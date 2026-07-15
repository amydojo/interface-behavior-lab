import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { RECOVERY_WINDOW_SECONDS } from '../../experiments/reversible/model'
import { archiveRecoveryScenario } from '../../scenarios/archive-recovery'
import { clearStoredSession, saveSession } from '../../session/persistence'
import { TrialSessionRecorder } from '../../session/recorder'
import type { LabSessionV2 } from '../../session/types'
import type { DemoProps, LabMode } from '../../types'
import { reversibleComparisonTrial } from '../definitions/reversible'
import '../intent/intent-comparison.css'
import { resolveConditionOrder } from '../order'
import { availableMetric, unavailableMetric } from '../types'
import type { ConditionOrderMode, TrialCondition, TrialOutcome } from '../types'
import './reversible-comparison.css'

type Phase = 'brief' | 'condition' | 'debrief' | 'between' | 'results'
type RecoveryState = 'ready' | 'window' | 'expiring' | 'recovered' | 'expired'
type LocationRecall = 'all-mail' | 'inbox' | 'trash' | 'not-sure'
type RecoveryOutcome = Extract<TrialOutcome, 'reversed' | 'expired'>
type RecoveryPlacement = 'detached-toast' | 'originating-control'

type ConditionResult = {
  condition: TrialCondition
  outcome: RecoveryOutcome
  archiveElapsedMs: number
  undoDiscoveryMs: number | null
  locationRecall: LocationRecall
  confidence: number
  placement: RecoveryPlacement
}

type Props = {
  demoProps: DemoProps
  mode: LabMode
  onExit: () => void
  onStateChange?: (state: string) => void
}

const locationLabels: Record<LocationRecall, string> = {
  'all-mail': 'All Mail',
  inbox: 'Inbox',
  trash: 'Trash',
  'not-sure': 'Not sure',
}

function createSeed() {
  return globalThis.crypto?.randomUUID?.() ?? `reversible-${Date.now()}`
}

function conditionName(condition: TrialCondition) {
  return condition === 'adaptive' ? 'Adaptive' : 'Conventional'
}

function resultFor(results: readonly ConditionResult[], condition: TrialCondition) {
  return results.find(result => result.condition === condition)
}

function placementLabel(placement: RecoveryPlacement) {
  return placement === 'originating-control' ? 'Originating control' : 'Detached toast'
}

function stateLabel(state: RecoveryState) {
  if (state === 'ready') return 'Ready'
  if (state === 'window') return 'Recovery window'
  if (state === 'expiring') return 'Recovery expiring'
  if (state === 'recovered') return 'Recovered'
  return 'Expired'
}

export function ReversibleComparisonTrial({ demoProps, mode, onExit, onStateChange }: Props) {
  const [phase, setPhase] = useState<Phase>('brief')
  const [orderMode, setOrderMode] = useState<ConditionOrderMode>('randomized')
  const [persistLocally, setPersistLocally] = useState(false)
  const [conditionOrder, setConditionOrder] = useState<readonly [TrialCondition, TrialCondition]>(['conventional', 'adaptive'])
  const [conditionIndex, setConditionIndex] = useState(0)
  const [activeTrialId, setActiveTrialId] = useState<string | null>(null)
  const [conditionStartedAt, setConditionStartedAt] = useState(0)
  const [recoveryState, setRecoveryState] = useState<RecoveryState>('ready')
  const [remaining, setRemaining] = useState(RECOVERY_WINDOW_SECONDS)
  const [archiveElapsedMs, setArchiveElapsedMs] = useState(0)
  const [undoDiscoveryMs, setUndoDiscoveryMs] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<RecoveryOutcome | null>(null)
  const [locationRecall, setLocationRecall] = useState<LocationRecall | ''>('')
  const [confidence, setConfidence] = useState(0)
  const [results, setResults] = useState<ConditionResult[]>([])
  const [session, setSession] = useState<LabSessionV2 | null>(null)
  const [storageMessage, setStorageMessage] = useState('Session remains in memory only.')
  const recorderRef = useRef<TrialSessionRecorder | null>(null)
  const tickTimerRef = useRef<number | null>(null)
  const expiryTimerRef = useRef<number | null>(null)
  const recoveryStartedAtRef = useRef<number | null>(null)
  const recoveryEndAtRef = useRef<number | null>(null)
  const previousSettingsRef = useRef({
    modality: demoProps.modality,
    mode,
    reducedMotion: demoProps.reducedMotion,
  })

  const activeCondition = conditionOrder[conditionIndex]
  const trialLetter = conditionIndex === 0 ? 'A' : 'B'
  const placement: RecoveryPlacement = activeCondition === 'adaptive' ? 'originating-control' : 'detached-toast'

  const clearRecoveryTimers = useCallback(() => {
    if (tickTimerRef.current !== null) window.clearInterval(tickTimerRef.current)
    if (expiryTimerRef.current !== null) window.clearTimeout(expiryTimerRef.current)
    tickTimerRef.current = null
    expiryTimerRef.current = null
    recoveryStartedAtRef.current = null
    recoveryEndAtRef.current = null
  }, [])

  useEffect(() => () => clearRecoveryTimers(), [clearRecoveryTimers])

  useEffect(() => {
    onStateChange?.(`Comparison · ${phase}`)
  }, [onStateChange, phase])

  const refreshSession = useCallback((recorder = recorderRef.current) => {
    if (!recorder) return null
    const snapshot = recorder.getSnapshot()
    setSession(snapshot)
    if (persistLocally) {
      const saved = saveSession(window.localStorage, snapshot)
      setStorageMessage(saved.ok ? 'Session saved locally for up to 24 hours.' : 'Local storage is unavailable.')
    }
    return snapshot
  }, [persistLocally])

  useEffect(() => {
    if (!persistLocally || !session) return
    const saved = saveSession(window.localStorage, session)
    setStorageMessage(saved.ok ? 'Session saved locally for up to 24 hours.' : 'Local storage is unavailable.')
  }, [persistLocally, session])

  useEffect(() => {
    const previous = previousSettingsRef.current
    const recorder = recorderRef.current
    if (recorder && activeTrialId) {
      if (previous.modality !== demoProps.modality) {
        recorder.record({
          action: 'input_context_changed',
          trialId: activeTrialId,
          inputContext: demoProps.modality,
          detail: { previous: previous.modality, next: demoProps.modality },
        })
      }
      if (previous.mode !== mode) {
        recorder.record({
          action: 'material_mode_changed',
          trialId: activeTrialId,
          materialMode: mode,
          detail: { previous: previous.mode, next: mode },
        })
      }
      if (previous.reducedMotion !== demoProps.reducedMotion) {
        recorder.record({
          action: 'reduced_motion_changed',
          trialId: activeTrialId,
          reducedMotion: demoProps.reducedMotion,
          detail: { previous: previous.reducedMotion, next: demoProps.reducedMotion },
        })
      }
      refreshSession(recorder)
    }
    previousSettingsRef.current = {
      modality: demoProps.modality,
      mode,
      reducedMotion: demoProps.reducedMotion,
    }
  }, [activeTrialId, demoProps.modality, demoProps.reducedMotion, mode, refreshSession])

  const changePersistence = (next: boolean) => {
    setPersistLocally(next)
    if (!next) {
      const cleared = clearStoredSession(window.localStorage)
      setStorageMessage(cleared.ok ? 'Session remains in memory only.' : 'Local storage is unavailable.')
    }
  }

  const startCondition = (
    condition: TrialCondition,
    index: number,
    recorder = recorderRef.current,
  ) => {
    if (!recorder) return
    clearRecoveryTimers()
    const trial = recorder.startTrial({
      definitionId: reversibleComparisonTrial.id,
      experimentId: reversibleComparisonTrial.experimentId,
      scenarioId: reversibleComparisonTrial.scenarioId,
      condition,
      orderIndex: index,
    })
    recorder.record({
      action: 'condition_selected',
      trialId: trial.trialId,
      detail: { orderIndex: index, trialLabel: index === 0 ? 'A' : 'B' },
    })
    setConditionIndex(index)
    setActiveTrialId(trial.trialId)
    setConditionStartedAt(globalThis.performance.now())
    setRecoveryState('ready')
    setRemaining(RECOVERY_WINDOW_SECONDS)
    setArchiveElapsedMs(0)
    setUndoDiscoveryMs(null)
    setOutcome(null)
    setLocationRecall('')
    setConfidence(0)
    setPhase('condition')
    refreshSession(recorder)
  }

  const beginComparison = () => {
    const seed = createSeed()
    const order = resolveConditionOrder(orderMode, seed)
    const recorder = new TrialSessionRecorder({
      randomizationSeed: seed,
      settings: {
        inputContext: demoProps.modality,
        materialMode: mode,
        reducedMotion: demoProps.reducedMotion,
        assistance: demoProps.assistance,
        conditionOrder: orderMode,
      },
    })
    recorderRef.current = recorder
    setConditionOrder(order)
    setResults([])
    setSession(recorder.getSnapshot())
    startCondition(order[0], 0, recorder)
  }

  const expireRecovery = useCallback(() => {
    if (!activeTrialId) return
    const startedAt = recoveryStartedAtRef.current
    clearRecoveryTimers()
    const elapsed = startedAt === null
      ? RECOVERY_WINDOW_SECONDS * 1000
      : Math.max(0, Math.round(globalThis.performance.now() - startedAt))
    recorderRef.current?.record({
      action: 'recovery_expired',
      trialId: activeTrialId,
      previousState: 'Recovery window',
      nextState: 'Expired',
      outcome: 'expired',
      detail: {
        recoveryWindowSeconds: RECOVERY_WINDOW_SECONDS,
        elapsedMs: elapsed,
        remainingLocation: archiveRecoveryScenario.expiredLocation,
      },
    })
    setRemaining(0)
    setRecoveryState('expired')
    setUndoDiscoveryMs(null)
    setOutcome('expired')
    setPhase('debrief')
    refreshSession()
  }, [activeTrialId, clearRecoveryTimers, refreshSession])

  const archiveMessage = () => {
    if (!activeTrialId || recoveryState !== 'ready') return
    const now = globalThis.performance.now()
    const archiveElapsed = Math.max(0, Math.round(now - conditionStartedAt))
    const endAt = now + RECOVERY_WINDOW_SECONDS * 1000
    recoveryStartedAtRef.current = now
    recoveryEndAtRef.current = endAt
    setArchiveElapsedMs(archiveElapsed)
    setRemaining(RECOVERY_WINDOW_SECONDS)
    setRecoveryState('window')
    recorderRef.current?.record({
      action: 'action_committed',
      trialId: activeTrialId,
      previousState: 'Ready',
      nextState: 'Recovery window',
      detail: {
        action: 'archive',
        archiveElapsedMs: archiveElapsed,
        recoveryWindowSeconds: RECOVERY_WINDOW_SECONDS,
        recoveryPlacement: placement,
      },
    })
    recorderRef.current?.record({
      action: 'observation_recorded',
      trialId: activeTrialId,
      previousState: 'Archived',
      nextState: 'Recovery requested',
      detail: { recoveryRequested: true },
    })
    tickTimerRef.current = window.setInterval(() => {
      const activeEndAt = recoveryEndAtRef.current
      if (activeEndAt === null) return
      const nextRemaining = Math.max(0, (activeEndAt - globalThis.performance.now()) / 1000)
      setRemaining(nextRemaining)
      setRecoveryState(nextRemaining <= 3 ? 'expiring' : 'window')
    }, 100)
    expiryTimerRef.current = window.setTimeout(expireRecovery, RECOVERY_WINDOW_SECONDS * 1000)
    refreshSession()
  }

  const recoverMessage = () => {
    if (!activeTrialId || (recoveryState !== 'window' && recoveryState !== 'expiring')) return
    const startedAt = recoveryStartedAtRef.current
    const discoveryMs = startedAt === null
      ? null
      : Math.max(0, Math.round(globalThis.performance.now() - startedAt))
    clearRecoveryTimers()
    recorderRef.current?.record({
      action: 'action_reversed',
      trialId: activeTrialId,
      previousState: recoveryState === 'expiring' ? 'Recovery expiring' : 'Recovery window',
      nextState: 'Recovered',
      outcome: 'reversed',
      detail: {
        recoveryPlacement: placement,
        undoDiscoveryMs: discoveryMs,
        remainingSeconds: remaining,
      },
    })
    setRecoveryState('recovered')
    setUndoDiscoveryMs(discoveryMs)
    setOutcome('reversed')
    setPhase('debrief')
    refreshSession()
  }

  const submitDebrief = () => {
    if (!activeTrialId || !outcome || !locationRecall || confidence < 1) return
    const result: ConditionResult = {
      condition: activeCondition,
      outcome,
      archiveElapsedMs,
      undoDiscoveryMs,
      locationRecall,
      confidence,
      placement,
    }
    recorderRef.current?.completeTrial(activeTrialId, {
      outcome,
      metrics: {
        'undo-discovery-time-ms': undoDiscoveryMs === null
          ? unavailableMetric('not-observed')
          : availableMetric(undoDiscoveryMs),
        'recovery-success': availableMetric(outcome === 'reversed'),
        'missed-recovery-window': availableMetric(outcome === 'expired'),
        'post-expiry-location-understanding': availableMetric(locationRecall === 'all-mail'),
        'post-expiry-location-response': availableMetric(locationRecall),
        'outcome-confidence': availableMetric(confidence),
        'archive-time-ms': availableMetric(archiveElapsedMs),
        'recovery-placement': availableMetric(placement),
        'recovery-window-seconds': availableMetric(RECOVERY_WINDOW_SECONDS),
      },
      detail: {
        locationRecall,
        recoveryPlacement: placement,
        undoObserved: undoDiscoveryMs !== null,
      },
    })
    setResults(current => [...current, result])
    setActiveTrialId(null)
    refreshSession()

    if (conditionIndex === 0) {
      setPhase('between')
      return
    }

    recorderRef.current?.completeSession()
    refreshSession()
    setPhase('results')
  }

  const continueToSecondCondition = () => {
    startCondition(conditionOrder[1], 1)
  }

  const abandonAndExit = () => {
    clearRecoveryTimers()
    if (activeTrialId) {
      recorderRef.current?.abandonTrial(activeTrialId, { reason: 'participant-exited-comparison' })
      refreshSession()
    }
    onExit()
  }

  const restart = () => {
    clearRecoveryTimers()
    recorderRef.current = null
    setSession(null)
    setResults([])
    setPhase('brief')
    setStorageMessage(persistLocally ? 'Start a new session to replace the saved record.' : 'Session remains in memory only.')
  }

  const clearData = () => {
    const cleared = clearStoredSession(window.localStorage)
    setPersistLocally(false)
    setStorageMessage(cleared.ok ? 'Stored session data cleared.' : 'Local storage is unavailable.')
  }

  const conventionalResult = useMemo(() => resultFor(results, 'conventional'), [results])
  const adaptiveResult = useMemo(() => resultFor(results, 'adaptive'), [results])
  const progress = Math.max(0, Math.min(100, (remaining / RECOVERY_WINDOW_SECONDS) * 100))

  return (
    <section className="comparison-trial reversible-comparison" aria-label="Archive recovery. Two Undo locations.">
      <header className="comparison-trial-header">
        <div>
          <span>CONTROLLED COMPARISON · REVERSIBLE</span>
          <h3>One archive. Two recovery locations.</h3>
        </div>
        <button type="button" onClick={abandonAndExit}>Exit comparison</button>
      </header>

      {phase === 'brief' && (
        <div className="comparison-brief">
          <p className="comparison-task-label">SHARED TASK</p>
          <p className="comparison-task">{reversibleComparisonTrial.taskPrompt}</p>
          <div className="reversible-fact-grid">
            <article>
              <span>MESSAGE</span>
              <strong>{archiveRecoveryScenario.itemTitle}</strong>
            </article>
            <article>
              <span>RECOVERY WINDOW</span>
              <strong>{RECOVERY_WINDOW_SECONDS} seconds</strong>
            </article>
            <article>
              <span>AFTER EXPIRY</span>
              <strong>{archiveRecoveryScenario.expiredLocation}</strong>
            </article>
          </div>
          <p className="comparison-boundary">
            One condition places Undo in a detached notification. The other transforms the originating Archive control. The message, deadline, consequence, label, and keyboard path remain equivalent.
          </p>
          <fieldset className="comparison-order-fieldset">
            <legend>Condition order</legend>
            {([
              ['randomized', 'Randomized'],
              ['conventional-first', 'Conventional first'],
              ['adaptive-first', 'Adaptive first'],
            ] as const).map(([value, label]) => (
              <label key={value}>
                <input type="radio" name="reversible-order" value={value} checked={orderMode === value} onChange={() => setOrderMode(value)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          <label className="comparison-persistence">
            <input type="checkbox" checked={persistLocally} onChange={event => changePersistence(event.target.checked)} />
            <span>Keep this session on this device for up to 24 hours</span>
          </label>
          <p className="comparison-storage-note">{storageMessage}</p>
          <button type="button" className="comparison-primary-action" onClick={beginComparison}>Begin two-condition trial</button>
        </div>
      )}

      {phase === 'condition' && (
        <div className="comparison-condition reversible-condition">
          <div className="comparison-condition-heading">
            <span>TRIAL {trialLetter} / 2</span>
            <strong>Archive the message. When recovery is requested, restore it before the window closes.</strong>
          </div>

          <div className={`reversible-condition-stage is-${activeCondition}`} data-reduced-motion={demoProps.reducedMotion}>
            <div className="reversible-message-card">
              <span>MESSAGE</span>
              <strong>{archiveRecoveryScenario.itemTitle}</strong>
              <small>{archiveRecoveryScenario.itemSource} · {recoveryState === 'ready' ? 'in inbox' : 'archived'}</small>
            </div>

            <div className="reversible-origin-slot">
              {recoveryState === 'ready' ? (
                <button type="button" className="reversible-origin-target" onClick={archiveMessage}>
                  <strong>Archive</strong>
                  <small>Action available</small>
                </button>
              ) : activeCondition === 'adaptive' ? (
                <button
                  type="button"
                  className="reversible-origin-target is-recovery"
                  onClick={recoverMessage}
                  style={{ '--recovery-progress': `${progress}%` } as CSSProperties}
                >
                  <span className="reversible-progress-fill" aria-hidden="true" />
                  <strong>Undo Archive</strong>
                  <small>{Math.ceil(remaining)} seconds remaining</small>
                </button>
              ) : (
                <button type="button" className="reversible-origin-target is-complete" disabled>
                  <strong>Archived</strong>
                  <small>Completed action</small>
                </button>
              )}
            </div>

            {recoveryState !== 'ready' && (
              <div className="reversible-request" role="note">
                <span>RECOVERY REQUESTED</span>
                <strong>Restore {archiveRecoveryScenario.itemTitle} before the window closes.</strong>
                <small>{stateLabel(recoveryState)}</small>
              </div>
            )}

            {activeCondition === 'conventional' && (recoveryState === 'window' || recoveryState === 'expiring') && (
              <aside className="reversible-toast" aria-label="Archive recovery">
                <div>
                  <strong>Message archived</strong>
                  <span>{Math.ceil(remaining)} seconds remaining</span>
                </div>
                <button type="button" onClick={recoverMessage}>Undo Archive</button>
              </aside>
            )}

            <p className="reversible-location-note">If the recovery window closes, the message remains in {archiveRecoveryScenario.expiredLocation}.</p>
          </div>
        </div>
      )}

      {phase === 'debrief' && outcome && (
        <div className="comparison-debrief">
          <span>TRIAL {trialLetter} OUTCOME</span>
          <h3>Record recovery understanding before continuing.</h3>
          <div className="reversible-outcome-summary">
            <strong>{outcome === 'reversed' ? archiveRecoveryScenario.recoveryResult : archiveRecoveryScenario.expiredResult}</strong>
            <p>
              {outcome === 'reversed' && undoDiscoveryMs !== null
                ? `${placementLabel(placement)} · ${Math.round(undoDiscoveryMs / 100) / 10}s to Undo`
                : `${placementLabel(placement)} · recovery window expired`}
            </p>
          </div>

          <fieldset>
            <legend>Where can the message be found after the recovery window closes?</legend>
            {(Object.entries(locationLabels) as [LocationRecall, string][]).map(([value, label]) => (
              <label key={value}>
                <input type="radio" name={`reversible-location-${conditionIndex}`} checked={locationRecall === value} onChange={() => setLocationRecall(value)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>How confident were you in the final message location?</legend>
            <div className="comparison-rating-row">
              {[1, 2, 3, 4, 5].map(value => (
                <label key={value}>
                  <input type="radio" name={`reversible-confidence-${conditionIndex}`} aria-label={`Recovery confidence ${value} of 5`} checked={confidence === value} onChange={() => setConfidence(value)} />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button type="button" className="comparison-primary-action" disabled={!locationRecall || confidence < 1} onClick={submitDebrief}>
            Record trial observation
          </button>
        </div>
      )}

      {phase === 'between' && (
        <div className="comparison-between">
          <span>TRIAL A RECORDED</span>
          <h3>The second condition keeps the same message, deadline, and recovery request.</h3>
          <p>Condition names remain masked until both observations are complete.</p>
          <button type="button" className="comparison-primary-action" onClick={continueToSecondCondition}>Continue to Trial B</button>
        </div>
      )}

      {phase === 'results' && conventionalResult && adaptiveResult && (
        <div className="comparison-results reversible-results">
          <header>
            <div>
              <span>EXPLORATORY LOCAL SESSION</span>
              <h3>Raw recovery observations, not a winner.</h3>
              <p>One archive per condition cannot establish recovery superiority, accessibility benefit, or reliable error rates.</p>
            </div>
          </header>

          <div className="comparison-result-grid reversible-result-grid">
            {[conventionalResult, adaptiveResult].map(result => (
              <article key={result.condition}>
                <span>{conditionName(result.condition)}</span>
                <strong>{result.outcome === 'reversed' ? 'Recovered' : 'Expired'}</strong>
                <dl>
                  <div><dt>Recovery location</dt><dd>{placementLabel(result.placement)}</dd></div>
                  <div><dt>Undo discovery</dt><dd>{result.undoDiscoveryMs === null ? 'Unavailable' : `${Math.round(result.undoDiscoveryMs / 100) / 10}s`}</dd></div>
                  <div><dt>Recovery success</dt><dd>{result.outcome === 'reversed' ? 'Yes' : 'No'}</dd></div>
                  <div><dt>Missed window</dt><dd>{result.outcome === 'expired' ? 'Yes' : 'No'}</dd></div>
                  <div><dt>All Mail recalled</dt><dd>{result.locationRecall === 'all-mail' ? 'Yes' : 'No'}</dd></div>
                  <div><dt>Confidence</dt><dd>{result.confidence}/5</dd></div>
                  <div><dt>Archive time</dt><dd>{Math.round(result.archiveElapsedMs / 100) / 10}s</dd></div>
                </dl>
              </article>
            ))}
          </div>

          <p className="comparison-session-meta">
            Session {session?.sessionId.slice(0, 8)} · order {conditionName(conditionOrder[0])} → {conditionName(conditionOrder[1])} · local observation only
          </p>
          <p className="comparison-boundary">
            Discovery time is recorded only when Undo occurs. An expired window is represented as unavailable, not zero. The browser cannot establish broad motor, memory, or accessibility performance from one local session.
          </p>
          <div className="comparison-result-actions">
            <button type="button" onClick={restart}>Run again</button>
            <button type="button" onClick={clearData}>Clear stored session data</button>
            <button type="button" onClick={onExit}>Return to specimen</button>
          </div>
          <p className="comparison-storage-note">{storageMessage}</p>
        </div>
      )}
    </section>
  )
}

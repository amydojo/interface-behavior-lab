import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { publicPublishScenario } from '../../scenarios/public-publish'
import { clearStoredSession, saveSession } from '../../session/persistence'
import { TrialSessionRecorder } from '../../session/recorder'
import type { LabSessionV2 } from '../../session/types'
import type { DemoProps, LabMode } from '../../types'
import { ETHICAL_HOLD_MS } from '../../experiments/ethical/model'
import { ethicalComparisonTrial } from '../definitions/ethical'
import '../intent/intent-comparison.css'
import { resolveConditionOrder } from '../order'
import { availableMetric } from '../types'
import type { ConditionOrderMode, TrialCondition, TrialOutcome } from '../types'
import './ethical-comparison.css'

type Phase = 'brief' | 'condition' | 'debrief' | 'between' | 'results'
type ConsequenceRecall = 'full' | 'audience-only' | 'location-only' | 'not-sure'
type AccidentalPublish = 'yes' | 'no'
type CommitMethod = 'conventional-dialog' | 'deliberate-hold' | 'non-hold' | 'cancelled'

type ConditionResult = {
  condition: TrialCondition
  outcome: Extract<TrialOutcome, 'completed' | 'cancelled'>
  interactionElapsedMs: number
  commitMethod: CommitMethod
  consequenceRecall: ConsequenceRecall
  accidentalPublish: boolean
  confidence: number
  coercion: number
}

type Props = {
  demoProps: DemoProps
  mode: LabMode
  onExit: () => void
  onStateChange?: (state: string) => void
}

const recallLabels: Record<ConsequenceRecall, string> = {
  full: '384 people, location, and tagged people',
  'audience-only': '384 people only',
  'location-only': 'Location only',
  'not-sure': 'Not sure',
}

function createSeed() {
  return globalThis.crypto?.randomUUID?.() ?? `ethical-${Date.now()}`
}

function conditionName(condition: TrialCondition) {
  return condition === 'adaptive' ? 'Adaptive' : 'Conventional'
}

function resultFor(results: readonly ConditionResult[], condition: TrialCondition) {
  return results.find(result => result.condition === condition)
}

function methodLabel(method: CommitMethod) {
  if (method === 'conventional-dialog') return 'Dialog confirmation'
  if (method === 'deliberate-hold') return 'Deliberate hold'
  if (method === 'non-hold') return 'Non-hold confirmation'
  return 'Cancelled after disclosure'
}

export function EthicalComparisonTrial({ demoProps, mode, onExit, onStateChange }: Props) {
  const [phase, setPhase] = useState<Phase>('brief')
  const [orderMode, setOrderMode] = useState<ConditionOrderMode>('randomized')
  const [persistLocally, setPersistLocally] = useState(false)
  const [conditionOrder, setConditionOrder] = useState<readonly [TrialCondition, TrialCondition]>(['conventional', 'adaptive'])
  const [conditionIndex, setConditionIndex] = useState(0)
  const [activeTrialId, setActiveTrialId] = useState<string | null>(null)
  const [conditionStartedAt, setConditionStartedAt] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [outcome, setOutcome] = useState<ConditionResult['outcome'] | null>(null)
  const [commitMethod, setCommitMethod] = useState<CommitMethod | null>(null)
  const [interactionElapsedMs, setInteractionElapsedMs] = useState(0)
  const [consequenceRecall, setConsequenceRecall] = useState<ConsequenceRecall | ''>('')
  const [accidentalPublish, setAccidentalPublish] = useState<AccidentalPublish | ''>('')
  const [confidence, setConfidence] = useState(0)
  const [coercion, setCoercion] = useState(0)
  const [results, setResults] = useState<ConditionResult[]>([])
  const [session, setSession] = useState<LabSessionV2 | null>(null)
  const [storageMessage, setStorageMessage] = useState('Session remains in memory only.')
  const recorderRef = useRef<TrialSessionRecorder | null>(null)
  const holdCompletionTimerRef = useRef<number | null>(null)
  const holdProgressTimerRef = useRef<number | null>(null)
  const holdStartedAtRef = useRef<number | null>(null)
  const previousSettingsRef = useRef({
    modality: demoProps.modality,
    mode,
    reducedMotion: demoProps.reducedMotion,
  })

  const activeCondition = conditionOrder[conditionIndex]
  const trialLetter = conditionIndex === 0 ? 'A' : 'B'

  const clearHoldTimers = useCallback(() => {
    if (holdCompletionTimerRef.current !== null) window.clearTimeout(holdCompletionTimerRef.current)
    if (holdProgressTimerRef.current !== null) window.clearInterval(holdProgressTimerRef.current)
    holdCompletionTimerRef.current = null
    holdProgressTimerRef.current = null
    holdStartedAtRef.current = null
  }, [])

  useEffect(() => () => clearHoldTimers(), [clearHoldTimers])

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
    clearHoldTimers()
    const trial = recorder.startTrial({
      definitionId: ethicalComparisonTrial.id,
      experimentId: ethicalComparisonTrial.experimentId,
      scenarioId: ethicalComparisonTrial.scenarioId,
      condition,
      orderIndex: index,
    })
    recorder.record({
      action: 'condition_selected',
      trialId: trial.trialId,
      detail: { orderIndex: index, trialLabel: index === 0 ? 'A' : 'B' },
    })
    if (condition === 'adaptive') {
      recorder.record({
        action: 'consequence_revealed',
        trialId: trial.trialId,
        previousState: 'Task introduced',
        nextState: 'Consequence visible',
        detail: {
          audienceSize: publicPublishScenario.audienceSize,
          locationIncluded: true,
          taggedPeopleIncluded: true,
        },
      })
    }
    setConditionIndex(index)
    setActiveTrialId(trial.trialId)
    setConditionStartedAt(globalThis.performance.now())
    setDialogOpen(false)
    setHoldProgress(0)
    setOutcome(null)
    setCommitMethod(null)
    setInteractionElapsedMs(0)
    setConsequenceRecall('')
    setAccidentalPublish('')
    setConfidence(0)
    setCoercion(0)
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

  const finishCondition = useCallback((nextOutcome: ConditionResult['outcome'], method: CommitMethod) => {
    if (!activeTrialId) return
    clearHoldTimers()
    const elapsed = Math.max(0, Math.round(globalThis.performance.now() - conditionStartedAt))
    if (method === 'non-hold') {
      recorderRef.current?.record({
        action: 'alternative_path_used',
        trialId: activeTrialId,
        detail: { path: 'confirm-without-holding' },
      })
    }
    recorderRef.current?.record({
      action: nextOutcome === 'completed' ? 'action_committed' : 'commit_cancelled',
      trialId: activeTrialId,
      previousState: activeCondition === 'conventional' ? 'Confirmation dialog' : 'Consequence visible',
      nextState: nextOutcome === 'completed' ? publicPublishScenario.successResult : 'Cancelled',
      outcome: nextOutcome,
      detail: {
        method,
        audienceSize: publicPublishScenario.audienceSize,
        locationIncluded: true,
        taggedPeopleIncluded: true,
        interactionElapsedMs: elapsed,
      },
    })
    setOutcome(nextOutcome)
    setCommitMethod(method)
    setInteractionElapsedMs(elapsed)
    setDialogOpen(false)
    setHoldProgress(0)
    setPhase('debrief')
    refreshSession()
  }, [activeCondition, activeTrialId, clearHoldTimers, conditionStartedAt, refreshSession])

  const revealConventionalDialog = () => {
    setDialogOpen(true)
    recorderRef.current?.record({
      action: 'consequence_revealed',
      trialId: activeTrialId ?? undefined,
      previousState: 'Publish available',
      nextState: 'Confirmation dialog',
      detail: {
        audienceSize: publicPublishScenario.audienceSize,
        locationIncluded: true,
        taggedPeopleIncluded: true,
      },
    })
    refreshSession()
  }

  const startAdaptiveHold = () => {
    if (activeCondition !== 'adaptive' || holdCompletionTimerRef.current !== null) return
    clearHoldTimers()
    const startedAt = globalThis.performance.now()
    holdStartedAtRef.current = startedAt
    setHoldProgress(0)
    recorderRef.current?.record({
      action: 'commit_started',
      trialId: activeTrialId ?? undefined,
      detail: { method: 'deliberate-hold', durationMs: ETHICAL_HOLD_MS },
    })
    holdProgressTimerRef.current = window.setInterval(() => {
      const holdStartedAt = holdStartedAtRef.current
      if (holdStartedAt === null) return
      const progress = Math.min(100, ((globalThis.performance.now() - holdStartedAt) / ETHICAL_HOLD_MS) * 100)
      setHoldProgress(progress)
    }, 32)
    holdCompletionTimerRef.current = window.setTimeout(() => {
      clearHoldTimers()
      setHoldProgress(100)
      finishCondition('completed', 'deliberate-hold')
    }, ETHICAL_HOLD_MS)
    refreshSession()
  }

  const cancelAdaptiveHold = () => {
    if (holdCompletionTimerRef.current === null) return
    clearHoldTimers()
    setHoldProgress(0)
    recorderRef.current?.record({
      action: 'commit_cancelled',
      trialId: activeTrialId ?? undefined,
      previousState: 'Hold in progress',
      nextState: 'Consequence visible',
      detail: { method: 'deliberate-hold', published: false },
    })
    refreshSession()
  }

  const submitDebrief = () => {
    if (!activeTrialId || !outcome || !commitMethod || !consequenceRecall || !accidentalPublish || confidence < 1 || coercion < 1) return
    const result: ConditionResult = {
      condition: activeCondition,
      outcome,
      interactionElapsedMs,
      commitMethod,
      consequenceRecall,
      accidentalPublish: accidentalPublish === 'yes',
      confidence,
      coercion,
    }
    recorderRef.current?.completeTrial(activeTrialId, {
      outcome,
      metrics: {
        'consequence-recall': availableMetric(consequenceRecall === 'full'),
        'consequence-recall-response': availableMetric(consequenceRecall),
        'cancellation-after-disclosure': availableMetric(outcome === 'cancelled'),
        'accidental-publish': availableMetric(accidentalPublish === 'yes'),
        'perceived-coercion': availableMetric(coercion),
        'outcome-confidence': availableMetric(confidence),
        'accessible-non-hold-path-used': availableMetric(commitMethod === 'non-hold'),
        'time-to-outcome-ms': availableMetric(interactionElapsedMs),
      },
      detail: {
        commitMethod,
        consequenceRecall,
        accidentalPublish: accidentalPublish === 'yes',
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
    clearHoldTimers()
    if (activeTrialId) {
      recorderRef.current?.abandonTrial(activeTrialId, { reason: 'participant-exited-comparison' })
      refreshSession()
    }
    onExit()
  }

  const restart = () => {
    clearHoldTimers()
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

  return (
    <section className="comparison-trial ethical-comparison" aria-label="Consequence before commitment. Two confirmation conditions.">
      <header className="comparison-trial-header">
        <div>
          <span>CONTROLLED COMPARISON · ETHICAL</span>
          <h3>Consequence before commitment. Two confirmation conditions.</h3>
        </div>
        <button type="button" onClick={abandonAndExit}>Exit comparison</button>
      </header>

      {phase === 'brief' && (
        <div className="comparison-brief">
          <p className="comparison-task-label">SHARED TASK</p>
          <p className="comparison-task">{ethicalComparisonTrial.taskPrompt}</p>
          <div className="ethical-fact-grid">
            <article>
              <span>AUDIENCE</span>
              <strong>{publicPublishScenario.audienceSize} people</strong>
            </article>
            <article>
              <span>INCLUDED CONTEXT</span>
              <strong>Location + tagged people</strong>
            </article>
            <article>
              <span>REVERSIBILITY</span>
              <strong>Final publication is not undone here</strong>
            </article>
          </div>
          <p className="comparison-boundary">
            One condition uses a familiar confirmation step. The other places consequence before proportional resistance. Both preserve Publish, Cancel, and keyboard completion.
          </p>
          <fieldset className="comparison-order-fieldset">
            <legend>Condition order</legend>
            {([
              ['randomized', 'Randomized'],
              ['conventional-first', 'Conventional first'],
              ['adaptive-first', 'Adaptive first'],
            ] as const).map(([value, label]) => (
              <label key={value}>
                <input type="radio" name="ethical-order" value={value} checked={orderMode === value} onChange={() => setOrderMode(value)} />
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
        <div className="comparison-condition ethical-condition">
          <div className="comparison-condition-heading">
            <span>TRIAL {trialLetter} / 2</span>
            <strong>Publish the post after deciding whether the disclosed consequence is acceptable.</strong>
          </div>

          {activeCondition === 'conventional' ? (
            <div className="ethical-condition-stage is-conventional">
              {!dialogOpen ? (
                <button type="button" className="ethical-publish-trigger" onClick={revealConventionalDialog}>
                  <strong>Publish</strong>
                  <small>Public audience</small>
                </button>
              ) : (
                <div className="ethical-confirmation-dialog" role="dialog" aria-labelledby="ethical-dialog-title">
                  <span>CONFIRM PUBLICATION</span>
                  <h4 id="ethical-dialog-title">Publish this post?</h4>
                  <div className="ethical-consequence-card" role="note">
                    <strong>{publicPublishScenario.audienceDisclosure}</strong>
                    <p>{publicPublishScenario.includedContextDisclosure}</p>
                  </div>
                  <div className="ethical-dialog-actions">
                    <button type="button" onClick={() => finishCondition('completed', 'conventional-dialog')}>Publish</button>
                    <button type="button" onClick={() => finishCondition('cancelled', 'cancelled')}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ethical-condition-stage is-adaptive" data-reduced-motion={demoProps.reducedMotion}>
              <div className="ethical-consequence-card" role="note">
                <span>BEFORE YOU COMMIT</span>
                <strong>{publicPublishScenario.audienceDisclosure}</strong>
                <p>{publicPublishScenario.includedContextDisclosure}</p>
              </div>
              <button
                type="button"
                className="ethical-hold-target"
                onPointerDown={startAdaptiveHold}
                onPointerUp={cancelAdaptiveHold}
                onPointerCancel={cancelAdaptiveHold}
                onPointerLeave={cancelAdaptiveHold}
                onKeyDown={event => {
                  if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
                    event.preventDefault()
                    startAdaptiveHold()
                  }
                }}
                onKeyUp={event => {
                  if (event.key === 'Enter' || event.key === ' ') cancelAdaptiveHold()
                }}
              >
                <span className="ethical-hold-progress" style={{ '--hold-progress': `${holdProgress}%` } as React.CSSProperties} aria-hidden="true" />
                <strong>Hold to publish</strong>
                <small>{Math.round(holdProgress)}% · one deliberate breath</small>
              </button>
              <div className="ethical-alternative-actions">
                <button type="button" onClick={() => finishCondition('completed', 'non-hold')}>Confirm without holding</button>
                <button type="button" onClick={() => finishCondition('cancelled', 'cancelled')}>Cancel</button>
              </div>
              <p className="ethical-simulation-boundary">Elapsed hold is a browser timing simulation, not physical pressure. The non-hold action commits the same outcome.</p>
            </div>
          )}
        </div>
      )}

      {phase === 'debrief' && outcome && commitMethod && (
        <div className="comparison-debrief">
          <span>TRIAL {trialLetter} OUTCOME</span>
          <h3>Record consequence understanding before continuing.</h3>
          <div className="ethical-outcome-summary">
            <strong>{outcome === 'completed' ? publicPublishScenario.successResult : 'Publication cancelled'}</strong>
            <p>{methodLabel(commitMethod)} · {Math.round(interactionElapsedMs / 100) / 10}s to outcome</p>
          </div>

          <fieldset>
            <legend>What consequence did the interface disclose?</legend>
            {(Object.entries(recallLabels) as [ConsequenceRecall, string][]).map(([value, label]) => (
              <label key={value}>
                <input type="radio" name={`ethical-recall-${conditionIndex}`} checked={consequenceRecall === value} onChange={() => setConsequenceRecall(value)} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Did the post publish before you intended?</legend>
            {(['no', 'yes'] as const).map(value => (
              <label key={value}>
                <input type="radio" name={`ethical-accidental-${conditionIndex}`} checked={accidentalPublish === value} onChange={() => setAccidentalPublish(value)} />
                <span>{value === 'yes' ? 'Yes' : 'No'}</span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>How confident were you in the final outcome?</legend>
            <div className="comparison-rating-row">
              {[1, 2, 3, 4, 5].map(value => (
                <label key={value}>
                  <input type="radio" name={`ethical-confidence-${conditionIndex}`} aria-label={`Outcome confidence ${value} of 5`} checked={confidence === value} onChange={() => setConfidence(value)} />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>How coercive did the confirmation feel?</legend>
            <div className="comparison-rating-row">
              {[1, 2, 3, 4, 5].map(value => (
                <label key={value}>
                  <input type="radio" name={`ethical-coercion-${conditionIndex}`} aria-label={`Coercion ${value} of 5`} checked={coercion === value} onChange={() => setCoercion(value)} />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            className="comparison-primary-action"
            disabled={!consequenceRecall || !accidentalPublish || confidence < 1 || coercion < 1}
            onClick={submitDebrief}
          >
            Record trial observation
          </button>
        </div>
      )}

      {phase === 'between' && (
        <div className="comparison-between">
          <span>TRIAL A RECORDED</span>
          <h3>The second condition keeps the same audience, context, and final consequence.</h3>
          <p>Condition identity remains masked until both observations are complete.</p>
          <button type="button" className="comparison-primary-action" onClick={continueToSecondCondition}>Continue to Trial B</button>
        </div>
      )}

      {phase === 'results' && conventionalResult && adaptiveResult && (
        <div className="comparison-results">
          <span>LOCAL EXPLORATORY SESSION</span>
          <h3>Raw commitment observations, not a winner.</h3>
          <div className="comparison-result-grid ethical-result-grid">
            {[conventionalResult, adaptiveResult].map(result => (
              <article key={result.condition}>
                <span>{conditionName(result.condition)}</span>
                <dl>
                  <div><dt>Outcome</dt><dd>{result.outcome === 'completed' ? 'Published' : 'Cancelled'}</dd></div>
                  <div><dt>Consequence recalled</dt><dd>{result.consequenceRecall === 'full' ? 'Full audience + context' : recallLabels[result.consequenceRecall]}</dd></div>
                  <div><dt>Accidental publish</dt><dd>{result.accidentalPublish ? 'Yes' : 'No'}</dd></div>
                  <div><dt>Confirmation path</dt><dd>{methodLabel(result.commitMethod)}</dd></div>
                  <div><dt>Confidence</dt><dd>{result.confidence} / 5</dd></div>
                  <div><dt>Coercion</dt><dd>{result.coercion} / 5</dd></div>
                  <div><dt>Time to outcome</dt><dd>{Math.round(result.interactionElapsedMs / 100) / 10}s</dd></div>
                </dl>
              </article>
            ))}
          </div>
          <p className="comparison-disclaimer">
            One local session cannot prove that either confirmation pattern is safer, less coercive, or universally clearer. Recall and coercion are self-reported observations.
          </p>
          <p className="comparison-session-meta">
            Session {session?.sessionId.slice(0, 12)} · order {conditionName(conditionOrder[0])} → {conditionName(conditionOrder[1])} · {session?.events.length ?? 0} semantic events
          </p>
          <div className="comparison-result-actions">
            <button type="button" onClick={restart}>Run another Ethical trial</button>
            <button type="button" onClick={clearData}>Clear stored session data</button>
            <button type="button" onClick={onExit}>Return to specimen</button>
          </div>
          <p className="comparison-storage-note" role="status">{storageMessage}</p>
        </div>
      )}
    </section>
  )
}

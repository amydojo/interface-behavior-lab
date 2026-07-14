import { useEffect, useMemo, useRef, useState } from 'react'
import { AdaptiveButton, MeterBars } from '../../components/ControlPrimitives'
import { clearStoredSession, saveSession } from '../../session/persistence'
import { TrialSessionRecorder } from '../../session/recorder'
import type { LabSessionV2 } from '../../session/types'
import type { DemoProps, LabMode } from '../../types'
import { pressureComparisonTrial } from '../definitions/pressure'
import '../intent/intent-comparison.css'
import { resolveConditionOrder } from '../order'
import { availableMetric } from '../types'
import type { ConditionOrderMode, TrialCondition, TrialOutcome } from '../types'
import './pressure-comparison.css'

type Phase = 'brief' | 'condition' | 'debrief' | 'between' | 'results'
type ActionChoice = 'preview' | 'trash' | 'permanent'
type Understanding = ActionChoice | 'not-sure'
type EffortResponse = 'clearer' | 'slower' | 'more-demanding' | 'unchanged'
type AdaptiveStage = 'Preview' | 'Act' | 'Commit'

type ConditionResult = {
  condition: TrialCondition
  interactionElapsedMs: number
  selectedAction: ActionChoice
  understanding: Understanding
  confidence: number
  effort: EffortResponse
  permanentCancellationBeforeCommit: boolean
}

type Props = {
  demoProps: DemoProps
  mode: LabMode
  onExit: () => void
  onStateChange?: (state: string) => void
}

const actionLabels: Record<ActionChoice, string> = {
  preview: 'Preview affected items',
  trash: 'Move to Trash',
  permanent: 'Delete permanently',
}

const stageAction: Record<AdaptiveStage, ActionChoice> = {
  Preview: 'preview',
  Act: 'trash',
  Commit: 'permanent',
}

function createSeed() {
  return globalThis.crypto?.randomUUID?.() ?? `pressure-${Date.now()}`
}

function conditionName(condition: TrialCondition) {
  return condition === 'adaptive' ? 'Adaptive' : 'Conventional'
}

function resultFor(results: readonly ConditionResult[], condition: TrialCondition) {
  return results.find(result => result.condition === condition)
}

function resultOutcome(action: ActionChoice): TrialOutcome {
  return action === 'trash' ? 'completed' : 'incorrect'
}

function understandingLabel(value: Understanding) {
  if (value === 'not-sure') return 'not sure'
  return actionLabels[value]
}

export function PressureComparisonTrial({ demoProps, mode, onExit, onStateChange }: Props) {
  const [phase, setPhase] = useState<Phase>('brief')
  const [orderMode, setOrderMode] = useState<ConditionOrderMode>('randomized')
  const [persistLocally, setPersistLocally] = useState(false)
  const [conditionOrder, setConditionOrder] = useState<readonly [TrialCondition, TrialCondition]>(['conventional', 'adaptive'])
  const [conditionIndex, setConditionIndex] = useState(0)
  const [activeTrialId, setActiveTrialId] = useState<string | null>(null)
  const [conditionStartedAt, setConditionStartedAt] = useState(0)
  const [interactionElapsedMs, setInteractionElapsedMs] = useState(0)
  const [selectedAction, setSelectedAction] = useState<ActionChoice | null>(null)
  const [adaptiveStage, setAdaptiveStage] = useState<AdaptiveStage>('Preview')
  const [conventionalConfirmation, setConventionalConfirmation] = useState(false)
  const [understanding, setUnderstanding] = useState<Understanding | ''>('')
  const [confidence, setConfidence] = useState(0)
  const [effort, setEffort] = useState<EffortResponse | ''>('')
  const [results, setResults] = useState<ConditionResult[]>([])
  const [session, setSession] = useState<LabSessionV2 | null>(null)
  const [storageMessage, setStorageMessage] = useState('Session remains in memory only.')
  const recorderRef = useRef<TrialSessionRecorder | null>(null)
  const permanentCancellationRef = useRef(false)
  const holdTimersRef = useRef<number[]>([])

  const activeCondition = conditionOrder[conditionIndex]
  const trialLetter = conditionIndex === 0 ? 'A' : 'B'

  const clearHoldTimers = () => {
    holdTimersRef.current.forEach(timer => window.clearTimeout(timer))
    holdTimersRef.current = []
  }

  useEffect(() => () => clearHoldTimers(), [])

  useEffect(() => {
    onStateChange?.(`Comparison · ${phase}`)
  }, [onStateChange, phase])

  const refreshSession = (recorder = recorderRef.current) => {
    if (!recorder) return null
    const snapshot = recorder.getSnapshot()
    setSession(snapshot)
    if (persistLocally) {
      const saved = saveSession(window.localStorage, snapshot)
      setStorageMessage(saved.ok ? 'Session saved locally for up to 24 hours.' : 'Local storage is unavailable.')
    }
    return snapshot
  }

  useEffect(() => {
    if (!persistLocally || !session) return
    const saved = saveSession(window.localStorage, session)
    setStorageMessage(saved.ok ? 'Session saved locally for up to 24 hours.' : 'Local storage is unavailable.')
  }, [persistLocally, session])

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
      definitionId: pressureComparisonTrial.id,
      experimentId: pressureComparisonTrial.experimentId,
      scenarioId: pressureComparisonTrial.scenarioId,
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
    setInteractionElapsedMs(0)
    setSelectedAction(null)
    setAdaptiveStage('Preview')
    setConventionalConfirmation(false)
    setUnderstanding('')
    setConfidence(0)
    setEffort('')
    permanentCancellationRef.current = false
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

  const selectAdaptiveStage = (stage: AdaptiveStage, source: string) => {
    const previous = adaptiveStage
    if (previous === stage) return
    setAdaptiveStage(stage)
    recorderRef.current?.record({
      action: 'state_transitioned',
      trialId: activeTrialId ?? undefined,
      previousState: previous,
      nextState: stage,
      detail: { source },
    })
    if (stage === 'Commit') {
      recorderRef.current?.record({
        action: 'consequence_revealed',
        trialId: activeTrialId ?? undefined,
        previousState: previous,
        nextState: stage,
        detail: { consequence: pressureComparisonTrial.comparisonFacts.consequence },
      })
    }
    refreshSession()
  }

  const startAdaptiveHold = () => {
    clearHoldTimers()
    recorderRef.current?.record({
      action: 'commit_started',
      trialId: activeTrialId ?? undefined,
      detail: { simulation: 'elapsed-hold-not-physical-pressure' },
    })
    holdTimersRef.current = [
      window.setTimeout(() => selectAdaptiveStage('Act', 'simulated hold duration'), 450),
      window.setTimeout(() => selectAdaptiveStage('Commit', 'simulated hold duration'), 1200),
    ]
    refreshSession()
  }

  const stopAdaptiveHold = () => {
    clearHoldTimers()
  }

  const finishInteraction = (condition: TrialCondition, action: ActionChoice) => {
    if (!activeTrialId) return
    clearHoldTimers()
    const elapsed = Math.max(0, Math.round(globalThis.performance.now() - conditionStartedAt))
    const outcome = resultOutcome(action)
    recorderRef.current?.record({
      action: 'action_committed',
      trialId: activeTrialId,
      previousState: condition === 'adaptive' ? adaptiveStage : 'Action choices',
      nextState: actionLabels[action],
      outcome,
      detail: {
        selectedAction: action,
        correctAction: action === 'trash',
        permanentAction: action === 'permanent',
        permanentCancellationBeforeCommit: permanentCancellationRef.current,
        interactionElapsedMs: elapsed,
      },
    })
    setSelectedAction(action)
    setInteractionElapsedMs(elapsed)
    setConventionalConfirmation(false)
    setPhase('debrief')
    refreshSession()
  }

  const revealConventionalPermanent = () => {
    setConventionalConfirmation(true)
    recorderRef.current?.record({
      action: 'consequence_revealed',
      trialId: activeTrialId ?? undefined,
      previousState: 'Action choices',
      nextState: 'Permanent confirmation',
      detail: { consequence: pressureComparisonTrial.comparisonFacts.consequence },
    })
    refreshSession()
  }

  const cancelPermanent = (condition: TrialCondition) => {
    permanentCancellationRef.current = true
    if (condition === 'conventional') setConventionalConfirmation(false)
    else setAdaptiveStage('Act')
    recorderRef.current?.record({
      action: 'commit_cancelled',
      trialId: activeTrialId ?? undefined,
      previousState: condition === 'conventional' ? 'Permanent confirmation' : 'Commit',
      nextState: condition === 'conventional' ? 'Action choices' : 'Act',
      detail: { retainedReversiblePath: true },
    })
    refreshSession()
  }

  const submitDebrief = () => {
    if (!activeTrialId || !selectedAction || !understanding || confidence < 1 || !effort) return
    const result: ConditionResult = {
      condition: activeCondition,
      interactionElapsedMs,
      selectedAction,
      understanding,
      confidence,
      effort,
      permanentCancellationBeforeCommit: permanentCancellationRef.current,
    }
    const outcome = resultOutcome(selectedAction)
    recorderRef.current?.completeTrial(activeTrialId, {
      outcome,
      metrics: {
        'correct-action-selected': availableMetric(selectedAction === 'trash'),
        'permanent-action-selected-accidentally': availableMetric(selectedAction === 'permanent'),
        'cancellation-before-commit': availableMetric(permanentCancellationRef.current),
        'stage-comprehension': availableMetric(understanding === selectedAction),
        'time-to-action-selection-ms': availableMetric(interactionElapsedMs),
        'confidence-rating': availableMetric(confidence),
        'clarity-effort-response': availableMetric(effort),
      },
      detail: { selectedAction, understanding, effort },
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
  const adaptiveAction = stageAction[adaptiveStage]
  const adaptivePresentation = adaptiveStage === 'Preview'
    ? { label: 'Delete', metadata: 'Preview affected items', tone: 'quiet' as const }
    : adaptiveStage === 'Act'
      ? { label: 'Move to Trash', metadata: 'Reversible action', tone: 'primary' as const }
      : { label: 'Delete Permanently', metadata: 'Cannot be undone', tone: 'ethical' as const }

  return (
    <section className="comparison-trial pressure-comparison" aria-labelledby="pressure-comparison-title">
      <header className="comparison-trial-header">
        <div>
          <span>CONTROLLED COMPARISON · PRESSURE</span>
          <h3 id="pressure-comparison-title">Same task. Two escalation models.</h3>
        </div>
        <button type="button" className="comparison-exit" onClick={abandonAndExit}>Exit comparison</button>
      </header>

      {phase === 'brief' && (
        <div className="comparison-brief">
          <div className="comparison-task-card">
            <span>TASK</span>
            <strong>{pressureComparisonTrial.taskPrompt}</strong>
            <p>{pressureComparisonTrial.comparisonFacts.consequence} Moving to Trash remains reversible.</p>
          </div>

          <fieldset className="condition-order-picker">
            <legend>Condition order</legend>
            <label><input type="radio" name="pressure-condition-order" checked={orderMode === 'randomized'} onChange={() => setOrderMode('randomized')} /> Randomized</label>
            <label><input type="radio" name="pressure-condition-order" checked={orderMode === 'conventional-first'} onChange={() => setOrderMode('conventional-first')} /> Conventional first</label>
            <label><input type="radio" name="pressure-condition-order" checked={orderMode === 'adaptive-first'} onChange={() => setOrderMode('adaptive-first')} /> Adaptive first</label>
          </fieldset>

          <label className="comparison-retention">
            <input type="checkbox" checked={persistLocally} onChange={event => changePersistence(event.target.checked)} />
            <span><strong>Keep this session on this device</strong><small>Optional. Local browser storage only, deleted after 24 hours.</small></span>
          </label>

          <div className="comparison-principles">
            <span>FAIRNESS CONTRACT</span>
            <p>The task, four-item count, consequence, target minimum, and success definition stay identical. Only the action-escalation model changes.</p>
          </div>

          <button type="button" className="comparison-primary" onClick={beginComparison}>Begin two-condition trial</button>
          <p className="comparison-disclaimer">Exploratory local observation only. Elapsed hold simulates stages; it is not physical pressure sensing.</p>
        </div>
      )}

      {phase === 'condition' && (
        <div className="comparison-condition">
          <div className="condition-neutral-label">
            <span>TRIAL {trialLetter} / 2</span>
            <strong>Condition identity is hidden until both trials are complete.</strong>
          </div>
          <div className="comparison-task-inline">
            <span>TASK</span>
            <p>{pressureComparisonTrial.taskPrompt}</p>
          </div>

          <div className="comparison-control-stage pressure-control-stage">
            {activeCondition === 'conventional' ? (
              conventionalConfirmation ? (
                <section className="pressure-permanent-confirmation" aria-labelledby="pressure-confirm-title">
                  <span>PERMANENT CONSEQUENCE</span>
                  <h4 id="pressure-confirm-title">Delete four items permanently?</h4>
                  <p>{pressureComparisonTrial.comparisonFacts.consequence}</p>
                  <div>
                    <button type="button" onClick={() => cancelPermanent('conventional')}>Cancel permanent action</button>
                    <button type="button" className="pressure-danger" onClick={() => finishInteraction('conventional', 'permanent')}>Confirm permanent deletion</button>
                  </div>
                </section>
              ) : (
                <div className="pressure-conventional-grid" role="group" aria-label="Choose an action">
                  <button type="button" onClick={() => finishInteraction('conventional', 'preview')}><strong>Preview affected items</strong><span>No items change</span></button>
                  <button type="button" onClick={() => finishInteraction('conventional', 'trash')}><strong>Move to Trash</strong><span>Reversible action</span></button>
                  <button type="button" onClick={revealConventionalPermanent}><strong>Delete permanently</strong><span>Cannot be undone</span></button>
                </div>
              )
            ) : (
              <div className="pressure-adaptive-condition">
                <div className="pressure-stage-selector" role="group" aria-label="Pressure stage alternatives">
                  {(['Preview', 'Act', 'Commit'] as const).map((stage, index) => (
                    <button type="button" key={stage} aria-pressed={adaptiveStage === stage} onClick={() => selectAdaptiveStage(stage, 'explicit stage control')}>
                      <span>{index + 1}</span>{stage}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="pressure-hold-surface"
                  onPointerDown={startAdaptiveHold}
                  onPointerUp={stopAdaptiveHold}
                  onPointerCancel={stopAdaptiveHold}
                  onPointerLeave={stopAdaptiveHold}
                  onKeyDown={event => {
                    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) startAdaptiveHold()
                  }}
                  onKeyUp={event => {
                    if (event.key === 'Enter' || event.key === ' ') stopAdaptiveHold()
                  }}
                >
                  Optional simulated hold path · explicit stages remain available
                </button>

                {adaptiveStage === 'Commit' && (
                  <div className="consequence-card" role="note">
                    <strong>Permanent deletion cannot be undone.</strong>
                    <span>The explicit Act stage remains available for reversible Trash.</span>
                    <button type="button" onClick={() => cancelPermanent('adaptive')}>Cancel permanent stage</button>
                  </div>
                )}

                <AdaptiveButton
                  label={adaptivePresentation.label}
                  metadata={adaptivePresentation.metadata}
                  tone={adaptivePresentation.tone}
                  stateName={adaptiveStage}
                  signal={<MeterBars active={adaptiveStage === 'Preview' ? 1 : adaptiveStage === 'Act' ? 2 : 3} />}
                  onClick={() => finishInteraction('adaptive', adaptiveAction)}
                  aria-label={`${adaptivePresentation.label}. ${adaptivePresentation.metadata}`}
                />
              </div>
            )}
            <p className="condition-boundary">Use the controls naturally. The correct task outcome is reversible Trash.</p>
          </div>

          <p className="comparison-disclaimer">The condition label will be disclosed only after both trials.</p>
        </div>
      )}

      {phase === 'debrief' && selectedAction && (
        <form className="comparison-debrief" onSubmit={event => { event.preventDefault(); submitDebrief() }}>
          <header><span>SHORT DEBRIEF · TRIAL {trialLetter}</span><h3>Record the consequence you understood.</h3></header>

          <fieldset>
            <legend>Before commitment, which outcome did your selected control represent?</legend>
            <label><input type="radio" name="pressure-understanding" checked={understanding === 'preview'} onChange={() => setUnderstanding('preview')} /> Preview four affected items</label>
            <label><input type="radio" name="pressure-understanding" checked={understanding === 'trash'} onChange={() => setUnderstanding('trash')} /> Move four items to Trash</label>
            <label><input type="radio" name="pressure-understanding" checked={understanding === 'permanent'} onChange={() => setUnderstanding('permanent')} /> Delete four items permanently</label>
            <label><input type="radio" name="pressure-understanding" checked={understanding === 'not-sure'} onChange={() => setUnderstanding('not-sure')} /> I was not sure</label>
          </fieldset>

          <fieldset>
            <legend>How confident were you in that understanding?</legend>
            <div className="confidence-scale">
              {[1, 2, 3, 4, 5].map(value => (
                <label key={value}><input type="radio" name="pressure-confidence" aria-label={`Pressure confidence ${value} of 5`} checked={confidence === value} onChange={() => setConfidence(value)} /><span>{value}</span></label>
              ))}
            </div>
            <div className="scale-labels"><span>Not confident</span><span>Very confident</span></div>
          </fieldset>

          <fieldset>
            <legend>How did the escalation model feel?</legend>
            <label><input type="radio" name="pressure-effort" checked={effort === 'clearer'} onChange={() => setEffort('clearer')} /> Clearer</label>
            <label><input type="radio" name="pressure-effort" checked={effort === 'slower'} onChange={() => setEffort('slower')} /> Slower</label>
            <label><input type="radio" name="pressure-effort" checked={effort === 'more-demanding'} onChange={() => setEffort('more-demanding')} /> More demanding</label>
            <label><input type="radio" name="pressure-effort" checked={effort === 'unchanged'} onChange={() => setEffort('unchanged')} /> Unchanged</label>
          </fieldset>

          <button type="submit" className="comparison-primary" disabled={!understanding || confidence < 1 || !effort}>Record trial observation</button>
        </form>
      )}

      {phase === 'between' && (
        <div className="comparison-between">
          <span>TRIAL A RECORDED</span>
          <h3>The second condition uses the same Trash task and permanent consequence.</h3>
          <p>Its identity remains hidden until the comparison is complete.</p>
          <button type="button" className="comparison-primary" onClick={continueToSecondCondition}>Continue to Trial B</button>
        </div>
      )}

      {phase === 'results' && conventionalResult && adaptiveResult && (
        <div className="comparison-results">
          <header>
            <span>EXPLORATORY SESSION COMPARISON</span>
            <h3>Raw action choices, not a winner.</h3>
            <p>One local session can reveal comprehension and cancellation signals. It cannot prove that either escalation model is safer or better.</p>
          </header>

          <div className="comparison-result-grid">
            {[conventionalResult, adaptiveResult].map(result => (
              <article key={result.condition}>
                <span>{conditionName(result.condition)}</span>
                <strong>Selected: {actionLabels[result.selectedAction]}</strong>
                <dl>
                  <div><dt>Selection time</dt><dd>{(result.interactionElapsedMs / 1000).toFixed(2)} s</dd></div>
                  <div><dt>Correct Trash action</dt><dd>{result.selectedAction === 'trash' ? 'yes' : 'no'}</dd></div>
                  <div><dt>Understood consequence</dt><dd>{understandingLabel(result.understanding)}</dd></div>
                  <div><dt>Comprehension matched</dt><dd>{result.understanding === result.selectedAction ? 'yes' : 'no'}</dd></div>
                  <div><dt>Permanent cancelled</dt><dd>{result.permanentCancellationBeforeCommit ? 'yes' : 'no'}</dd></div>
                  <div><dt>Confidence</dt><dd>{result.confidence} / 5</dd></div>
                  <div><dt>Participant description</dt><dd>{result.effort.replace('-', ' ')}</dd></div>
                </dl>
              </article>
            ))}
          </div>

          <div className="comparison-session-note">
            <span>SESSION RECORD</span>
            <p>{session?.trials.length ?? 0} trials · {session?.events.length ?? 0} semantic events · order {conditionOrder.map(conditionName).join(' → ')}</p>
            <small>{storageMessage}</small>
          </div>

          <div className="comparison-result-actions">
            <button type="button" className="comparison-primary" onClick={restart}>Run again</button>
            <button type="button" onClick={clearData}>Clear stored session data</button>
            <button type="button" onClick={onExit}>Return to specimen</button>
          </div>
        </div>
      )}
    </section>
  )
}

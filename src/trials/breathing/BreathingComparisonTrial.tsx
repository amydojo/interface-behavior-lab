import { useEffect, useMemo, useRef, useState } from 'react'
import { breathingExperiment, type BreathingStateId } from '../../experiments/breathing/model'
import { clearStoredSession, saveSession } from '../../session/persistence'
import { TrialSessionRecorder } from '../../session/recorder'
import type { LabSessionV2 } from '../../session/types'
import type { DemoProps, LabMode } from '../../types'
import { breathingComparisonTrial, breathingStateSequence } from '../definitions/breathing'
import '../intent/intent-comparison.css'
import { resolveConditionOrder } from '../order'
import { availableMetric } from '../types'
import type { ConditionOrderMode, TrialCondition } from '../types'
import './breathing-comparison.css'

type Phase = 'brief' | 'condition' | 'debrief' | 'between' | 'results'
type MotionPreference = 'keep-motion' | 'reduce-motion' | 'no-preference'

type StateObservation = {
  state: BreathingStateId
  response: BreathingStateId
  correct: boolean
  identificationElapsedMs: number
}

type ConditionResult = {
  condition: TrialCondition
  observations: readonly StateObservation[]
  correctCount: number
  accuracyPercent: number
  meanIdentificationMs: number
  motionPreference: MotionPreference
  distractionRating: number
}

type Props = {
  demoProps: DemoProps
  mode: LabMode
  onExit: () => void
  onStateChange?: (state: string) => void
}

const stateNames: readonly BreathingStateId[] = ['Ready', 'Listening', 'Processing', 'Complete']

function createSeed() {
  return globalThis.crypto?.randomUUID?.() ?? `breathing-${Date.now()}`
}

function conditionName(condition: TrialCondition) {
  return condition === 'adaptive' ? 'Adaptive' : 'Conventional'
}

function resultFor(results: readonly ConditionResult[], condition: TrialCondition) {
  return results.find(result => result.condition === condition)
}

function motionPreferenceLabel(value: MotionPreference) {
  if (value === 'keep-motion') return 'keep motion'
  if (value === 'reduce-motion') return 'reduce motion'
  return 'no preference'
}

function mean(values: readonly number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length)
}

export function BreathingComparisonTrial({ demoProps, mode, onExit, onStateChange }: Props) {
  const [phase, setPhase] = useState<Phase>('brief')
  const [orderMode, setOrderMode] = useState<ConditionOrderMode>('randomized')
  const [persistLocally, setPersistLocally] = useState(false)
  const [conditionOrder, setConditionOrder] = useState<readonly [TrialCondition, TrialCondition]>(['conventional', 'adaptive'])
  const [conditionIndex, setConditionIndex] = useState(0)
  const [activeTrialId, setActiveTrialId] = useState<string | null>(null)
  const [observationIndex, setObservationIndex] = useState(0)
  const [roundStartedAt, setRoundStartedAt] = useState(0)
  const [observations, setObservations] = useState<StateObservation[]>([])
  const [motionPreference, setMotionPreference] = useState<MotionPreference | ''>('')
  const [distractionRating, setDistractionRating] = useState(0)
  const [results, setResults] = useState<ConditionResult[]>([])
  const [session, setSession] = useState<LabSessionV2 | null>(null)
  const [storageMessage, setStorageMessage] = useState('Session remains in memory only.')
  const recorderRef = useRef<TrialSessionRecorder | null>(null)
  const previousModeRef = useRef(mode)
  const previousMotionRef = useRef(demoProps.reducedMotion)
  const previousInputRef = useRef(demoProps.modality)

  const activeCondition = conditionOrder[conditionIndex]
  const trialLetter = conditionIndex === 0 ? 'A' : 'B'
  const activeState = breathingStateSequence[observationIndex] ?? breathingStateSequence[0]
  const presentation = breathingExperiment.getPresentation({ id: activeState })

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
    onStateChange?.(`Comparison · ${phase}`)
  }, [onStateChange, phase])

  useEffect(() => {
    if (!persistLocally || !session) return
    const saved = saveSession(window.localStorage, session)
    setStorageMessage(saved.ok ? 'Session saved locally for up to 24 hours.' : 'Local storage is unavailable.')
  }, [persistLocally, session])

  useEffect(() => {
    if (previousModeRef.current === mode) return
    recorderRef.current?.record({
      action: 'material_mode_changed',
      trialId: activeTrialId ?? undefined,
      materialMode: mode,
      detail: { previousMode: previousModeRef.current, nextMode: mode },
    })
    previousModeRef.current = mode
    refreshSession()
  }, [activeTrialId, mode])

  useEffect(() => {
    if (previousMotionRef.current === demoProps.reducedMotion) return
    recorderRef.current?.record({
      action: 'reduced_motion_changed',
      trialId: activeTrialId ?? undefined,
      reducedMotion: demoProps.reducedMotion,
      detail: { reducedMotion: demoProps.reducedMotion },
    })
    previousMotionRef.current = demoProps.reducedMotion
    refreshSession()
  }, [activeTrialId, demoProps.reducedMotion])

  useEffect(() => {
    if (previousInputRef.current === demoProps.modality) return
    recorderRef.current?.record({
      action: 'input_context_changed',
      trialId: activeTrialId ?? undefined,
      inputContext: demoProps.modality,
      detail: { previousInput: previousInputRef.current, nextInput: demoProps.modality },
    })
    previousInputRef.current = demoProps.modality
    refreshSession()
  }, [activeTrialId, demoProps.modality])

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
    const trial = recorder.startTrial({
      definitionId: breathingComparisonTrial.id,
      experimentId: breathingComparisonTrial.experimentId,
      scenarioId: breathingComparisonTrial.scenarioId,
      condition,
      orderIndex: index,
    })
    recorder.record({
      action: 'condition_selected',
      trialId: trial.trialId,
      detail: {
        orderIndex: index,
        trialLabel: index === 0 ? 'A' : 'B',
        stateSequence: breathingStateSequence.join(' → '),
      },
    })
    setConditionIndex(index)
    setActiveTrialId(trial.trialId)
    setObservationIndex(0)
    setObservations([])
    setMotionPreference('')
    setDistractionRating(0)
    setRoundStartedAt(globalThis.performance.now())
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
    previousModeRef.current = mode
    previousMotionRef.current = demoProps.reducedMotion
    previousInputRef.current = demoProps.modality
    setConditionOrder(order)
    setResults([])
    setSession(recorder.getSnapshot())
    startCondition(order[0], 0, recorder)
  }

  const identifyState = (response: BreathingStateId) => {
    if (!activeTrialId || phase !== 'condition') return
    const now = globalThis.performance.now()
    const elapsed = Math.max(0, Math.round(now - roundStartedAt))
    const observation: StateObservation = {
      state: activeState,
      response,
      correct: response === activeState,
      identificationElapsedMs: elapsed,
    }
    const nextObservations = [...observations, observation]

    recorderRef.current?.record({
      action: 'observation_recorded',
      trialId: activeTrialId,
      previousState: activeState,
      nextState: response,
      outcome: response === activeState ? 'completed' : 'incorrect',
      detail: {
        observationIndex: observationIndex + 1,
        displayedState: activeState,
        response,
        correct: observation.correct,
        identificationElapsedMs: elapsed,
        motionEnabled: !demoProps.reducedMotion,
      },
    })
    setObservations(nextObservations)
    refreshSession()

    if (observationIndex === breathingStateSequence.length - 1) {
      setPhase('debrief')
      return
    }

    setObservationIndex(current => current + 1)
    setRoundStartedAt(now)
  }

  const submitDebrief = () => {
    if (!activeTrialId || observations.length !== breathingStateSequence.length || !motionPreference || distractionRating < 1) return
    const correctCount = observations.filter(observation => observation.correct).length
    const accuracyPercent = Math.round((correctCount / observations.length) * 100)
    const meanIdentificationMs = mean(observations.map(observation => observation.identificationElapsedMs))
    const result: ConditionResult = {
      condition: activeCondition,
      observations,
      correctCount,
      accuracyPercent,
      meanIdentificationMs,
      motionPreference,
      distractionRating,
    }

    recorderRef.current?.completeTrial(activeTrialId, {
      outcome: 'completed',
      metrics: {
        'state-identification-accuracy': availableMetric(accuracyPercent),
        'correct-state-count': availableMetric(correctCount),
        'mean-identification-time-ms': availableMetric(meanIdentificationMs),
        'motion-preference': availableMetric(motionPreference),
        'distraction-rating': availableMetric(distractionRating),
      },
      detail: {
        motionPreference,
        distractionRating,
        correctCount,
        observationCount: observations.length,
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
    if (activeTrialId) {
      recorderRef.current?.abandonTrial(activeTrialId, { reason: 'participant-exited-comparison' })
      refreshSession()
    }
    onExit()
  }

  const restart = () => {
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
    <section className="comparison-trial breathing-comparison" aria-labelledby="comparison-title">
      <header className="comparison-trial-header">
        <div>
          <span>CONTROLLED COMPARISON · BREATHING</span>
          <h3 id="comparison-title">Same literal states. Two presentation conditions.</h3>
        </div>
        <button type="button" className="comparison-exit" onClick={abandonAndExit}>Exit comparison</button>
      </header>

      {phase === 'brief' && (
        <div className="comparison-brief">
          <div className="comparison-task-card">
            <span>TASK</span>
            <strong>{breathingComparisonTrial.taskPrompt}</strong>
            <p>{breathingComparisonTrial.comparisonFacts.consequence}</p>
          </div>

          <fieldset className="condition-order-picker">
            <legend>Condition order</legend>
            <label><input type="radio" name="breathing-condition-order" checked={orderMode === 'randomized'} onChange={() => setOrderMode('randomized')} /> Randomized</label>
            <label><input type="radio" name="breathing-condition-order" checked={orderMode === 'conventional-first'} onChange={() => setOrderMode('conventional-first')} /> Conventional first</label>
            <label><input type="radio" name="breathing-condition-order" checked={orderMode === 'adaptive-first'} onChange={() => setOrderMode('adaptive-first')} /> Adaptive first</label>
          </fieldset>

          <label className="comparison-retention">
            <input type="checkbox" checked={persistLocally} onChange={event => changePersistence(event.target.checked)} />
            <span><strong>Keep this session on this device</strong><small>Optional. Local browser storage only, deleted after 24 hours.</small></span>
          </label>

          <div className="comparison-principles">
            <span>FAIRNESS CONTRACT</span>
            <p>Both conditions use the same state order, literal labels, metadata, answer choices, target minimum, and completion rule. Only the visual presentation pattern changes.</p>
          </div>

          <button type="button" className="comparison-primary" onClick={beginComparison}>Begin two-condition trial</button>
          <p className="comparison-disclaimer">Exploratory local observation only. Accuracy and timing from one session cannot validate either presentation.</p>
        </div>
      )}

      {phase === 'condition' && (
        <div className="comparison-condition breathing-condition">
          <div className="condition-neutral-label">
            <span>TRIAL {trialLetter} / 2 · OBSERVATION {observationIndex + 1} / {breathingStateSequence.length}</span>
            <strong>Condition identity is hidden until both trials are complete.</strong>
          </div>

          <div className="comparison-task-inline">
            <span>TASK</span>
            <p>{breathingComparisonTrial.taskPrompt}</p>
          </div>

          <div className="comparison-control-stage breathing-control-stage">
            <div
              className={`breathing-state-display ${activeCondition === 'adaptive' ? 'is-rhythmic' : 'is-conventional'}`}
              data-state={activeState.toLowerCase()}
              data-reduced-motion={demoProps.reducedMotion}
              aria-label={`${activeState} system state`}
            >
              {activeCondition === 'adaptive' ? (
                <div className="breathing-rhythm" aria-hidden="true" data-rings={presentation.rings}>
                  <i /><i /><i /><b>{activeState === 'Complete' ? '✓' : '·'}</b>
                </div>
              ) : (
                <div className="conventional-status-indicator" aria-hidden="true">
                  <i />
                  <b>{activeState === 'Complete' ? '✓' : activeState === 'Listening' ? '●' : activeState === 'Ready' ? '—' : '↻'}</b>
                </div>
              )}
              <div className="breathing-state-copy">
                <span>SYSTEM STATE</span>
                <strong>{activeState}</strong>
                <small>{presentation.metadata}</small>
              </div>
            </div>

            <fieldset className="breathing-answer-set">
              <legend>Which state is shown?</legend>
              <div>
                {stateNames.map(state => (
                  <button key={state} type="button" onClick={() => identifyState(state)}>{state}</button>
                ))}
              </div>
            </fieldset>
          </div>

          <p className="condition-boundary">Literal labels remain available in both conditions. Motion is supplementary and never the sole state cue.</p>
        </div>
      )}

      {phase === 'debrief' && (
        <form className="comparison-debrief" onSubmit={event => { event.preventDefault(); submitDebrief() }}>
          <header><span>SHORT DEBRIEF · TRIAL {trialLetter}</span><h3>Record the presentation experience before continuing.</h3></header>

          <fieldset>
            <legend>Would you keep or reduce the motion in this presentation?</legend>
            <label><input type="radio" name="motion-preference" checked={motionPreference === 'keep-motion'} onChange={() => setMotionPreference('keep-motion')} /> Keep the motion</label>
            <label><input type="radio" name="motion-preference" checked={motionPreference === 'reduce-motion'} onChange={() => setMotionPreference('reduce-motion')} /> Reduce the motion</label>
            <label><input type="radio" name="motion-preference" checked={motionPreference === 'no-preference'} onChange={() => setMotionPreference('no-preference')} /> No preference</label>
          </fieldset>

          <fieldset>
            <legend>How visually distracting was the presentation?</legend>
            <div className="confidence-scale">
              {[1, 2, 3, 4, 5].map(value => (
                <label key={value}><input type="radio" name="distraction" aria-label={`Distraction ${value} of 5`} checked={distractionRating === value} onChange={() => setDistractionRating(value)} /><span>{value}</span></label>
              ))}
            </div>
            <div className="scale-labels"><span>Not distracting</span><span>Very distracting</span></div>
          </fieldset>

          <button type="submit" className="comparison-primary" disabled={!motionPreference || distractionRating < 1}>Record trial observation</button>
        </form>
      )}

      {phase === 'between' && (
        <div className="comparison-between">
          <span>TRIAL A RECORDED</span>
          <h3>The second condition uses the same four states in the same order.</h3>
          <p>Literal labels, metadata, and answer choices remain unchanged. Condition identity stays hidden.</p>
          <button type="button" className="comparison-primary" onClick={continueToSecondCondition}>Continue to Trial B</button>
        </div>
      )}

      {phase === 'results' && conventionalResult && adaptiveResult && (
        <div className="comparison-results">
          <header>
            <span>EXPLORATORY SESSION COMPARISON</span>
            <h3>Raw state observations, not a winner.</h3>
            <p>One local session can reveal timing, accuracy, and distraction tradeoffs. It cannot prove that either presentation is universally clearer.</p>
          </header>

          <div className="comparison-result-grid breathing-result-grid">
            {[conventionalResult, adaptiveResult].map(result => (
              <article key={result.condition}>
                <span>{conditionName(result.condition)}</span>
                <strong>{result.correctCount} / {result.observations.length} states identified</strong>
                <dl>
                  <div><dt>Accuracy</dt><dd>{result.accuracyPercent}%</dd></div>
                  <div><dt>Mean identify time</dt><dd>{(result.meanIdentificationMs / 1000).toFixed(2)} s</dd></div>
                  <div><dt>Motion preference</dt><dd>{motionPreferenceLabel(result.motionPreference)}</dd></div>
                  <div><dt>Distraction</dt><dd>{result.distractionRating} / 5</dd></div>
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

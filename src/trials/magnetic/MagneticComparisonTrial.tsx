import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { magneticThresholds } from '../../experiments/magnetic/model'
import { clearStoredSession, saveSession } from '../../session/persistence'
import { TrialSessionRecorder } from '../../session/recorder'
import type { LabSessionV2 } from '../../session/types'
import type { DemoProps, LabMode } from '../../types'
import { magneticComparisonTrial } from '../definitions/magnetic'
import '../intent/intent-comparison.css'
import { resolveConditionOrder } from '../order'
import { availableMetric, unavailableMetric } from '../types'
import type { ConditionOrderMode, TrialCondition } from '../types'
import './magnetic-comparison.css'

type Phase = 'brief' | 'condition' | 'debrief' | 'between' | 'results'
type FieldState = 'Far' | 'Near' | 'Aligned'
type InputPath = 'pointer' | 'touch' | 'keyboard-or-switch' | 'other'
type EffortResponse = 'easier' | 'unchanged' | 'harder'
type AssistanceResponse = 'helpful' | 'neutral' | 'distracting'

type ActivationObservation = {
  condition: TrialCondition
  activationElapsedMs: number
  finalPointerOffsetPx: number | null
  offsetUnavailableReason: 'unsupported-input' | null
  alignedAtActivation: boolean | null
  inputPath: InputPath
  confidence: number
  effort: EffortResponse
  assistanceResponse: AssistanceResponse
}

type Props = {
  demoProps: DemoProps
  mode: LabMode
  onExit: () => void
  onStateChange?: (state: string) => void
}

function createSeed() {
  return globalThis.crypto?.randomUUID?.() ?? `magnetic-${Date.now()}`
}

function conditionName(condition: TrialCondition) {
  return condition === 'adaptive' ? 'Adaptive' : 'Conventional'
}

function resultFor(results: readonly ActivationObservation[], condition: TrialCondition) {
  return results.find(result => result.condition === condition)
}

function fieldStateForDistance(distance: number, assistance: number): FieldState {
  const thresholds = magneticThresholds(assistance)
  if (distance <= thresholds.aligned) return 'Aligned'
  if (distance <= thresholds.near) return 'Near'
  return 'Far'
}

function inputPathLabel(path: InputPath) {
  if (path === 'keyboard-or-switch') return 'keyboard or switch'
  return path
}

function offsetLabel(result: ActivationObservation) {
  if (result.finalPointerOffsetPx !== null) return `${result.finalPointerOffsetPx} px`
  return result.offsetUnavailableReason === 'unsupported-input' ? 'Unavailable for this input path' : 'Not observed'
}

export function MagneticComparisonTrial({ demoProps, mode, onExit, onStateChange }: Props) {
  const { assistance, modality, reducedMotion } = demoProps
  const [phase, setPhase] = useState<Phase>('brief')
  const [orderMode, setOrderMode] = useState<ConditionOrderMode>('randomized')
  const [persistLocally, setPersistLocally] = useState(false)
  const [conditionOrder, setConditionOrder] = useState<readonly [TrialCondition, TrialCondition]>(['conventional', 'adaptive'])
  const [conditionIndex, setConditionIndex] = useState(0)
  const [activeTrialId, setActiveTrialId] = useState<string | null>(null)
  const [conditionStartedAt, setConditionStartedAt] = useState(0)
  const [fieldState, setFieldState] = useState<FieldState>('Far')
  const [activation, setActivation] = useState<Omit<ActivationObservation, 'condition' | 'confidence' | 'effort' | 'assistanceResponse'> | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [effort, setEffort] = useState<EffortResponse | ''>('')
  const [assistanceResponse, setAssistanceResponse] = useState<AssistanceResponse | ''>('')
  const [results, setResults] = useState<ActivationObservation[]>([])
  const [session, setSession] = useState<LabSessionV2 | null>(null)
  const [storageMessage, setStorageMessage] = useState('Session remains in memory only.')
  const recorderRef = useRef<TrialSessionRecorder | null>(null)
  const fieldStateRef = useRef<FieldState>('Far')
  const pointerIntentRef = useRef(false)
  const previousModeRef = useRef(mode)
  const previousMotionRef = useRef(reducedMotion)
  const previousInputRef = useRef(modality)
  const previousAssistanceRef = useRef(assistance)

  const activeCondition = conditionOrder[conditionIndex]
  const trialLetter = conditionIndex === 0 ? 'A' : 'B'

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
  }, [activeTrialId, mode, refreshSession])

  useEffect(() => {
    if (previousMotionRef.current === reducedMotion) return
    recorderRef.current?.record({
      action: 'reduced_motion_changed',
      trialId: activeTrialId ?? undefined,
      reducedMotion,
      detail: { reducedMotion },
    })
    previousMotionRef.current = reducedMotion
    refreshSession()
  }, [activeTrialId, reducedMotion, refreshSession])

  useEffect(() => {
    if (previousInputRef.current === modality) return
    recorderRef.current?.record({
      action: 'input_context_changed',
      trialId: activeTrialId ?? undefined,
      inputContext: modality,
      detail: { previousInput: previousInputRef.current, nextInput: modality },
    })
    previousInputRef.current = modality
    refreshSession()
  }, [activeTrialId, modality, refreshSession])

  useEffect(() => {
    if (previousAssistanceRef.current === assistance) return
    recorderRef.current?.record({
      action: 'assistance_changed',
      trialId: activeTrialId ?? undefined,
      detail: { previousAssistance: previousAssistanceRef.current, nextAssistance: assistance },
    })
    previousAssistanceRef.current = assistance
    refreshSession()
  }, [activeTrialId, assistance, refreshSession])

  const changePersistence = (next: boolean) => {
    setPersistLocally(next)
    if (!next) {
      const cleared = clearStoredSession(window.localStorage)
      setStorageMessage(cleared.ok ? 'Session remains in memory only.' : 'Local storage is unavailable.')
    }
  }

  const setSemanticFieldState = useCallback((next: FieldState, source: string) => {
    if (activeCondition !== 'adaptive' || next === fieldStateRef.current) return
    const previous = fieldStateRef.current
    fieldStateRef.current = next
    setFieldState(next)
    recorderRef.current?.record({
      action: 'state_transitioned',
      trialId: activeTrialId ?? undefined,
      previousState: previous,
      nextState: next,
      detail: { source },
    })
    refreshSession()
  }, [activeCondition, activeTrialId, refreshSession])

  const startCondition = (
    condition: TrialCondition,
    index: number,
    recorder = recorderRef.current,
  ) => {
    if (!recorder) return
    const trial = recorder.startTrial({
      definitionId: magneticComparisonTrial.id,
      experimentId: magneticComparisonTrial.experimentId,
      scenarioId: magneticComparisonTrial.scenarioId,
      condition,
      orderIndex: index,
    })
    recorder.record({
      action: 'condition_selected',
      trialId: trial.trialId,
      detail: {
        orderIndex: index,
        trialLabel: index === 0 ? 'A' : 'B',
        targetGeometry: 'fixed',
        assistance: condition === 'adaptive' ? assistance : 0,
      },
    })
    setConditionIndex(index)
    setActiveTrialId(trial.trialId)
    setConditionStartedAt(globalThis.performance.now())
    fieldStateRef.current = 'Far'
    setFieldState('Far')
    setActivation(null)
    setConfidence(0)
    setEffort('')
    setAssistanceResponse('')
    setPhase('condition')
    refreshSession(recorder)
  }

  const beginComparison = () => {
    const seed = createSeed()
    const order = resolveConditionOrder(orderMode, seed)
    const recorder = new TrialSessionRecorder({
      randomizationSeed: seed,
      settings: {
        inputContext: modality,
        materialMode: mode,
        reducedMotion,
        assistance,
        conditionOrder: orderMode,
      },
    })
    recorderRef.current = recorder
    previousModeRef.current = mode
    previousMotionRef.current = reducedMotion
    previousInputRef.current = modality
    previousAssistanceRef.current = assistance
    setConditionOrder(order)
    setResults([])
    setSession(recorder.getSnapshot())
    startCondition(order[0], 0, recorder)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (activeCondition !== 'adaptive') return
    const button = event.currentTarget.querySelector<HTMLButtonElement>('.magnetic-trial-target')
    if (!button) return
    const rect = button.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    setSemanticFieldState(fieldStateForDistance(Math.sqrt(dx * dx + dy * dy), assistance), 'bounded pointer proximity')
  }

  const handleActivate = (event: MouseEvent<HTMLButtonElement>) => {
    if (!activeTrialId) return
    const elapsed = Math.max(0, Math.round(globalThis.performance.now() - conditionStartedAt))
    const pointerActivation = event.detail > 0 && modality === 'pointer'
    const touchActivation = event.detail > 0 && modality === 'touch'
    const inputPath: InputPath = pointerActivation
      ? 'pointer'
      : touchActivation
        ? 'touch'
        : modality === 'switch' || event.detail === 0
          ? 'keyboard-or-switch'
          : 'other'
    let finalPointerOffsetPx: number | null = null
    let offsetUnavailableReason: 'unsupported-input' | null = 'unsupported-input'

    if (pointerActivation) {
      const rect = event.currentTarget.getBoundingClientRect()
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      finalPointerOffsetPx = Math.max(0, Math.round(Math.sqrt(dx * dx + dy * dy)))
      offsetUnavailableReason = null
    }

    const alignedAtActivation = activeCondition === 'adaptive' ? fieldStateRef.current === 'Aligned' : null
    recorderRef.current?.record({
      action: 'action_committed',
      trialId: activeTrialId,
      previousState: activeCondition === 'adaptive' ? fieldStateRef.current : 'Static target',
      nextState: 'Released',
      outcome: 'completed',
      detail: {
        inputPath,
        activationElapsedMs: elapsed,
        finalPointerOffsetPx,
        alignedAtActivation,
        targetMoved: false,
        assistance: activeCondition === 'adaptive' ? assistance : 0,
      },
    })
    if (inputPath === 'keyboard-or-switch') {
      recorderRef.current?.record({
        action: 'alternative_path_used',
        trialId: activeTrialId,
        previousState: activeCondition === 'adaptive' ? fieldStateRef.current : 'Static target',
        nextState: 'Released',
        detail: { path: 'native keyboard activation' },
      })
    }
    setActivation({
      activationElapsedMs: elapsed,
      finalPointerOffsetPx,
      offsetUnavailableReason,
      alignedAtActivation,
      inputPath,
    })
    pointerIntentRef.current = false
    setPhase('debrief')
    refreshSession()
  }

  const submitDebrief = () => {
    if (!activeTrialId || !activation || confidence < 1 || !effort || !assistanceResponse) return
    const result: ActivationObservation = {
      condition: activeCondition,
      ...activation,
      confidence,
      effort,
      assistanceResponse,
    }
    recorderRef.current?.completeTrial(activeTrialId, {
      outcome: 'completed',
      metrics: {
        'activation-time-ms': availableMetric(activation.activationElapsedMs),
        'final-pointer-offset-px': activation.finalPointerOffsetPx === null
          ? unavailableMetric('unsupported-input')
          : availableMetric(activation.finalPointerOffsetPx),
        'aligned-at-activation': activation.alignedAtActivation === null
          ? unavailableMetric('not-applicable')
          : availableMetric(activation.alignedAtActivation),
        'keyboard-completion': availableMetric(activation.inputPath === 'keyboard-or-switch'),
        'confidence-rating': availableMetric(confidence),
        'aiming-effort-response': availableMetric(effort),
        'assistance-response': availableMetric(assistanceResponse),
      },
      detail: {
        inputPath: activation.inputPath,
        targetMoved: false,
        effort,
        assistanceResponse,
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
    <section className="comparison-trial magnetic-comparison" aria-labelledby="comparison-title">
      <header className="comparison-trial-header">
        <div>
          <span>CONTROLLED COMPARISON · MAGNETIC</span>
          <h3 id="comparison-title">Same fixed target. Two acquisition conditions.</h3>
        </div>
        <button type="button" className="comparison-exit" onClick={abandonAndExit}>Exit comparison</button>
      </header>

      {phase === 'brief' && (
        <div className="comparison-brief">
          <div className="comparison-task-card">
            <span>TASK</span>
            <strong>{magneticComparisonTrial.taskPrompt}</strong>
            <p>{magneticComparisonTrial.comparisonFacts.consequence}</p>
          </div>

          <fieldset className="condition-order-picker">
            <legend>Condition order</legend>
            <label><input type="radio" name="magnetic-condition-order" checked={orderMode === 'randomized'} onChange={() => setOrderMode('randomized')} /> Randomized</label>
            <label><input type="radio" name="magnetic-condition-order" checked={orderMode === 'conventional-first'} onChange={() => setOrderMode('conventional-first')} /> Conventional first</label>
            <label><input type="radio" name="magnetic-condition-order" checked={orderMode === 'adaptive-first'} onChange={() => setOrderMode('adaptive-first')} /> Adaptive first</label>
          </fieldset>

          <label className="comparison-retention">
            <input type="checkbox" checked={persistLocally} onChange={event => changePersistence(event.target.checked)} />
            <span><strong>Keep this session on this device</strong><small>Optional. Local browser storage only, deleted after 24 hours.</small></span>
          </label>

          <div className="comparison-principles">
            <span>FAIRNESS CONTRACT</span>
            <p>The button label, dimensions, position, consequence, activation rule, and keyboard path remain identical. Only bounded visual proximity assistance changes.</p>
          </div>

          <button type="button" className="comparison-primary" onClick={beginComparison}>Begin two-condition trial</button>
          <p className="comparison-disclaimer">Exploratory local observation only. One activation per condition cannot validate aiming benefit or accessibility superiority.</p>
        </div>
      )}

      {phase === 'condition' && (
        <div className="comparison-condition magnetic-condition">
          <div className="condition-neutral-label">
            <span>TRIAL {trialLetter} / 2</span>
            <strong>Condition identity is hidden until both trials are complete.</strong>
          </div>

          <div className="comparison-task-inline">
            <span>TASK</span>
            <p>{magneticComparisonTrial.taskPrompt}</p>
          </div>

          <div
            className={`magnetic-target-stage ${activeCondition === 'adaptive' ? 'is-assisted' : 'is-static'}`}
            data-field-state={fieldState.toLowerCase()}
            data-reduced-motion={reducedMotion}
            style={{ '--magnetic-assistance': `${assistance}%` } as React.CSSProperties}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setSemanticFieldState('Far', 'pointer left assistance field')}
          >
            <div className="magnetic-target-anchor">
              <span className="magnetic-assistance-field" aria-hidden="true"><i /><i /><i /></span>
              <button
                type="button"
                className="magnetic-trial-target"
                onPointerDown={() => { pointerIntentRef.current = true }}
                onKeyDown={() => { pointerIntentRef.current = false }}
                onFocus={() => {
                  if (activeCondition === 'adaptive' && !pointerIntentRef.current) {
                    setSemanticFieldState('Aligned', 'keyboard focus alignment')
                  }
                }}
                onBlur={() => {
                  pointerIntentRef.current = false
                  setSemanticFieldState('Far', 'focus left target')
                }}
                onClick={handleActivate}
              >
                <strong>Send to Maya</strong>
                <small>Stable native target</small>
              </button>
            </div>
            <div className="magnetic-stage-copy">
              <span>TARGET GEOMETRY</span>
              <strong>Fixed</strong>
              <p>{activeCondition === 'adaptive' ? 'A bounded field responds to proximity without moving the target.' : 'The target remains static without proximity response.'}</p>
            </div>
          </div>

          <p className="condition-boundary">No raw pointer trajectory is stored. Only the final activation offset is recorded when pointer input supports it.</p>
        </div>
      )}

      {phase === 'debrief' && activation && (
        <form className="comparison-debrief" onSubmit={event => { event.preventDefault(); submitDebrief() }}>
          <header><span>SHORT DEBRIEF · TRIAL {trialLetter}</span><h3>Record the acquisition experience before continuing.</h3></header>

          <fieldset>
            <legend>How confident were you that the target would activate?</legend>
            <div className="confidence-scale">
              {[1, 2, 3, 4, 5].map(value => (
                <label key={value}><input type="radio" name="magnetic-confidence" aria-label={`Magnetic confidence ${value} of 5`} checked={confidence === value} onChange={() => setConfidence(value)} /><span>{value}</span></label>
              ))}
            </div>
            <div className="scale-labels"><span>Not confident</span><span>Very confident</span></div>
          </fieldset>

          <fieldset>
            <legend>How effortful did the target feel to acquire?</legend>
            <label><input type="radio" name="magnetic-effort" checked={effort === 'easier'} onChange={() => setEffort('easier')} /> Easier</label>
            <label><input type="radio" name="magnetic-effort" checked={effort === 'unchanged'} onChange={() => setEffort('unchanged')} /> Unchanged</label>
            <label><input type="radio" name="magnetic-effort" checked={effort === 'harder'} onChange={() => setEffort('harder')} /> Harder</label>
          </fieldset>

          <fieldset>
            <legend>How did the visual assistance feel?</legend>
            <label><input type="radio" name="magnetic-assistance-response" checked={assistanceResponse === 'helpful'} onChange={() => setAssistanceResponse('helpful')} /> Helpful</label>
            <label><input type="radio" name="magnetic-assistance-response" checked={assistanceResponse === 'neutral'} onChange={() => setAssistanceResponse('neutral')} /> Neutral</label>
            <label><input type="radio" name="magnetic-assistance-response" checked={assistanceResponse === 'distracting'} onChange={() => setAssistanceResponse('distracting')} /> Distracting</label>
          </fieldset>

          <div className="magnetic-observation-summary">
            <span>ACTIVATION OBSERVATION</span>
            <p>{(activation.activationElapsedMs / 1000).toFixed(2)} s · {inputPathLabel(activation.inputPath)} · {activation.finalPointerOffsetPx === null ? 'offset unavailable' : `${activation.finalPointerOffsetPx} px final offset`}</p>
          </div>

          <button type="submit" className="comparison-primary" disabled={confidence < 1 || !effort || !assistanceResponse}>Record trial observation</button>
        </form>
      )}

      {phase === 'between' && (
        <div className="comparison-between">
          <span>TRIAL A RECORDED</span>
          <h3>The second condition uses the exact same fixed native target.</h3>
          <p>Copy, geometry, consequence, activation, and keyboard access remain unchanged. Condition identity stays hidden.</p>
          <button type="button" className="comparison-primary" onClick={continueToSecondCondition}>Continue to Trial B</button>
        </div>
      )}

      {phase === 'results' && conventionalResult && adaptiveResult && (
        <div className="comparison-results">
          <header>
            <span>EXPLORATORY SESSION COMPARISON</span>
            <h3>Raw target observations, not a winner.</h3>
            <p>One local activation per condition can reveal acquisition tradeoffs. It cannot prove that proximity assistance improves performance or accessibility.</p>
          </header>

          <div className="comparison-result-grid magnetic-result-grid">
            {[conventionalResult, adaptiveResult].map(result => (
              <article key={result.condition}>
                <span>{conditionName(result.condition)}</span>
                <strong>{(result.activationElapsedMs / 1000).toFixed(2)} s activation</strong>
                <dl>
                  <div><dt>Final pointer offset</dt><dd>{offsetLabel(result)}</dd></div>
                  <div><dt>Input path</dt><dd>{inputPathLabel(result.inputPath)}</dd></div>
                  <div><dt>Aligned at activation</dt><dd>{result.alignedAtActivation === null ? 'Not applicable' : result.alignedAtActivation ? 'Yes' : 'No'}</dd></div>
                  <div><dt>Confidence</dt><dd>{result.confidence} / 5</dd></div>
                  <div><dt>Acquisition effort</dt><dd>{result.effort}</dd></div>
                  <div><dt>Visual assistance</dt><dd>{result.assistanceResponse}</dd></div>
                </dl>
              </article>
            ))}
          </div>

          <div className="comparison-session-note">
            <span>SESSION RECORD</span>
            <p>{session?.trials.length ?? 0} trials · {session?.events.length ?? 0} semantic events · order {conditionName(conditionOrder[0])} → {conditionName(conditionOrder[1])}</p>
            <p>{storageMessage}</p>
          </div>

          <div className="comparison-result-actions">
            <button type="button" className="comparison-primary" onClick={restart}>Run again</button>
            <button type="button" onClick={clearData}>Clear stored session data</button>
            <button type="button" onClick={onExit}>Return to adaptive specimen</button>
          </div>
        </div>
      )}
    </section>
  )
}

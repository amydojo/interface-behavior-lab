import { useEffect, useMemo, useRef, useState } from 'react'
import { AdaptiveButton } from '../../components/ControlPrimitives'
import { clearStoredSession, saveSession } from '../../session/persistence'
import { TrialSessionRecorder } from '../../session/recorder'
import type { LabSessionV2 } from '../../session/types'
import type { DemoProps, LabMode } from '../../types'
import { availableMetric, unavailableMetric } from '../types'
import type { ConditionOrderMode, TrialCondition } from '../types'
import { intentComparisonTrial } from '../definitions/intent'
import { resolveConditionOrder } from '../order'
import './intent-comparison.css'

type Phase = 'brief' | 'condition' | 'debrief' | 'between' | 'results'
type AdaptiveState = 'Rest' | 'Revealed' | 'Confirmed'
type Prediction = 'journal' | 'close-editor' | 'not-sure'
type ClarityResponse = 'clearer' | 'slower' | 'more-demanding' | 'unchanged'

type ConditionResult = {
  condition: TrialCondition
  interactionElapsedMs: number
  prediction: Prediction
  confidence: number
  clarity: ClarityResponse
}

type Props = {
  demoProps: DemoProps
  mode: LabMode
  onExit: () => void
  onStateChange?: (state: string) => void
}

function createSeed() {
  return globalThis.crypto?.randomUUID?.() ?? `intent-${Date.now()}`
}

function conditionName(condition: TrialCondition) {
  return condition === 'adaptive' ? 'Adaptive' : 'Conventional'
}

function resultFor(results: readonly ConditionResult[], condition: TrialCondition) {
  return results.find(result => result.condition === condition)
}

export function IntentComparisonTrial({ demoProps, mode, onExit, onStateChange }: Props) {
  const [phase, setPhase] = useState<Phase>('brief')
  const [orderMode, setOrderMode] = useState<ConditionOrderMode>('randomized')
  const [persistLocally, setPersistLocally] = useState(false)
  const [conditionOrder, setConditionOrder] = useState<readonly [TrialCondition, TrialCondition]>(['conventional', 'adaptive'])
  const [conditionIndex, setConditionIndex] = useState(0)
  const [activeTrialId, setActiveTrialId] = useState<string | null>(null)
  const [conditionStartedAt, setConditionStartedAt] = useState(0)
  const [interactionElapsedMs, setInteractionElapsedMs] = useState(0)
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>('Rest')
  const [conventionalComplete, setConventionalComplete] = useState(false)
  const [prediction, setPrediction] = useState<Prediction | ''>('')
  const [confidence, setConfidence] = useState(0)
  const [clarity, setClarity] = useState<ClarityResponse | ''>('')
  const [results, setResults] = useState<ConditionResult[]>([])
  const [session, setSession] = useState<LabSessionV2 | null>(null)
  const [storageMessage, setStorageMessage] = useState('')
  const recorderRef = useRef<TrialSessionRecorder | null>(null)
  const revealRecordedRef = useRef(false)

  const activeCondition = conditionOrder[conditionIndex]
  const trialLetter = conditionIndex === 0 ? 'A' : 'B'

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
    if (!persistLocally) {
      clearStoredSession(window.localStorage)
      setStorageMessage('Session remains in memory only.')
      return
    }
    if (session) {
      const saved = saveSession(window.localStorage, session)
      setStorageMessage(saved.ok ? 'Session saved locally for up to 24 hours.' : 'Local storage is unavailable.')
    }
  }, [persistLocally, session])

  useEffect(() => {
    onStateChange?.(`Comparison · ${phase}`)
  }, [onStateChange, phase])

  const startCondition = (
    condition: TrialCondition,
    index: number,
    recorder = recorderRef.current,
  ) => {
    if (!recorder) return
    const trial = recorder.startTrial({
      definitionId: intentComparisonTrial.id,
      experimentId: intentComparisonTrial.experimentId,
      scenarioId: intentComparisonTrial.scenarioId,
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
    setAdaptiveState('Rest')
    setConventionalComplete(false)
    setPrediction('')
    setConfidence(0)
    setClarity('')
    revealRecordedRef.current = false
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

  const recordReveal = (source: string) => {
    if (adaptiveState !== 'Rest') return
    setAdaptiveState('Revealed')
    if (!revealRecordedRef.current && activeTrialId) {
      revealRecordedRef.current = true
      recorderRef.current?.record({
        action: 'consequence_revealed',
        trialId: activeTrialId,
        previousState: 'Rest',
        nextState: 'Revealed',
        detail: { source },
      })
      refreshSession()
    }
  }

  const finishInteraction = (condition: TrialCondition) => {
    if (!activeTrialId) return
    const elapsed = Math.max(0, Math.round(globalThis.performance.now() - conditionStartedAt))
    recorderRef.current?.record({
      action: 'action_committed',
      trialId: activeTrialId,
      previousState: condition === 'adaptive' ? 'Revealed' : 'Ready',
      nextState: 'Confirmed',
      outcome: 'completed',
      detail: {
        interactionElapsedMs: elapsed,
        consequenceVisibleBeforeCommit: condition === 'adaptive' && revealRecordedRef.current,
      },
    })
    setInteractionElapsedMs(elapsed)
    setPhase('debrief')
    refreshSession()
  }

  const activateConventional = () => {
    if (conventionalComplete) return
    setConventionalComplete(true)
    finishInteraction('conventional')
  }

  const activateAdaptive = () => {
    if (adaptiveState === 'Rest') {
      recordReveal('activation')
      return
    }
    if (adaptiveState === 'Revealed') {
      setAdaptiveState('Confirmed')
      finishInteraction('adaptive')
    }
  }

  const submitDebrief = () => {
    if (!activeTrialId || !prediction || confidence < 1 || !clarity) return
    const result: ConditionResult = {
      condition: activeCondition,
      interactionElapsedMs,
      prediction,
      confidence,
      clarity,
    }
    recorderRef.current?.completeTrial(activeTrialId, {
      outcome: 'completed',
      metrics: {
        'consequence-predicted-before-commit': availableMetric(prediction === 'journal'),
        'incorrect-first-activation': unavailableMetric('not-observed'),
        'time-to-confident-commitment-ms': availableMetric(interactionElapsedMs),
        'confidence-rating': availableMetric(confidence),
        'clarity-effort-response': availableMetric(clarity),
      },
      detail: { prediction, clarity },
    })
    const nextResults = [...results, result]
    setResults(nextResults)
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
    <section className="comparison-trial" aria-labelledby="comparison-title">
      <header className="comparison-trial-header">
        <div>
          <span>CONTROLLED COMPARISON · INTENT</span>
          <h3 id="comparison-title">Same task. Two interaction conditions.</h3>
        </div>
        <button type="button" className="comparison-exit" onClick={abandonAndExit}>Exit comparison</button>
      </header>

      {phase === 'brief' && (
        <div className="comparison-brief">
          <div className="comparison-task-card">
            <span>TASK</span>
            <strong>{intentComparisonTrial.taskPrompt}</strong>
            <p>{intentComparisonTrial.comparisonFacts.consequence}</p>
          </div>

          <fieldset className="condition-order-picker">
            <legend>Condition order</legend>
            <label><input type="radio" name="condition-order" checked={orderMode === 'randomized'} onChange={() => setOrderMode('randomized')} /> Randomized</label>
            <label><input type="radio" name="condition-order" checked={orderMode === 'conventional-first'} onChange={() => setOrderMode('conventional-first')} /> Conventional first</label>
            <label><input type="radio" name="condition-order" checked={orderMode === 'adaptive-first'} onChange={() => setOrderMode('adaptive-first')} /> Adaptive first</label>
          </fieldset>

          <label className="comparison-retention">
            <input type="checkbox" checked={persistLocally} onChange={event => setPersistLocally(event.target.checked)} />
            <span><strong>Keep this session on this device</strong><small>Optional. Local browser storage only, deleted after 24 hours.</small></span>
          </label>

          <div className="comparison-principles">
            <span>FAIRNESS CONTRACT</span>
            <p>The task, consequence, object count, target minimum, and success definition stay identical. Only the disclosure behavior changes.</p>
          </div>

          <button type="button" className="comparison-primary" onClick={beginComparison}>Begin two-condition trial</button>
          <p className="comparison-disclaimer">Exploratory local observation only. This session cannot validate or prove that either condition is better.</p>
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
            <p>{intentComparisonTrial.taskPrompt}</p>
          </div>

          <div className="comparison-control-stage" data-condition={activeCondition}>
            {activeCondition === 'conventional' ? (
              <>
                <AdaptiveButton
                  label={conventionalComplete ? 'Saved' : 'Done'}
                  metadata={conventionalComplete ? 'Today · just now' : 'Action available'}
                  tone={conventionalComplete ? 'success' : 'quiet'}
                  stateName={conventionalComplete ? 'Confirmed' : 'Ready'}
                  signal={<span className="signal-glyph">{conventionalComplete ? '✓' : '·'}</span>}
                  onClick={activateConventional}
                  aria-label={conventionalComplete ? 'Saved. Today, just now' : 'Done. Action available'}
                />
                <p className="condition-boundary">Stable conventional control. The exact destination is not progressively disclosed by the control.</p>
              </>
            ) : (
              <>
                <AdaptiveButton
                  label={adaptiveState === 'Rest' ? 'Done' : adaptiveState === 'Revealed' ? 'Save to Journal' : 'Saved'}
                  metadata={adaptiveState === 'Rest' ? 'Action available' : adaptiveState === 'Revealed' ? '2 changes' : 'Today · just now'}
                  tone={adaptiveState === 'Rest' ? 'quiet' : adaptiveState === 'Revealed' ? 'primary' : 'success'}
                  stateName={adaptiveState}
                  signal={<span className="signal-glyph">{adaptiveState === 'Rest' ? '·' : adaptiveState === 'Revealed' ? '→' : '✓'}</span>}
                  onPointerEnter={() => recordReveal('pointer')}
                  onPointerLeave={() => adaptiveState === 'Revealed' && setAdaptiveState('Rest')}
                  onFocus={() => recordReveal('focus')}
                  onBlur={() => adaptiveState === 'Revealed' && setAdaptiveState('Rest')}
                  onClick={activateAdaptive}
                  aria-label={`${adaptiveState === 'Rest' ? 'Done' : adaptiveState === 'Revealed' ? 'Save to Journal' : 'Saved'}. ${adaptiveState === 'Revealed' ? '2 changes' : adaptiveState === 'Confirmed' ? 'Today, just now' : 'Action available'}`}
                />
                <p className="condition-boundary">Adaptive disclosure may reveal destination and affected count before commitment. The target remains fixed.</p>
              </>
            )}
          </div>

          <p className="comparison-disclaimer">Use the control naturally. The condition label will be disclosed only after both trials.</p>
        </div>
      )}

      {phase === 'debrief' && (
        <form className="comparison-debrief" onSubmit={event => { event.preventDefault(); submitDebrief() }}>
          <header><span>SHORT DEBRIEF · TRIAL {trialLetter}</span><h3>Record the observation before continuing.</h3></header>

          <fieldset>
            <legend>Before activating, what did you expect?</legend>
            <label><input type="radio" name="prediction" checked={prediction === 'journal'} onChange={() => setPrediction('journal')} /> Save the two changes to Journal</label>
            <label><input type="radio" name="prediction" checked={prediction === 'close-editor'} onChange={() => setPrediction('close-editor')} /> Close the editor without a specific destination</label>
            <label><input type="radio" name="prediction" checked={prediction === 'not-sure'} onChange={() => setPrediction('not-sure')} /> I was not sure</label>
          </fieldset>

          <fieldset>
            <legend>How confident were you in that prediction?</legend>
            <div className="confidence-scale">
              {[1, 2, 3, 4, 5].map(value => (
                <label key={value}><input type="radio" name="confidence" checked={confidence === value} onChange={() => setConfidence(value)} /><span>{value}</span></label>
              ))}
            </div>
            <div className="scale-labels"><span>Not confident</span><span>Very confident</span></div>
          </fieldset>

          <fieldset>
            <legend>How did the interaction feel?</legend>
            <label><input type="radio" name="clarity" checked={clarity === 'clearer'} onChange={() => setClarity('clearer')} /> Clearer</label>
            <label><input type="radio" name="clarity" checked={clarity === 'slower'} onChange={() => setClarity('slower')} /> Slower</label>
            <label><input type="radio" name="clarity" checked={clarity === 'more-demanding'} onChange={() => setClarity('more-demanding')} /> More demanding</label>
            <label><input type="radio" name="clarity" checked={clarity === 'unchanged'} onChange={() => setClarity('unchanged')} /> Unchanged</label>
          </fieldset>

          <button type="submit" className="comparison-primary" disabled={!prediction || confidence < 1 || !clarity}>Record trial observation</button>
        </form>
      )}

      {phase === 'between' && (
        <div className="comparison-between">
          <span>TRIAL A RECORDED</span>
          <h3>The second condition uses the same task and consequence.</h3>
          <p>Its identity remains hidden until the comparison is complete.</p>
          <button type="button" className="comparison-primary" onClick={continueToSecondCondition}>Continue to Trial B</button>
        </div>
      )}

      {phase === 'results' && conventionalResult && adaptiveResult && (
        <div className="comparison-results">
          <header>
            <span>EXPLORATORY SESSION COMPARISON</span>
            <h3>Raw observations, not a winner.</h3>
            <p>One local session can reveal tradeoffs and failure signals. It cannot prove superiority or statistical significance.</p>
          </header>

          <div className="comparison-result-grid">
            {[conventionalResult, adaptiveResult].map(result => (
              <article key={result.condition}>
                <span>{conditionName(result.condition)}</span>
                <strong>Completed: yes</strong>
                <dl>
                  <div><dt>Commit time</dt><dd>{(result.interactionElapsedMs / 1000).toFixed(2)} s</dd></div>
                  <div><dt>Expected Journal</dt><dd>{result.prediction === 'journal' ? 'yes' : result.prediction === 'not-sure' ? 'not sure' : 'no'}</dd></div>
                  <div><dt>Confidence</dt><dd>{result.confidence} / 5</dd></div>
                  <div><dt>Participant description</dt><dd>{result.clarity.replace('-', ' ')}</dd></div>
                </dl>
              </article>
            ))}
          </div>

          <div className="comparison-session-note">
            <span>SESSION RECORD</span>
            <p>{session?.trials.length ?? 0} trials · {session?.events.length ?? 0} semantic events · order {conditionOrder.map(conditionName).join(' → ')}</p>
            <small>{storageMessage || 'Session remained in memory only.'}</small>
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

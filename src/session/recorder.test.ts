import { describe, expect, it } from 'vitest'
import { availableMetric, unavailableMetric } from '../trials/types'
import { createSequentialSessionIdFactory } from './id'
import { TrialSessionRecorder, type SessionTimeSource } from './recorder'

function createClock() {
  let wallMs = Date.UTC(2026, 6, 14, 12, 0, 0)
  let monotonicMs = 100
  const time: SessionTimeSource = {
    wallNow: () => new Date(wallMs),
    monotonicNow: () => monotonicMs,
  }
  return {
    time,
    advance(ms: number) {
      wallMs += ms
      monotonicMs += ms
    },
  }
}

function createRecorder() {
  const clock = createClock()
  const recorder = new TrialSessionRecorder({
    settings: {
      inputContext: 'pointer',
      materialMode: 'spatial',
      reducedMotion: false,
      assistance: 50,
      conditionOrder: 'randomized',
    },
    randomizationSeed: 'session-seed',
  }, {
    ids: createSequentialSessionIdFactory('test'),
    time: clock.time,
  })
  return { recorder, clock }
}

describe('TrialSessionRecorder', () => {
  it('creates deterministic IDs and strictly sequenced semantic events', () => {
    const { recorder, clock } = createRecorder()
    clock.advance(250)
    const trial = recorder.startTrial({
      definitionId: 'intent-journal-save-v1',
      experimentId: 'intent',
      scenarioId: 'journal-save',
      condition: 'adaptive',
    })
    clock.advance(300)
    recorder.record({
      action: 'consequence_revealed',
      trialId: trial.trialId,
      previousState: 'Rest',
      nextState: 'Revealed',
      detail: { source: 'focus' },
    })
    clock.advance(450)
    recorder.completeTrial(trial.trialId, {
      outcome: 'completed',
      metrics: {
        confidence: availableMetric(4),
        pointerPathLengthPx: unavailableMetric('unsupported-input'),
      },
    })
    const snapshot = recorder.completeSession()

    expect(snapshot.sessionId).toBe('test_session_0001')
    expect(snapshot.events.map(event => event.eventId)).toEqual([
      'test_event_0002',
      'test_event_0004',
      'test_event_0005',
      'test_event_0006',
      'test_event_0007',
    ])
    expect(snapshot.events.map(event => event.sequence)).toEqual([1, 2, 3, 4, 5])
    expect(snapshot.events.map(event => event.action)).toEqual([
      'session_started',
      'trial_started',
      'consequence_revealed',
      'trial_completed',
      'session_completed',
    ])
    expect(snapshot.events[3].detail?.trialElapsedMs).toBe(750)
    expect(snapshot.trials[0].metrics.pointerPathLengthPx).toEqual({
      status: 'unavailable',
      value: null,
      reason: 'unsupported-input',
    })
  })

  it('returns snapshots that cannot mutate recorder state', () => {
    const { recorder } = createRecorder()
    const snapshot = recorder.getSnapshot()
    ;(snapshot.events as unknown[]).push({ action: 'corrupt' })

    expect(recorder.getSnapshot().events).toHaveLength(1)
  })

  it('requires active trials to be resolved before session completion', () => {
    const { recorder } = createRecorder()
    const trial = recorder.startTrial({
      definitionId: 'intent-journal-save-v1',
      experimentId: 'intent',
      scenarioId: 'journal-save',
      condition: 'conventional',
    })

    expect(() => recorder.completeSession()).toThrow(/active trials/i)
    const abandoned = recorder.abandonTrial(trial.trialId, { reason: 'participant left' })
    expect(abandoned.status).toBe('abandoned')
    expect(abandoned.outcome).toBe('abandoned')
    expect(() => recorder.completeSession()).not.toThrow()
  })

  it('rejects events and outcomes for unknown or completed trials', () => {
    const { recorder } = createRecorder()
    expect(() => recorder.record({ action: 'state_transitioned', trialId: 'missing' })).toThrow(/unknown trial/i)

    const trial = recorder.startTrial({
      definitionId: 'intent-journal-save-v1',
      experimentId: 'intent',
      scenarioId: 'journal-save',
      condition: 'adaptive',
    })
    recorder.completeTrial(trial.trialId, { outcome: 'completed' })
    expect(() => recorder.completeTrial(trial.trialId, { outcome: 'completed' })).toThrow(/not active/i)
  })
})

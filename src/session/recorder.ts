import type { ExperimentId, InputContext } from '../experiments/types'
import type { ScenarioId } from '../scenarios/types'
import type { LabMode } from '../types'
import type { MetricObservation, TrialCondition, TrialOutcome } from '../trials/types'
import { cryptoSessionIdFactory, type SessionIdFactory } from './id'
import {
  SESSION_SCHEMA_VERSION,
  type EventDetailPrimitive,
  type LabEventAction,
  type LabEventV2,
  type LabSessionV2,
  type SessionSettings,
  type TrialRecord,
} from './types'

export type SessionTimeSource = {
  wallNow: () => Date
  monotonicNow: () => number
}

export type CreateSessionOptions = {
  settings: SessionSettings
  randomizationSeed?: string
}

export type SessionRecorderDependencies = {
  ids?: SessionIdFactory
  time?: SessionTimeSource
}

export type StartTrialInput = {
  definitionId: string
  experimentId: ExperimentId
  scenarioId: ScenarioId
  condition: TrialCondition
  orderIndex?: number
}

export type RecordTrialEventInput = {
  action: LabEventAction
  trialId?: string
  experimentId?: ExperimentId | 'system'
  condition?: TrialCondition
  scenarioId?: ScenarioId
  inputContext?: InputContext
  materialMode?: LabMode
  reducedMotion?: boolean
  previousState?: string
  nextState?: string
  outcome?: TrialOutcome
  detail?: Readonly<Record<string, EventDetailPrimitive>>
}

export type FinishTrialInput = {
  outcome: TrialOutcome
  metrics?: Readonly<Record<string, MetricObservation>>
  detail?: Readonly<Record<string, EventDetailPrimitive>>
}

const defaultTimeSource: SessionTimeSource = {
  wallNow: () => new Date(),
  monotonicNow: () => globalThis.performance.now(),
}

function roundedDuration(value: number) {
  return Math.max(0, Math.round(value))
}

export class TrialSessionRecorder {
  private session: LabSessionV2
  private readonly ids: SessionIdFactory
  private readonly time: SessionTimeSource
  private readonly sessionStartedMono: number
  private readonly trialStartedMono = new Map<string, number>()

  constructor(options: CreateSessionOptions, dependencies: SessionRecorderDependencies = {}) {
    this.ids = dependencies.ids ?? cryptoSessionIdFactory
    this.time = dependencies.time ?? defaultTimeSource
    this.sessionStartedMono = this.time.monotonicNow()

    const sessionId = this.ids('session')
    this.session = {
      schemaVersion: SESSION_SCHEMA_VERSION,
      sessionId,
      startedAt: this.time.wallNow().toISOString(),
      randomizationSeed: options.randomizationSeed,
      consent: 'local-observation-only',
      settingsSnapshot: { ...options.settings },
      trials: [],
      events: [],
    }

    this.appendEvent({ action: 'session_started', experimentId: 'system' })
  }

  getSnapshot(): LabSessionV2 {
    return structuredClone(this.session)
  }

  startTrial(input: StartTrialInput): TrialRecord {
    const trialId = this.ids('trial')
    const startedAt = this.time.wallNow().toISOString()
    const trial: TrialRecord = {
      trialId,
      definitionId: input.definitionId,
      experimentId: input.experimentId,
      scenarioId: input.scenarioId,
      condition: input.condition,
      orderIndex: input.orderIndex ?? this.session.trials.length,
      status: 'active',
      startedAt,
      metrics: {},
    }

    this.session = { ...this.session, trials: [...this.session.trials, trial] }
    this.trialStartedMono.set(trialId, this.time.monotonicNow())
    this.appendEvent({ action: 'trial_started', trialId })
    return structuredClone(trial)
  }

  record(input: RecordTrialEventInput): LabEventV2 {
    return this.appendEvent(input)
  }

  completeTrial(trialId: string, input: FinishTrialInput): TrialRecord {
    return this.finishTrial(trialId, 'completed', 'trial_completed', input)
  }

  abandonTrial(
    trialId: string,
    detail?: Readonly<Record<string, EventDetailPrimitive>>,
  ): TrialRecord {
    return this.finishTrial(trialId, 'abandoned', 'trial_abandoned', {
      outcome: 'abandoned',
      detail,
    })
  }

  completeSession(): LabSessionV2 {
    if (this.session.trials.some(trial => trial.status === 'active')) {
      throw new Error('Active trials must be completed or abandoned before completing the session.')
    }
    if (this.session.completedAt) return this.getSnapshot()

    this.session = { ...this.session, completedAt: this.time.wallNow().toISOString() }
    this.appendEvent({ action: 'session_completed', experimentId: 'system' })
    return this.getSnapshot()
  }

  private finishTrial(
    trialId: string,
    status: 'completed' | 'abandoned',
    action: 'trial_completed' | 'trial_abandoned',
    input: FinishTrialInput,
  ): TrialRecord {
    const existing = this.requireActiveTrial(trialId)
    const trialElapsedMs = roundedDuration(
      this.time.monotonicNow() - (this.trialStartedMono.get(trialId) ?? this.sessionStartedMono),
    )
    const completed: TrialRecord = {
      ...existing,
      status,
      completedAt: this.time.wallNow().toISOString(),
      outcome: input.outcome,
      metrics: { ...(input.metrics ?? {}) },
    }

    this.session = {
      ...this.session,
      trials: this.session.trials.map(trial => trial.trialId === trialId ? completed : trial),
    }
    this.trialStartedMono.delete(trialId)
    this.appendEvent({
      action,
      trialId,
      outcome: input.outcome,
      detail: { trialElapsedMs, ...(input.detail ?? {}) },
    })
    return structuredClone(completed)
  }

  private requireActiveTrial(trialId: string): TrialRecord {
    const trial = this.session.trials.find(candidate => candidate.trialId === trialId)
    if (!trial) throw new Error(`Unknown trial: ${trialId}`)
    if (trial.status !== 'active') throw new Error(`Trial is not active: ${trialId}`)
    return trial
  }

  private appendEvent(input: RecordTrialEventInput): LabEventV2 {
    const trial = input.trialId
      ? this.session.trials.find(candidate => candidate.trialId === input.trialId)
      : undefined
    if (input.trialId && !trial) throw new Error(`Unknown trial: ${input.trialId}`)

    const event: LabEventV2 = {
      schemaVersion: SESSION_SCHEMA_VERSION,
      eventId: this.ids('event'),
      sessionId: this.session.sessionId,
      trialId: input.trialId,
      sequence: this.session.events.length + 1,
      occurredAt: this.time.wallNow().toISOString(),
      elapsedMs: roundedDuration(this.time.monotonicNow() - this.sessionStartedMono),
      experimentId: input.experimentId ?? trial?.experimentId ?? 'system',
      condition: input.condition ?? trial?.condition,
      scenarioId: input.scenarioId ?? trial?.scenarioId,
      inputContext: input.inputContext ?? this.session.settingsSnapshot.inputContext,
      materialMode: input.materialMode ?? this.session.settingsSnapshot.materialMode,
      reducedMotion: input.reducedMotion ?? this.session.settingsSnapshot.reducedMotion,
      action: input.action,
      previousState: input.previousState,
      nextState: input.nextState,
      outcome: input.outcome,
      detail: input.detail ? { ...input.detail } : undefined,
    }

    this.session = { ...this.session, events: [...this.session.events, event] }
    return structuredClone(event)
  }
}

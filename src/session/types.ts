import type { ExperimentId, InputContext } from '../experiments/types'
import type { ScenarioId } from '../scenarios/types'
import type { LabMode } from '../types'
import type {
  ConditionOrderMode,
  MetricObservation,
  TrialCondition,
  TrialOutcome,
} from '../trials/types'

export const SESSION_SCHEMA_VERSION = 2 as const

export type LabEventAction =
  | 'session_started'
  | 'session_resumed'
  | 'session_completed'
  | 'session_cleared'
  | 'session_exported'
  | 'experiment_selected'
  | 'condition_selected'
  | 'catalog_opened'
  | 'inspector_opened'
  | 'trial_started'
  | 'trial_abandoned'
  | 'trial_completed'
  | 'trial_reset'
  | 'state_transitioned'
  | 'observation_recorded'
  | 'consequence_revealed'
  | 'commit_started'
  | 'commit_cancelled'
  | 'action_committed'
  | 'action_reversed'
  | 'recovery_expired'
  | 'alternative_path_used'
  | 'material_mode_changed'
  | 'input_context_changed'
  | 'reduced_motion_changed'
  | 'assistance_changed'

export type EventDetailPrimitive = string | number | boolean | null

export type LabEventV2 = {
  schemaVersion: typeof SESSION_SCHEMA_VERSION
  eventId: string
  sessionId: string
  trialId?: string
  sequence: number
  occurredAt: string
  elapsedMs: number
  experimentId: ExperimentId | 'system'
  condition?: TrialCondition
  scenarioId?: ScenarioId
  inputContext: InputContext
  materialMode: LabMode
  reducedMotion: boolean
  action: LabEventAction
  previousState?: string
  nextState?: string
  outcome?: TrialOutcome
  detail?: Readonly<Record<string, EventDetailPrimitive>>
}

export type SessionSettings = {
  inputContext: InputContext
  materialMode: LabMode
  reducedMotion: boolean
  assistance: number
  conditionOrder: ConditionOrderMode
}

export type TrialRecordStatus = 'active' | 'completed' | 'abandoned'

export type TrialRecord = {
  trialId: string
  definitionId: string
  experimentId: ExperimentId
  scenarioId: ScenarioId
  condition: TrialCondition
  orderIndex: number
  status: TrialRecordStatus
  startedAt: string
  completedAt?: string
  outcome?: TrialOutcome
  metrics: Readonly<Record<string, MetricObservation>>
}

export type LabSessionV2 = {
  schemaVersion: typeof SESSION_SCHEMA_VERSION
  sessionId: string
  startedAt: string
  completedAt?: string
  randomizationSeed?: string
  consent: 'local-observation-only'
  settingsSnapshot: SessionSettings
  trials: readonly TrialRecord[]
  events: readonly LabEventV2[]
}

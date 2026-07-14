import type { ComponentType } from 'react'
import type { InstrumentationEffect } from '../instrumentation/types'
import type { ScenarioId } from '../scenarios/types'
import type { DemoProps, Family, InputModality } from '../types'

export type ExperimentId =
  | 'intent'
  | 'pressure'
  | 'breathing'
  | 'magnetic'
  | 'ethical'
  | 'reversible'

export type ExperimentFamily = Exclude<Family, 'System'>
export type InputContext = InputModality | 'gaze' | 'hold' | 'pressure'
export type ExperimentTone = 'quiet' | 'primary' | 'success' | 'attention' | 'ethical' | 'exploratory'

export type ExperimentState = {
  id: string
}

export type ExperimentAction = {
  type: string
}

export type ExperimentStateDescriptor<StateId extends string = string> = {
  id: StateId
  label: string
  description: string
  isTerminal?: boolean
  isRecoverable?: boolean
  consequenceVisible?: boolean
}

export type TransitionContext = {
  now: number
  inputContext: InputContext
  reducedMotion: boolean
  assistance: number
}

export type TimerEffect<A> =
  | { type: 'schedule'; timerId: string; delayMs: number; action: A }
  | { type: 'repeat'; timerId: string; intervalMs: number; action: A }
  | { type: 'cancel'; timerId: string }

export type ExperimentEffect<A> = InstrumentationEffect | TimerEffect<A>

export type TransitionResult<S, A> = {
  state: S
  effects: ExperimentEffect<A>[]
}

export type ExperimentPresentation = {
  label: string
  metadata: string
  tone: ExperimentTone
  stateName: string
}

export type ExperimentMetadata = {
  id: ExperimentId
  family: ExperimentFamily
  displayName: string
  order: number
  lifecycleOrder: number
  lifecycleStage: string
  lifecycleVerb: string
  value: string
  description: string
  hypothesis: string
  successSignal: string
  failureCondition: string
  supportedInputContexts: readonly InputContext[]
  requiredAlternativePaths: readonly string[]
  scenarioIds: readonly ScenarioId[]
  conventionalComparisonAvailable: boolean
  documentationPath: string
  implementationNote: string
}

export type ExperimentDefinition<
  S extends ExperimentState,
  A extends ExperimentAction,
> = ExperimentMetadata & {
  states: readonly ExperimentStateDescriptor<S['id']>[]
  initialState: S
  transition: (state: S, action: A, context: TransitionContext) => TransitionResult<S, A>
  reset: () => S
  getPresentation: (state: S) => ExperimentPresentation
}

export type ExperimentRegistryEntry = ExperimentMetadata & {
  Renderer: ComponentType<DemoProps>
}

export type WorkspaceExperimentEntry = ExperimentRegistryEntry & {
  states: readonly ExperimentStateDescriptor[]
  initialState: ExperimentState
  reset: () => ExperimentState
}

export function registerExperiment<
  S extends ExperimentState,
  A extends ExperimentAction,
>(definition: ExperimentDefinition<S, A>, Renderer: ComponentType<DemoProps>) {
  return { ...definition, Renderer }
}

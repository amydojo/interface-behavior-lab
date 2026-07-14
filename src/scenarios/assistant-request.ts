import type { ScenarioDefinition } from './types'

export const assistantRequestScenario = {
  id: 'assistant-request',
  title: 'Ask the assistant',
  summary: 'Represent readiness, listening, processing, and completion without a spinner.',
  consequence: 'The request moves through four literal semantic states.',
  successResult: 'Response complete',
} as const satisfies ScenarioDefinition

import type { ScenarioDefinition } from './types'

export const messageSendScenario = {
  id: 'message-send',
  title: 'Send a message to Maya',
  summary: 'Use bounded proximity assistance while preserving one stable native target.',
  consequence: 'The message will be sent to Maya.',
  successResult: 'Sent to Maya',
} as const satisfies ScenarioDefinition

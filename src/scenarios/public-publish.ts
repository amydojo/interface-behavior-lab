import type { ScenarioDefinition } from './types'

export const publicPublishScenario = {
  id: 'public-publish',
  title: 'Publish to a public audience',
  summary: 'Disclose audience and included context before deliberate confirmation.',
  consequence: 'This will be visible to 384 people. Your location and tagged people will also be included.',
  successResult: 'Published to 384 people',
  audienceSize: 384,
} as const satisfies ScenarioDefinition & { audienceSize: number }

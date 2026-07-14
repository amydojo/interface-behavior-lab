import type { ScenarioDefinition } from './types'

export const archiveRecoveryScenario = {
  id: 'archive-recovery',
  title: 'Archive with recovery',
  summary: 'Transform a completed action into its own time-bounded recovery path.',
  consequence: 'The message leaves the inbox but remains available in All Mail.',
  successResult: 'Archived · recovery window opened',
  recoveryResult: 'Archive undone',
  expiredResult: 'Archive remains available in All Mail',
} as const satisfies ScenarioDefinition & Record<string, string>

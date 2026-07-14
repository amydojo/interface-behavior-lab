import type { ScenarioDefinition } from './types'

export const journalSaveScenario = {
  id: 'journal-save',
  title: 'Save changes to Journal',
  summary: 'Reveal the exact destination before committing a quiet action.',
  consequence: 'Two changes will be saved to Journal.',
  successResult: 'Saved to Journal',
  restLabel: 'Done',
  restMetadata: 'Action available',
  revealedLabel: 'Save to Journal',
  revealedMetadata: '2 changes',
  confirmedLabel: 'Saved',
  confirmedMetadata: 'Today · just now',
} as const satisfies ScenarioDefinition & Record<string, string>

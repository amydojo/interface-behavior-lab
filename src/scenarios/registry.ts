import { archiveRecoveryScenario } from './archive-recovery'
import { assistantRequestScenario } from './assistant-request'
import { destructiveDeleteScenario } from './destructive-delete'
import { journalSaveScenario } from './journal-save'
import { messageSendScenario } from './message-send'
import { publicPublishScenario } from './public-publish'

export const scenarioRegistry = {
  [journalSaveScenario.id]: journalSaveScenario,
  [destructiveDeleteScenario.id]: destructiveDeleteScenario,
  [assistantRequestScenario.id]: assistantRequestScenario,
  [messageSendScenario.id]: messageSendScenario,
  [publicPublishScenario.id]: publicPublishScenario,
  [archiveRecoveryScenario.id]: archiveRecoveryScenario,
} as const

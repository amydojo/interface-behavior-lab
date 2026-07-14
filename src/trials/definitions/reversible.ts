import { archiveRecoveryScenario } from '../../scenarios/archive-recovery'
import { assertTrialFairness } from '../fairness'
import type { TrialDefinition } from '../types'

export const reversibleComparisonTrial = assertTrialFairness({
  id: 'reversible-archive-recovery-v1',
  experimentId: 'reversible',
  scenarioId: archiveRecoveryScenario.id,
  conditions: ['conventional', 'adaptive'],
  taskPrompt: 'Archive Design review notes, then restore it when recovery is requested.',
  behaviorUnderTest: 'Compare a detached Undo toast with an originating control that transforms into the recovery action in place.',
  comparisonFacts: {
    consequence: archiveRecoveryScenario.consequence,
    reversible: true,
    recoveryLocation: archiveRecoveryScenario.expiredLocation,
  },
  conditionDesign: {
    conventional: {
      condition: 'conventional',
      controlLabel: 'Archive',
      targetMinCssPx: 44,
      sharedCopy: [
        'Archive',
        'Undo Archive',
        'Recovery requested',
        '8 seconds',
        archiveRecoveryScenario.expiredLocation,
      ],
      behaviorUnderTestCopy: ['Detached recovery toast'],
      communicatesWithoutColor: true,
    },
    adaptive: {
      condition: 'adaptive',
      controlLabel: 'Archive',
      targetMinCssPx: 44,
      sharedCopy: [
        'Archive',
        'Undo Archive',
        'Recovery requested',
        '8 seconds',
        archiveRecoveryScenario.expiredLocation,
      ],
      behaviorUnderTestCopy: ['Originating control becomes recovery action'],
      communicatesWithoutColor: true,
    },
  },
  completionRule: {
    description: 'The participant archives the message, then either restores it during the documented window, lets the window expire, or abandons the condition.',
    acceptedOutcomes: ['reversed', 'expired', 'abandoned'],
  },
  successSignals: [
    'Undo remains keyboard reachable for the complete documented recovery window.',
    'The adaptive recovery action occupies the originating target rather than appearing in a second location.',
    'Expiry clearly explains that the archived message remains in All Mail.',
  ],
  failureSignals: [
    'A stale timer reopens or mutates a completed recovery state.',
    'The recovery target becomes smaller or less operable than the original Archive target.',
    'The interface implies the message was deleted after the recovery window closes.',
    'A missing recovery observation is fabricated as zero milliseconds.',
  ],
  primaryMeasures: [
    'undo-discovery-time-ms',
    'recovery-success',
    'missed-recovery-window',
    'post-expiry-location-understanding',
  ],
  debriefQuestions: [
    {
      id: 'prediction',
      prompt: 'Where can the message be found after the recovery window closes?',
      response: 'choice',
      choices: ['All Mail', 'Inbox', 'Trash', 'Not sure'],
    },
    {
      id: 'confidence',
      prompt: 'How confident were you in the final message location?',
      response: 'rating-5',
    },
  ],
  supportedInputContexts: ['touch', 'pointer', 'voice'],
} satisfies TrialDefinition)

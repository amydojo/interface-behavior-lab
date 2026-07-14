import { journalSaveScenario } from '../../scenarios/journal-save'
import { assertTrialFairness } from '../fairness'
import type { TrialDefinition } from '../types'

export const intentComparisonTrial = assertTrialFairness({
  id: 'intent-journal-save-v1',
  experimentId: 'intent',
  scenarioId: journalSaveScenario.id,
  conditions: ['conventional', 'adaptive'],
  taskPrompt: 'Save two changes to the journal entry.',
  behaviorUnderTest: 'Reveal destination and change count before commitment.',
  comparisonFacts: {
    consequence: journalSaveScenario.consequence,
    objectCount: 2,
    reversible: true,
    recoveryLocation: 'Journal',
  },
  conditionDesign: {
    conventional: {
      condition: 'conventional',
      controlLabel: journalSaveScenario.restLabel,
      targetMinCssPx: 44,
      sharedCopy: [],
      behaviorUnderTestCopy: [],
      communicatesWithoutColor: true,
    },
    adaptive: {
      condition: 'adaptive',
      controlLabel: journalSaveScenario.restLabel,
      targetMinCssPx: 44,
      sharedCopy: [],
      behaviorUnderTestCopy: [
        journalSaveScenario.revealedLabel,
        journalSaveScenario.revealedMetadata,
      ],
      communicatesWithoutColor: true,
    },
  },
  completionRule: {
    description: 'The two changes are saved to Journal or the participant cancels or abandons the trial.',
    acceptedOutcomes: ['completed', 'cancelled', 'abandoned'],
  },
  successSignals: [
    'Participant predicts the Journal destination before commitment.',
    'Participant completes the intended save without an incorrect first activation.',
  ],
  failureSignals: [
    'Participant commits before understanding the destination.',
    'Condition copy changes facts beyond the behavior under test.',
  ],
  primaryMeasures: [
    'consequence-predicted-before-commit',
    'incorrect-first-activation',
    'time-to-confident-commitment-ms',
    'confidence-rating',
  ],
  debriefQuestions: [
    {
      id: 'prediction',
      prompt: 'What did you expect to happen before activating the control?',
      response: 'text',
    },
    {
      id: 'confidence',
      prompt: 'How confident were you in that prediction?',
      response: 'rating-5',
    },
    {
      id: 'clarity-effort',
      prompt: 'Did the interface feel clearer, slower, more demanding, or unchanged?',
      response: 'choice',
      choices: ['clearer', 'slower', 'more demanding', 'unchanged'],
    },
  ],
  supportedInputContexts: ['pointer', 'touch', 'voice', 'switch'],
} satisfies TrialDefinition)

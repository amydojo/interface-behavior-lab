import { destructiveDeleteScenario } from '../../scenarios/destructive-delete'
import { assertTrialFairness } from '../fairness'
import type { TrialDefinition } from '../types'

const sharedCopy = [
  'Move four affected items to Trash.',
  'Do not delete them permanently.',
  destructiveDeleteScenario.consequence,
]

export const pressureComparisonTrial = assertTrialFairness({
  id: 'pressure-trash-choice-v1',
  experimentId: 'pressure',
  scenarioId: destructiveDeleteScenario.id,
  conditions: ['conventional', 'adaptive'],
  taskPrompt: 'Move four affected items to Trash. Do not delete them permanently.',
  behaviorUnderTest: 'Use named Preview, Act, and Commit stages to distinguish reversible and irreversible consequences.',
  comparisonFacts: {
    consequence: destructiveDeleteScenario.consequence,
    objectCount: 4,
    reversible: true,
    recoveryLocation: 'Trash',
  },
  conditionDesign: {
    conventional: {
      condition: 'conventional',
      controlLabel: 'Choose action',
      targetMinCssPx: 44,
      sharedCopy,
      behaviorUnderTestCopy: [
        'Preview affected items',
        'Move to Trash',
        'Delete permanently',
      ],
      communicatesWithoutColor: true,
    },
    adaptive: {
      condition: 'adaptive',
      controlLabel: 'Delete',
      targetMinCssPx: 44,
      sharedCopy,
      behaviorUnderTestCopy: [
        'Preview',
        'Act',
        'Commit',
        'Elapsed hold is not physical pressure.',
      ],
      communicatesWithoutColor: true,
    },
  },
  completionRule: {
    description: 'The participant selects Preview, Trash, or permanent deletion, or abandons the trial.',
    acceptedOutcomes: ['completed', 'incorrect', 'cancelled', 'abandoned'],
  },
  successSignals: [
    'Participant selects the reversible Trash action.',
    'Participant distinguishes Preview, Trash, and permanent deletion before commitment.',
    'Participant can cancel after permanent consequences are disclosed.',
  ],
  failureSignals: [
    'Participant selects permanent deletion while intending to use Trash.',
    'A simulated hold is described as physical pressure.',
    'The adaptive condition hides the equivalent explicit stage controls.',
  ],
  primaryMeasures: [
    'correct-action-selected',
    'permanent-action-selected-accidentally',
    'cancellation-before-commit',
    'stage-comprehension',
    'confidence-rating',
  ],
  debriefQuestions: [
    {
      id: 'prediction',
      prompt: 'Which consequence did the selected control represent before commitment?',
      response: 'choice',
      choices: ['preview four items', 'move to Trash', 'delete permanently', 'not sure'],
    },
    {
      id: 'confidence',
      prompt: 'How confident were you in that understanding?',
      response: 'rating-5',
    },
    {
      id: 'clarity-effort',
      prompt: 'Did the escalation model feel clearer, slower, more demanding, or unchanged?',
      response: 'choice',
      choices: ['clearer', 'slower', 'more demanding', 'unchanged'],
    },
  ],
  supportedInputContexts: ['pointer', 'touch', 'voice', 'switch'],
} satisfies TrialDefinition)

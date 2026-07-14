import { publicPublishScenario } from '../../scenarios/public-publish'
import { assertTrialFairness } from '../fairness'
import type { TrialDefinition } from '../types'

export const ethicalComparisonTrial = assertTrialFairness({
  id: 'ethical-public-publish-v1',
  experimentId: 'ethical',
  scenarioId: publicPublishScenario.id,
  conditions: ['conventional', 'adaptive'],
  taskPrompt: 'Publish the post to 384 people with location and tagged people included.',
  behaviorUnderTest: 'Compare a standard confirmation dialog with consequence-first informed commitment and proportional resistance.',
  comparisonFacts: {
    consequence: publicPublishScenario.consequence,
    audienceSize: publicPublishScenario.audienceSize,
    reversible: false,
  },
  conditionDesign: {
    conventional: {
      condition: 'conventional',
      controlLabel: 'Publish post',
      targetMinCssPx: 44,
      sharedCopy: [
        publicPublishScenario.audienceDisclosure,
        publicPublishScenario.includedContextDisclosure,
        'Publish',
        'Cancel',
      ],
      behaviorUnderTestCopy: ['Standard confirmation dialog'],
      communicatesWithoutColor: true,
    },
    adaptive: {
      condition: 'adaptive',
      controlLabel: 'Publish post',
      targetMinCssPx: 44,
      sharedCopy: [
        publicPublishScenario.audienceDisclosure,
        publicPublishScenario.includedContextDisclosure,
        'Publish',
        'Cancel',
      ],
      behaviorUnderTestCopy: ['Consequence-first disclosure', 'Confirm without holding'],
      communicatesWithoutColor: true,
    },
  },
  completionRule: {
    description: 'The participant either publishes after disclosure, cancels after disclosure, or abandons the condition.',
    acceptedOutcomes: ['completed', 'cancelled', 'abandoned'],
  },
  successSignals: [
    'The participant recalls the audience and included context before reporting confidence in the outcome.',
    'Cancel remains immediately available after disclosure and produces no published outcome.',
    'The adaptive condition offers a non-hold confirmation path equivalent to the final hold action.',
  ],
  failureSignals: [
    'Final publication occurs before consequence disclosure.',
    'Cancel commits or partially commits the public action.',
    'Timed hold becomes the only accessible confirmation path.',
    'Friction is framed as a conversion mechanism rather than informed agency.',
  ],
  primaryMeasures: [
    'consequence-recall',
    'cancellation-after-disclosure',
    'accidental-publish',
    'perceived-coercion',
    'outcome-confidence',
  ],
  debriefQuestions: [
    {
      id: 'prediction',
      prompt: 'What consequence did the interface disclose?',
      response: 'choice',
      choices: [
        '384 people, location, and tagged people',
        '384 people only',
        'Location only',
        'Not sure',
      ],
    },
    {
      id: 'accidental-publish',
      prompt: 'Did the post publish before you intended?',
      response: 'choice',
      choices: ['No', 'Yes'],
    },
    {
      id: 'confidence',
      prompt: 'How confident were you in the final outcome?',
      response: 'rating-5',
    },
    {
      id: 'coercion',
      prompt: 'How coercive did the confirmation feel?',
      response: 'rating-5',
    },
  ],
  supportedInputContexts: ['hold', 'voice', 'switch'],
} satisfies TrialDefinition)

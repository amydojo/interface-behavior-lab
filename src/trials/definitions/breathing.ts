import { assistantRequestScenario } from '../../scenarios/assistant-request'
import { assertTrialFairness } from '../fairness'
import type { TrialDefinition } from '../types'

export const breathingStateSequence = ['Processing', 'Ready', 'Complete', 'Listening'] as const

export const breathingComparisonTrial = assertTrialFairness({
  id: 'breathing-state-identification-v1',
  experimentId: 'breathing',
  scenarioId: assistantRequestScenario.id,
  conditions: ['conventional', 'adaptive'],
  taskPrompt: 'Identify each system state as Ready, Listening, Processing, or Complete.',
  behaviorUnderTest: 'Compare a conventional status indicator with restrained rhythmic material state while preserving identical literal labels.',
  comparisonFacts: {
    consequence: assistantRequestScenario.consequence,
    objectCount: breathingStateSequence.length,
    reversible: true,
  },
  conditionDesign: {
    conventional: {
      condition: 'conventional',
      controlLabel: 'Identify displayed state',
      targetMinCssPx: 44,
      sharedCopy: ['Ready', 'Listening', 'Processing', 'Complete'],
      behaviorUnderTestCopy: ['Conventional status indicator'],
      communicatesWithoutColor: true,
    },
    adaptive: {
      condition: 'adaptive',
      controlLabel: 'Identify displayed state',
      targetMinCssPx: 44,
      sharedCopy: ['Ready', 'Listening', 'Processing', 'Complete'],
      behaviorUnderTestCopy: ['Restrained rhythmic material state'],
      communicatesWithoutColor: true,
    },
  },
  completionRule: {
    description: 'All four literal states are identified, or the participant abandons the condition.',
    acceptedOutcomes: ['completed', 'abandoned'],
  },
  successSignals: [
    'Participant identifies the literal state accurately without relying on motion or color.',
    'Reduced motion preserves the same semantic state order and completion path.',
  ],
  failureSignals: [
    'Animation becomes the only way to distinguish a state.',
    'The rhythmic condition adds explanatory copy unavailable to the conventional condition.',
    'A participant reports the presentation as distracting enough to interfere with state identification.',
  ],
  primaryMeasures: [
    'state-identification-accuracy',
    'mean-identification-time-ms',
    'motion-preference',
    'distraction-rating',
  ],
  debriefQuestions: [
    {
      id: 'motion-preference',
      prompt: 'Would you keep, reduce, or remove the motion in this presentation?',
      response: 'choice',
      choices: ['keep motion', 'reduce motion', 'no preference'],
    },
    {
      id: 'distraction',
      prompt: 'How visually distracting was this presentation?',
      response: 'rating-5',
    },
  ],
  supportedInputContexts: ['pointer', 'touch', 'voice', 'switch'],
} satisfies TrialDefinition)

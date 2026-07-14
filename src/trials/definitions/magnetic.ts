import { messageSendScenario } from '../../scenarios/message-send'
import { assertTrialFairness } from '../fairness'
import type { TrialDefinition } from '../types'

export const magneticComparisonTrial = assertTrialFairness({
  id: 'magnetic-target-acquisition-v1',
  experimentId: 'magnetic',
  scenarioId: messageSendScenario.id,
  conditions: ['conventional', 'adaptive'],
  taskPrompt: 'Activate the fixed Send to Maya target.',
  behaviorUnderTest: 'Compare a static native target with bounded proximity assistance while preserving identical geometry and activation.',
  comparisonFacts: {
    consequence: messageSendScenario.consequence,
    objectCount: 1,
    reversible: false,
  },
  conditionDesign: {
    conventional: {
      condition: 'conventional',
      controlLabel: 'Send to Maya',
      targetMinCssPx: 44,
      sharedCopy: ['Send to Maya', messageSendScenario.consequence],
      behaviorUnderTestCopy: ['Fixed native target without proximity response'],
      communicatesWithoutColor: true,
    },
    adaptive: {
      condition: 'adaptive',
      controlLabel: 'Send to Maya',
      targetMinCssPx: 44,
      sharedCopy: ['Send to Maya', messageSendScenario.consequence],
      behaviorUnderTestCopy: ['Fixed native target with bounded proximity assistance'],
      communicatesWithoutColor: true,
    },
  },
  completionRule: {
    description: 'The fixed native target is activated once, or the participant abandons the condition.',
    acceptedOutcomes: ['completed', 'abandoned'],
  },
  successSignals: [
    'The target geometry remains fixed before, during, and after assistance state changes.',
    'Pointer and keyboard paths activate the same native button and produce the same message consequence.',
    'Final activation offset can be recorded without collecting raw pointer trajectories.',
  ],
  failureSignals: [
    'The adaptive target moves, chases, captures, or enlarges toward the pointer.',
    'The conventional condition receives different task copy, geometry, or consequence information.',
    'Keyboard focus cannot reach the same aligned and released outcome.',
    'Assistance exceeds the documented bounded thresholds.',
  ],
  primaryMeasures: [
    'activation-time-ms',
    'final-pointer-offset-px',
    'aligned-at-activation',
    'keyboard-completion',
    'confidence-rating',
    'aiming-effort-response',
    'assistance-response',
  ],
  debriefQuestions: [
    {
      id: 'confidence',
      prompt: 'How confident were you that the target would activate?',
      response: 'rating-5',
    },
    {
      id: 'clarity-effort',
      prompt: 'How effortful did the target feel to acquire?',
      response: 'choice',
      choices: ['easier', 'unchanged', 'harder'],
    },
    {
      id: 'distraction',
      prompt: 'How did the visual assistance feel?',
      response: 'choice',
      choices: ['helpful', 'neutral', 'distracting'],
    },
  ],
  supportedInputContexts: ['pointer', 'touch', 'gaze', 'switch'],
} satisfies TrialDefinition)

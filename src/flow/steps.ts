/**
 * The screen order from the wireframe, with two merges:
 *   - landing takes college + phone (was the landing and part of intake)
 *   - intake takes name, study stage and the whole questionnaire
 *     (was intake + the likert screen)
 *   - puzzle runs all five questions and shows each outcome inline
 *     (was puzzle + the separate round-result screen)
 *   - score comes before the answers, so the result lands first and the
 *     explanations are what the student leaves on
 */
export const STEPS = [
  'landing',
  'intake',
  'transition',
  'puzzle',
  'score',
  'reveal',
] as const;

export type Step = (typeof STEPS)[number];

export function nextStep(current: Step): Step {
  const i = STEPS.indexOf(current);
  return STEPS[Math.min(i + 1, STEPS.length - 1)];
}

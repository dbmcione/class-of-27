import type { College } from '../lib/colleges';
import type { StudyStage } from './questions';

/** Everything gathered across the flow. Screens fill in their own slice. */
export type Session = {
  playerId: string;
  college: College;
  phone: string;
  name?: string;
  stage?: StudyStage;
  /** Questionnaire answers, keyed by Question.key. */
  answers?: Record<string, string>;
};

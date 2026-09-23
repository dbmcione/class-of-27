/**
 * The Quick Intro questionnaire. Every item is a statement the student marks
 * as describing them or not, so the answers line up as one comparable set.
 *
 * Statements are all phrased so that "Sounds like me" is the struggle signal —
 * keep that polarity when adding new ones, or scoring later will need to know
 * which items are reversed.
 *
 * `key` is stored as question_key in Supabase, so renaming one breaks
 * continuity with rows already collected — add a new key instead.
 */
export type Question = {
  key: string;
  statement: string;
};

export const ANSWER_OPTIONS = ['Sounds like me', 'Not really'] as const;
export type AnswerOption = (typeof ANSWER_OPTIONS)[number];

/**
 * Three statements, down from seven. The keys are unchanged, so the answers
 * already collected under them still line up; rows for the four that were
 * dropped stay in player_answers as history and simply stop being written.
 */
export const QUESTIONS: readonly Question[] = [
  {
    key: 'timetable_slips',
    statement: 'My timetable ends up being more of a suggestion than a plan.',
  },
  {
    key: 'recall_under_pressure',
    statement:
      'I understand the topic when someone explains it, but I struggle to recall and apply it when I’m solving questions.',
  },
  {
    key: 'postpones_mcqs',
    statement: 'I keep postponing MCQs until I’ve ‘finished studying’ the subject.',
  },
];

/** Most senior first — the students likeliest to be sitting NEET PG soon. */
export const STUDY_STAGES = [
  'Post-Intern',
  'Intern',
  '4th Year',
  '3rd Year',
  '2nd Year',
  '1st Year',
] as const;
export type StudyStage = (typeof STUDY_STAGES)[number];

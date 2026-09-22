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

export const QUESTIONS: readonly Question[] = [
  {
    key: 'timetable_slips',
    statement: 'My timetable ends up being more of a suggestion than a plan.',
  },
  {
    key: 'tough_topic_deferred',
    statement: 'When a topic feels tough, I set it aside and tell myself I’ll come back to it.',
  },
  {
    key: 'recall_under_pressure',
    statement:
      'I understand the topic when someone explains it, but I struggle to recall and apply it when I’m solving questions.',
  },
  {
    key: 'misses_details',
    statement: 'I remember the broad concept but forget the small details that MCQs test.',
  },
  {
    key: 'postpones_mcqs',
    statement: 'I keep postponing MCQs until I’ve ‘finished studying’ the subject.',
  },
  {
    key: 'momentum_dips',
    statement: 'I study really well for a few days and then struggle to maintain the momentum.',
  },
  {
    key: 'growing_backlog',
    statement: 'I save notes, videos and questions for later, but my ‘later’ pile keeps growing.',
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

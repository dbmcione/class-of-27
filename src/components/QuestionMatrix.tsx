import { ANSWER_OPTIONS, type Question } from '../flow/questions';

/**
 * Statements down the left, the two answers as columns. Each row is its own
 * radiogroup, so a keyboard or screen-reader user moves row to row and picks
 * within a row with arrow keys, rather than wading through 14 loose controls.
 *
 * The header is sticky inside the scrolling screen — without it the column
 * meanings scroll away and the radios become unlabelled circles.
 */
export function QuestionMatrix({
  questions,
  answers,
  highlightUnanswered,
  onAnswer,
}: {
  questions: readonly Question[];
  answers: Record<string, string>;
  highlightUnanswered: boolean;
  onAnswer: (key: string, answer: string) => void;
}) {
  return (
    <div className="matrix">
      <div className="matrix-head" aria-hidden="true">
        <span />
        {ANSWER_OPTIONS.map((option) => (
          <span key={option} className="matrix-head-label">
            {option}
          </span>
        ))}
      </div>

      {questions.map((question) => {
        const answer = answers[question.key];
        const missing = highlightUnanswered && answer === undefined;
        return (
          <div
            key={question.key}
            className={`matrix-row${missing ? ' is-missing' : ''}`}
            role="radiogroup"
            aria-label={question.statement}
            data-question={question.key}
          >
            <p className="matrix-statement">{question.statement}</p>
            {ANSWER_OPTIONS.map((option) => (
              <label
                key={option}
                className={`matrix-cell${answer === option ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name={question.key}
                  value={option}
                  checked={answer === option}
                  onChange={() => onAnswer(question.key, option)}
                />
                <span className="matrix-dot" aria-hidden="true" />
                <span className="sr-only">{option}</span>
              </label>
            ))}
          </div>
        );
      })}
    </div>
  );
}

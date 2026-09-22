import { isPositionShown, longestWordLength, toWords } from '../flow/puzzle';
import type { Puzzle } from '../flow/bank';

/**
 * The fill-in-the-blanks row. Boxes are sized off the longest word so the
 * whole answer fits any screen width without a word ever breaking across
 * lines, which would make it unreadable.
 */
export function WordDisplay({
  puzzle,
  guessed,
  reveal,
}: {
  puzzle: Puzzle;
  guessed: ReadonlySet<string>;
  /** After a loss, show the answer including letters never guessed. */
  reveal: boolean;
}) {
  const words = toWords(puzzle.answer);
  const maxLen = longestWordLength(puzzle.answer);

  return (
    <div
      className="word-display"
      style={{ '--maxlen': maxLen } as React.CSSProperties}
      role="img"
      aria-label={
        reveal
          ? `The answer is ${puzzle.answer}`
          : `${puzzle.answer.replace(/[A-Z]/g, '_')}, blanks to fill in`
      }
    >
      {words.map((word, wordIndex) => (
        <div className="word-row" key={wordIndex}>
          {word.map(({ char, index }) => {
            const shown = isPositionShown(puzzle, index, guessed);
            return (
              <span
                key={index}
                className={`letter-box${shown || reveal ? ' is-shown' : ''}${
                  reveal && !shown ? ' is-missed' : ''
                }`}
              >
                {shown || reveal ? char : ''}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, type KeyState } from '../components/Keyboard';
import { WordDisplay } from '../components/WordDisplay';
import { MAX_WRONG, type Puzzle } from '../flow/bank';
import type { PuzzleResult } from '../flow/round';
import {
  answerContains,
  formatClock,
  isLetter,
  isSolved,
  preRevealedLetters,
  titleCaseAnswer,
} from '../flow/puzzle';

type Props = {
  puzzles: readonly Puzzle[];
  onFinish: (results: PuzzleResult[]) => void;
};

export function PuzzleScreen({ puzzles, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<PuzzleResult[]>([]);
  const [guessed, setGuessed] = useState<ReadonlySet<string>>(new Set());
  const [wrong, setWrong] = useState<ReadonlySet<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);

  const puzzle = puzzles[index];
  const isLast = index === puzzles.length - 1;

  // Seconds spent on the current question, reset as each one starts.
  const questionStartRef = useRef(0);

  // Start each question with its first letters already on show.
  useEffect(() => {
    if (!puzzle) return;
    setGuessed(preRevealedLetters(puzzle));
    setWrong(new Set());
    questionStartRef.current = elapsed;
    // elapsed is read as a starting mark only; re-running on every tick would
    // reset the question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, puzzle]);

  const solved = puzzle ? isSolved(puzzle, guessed) : false;
  const lost = wrong.size >= MAX_WRONG;
  const over = solved || lost;

  useEffect(() => {
    if (over) return;
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [over]);

  const guess = useCallback(
    (letter: string) => {
      if (over || !puzzle || guessed.has(letter)) return;
      setGuessed((prev) => new Set(prev).add(letter));
      if (!answerContains(puzzle, letter)) {
        setWrong((prev) => new Set(prev).add(letter));
      }
    },
    [over, puzzle, guessed],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const letter = event.key.toUpperCase();
      if (letter.length === 1 && isLetter(letter)) guess(letter);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [guess]);

  if (!puzzle) return null;

  function advance() {
    if (!puzzle) return;
    const record: PuzzleResult = {
      puzzleId: puzzle.id,
      solved,
      seconds: elapsed - questionStartRef.current,
      wrongGuesses: wrong.size,
    };
    const next = [...results, record];

    if (isLast) {
      onFinish(next);
      return;
    }
    setResults(next);
    setIndex((i) => i + 1);
  }

  const stateFor = (letter: string): KeyState => {
    if (!guessed.has(letter)) return 'unused';
    return wrong.has(letter) ? 'wrong' : 'correct';
  };

  const left = MAX_WRONG - wrong.size;

  return (
    <div className="screen screen-puzzle">
      <div className="puzzle-progress">
        <div className="progress-track" aria-hidden="true">
          {puzzles.map((p, i) => (
            <span
              key={p.id}
              className={`progress-seg${
                i < index ? ' is-done' : i === index ? ' is-current' : ''
              }`}
            />
          ))}
        </div>
        <div className="puzzle-bar">
          <span className="question-count">
            Question {index + 1} of {puzzles.length}
          </span>
          <span className="timer" aria-label={`Time elapsed ${formatClock(elapsed)}`}>
            {formatClock(elapsed)}
          </span>
        </div>
      </div>

      <p className="clue-box">{puzzle.clue}</p>

      <WordDisplay puzzle={puzzle} guessed={guessed} reveal={lost} />

      {!over && (
        <div className="attempts" role="status">
          <span className="attempts-pips" aria-hidden="true">
            {Array.from({ length: MAX_WRONG }, (_, i) => (
              <span key={i} className={`pip${i < wrong.size ? ' is-used' : ''}`} />
            ))}
          </span>
          <span className="attempts-text">
            {left} guess{left === 1 ? '' : 'es'} left
          </span>
        </div>
      )}

      {over ? (
        <div className="outcome" role="status">
          <span className={`badge${lost ? ' is-fail' : ''}`}>
            {solved ? 'Solved!' : 'Out of guesses'}
          </span>
          <h2 className="outcome-title">
            {solved ? 'Yay! You Got It Right' : 'Not This Time'}
          </h2>
          <p className="outcome-answer">
            It’s <strong>{titleCaseAnswer(puzzle.answer)}</strong>.
          </p>
          <button className="btn" type="button" onClick={advance}>
            {isLast ? 'See My Score' : 'Next Question'}
          </button>
        </div>
      ) : (
        <Keyboard stateFor={stateFor} disabled={false} onPress={guess} />
      )}
    </div>
  );
}

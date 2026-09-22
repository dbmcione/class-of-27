import { RevealCard } from '../components/RevealCard';
import type { Puzzle } from '../flow/bank';
import type { PuzzleResult } from '../flow/round';

type Props = {
  puzzles: readonly Puzzle[];
  results: readonly PuzzleResult[];
  onPlayAgain: () => void;
};

/** All five questions with their answers, MCQs and tags, after the round. */
export function RevealScreen({ puzzles, results, onPlayAgain }: Props) {
  const solvedCount = results.filter((r) => r.solved).length;

  return (
    <div className="screen">
      <h1>The Answers</h1>
      <p className="sub">
        You solved {solvedCount} of {results.length}. Tap any card for the full explanation.
      </p>

      <ol className="reveal-list">
        {puzzles.map((puzzle, i) => (
          <RevealCard
            key={puzzle.id}
            puzzle={puzzle}
            index={i}
            solved={results[i]?.solved ?? false}
          />
        ))}
      </ol>

      <button className="btn" type="button" onClick={onPlayAgain}>
        Play Again
      </button>
      <p className="footer-note">
        A new round pulls fresh questions you haven’t seen yet.
      </p>
    </div>
  );
}

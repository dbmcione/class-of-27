import { useState } from 'react';
import { RevealCard } from '../components/RevealCard';
import { CourseNote } from '../components/CourseNote';
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
  // One card open at a time; opening another closes the previous one.
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="screen reveal-screen">
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
            open={openId === puzzle.id}
            onToggle={() => setOpenId((id) => (id === puzzle.id ? null : puzzle.id))}
          />
        ))}
      </ol>

      <CourseNote />

      <button className="btn" type="button" onClick={onPlayAgain}>
        Play Again
      </button>
    </div>
  );
}

import { PUZZLE_BANK, QUESTIONS_PER_ROUND, type Puzzle } from './bank';
import { FIRST_ROUND_BANK } from './recall-bank';

export type PuzzleResult = {
  puzzleId: string;
  solved: boolean;
  seconds: number;
  wrongGuesses: number;
};

/** Fisher-Yates. `rng` is injectable so round selection can be tested. */
function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i]!;
    const b = out[j]!;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

export type RoundSelection = {
  puzzles: Puzzle[];
  /** The seen list to persist after this round is served. */
  nextSeen: string[];
  /** True when the bank ran low and the pool was started over. */
  cycled: boolean;
};

/**
 * Picks the next set of puzzles, skipping anything this player has already
 * been shown. When fewer than a full round remain, the pool starts over —
 * otherwise a returning student would hit a dead end after five attempts.
 *
 * TEMPORARY: a player who has seen nothing gets the five NEET PG 2026
 * recalls instead of a draw from the bank, in the order the sheet lists
 * them. Delete this branch and `recall-bank.ts` together once the full
 * question list lands. Their ids still go into the seen list, so a second
 * round draws from the bank as usual and never repeats them.
 */
export function selectRound(
  seen: readonly string[],
  rng: () => number = Math.random,
  bank: readonly Puzzle[] = PUZZLE_BANK,
  count: number = QUESTIONS_PER_ROUND,
): RoundSelection {
  if (seen.length === 0 && FIRST_ROUND_BANK.length >= count) {
    const puzzles = FIRST_ROUND_BANK.slice(0, count);
    return { puzzles: [...puzzles], nextSeen: puzzles.map((p) => p.id), cycled: false };
  }

  const seenSet = new Set(seen);
  let pool = bank.filter((p) => !seenSet.has(p.id));
  let cycled = false;
  let carriedSeen: string[] = [...seen];

  if (pool.length < count) {
    pool = [...bank];
    carriedSeen = [];
    cycled = true;
  }

  const puzzles = shuffle(pool, rng).slice(0, count);
  return {
    puzzles,
    nextSeen: [...carriedSeen, ...puzzles.map((p) => p.id)],
    cycled,
  };
}

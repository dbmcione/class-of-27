import { PUZZLE_BANK, QUESTIONS_PER_ROUND, type Puzzle } from './bank';

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
 * With the bank at exactly one round, that second clause is the only one that
 * ever runs: a replay serves the same five in the same order, which is the
 * intended behaviour until the bank grows. Nothing here needs changing when
 * it does; the exclusion starts working again on its own.
 */
export function selectRound(
  seen: readonly string[],
  rng: () => number = Math.random,
  bank: readonly Puzzle[] = PUZZLE_BANK,
  count: number = QUESTIONS_PER_ROUND,
): RoundSelection {
  // A bank no larger than a round has nothing to choose between, so it is
  // served in the sheet's order rather than shuffled into a different one.
  if (bank.length <= count) {
    return { puzzles: [...bank], nextSeen: bank.map((p) => p.id), cycled: true };
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

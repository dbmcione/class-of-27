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

/** Every student's first round must include this puzzle, at a random position. */
const PINNED_FIRST_ROUND_ID = 'primary-hyperaldosteronism';

/**
 * Picks the next set of puzzles, skipping anything this player has already
 * been shown. When fewer than a full round remain, the pool starts over —
 * otherwise a returning student would hit a dead end after five attempts.
 *
 * A student's first round (an empty seen list) is a special case: it always
 * carries `PINNED_FIRST_ROUND_ID`, shuffled in at a random position alongside
 * four other random puzzles, so every student sees it early regardless of
 * what the rest of the shuffle turns up.
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

  if (seen.length === 0) {
    const pinned = bank.find((p) => p.id === PINNED_FIRST_ROUND_ID);
    if (pinned) {
      const others = shuffle(
        bank.filter((p) => p.id !== PINNED_FIRST_ROUND_ID),
        rng,
      ).slice(0, count - 1);
      const puzzles = shuffle([pinned, ...others], rng);
      return { puzzles, nextSeen: puzzles.map((p) => p.id), cycled: false };
    }
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

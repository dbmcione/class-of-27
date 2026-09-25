import type { PuzzleProgress } from '../flow/round';

/**
 * A round in progress, saved so a dead tab or a refresh sends a student back
 * to exactly where they were instead of a fresh set of five. Keyed by player,
 * so a shared device never resumes the wrong person's game.
 */
export type ActiveRound = PuzzleProgress & {
  /** The exact five puzzle ids this round drew, in order. */
  puzzleIds: string[];
};

const KEY_PREFIX = 'class-of-27:active-round:';

export function loadActiveRound(playerId: string): ActiveRound | null {
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + playerId);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveRound;
  } catch {
    return null;
  }
}

export function saveActiveRound(playerId: string, round: ActiveRound): void {
  try {
    window.localStorage.setItem(KEY_PREFIX + playerId, JSON.stringify(round));
  } catch {
    // Private browsing or full quota — resuming is a nicety, not a
    // requirement, so the round should still be playable either way.
  }
}

/** Called once a round is finished — a completed round has nothing to resume. */
export function clearActiveRound(playerId: string): void {
  try {
    window.localStorage.removeItem(KEY_PREFIX + playerId);
  } catch {
    // As above.
  }
}

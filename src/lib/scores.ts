import { supabase } from './supabase';
import type { PuzzleResult } from '../flow/round';

export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  displayName: string;
  solved: number;
  total: number;
  totalSeconds: number;
};

export type RoundScore = {
  solved: number;
  total: number;
  totalSeconds: number;
};

const LOCAL_SCORES_KEY = 'class-of-27:round-scores';

type LocalRound = RoundScore & { playerId: string; collegeId: string; name: string };

function readLocalRounds(): LocalRound[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_SCORES_KEY);
    return raw ? (JSON.parse(raw) as LocalRound[]) : [];
  } catch {
    return [];
  }
}

export function summarise(results: readonly PuzzleResult[]): RoundScore {
  return {
    solved: results.filter((r) => r.solved).length,
    total: results.length,
    totalSeconds: results.reduce((sum, r) => sum + r.seconds, 0),
  };
}

/** How many rows of the college board the score screen shows. */
export const BOARD_TOP = 5;

/** A saved round, and the code its answers page lives at. */
export type SaveResult = {
  ok: boolean;
  /** Null when the round could not be saved, or when Supabase is not set up. */
  code: string | null;
  /**
   * Whether this was the student's first finished round, so whether its
   * scorecard is uploaded. Undefined when the save came back without the
   * board (see saveRound), and the upload then asks for itself.
   */
  isFirst?: boolean;
  /**
   * The top of the college board and the student's own place, read in the
   * same call as the save. Undefined in the same case, and the score screen
   * then fetches them itself.
   */
  board?: LeaderboardEntry[];
  place?: BoardPlace | null;
};

type BoardRowData = {
  rank: number;
  player_id: string;
  display_name: string;
  solved: number;
  total: number;
  total_seconds: number;
};

function toEntry(row: BoardRowData): LeaderboardEntry {
  return {
    rank: Number(row.rank),
    playerId: row.player_id,
    displayName: row.display_name,
    solved: row.solved,
    total: row.total,
    totalSeconds: row.total_seconds,
  };
}

/** PostgREST's "no such function": the database has not been migrated yet. */
function isMissingFunction(error: { code?: string } | null): boolean {
  return error?.code === 'PGRST202';
}

export async function saveRound(args: {
  playerId: string;
  collegeId: string;
  name: string;
  score: RoundScore;
  results: readonly PuzzleResult[];
}): Promise<SaveResult> {
  const { playerId, collegeId, name, score, results } = args;

  if (!supabase) {
    try {
      const rounds = readLocalRounds();
      rounds.push({ ...score, playerId, collegeId, name });
      window.localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(rounds));
    } catch {
      // Private browsing or full quota.
    }
    return { ok: true, code: null };
  }

  const round = {
    p_player_id: playerId,
    p_college_id: collegeId,
    p_solved: score.solved,
    p_total: score.total,
    p_total_seconds: score.totalSeconds,
    p_results: results.map((r) => ({
      puzzleId: r.puzzleId,
      solved: r.solved,
      seconds: r.seconds,
      wrongGuesses: r.wrongGuesses,
    })),
  };

  /**
   * One call for the whole score screen: the save, the board, the student's
   * place and whether to upload the scorecard. Every request is logged by
   * Supabase (twice, counting the browser's OPTIONS check), and these four
   * always ran back to back.
   */
  const combined = await supabase.rpc('save_round_and_board', { ...round, p_top: BOARD_TOP });

  if (!combined.error && combined.data) {
    const d = combined.data;
    return {
      ok: true,
      code: typeof d.code === 'string' ? d.code : null,
      isFirst: d.is_first === true,
      board: (d.board ?? []).map(toEntry),
      place: d.place
        ? { entry: toEntry(d.place), boardSize: Number(d.place.board_size) }
        : null,
    };
  }

  // Only a database without migration-fewer-requests.sql falls through to
  // here. Anything else is a real failure, and retrying the save through
  // save_round could record the round twice.
  if (!isMissingFunction(combined.error)) return { ok: false, code: null };

  /**
   * One call rather than two inserts. The round and its per-puzzle detail
   * should not be able to half-succeed, and the share code has to come back
   * with the write: it is generated in the database, where uniqueness can
   * actually be enforced.
   */
  const { data, error } = await supabase.rpc('save_round', round);

  // The leaderboard is driven by this write, so a failure here is what the
  // player would notice.
  if (error) return { ok: false, code: null };

  return { ok: true, code: typeof data === 'string' ? data : null };
}

/**
 * Best round per player for a college, most solved first then fastest.
 * Server-side this returns a first name only — never a full name or phone.
 */
/** Where one student sits on their college board, counted over the whole of it. */
export type BoardPlace = {
  entry: LeaderboardEntry;
  /**
   * How many students have a place on this board. Nothing renders it today;
   * it comes back from the same query as the rank, so it costs nothing to
   * keep and saves a second round trip if the count is ever wanted.
   */
  boardSize: number;
};

/**
 * Asked separately from the list, not found by searching it. Searching only
 * works while the student is inside the window fetched, and a student outside
 * it is precisely who this is for.
 */
export async function fetchOwnPlace(
  collegeId: string,
  playerId: string,
): Promise<BoardPlace | null> {
  if (!supabase) {
    const board = await fetchLeaderboard(collegeId, 1000);
    const entry = board.find((e) => e.playerId === playerId);
    return entry ? { entry, boardSize: board.length } : null;
  }

  const { data, error } = await supabase.rpc('college_rank', {
    p_college_id: collegeId,
    p_player_id: playerId,
  });

  if (error || !data || data.length === 0) return null;
  const row = data[0]!;
  return { entry: toEntry(row), boardSize: Number(row.board_size) };
}

export async function fetchLeaderboard(
  collegeId: string,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  if (!supabase) {
    // Local mode has only this browser's own rounds to show.
    const best = new Map<string, LocalRound>();
    for (const round of readLocalRounds()) {
      if (round.collegeId !== collegeId) continue;
      const current = best.get(round.playerId);
      const better =
        !current ||
        round.solved > current.solved ||
        (round.solved === current.solved && round.totalSeconds < current.totalSeconds);
      if (better) best.set(round.playerId, round);
    }
    return [...best.values()]
      .sort((a, b) => b.solved - a.solved || a.totalSeconds - b.totalSeconds)
      .slice(0, limit)
      .map((r, i) => ({
        rank: i + 1,
        playerId: r.playerId,
        displayName: r.name.trim().split(/\s+/)[0] ?? 'Anonymous',
        solved: r.solved,
        total: r.total,
        totalSeconds: r.totalSeconds,
      }));
  }

  const { data, error } = await supabase.rpc('college_leaderboard', {
    p_college_id: collegeId,
    p_limit: limit,
  });

  if (error || !data) return [];
  return data.map(toEntry);
}

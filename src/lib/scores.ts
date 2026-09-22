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

export async function saveRound(args: {
  playerId: string;
  collegeId: string;
  name: string;
  score: RoundScore;
  results: readonly PuzzleResult[];
}): Promise<void> {
  const { playerId, collegeId, name, score, results } = args;

  if (!supabase) {
    try {
      const rounds = readLocalRounds();
      rounds.push({ ...score, playerId, collegeId, name });
      window.localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(rounds));
    } catch {
      // Private browsing or full quota.
    }
    return;
  }

  await supabase.from('round_scores').insert({
    player_id: playerId,
    college_id: collegeId,
    solved: score.solved,
    total: score.total,
    total_seconds: score.totalSeconds,
  });

  if (results.length > 0) {
    await supabase.from('puzzle_results').insert(
      results.map((r) => ({
        player_id: playerId,
        puzzle_id: r.puzzleId,
        solved: r.solved,
        seconds: r.seconds,
        wrong_guesses: r.wrongGuesses,
      })),
    );
  }
}

/**
 * Best round per player for a college, most solved first then fastest.
 * Server-side this returns a first name only — never a full name or phone.
 */
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
  return data.map((row) => ({
    rank: Number(row.rank),
    playerId: row.player_id,
    displayName: row.display_name,
    solved: row.solved,
    total: row.total,
    totalSeconds: row.total_seconds,
  }));
}

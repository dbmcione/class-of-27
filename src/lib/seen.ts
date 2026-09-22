import { supabase } from './supabase';

const LOCAL_KEY = 'class-of-27:seen-puzzles';

type SeenStore = Record<string, string[]>;

function readLocal(): SeenStore {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as SeenStore) : {};
  } catch {
    return {};
  }
}

/** Puzzle ids this player has already been shown, across all their attempts. */
export async function loadSeen(playerId: string): Promise<string[]> {
  if (!supabase) return readLocal()[playerId] ?? [];

  const { data, error } = await supabase
    .from('player_seen_puzzles')
    .select('puzzle_id')
    .eq('player_id', playerId);

  if (error || !data) return [];
  return data.map((row) => row.puzzle_id);
}

/**
 * Records the puzzles served for this attempt. Called as the round starts, so
 * a student who abandons midway still does not see the same set next time.
 */
export async function recordServed(playerId: string, puzzleIds: string[]): Promise<void> {
  if (!supabase) {
    try {
      const store = readLocal();
      const merged = new Set([...(store[playerId] ?? []), ...puzzleIds]);
      store[playerId] = [...merged];
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
    } catch {
      // Private browsing or full quota.
    }
    return;
  }

  await supabase
    .from('player_seen_puzzles')
    .upsert(
      puzzleIds.map((puzzle_id) => ({ player_id: playerId, puzzle_id })),
      // DO NOTHING rather than DO UPDATE: a second write of the same row is
      // a no-op, and DO UPDATE would need an UPDATE policy this table has
      // deliberately not been given.
      { onConflict: 'player_id,puzzle_id', ignoreDuplicates: true },
    );
}

/** Clears the seen list when the pool cycles, so it matches the new cycle. */
export async function resetSeen(playerId: string): Promise<void> {
  if (!supabase) {
    try {
      const store = readLocal();
      delete store[playerId];
      window.localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
    } catch {
      // Ignore.
    }
    return;
  }
  await supabase.from('player_seen_puzzles').delete().eq('player_id', playerId);
}

import { supabase } from './supabase';

/**
 * A finished round, read back from its share code.
 *
 * Only what the answers page needs and nothing a forwarded link should not
 * carry: a first name, a score, and which puzzles were solved. No phone
 * number, no full name, no college.
 */
export type Play = {
  firstName: string | null;
  solved: number;
  total: number;
  totalSeconds: number;
  results: readonly { puzzleId: string; solved: boolean }[];
  playedAt: string;
};

/**
 * The code in the address bar, or null for a normal visit.
 *
 * Read from the path rather than a query string so the link reads as a page:
 * /a/a7Kd93mP. Vercel rewrites every path to the app, so no router is needed
 * to serve it.
 */
export function playCodeFromUrl(): string | null {
  const match = window.location.pathname.match(/\/a\/([A-Za-z0-9]{4,32})\/?$/);
  return match ? match[1]! : null;
}

/** The shareable address for a code, built from wherever the app is running. */
export function playUrl(code: string): string {
  const { origin, pathname } = window.location;
  const base = pathname.replace(/\/a\/[^/]*\/?$/, '').replace(/\/+$/, '');
  return `${origin}${base}/a/${code}`;
}

export async function fetchPlay(code: string): Promise<Play | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_play', { p_code: code });
  if (error || !data || data.length === 0) return null;

  const row = data[0] as {
    first_name: string | null;
    solved: number;
    total: number;
    total_seconds: number;
    detail: unknown;
    played_at: string;
  };

  // The detail column is written by this app, but it is still JSON coming
  // back over the wire: a malformed row should render an empty round rather
  // than throw on the way in.
  const results = Array.isArray(row.detail)
    ? row.detail
        .filter(
          (r): r is { puzzleId: string; solved: boolean } =>
            typeof r === 'object' &&
            r !== null &&
            typeof (r as { puzzleId?: unknown }).puzzleId === 'string',
        )
        .map((r) => ({ puzzleId: r.puzzleId, solved: r.solved === true }))
    : [];

  return {
    firstName: row.first_name,
    solved: row.solved,
    total: row.total,
    totalSeconds: row.total_seconds,
    results,
    playedAt: row.played_at,
  };
}

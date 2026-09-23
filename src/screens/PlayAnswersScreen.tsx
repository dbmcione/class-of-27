import { useEffect, useState } from 'react';
import { RevealCard } from '../components/RevealCard';
import { PUZZLE_BANK, type Puzzle } from '../flow/bank';
import { formatDuration } from '../flow/puzzle';
import { fetchPlay, type Play } from '../lib/play';

type Props = { code: string };

/**
 * The answers for one finished round, opened from a link rather than played
 * to. The student may be reading this days later, on a different phone, or
 * be a friend the link was forwarded to.
 *
 * The questions come from the bundle and only the outcome is fetched, so the
 * page is one small request. The trade is that a link renders whatever the
 * bank says today: fine while questions are only added, wrong the day one is
 * reworded.
 */
export function PlayAnswersScreen({ code }: Props) {
  const [play, setPlay] = useState<Play | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchPlay(code).then((found) => {
      if (cancelled) return;
      setPlay(found);
      setState(found ? 'ready' : 'missing');
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state === 'loading') {
    return (
      <div className="screen">
        <p className="board-empty">Loading your answers…</p>
      </div>
    );
  }

  if (state === 'missing' || !play) {
    return (
      <div className="screen">
        <h1>Answers not found</h1>
        <p className="sub">
          This link doesn’t match a round. It may have been typed slightly
          wrong, or the round may have been cleared.
        </p>
        <a className="btn" href={homeHref()}>
          Play The Game
        </a>
      </div>
    );
  }

  // A puzzle that has since left the bank is dropped rather than rendered
  // half-empty. Its outcome still counted towards the score shown above.
  const cards = play.results
    .map((r) => ({ result: r, puzzle: byId(r.puzzleId) }))
    .filter((c): c is { result: typeof c.result; puzzle: Puzzle } => c.puzzle !== undefined);

  return (
    <div className="screen reveal-screen">
      <h1>{play.firstName ? `${play.firstName}, here are your answers` : 'Your answers'}</h1>
      <p className="sub">
        You scored {play.solved} of {play.total} in {formatDuration(play.totalSeconds)}.
        Tap any card for the full explanation.
      </p>

      <ol className="reveal-list">
        {cards.map(({ puzzle, result }, i) => (
          <RevealCard
            key={puzzle.id}
            puzzle={puzzle}
            index={i}
            solved={result.solved}
            open={openId === puzzle.id}
            onToggle={() => setOpenId((id) => (id === puzzle.id ? null : puzzle.id))}
          />
        ))}
      </ol>

      <a className="btn" href={homeHref()}>
        Play The Game
      </a>
    </div>
  );
}

function byId(id: string): Puzzle | undefined {
  return PUZZLE_BANK.find((p) => p.id === id);
}

/** Back to the game from /a/<code>, wherever the app is mounted. */
function homeHref(): string {
  const base = window.location.pathname.replace(/\/a\/[^/]*\/?$/, '');
  return base === '' ? '/' : base;
}

import { useEffect, useRef, useState } from 'react';
import { formatDuration, formatMinutesSeconds } from '../flow/puzzle';
import {
  fetchLeaderboard,
  fetchOwnPlace,
  type BoardPlace,
  type LeaderboardEntry,
  type RoundScore,
  type SaveResult,
} from '../lib/scores';
import { Leaderboard } from '../components/Leaderboard';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { shareScorecard, shareHint } from '../lib/share';
import { generateScorecard } from '../lib/scorecard';
import { uploadScorecard } from '../lib/cards';
import type { College } from '../lib/colleges';

type Props = {
  playerId: string;
  playerName: string;
  college: College;
  score: RoundScore;
  /**
   * Resolves once this round's score has been written, carrying the code the
   * database minted for it — the answers page's address, and the scorecard's
   * filename in the bucket.
   */
  pendingSave: Promise<SaveResult> | null;
  onSeeAnswers: () => void;
};

function ShareIcon() {
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
    </svg>
  );
}

function verdict(solved: number, total: number): string {
  if (solved === total) return 'Clean sweep.';
  if (solved === 0) return 'Tough round. The answers are worth a read.';
  if (solved >= total / 2) return 'Solid round.';
  return 'Room to grow.';
}

/**
 * The five, plus this student's own row when they are not already among them.
 * Their row is appended rather than the list being extended to reach it: the
 * point is to show where they stand without printing the eighteen names in
 * between.
 */
function withOwnRow(
  top: readonly LeaderboardEntry[],
  place: BoardPlace | null,
  count: number,
): LeaderboardEntry[] {
  const rows = top.slice(0, count);
  if (!place) return rows;
  if (rows.some((r) => r.playerId === place.entry.playerId)) return rows;
  return [...rows, place.entry];
}

/** The rank the gap marker sits above, or undefined when the rows are adjacent. */
function gapAfterRank(
  top: readonly LeaderboardEntry[],
  place: BoardPlace | null,
  count: number,
): number | undefined {
  if (!place) return undefined;
  const rows = top.slice(0, count);
  if (rows.some((r) => r.playerId === place.entry.playerId)) return undefined;
  const last = rows[rows.length - 1];
  if (!last || place.entry.rank === last.rank + 1) return undefined;
  return place.entry.rank;
}

export function ScoreScreen({
  playerId,
  playerName,
  college,
  score,
  pendingSave,
  onSeeAnswers,
}: Props) {
  /** The five shown on the page. The popup fetches the rest on demand. */
  const TOP = 5;

  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [place, setPlace] = useState<BoardPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState(false);
  const [fullBoard, setFullBoard] = useState<LeaderboardEntry[] | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  /**
   * `disabled={sharing}` only takes effect on the next render, which happens
   * after this handler yields at its first await — so a fast double tap fires
   * two shares and attaches the image twice. A ref blocks the second tap
   * synchronously, before any awaiting starts.
   */
  const sharingRef = useRef(false);
  const [preview, setPreview] = useState<string | null>(null);
  // Revealed after a share so the message is always reachable, even when the
  // clipboard write was blocked or the target dropped the text.

  const scorecard = {
    ...score,
    collegeName: college.name,
    playerName: playerName || 'Doctor-to-be',
    timeLabel: formatMinutesSeconds(score.totalSeconds),
  };

  /**
   * Drawn once, used twice: shown as the preview, and uploaded so the
   * marketing message can attach the very image the student saw. Held in a
   * ref rather than started inside an effect because two consumers need it
   * and neither should trigger a second draw.
   */
  const cardRef = useRef<ReturnType<typeof generateScorecard> | null>(null);
  if (cardRef.current === null) cardRef.current = generateScorecard(scorecard);

  useEffect(() => {
    let cancelled = false;
    void cardRef.current?.then((card) => {
      if (!cancelled) setPreview(card?.dataUrl ?? null);
    });
    return () => {
      cancelled = true;
    };
    // The card depends only on the finished round, which does not change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // Wait for this round's own write before reading the board back.
      const saved = pendingSave ? await pendingSave : { ok: true };
      if (cancelled) return;
      setSaveFailed(!saved.ok);

      // Both at once: the five to show, and where this student actually sits.
      // Their rank cannot be read off a five-row list when they are 24th.
      const [rows, own] = await Promise.all([
        fetchLeaderboard(college.id, TOP),
        fetchOwnPlace(college.id, playerId),
      ]);
      if (cancelled) return;
      setBoard(rows);
      setPlace(own);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [college.id, playerId, pendingSave]);

  /**
   * The card goes to the bucket under this round's own code, which is what
   * lets the sheet work out its address without storing one.
   *
   * Nothing here is cancelled on unmount, unlike every other effect on this
   * screen. A student who taps through to the answers a second after the
   * score lands still needs their card uploaded, and there is no state to
   * set afterwards that a gone screen would care about. A failure is ignored
   * on purpose: they have their score, and the only cost is a later message
   * without a picture.
   */
  useEffect(() => {
    void (async () => {
      const saved = pendingSave ? await pendingSave : null;
      if (!saved?.code) return;
      const card = await cardRef.current;
      if (card) await uploadScorecard(saved.code, card.blob);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSave]);

  return (
    <div className="screen score-screen">
      <div className="score-hero">
        <p className="score-college">{college.name}</p>
        <p className="score-big">
          {score.solved}
          <span className="score-of">/{score.total}</span>
        </p>
        <p className="score-verdict">{verdict(score.solved, score.total)}</p>
        <p className="score-time">Total time {formatDuration(score.totalSeconds)}</p>
      </div>

      <h2 className="board-title">Your College Board</h2>
      <p className="board-note">Each player&rsquo;s best round.</p>

      {loading ? (
        <p className="board-empty">Saving your score…</p>
      ) : saveFailed ? (
        <p className="board-empty">
          We couldn’t save this round. Your score isn’t on the board. Check
          your connection and play again.
        </p>
      ) : board.length === 0 ? (
        <p className="board-empty">No scores on this college’s board yet.</p>
      ) : (
        <>
          <Leaderboard
            entries={withOwnRow(board, place, TOP)}
            playerId={playerId}
            gapBefore={gapAfterRank(board, place, TOP)}
          />

          <button
            className="board-more"
            type="button"
            onClick={() => {
              setShowFull(true);
              if (fullBoard === null) {
                void fetchLeaderboard(college.id, 1000).then(setFullBoard);
              }
            }}
          >
            See Leaderboard
          </button>
        </>
      )}

      {showFull && (
        <LeaderboardModal
          entries={fullBoard ?? []}
          playerId={playerId}
          collegeName={college.name}
          loading={fullBoard === null}
          onClose={() => setShowFull(false)}
        />
      )}

      {preview && (
        <img className="scorecard-preview" src={preview} alt="Your scorecard" />
      )}

      <div className="screen-actions">
        <button
          className="btn secondary"
          type="button"
          disabled={sharing}
          onClick={async () => {
            if (sharingRef.current) return;
            sharingRef.current = true;
            setSharing(true);
            setShareNote(null);
            try {
              const outcome = await shareScorecard(scorecard);
              setShareNote(shareHint(outcome) || null);
            } finally {
              sharingRef.current = false;
              setSharing(false);
            }
          }}
        >
          <ShareIcon />
          {sharing ? 'Preparing…' : 'Challenge a friend'}
        </button>

        <p className="share-note" role="status">
          {shareNote ?? ''}
        </p>

        <section className="score-note">
          <p>
            That was a fun game, a direct clue leading to a diagnosis. But,
            NEET PG questions have now evolved beyond that to test your
            clinical reasoning.
          </p>
        </section>

        <button className="btn" type="button" onClick={onSeeAnswers}>
          View Sample MCQs
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { formatDuration, formatMinutesSeconds } from '../flow/puzzle';
import { fetchLeaderboard, type LeaderboardEntry, type RoundScore } from '../lib/scores';
import { shareScorecard, shareHint } from '../lib/share';
import { generateScorecard } from '../lib/scorecard';
import type { College } from '../lib/colleges';

type Props = {
  playerId: string;
  playerName: string;
  college: College;
  score: RoundScore;
  /** Resolves once this round's score has been written. */
  pendingSave: Promise<{ ok: boolean }> | null;
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
  if (solved === 0) return 'Tough round — the answers are worth a read.';
  if (solved >= total / 2) return 'Solid round.';
  return 'Room to grow.';
}

export function ScoreScreen({
  playerId,
  playerName,
  college,
  score,
  pendingSave,
  onSeeAnswers,
}: Props) {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let cancelled = false;
    void generateScorecard(scorecard).then((card) => {
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

      const rows = await fetchLeaderboard(college.id);
      if (cancelled) return;
      setBoard(rows);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [college.id, pendingSave]);

  return (
    <div className="screen">
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
          We couldn’t save this round. Your score isn’t on the board — check
          your connection and play again.
        </p>
      ) : board.length === 0 ? (
        <p className="board-empty">No scores on this college’s board yet.</p>
      ) : (
        <table className="board">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Name</th>
              <th scope="col">Score</th>
              <th scope="col">Time</th>
            </tr>
          </thead>
          <tbody>
            {board.map((entry) => (
              <tr key={entry.playerId} className={entry.playerId === playerId ? 'is-me' : ''}>
                <td>{entry.rank}</td>
                <td>
                  {entry.displayName}
                  {entry.playerId === playerId && (
                    <span className="you-tag">Your best</span>
                  )}
                </td>
                <td>
                  {entry.solved}/{entry.total}
                </td>
                <td>{formatDuration(entry.totalSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
          {sharing ? 'Preparing…' : 'Share My Scorecard'}
        </button>

        <p className="share-note" role="status">
          {shareNote ?? ''}
        </p>

        <button className="btn" type="button" onClick={onSeeAnswers}>
          See The Answers
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { shareScorecard, shareHint } from '../lib/share';
import { fetchOwnPlace } from '../lib/scores';
import { formatMinutesSeconds } from '../flow/puzzle';
import type { ScorecardInput } from '../lib/scorecard';
import type { College } from '../lib/colleges';

type Props = {
  name: string | undefined;
  playerId: string;
  college: College;
  questionCount: number;
  ready: boolean;
  /** Only for a student who has played before; a first try has nothing to challenge with. */
  canChallenge: boolean;
  onStart: () => void;
};

/** First name only — "Ready, Ayesha?" reads better than the full name. */
function firstName(name: string | undefined): string {
  const first = name?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : 'Doctor-to-be';
}

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

export function TransitionScreen({
  name,
  playerId,
  college,
  questionCount,
  ready,
  canChallenge,
  onStart,
}: Props) {
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  // See ScoreScreen for why this needs to be a ref rather than just `sharing`.
  const sharingRef = useRef(false);
  /**
   * The student's best round, the one their college board shows, shared the
   * same way the score page shares a round. Null until loaded, and stays null
   * for a student who has never finished a round: nothing to challenge with.
   */
  const [best, setBest] = useState<ScorecardInput | null>(null);

  useEffect(() => {
    if (!canChallenge) return;
    let cancelled = false;
    void fetchOwnPlace(college.id, playerId).then((place) => {
      if (cancelled || !place) return;
      const { solved, total, totalSeconds } = place.entry;
      setBest({
        solved,
        total,
        totalSeconds,
        collegeName: college.name,
        playerName: name || 'Doctor-to-be',
        timeLabel: formatMinutesSeconds(totalSeconds),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [canChallenge, college.id, college.name, playerId, name]);

  return (
    <div className="screen screen-centred">
      <div className="centred-block">
        <p className="badge">Ready, {firstName(name)}?</p>
        <h1>Let’s Start The Game</h1>
        <p className="sub">
          {questionCount || 5} diagnoses. 5 guesses each. How many can you spot?
          Play again to take on a new set of cases.
        </p>
      </div>

      <div className="transition-actions">
        {canChallenge && best && (
          <>
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
                  const outcome = await shareScorecard(best, null);
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
          </>
        )}

        <button className="btn" type="button" disabled={!ready} onClick={onStart}>
          {ready ? 'Let’s Go' : 'Getting Your Questions…'}
        </button>
      </div>
    </div>
  );
}

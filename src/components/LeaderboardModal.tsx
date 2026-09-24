import { useEffect, useRef } from 'react';
import { Leaderboard } from './Leaderboard';
import type { LeaderboardEntry } from '../lib/scores';

type Props = {
  entries: readonly LeaderboardEntry[];
  playerId: string;
  collegeName: string;
  loading: boolean;
  onClose: () => void;
};

/** The whole college board, over the score page. */
export function LeaderboardModal({
  entries,
  playerId,
  collegeName,
  loading,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);

    /**
     * The page behind must not scroll while this is open. Without it a phone
     * scrolls the score page under the overlay once the list hits its end,
     * which reads as the popup having broken.
     */
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        // Only a click on the backdrop itself, not one that bubbled up from
        // inside the panel.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${collegeName} leaderboard`}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Leaderboard</h2>
            <p className="modal-sub">{collegeName}</p>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close leaderboard"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <p className="board-empty">Loading the full board…</p>
          ) : entries.length === 0 ? (
            <p className="board-empty">No scores on this college’s board yet.</p>
          ) : (
            <Leaderboard entries={entries} playerId={playerId} />
          )}
        </div>
      </div>
    </div>
  );
}

import { formatDuration } from '../flow/puzzle';
import type { LeaderboardEntry } from '../lib/scores';

type Props = {
  entries: readonly LeaderboardEntry[];
  playerId: string;
  /**
   * Rendered between two rows whose ranks are not adjacent, so the jump from
   * 5th to 24th reads as a gap rather than as a mistake.
   */
  gapBefore?: number | undefined;
};

/** The board itself. Shared by the five-row summary and the full popup. */
export function Leaderboard({ entries, playerId, gapBefore }: Props) {
  return (
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
        {entries.map((entry) => (
          <Row
            key={entry.playerId}
            entry={entry}
            isMe={entry.playerId === playerId}
            gap={entry.rank === gapBefore}
          />
        ))}
      </tbody>
    </table>
  );
}

function Row({
  entry,
  isMe,
  gap,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  gap: boolean;
}) {
  return (
    <>
      {gap && (
        <tr className="board-gap" aria-hidden="true">
          <td colSpan={4}>⋯</td>
        </tr>
      )}
      <tr className={isMe ? 'is-me' : ''}>
        <td>{entry.rank}</td>
        <td>
          {entry.displayName}
          {isMe && <span className="you-tag">You</span>}
        </td>
        <td>
          {entry.solved}/{entry.total}
        </td>
        <td>{formatDuration(entry.totalSeconds)}</td>
      </tr>
    </>
  );
}

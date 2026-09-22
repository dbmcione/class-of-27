type Props = {
  name: string | undefined;
  questionCount: number;
  ready: boolean;
  onStart: () => void;
};

/** First name only — "Ready, Ayesha?" reads better than the full name. */
function firstName(name: string | undefined): string {
  const first = name?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : 'Doctor-to-be';
}

export function TransitionScreen({ name, questionCount, ready, onStart }: Props) {
  return (
    <div className="screen screen-centred">
      <div className="centred-block">
        <p className="badge">Ready, {firstName(name)}?</p>
        <h1>Let’s Start The Game</h1>
        <p className="sub">
          {questionCount || 5} questions. 5 guesses each. Score and time go on the
          leaderboard.
        </p>
      </div>
      <button className="btn" type="button" disabled={!ready} onClick={onStart}>
        {ready ? 'Let’s Go' : 'Getting Your Questions…'}
      </button>
    </div>
  );
}

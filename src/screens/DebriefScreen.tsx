type Props = {
  onContinue: () => void;
};

/** The three patterns, as supplied. */
const PATTERNS = [
  'Integrated across subjects.',
  'Multistep, where you need to identify the diagnosis first and then reach what was actually asked about treatment.',
  'Clinical decision based, where there is no single right answer but you have to select the best choice.',
];

/**
 * Sits between the last question and the score.
 *
 * The button is the last thing in the scroll, not pinned to the bottom of the
 * screen, so reaching it means having scrolled past the copy. That makes the
 * gate physical and needs no scroll listener, no disabled state and no
 * measuring of whether the content happens to fit.
 */
export function DebriefScreen({ onContinue }: Props) {
  return (
    <div className="screen debrief-screen">
      <p className="debrief-lede">
        What you played just now was a fun game identifying diagnosis based on
        topics seen in recent NEET PG.
        <br />
        But the MCQs asked in the exam were more clinical.
      </p>

      <p className="debrief-kicker">This year, we’ve seen MCQs that are:</p>

      <ul className="debrief-list">
        {PATTERNS.map((pattern) => (
          <li key={pattern}>{pattern}</li>
        ))}
      </ul>

      <button className="btn debrief-cta" type="button" onClick={onContinue}>
        Show My Score
      </button>
    </div>
  );
}

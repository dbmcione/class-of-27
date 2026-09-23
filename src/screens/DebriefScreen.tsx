import { useCallback, useEffect, useRef, useState } from 'react';

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
 * Sits between the last question and the score. The button unlocks only once
 * the student has scrolled to the end, so the point is read rather than
 * tapped past on the way to the result.
 */
export function DebriefScreen({ onContinue }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unlocked, setUnlocked] = useState(false);
  /** Sticky: scrolling back up after reading to the end must not re-lock. */
  const seenEnd = useRef(false);

  /**
   * Unlocks when the scroll reaches the bottom, and immediately when there is
   * nothing to scroll. That second case is the one that matters: when the copy
   * fits, no scroll event ever fires, and a gate that only listened for
   * scrolling would strand the student on a dead button.
   *
   * Recomputed rather than latched, because the content can start fitting and
   * stop: the webfont lands after first paint and reflows the copy, and the
   * screen can rotate. Latching on the first pass would leave the button live
   * over copy that had since grown past the fold.
   *
   * The 2px slack absorbs sub-pixel rounding, which otherwise leaves scrollTop
   * a fraction short of the bottom at some zoom levels.
   */
  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (el.scrollHeight - el.clientHeight <= 2) {
      seenEnd.current = false;
      setUnlocked(true);
      return;
    }
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
      seenEnd.current = true;
    }
    setUnlocked(seenEnd.current);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let live = true;
    const recheck = () => {
      if (live) check();
    };

    check();
    el.addEventListener('scroll', check, { passive: true });

    /**
     * Anything that changes how much copy fits has to re-open the question of
     * whether the student has seen the end.
     *
     * Several listeners rather than one because none of them is reliable on
     * its own. ResizeObserver does not fire in every engine this has to run
     * in, so it is the bonus rather than the mechanism; window resize covers
     * rotation and the mobile URL bar sliding away; and the webfont lands
     * after first paint and reflows the copy, which on its own can turn a
     * page that fitted into one that scrolls.
     */
    window.addEventListener('resize', recheck);
    window.addEventListener('orientationchange', recheck);

    // Once after layout settles, for the case where none of the above fires.
    const settle = window.setTimeout(recheck, 120);

    if ('fonts' in document) void document.fonts.ready.then(recheck);

    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(recheck) : null;
    if (observer) {
      observer.observe(el);
      for (const child of Array.from(el.children)) observer.observe(child);
    }

    return () => {
      live = false;
      window.clearTimeout(settle);
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', recheck);
      window.removeEventListener('orientationchange', recheck);
      observer?.disconnect();
    };
  }, [check]);

  return (
    <div className="screen debrief-screen">
      <div className="debrief-scroll" ref={scrollRef}>
        <div className="debrief-body">
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
        </div>
      </div>

      <div className="debrief-footer">
        <p className="debrief-hint" role="status">
          {unlocked ? '' : 'Scroll to the end to continue'}
        </p>
        <button
          className="btn"
          type="button"
          disabled={!unlocked}
          onClick={onContinue}
        >
          Show My Score
        </button>
      </div>
    </div>
  );
}

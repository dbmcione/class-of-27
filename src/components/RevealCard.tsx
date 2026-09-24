import { useId, useLayoutEffect, useRef } from 'react';
import type { Puzzle } from '../flow/bank';
import { titleCaseAnswer } from '../flow/puzzle';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * The question sheet writes its explanations in paragraphs, and the argument
 * moves one step per paragraph. Collapsing them into a single block would
 * hide that structure, so each becomes its own <p>.
 */
function Prose({ text }: { text: string }) {
  return (
    <>
      {text.split('\n\n').map((paragraph, i) => (
        <p className="reveal-body" key={i}>
          {paragraph}
        </p>
      ))}
    </>
  );
}

export function RevealCard({
  puzzle,
  index,
  solved,
  open,
  onToggle,
}: {
  puzzle: Puzzle;
  index: number;
  solved: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const itemRef = useRef<HTMLLIElement>(null);
  const wasOpen = useRef(open);

  /**
   * Opening a card collapses the previously open one, which shifts this card
   * up or down the page — often out of view. Scroll it back to the top so the
   * card you tapped is the card you are looking at.
   *
   * Deferred a frame so the collapse has been laid out first, and deliberately
   * not `behavior: 'smooth'` — a smooth scroll started in the same tick as a
   * large layout change gets dropped, leaving the card off screen.
   */
  useLayoutEffect(() => {
    const justOpened = open && !wasOpen.current;
    wasOpen.current = open;
    if (!justOpened) return;

    const card = itemRef.current;
    const scroller = card?.closest<HTMLElement>('.screen');
    if (!card || !scroller) return;

    // Measured geometry rather than scrollIntoView: that depends on the page
    // painting and silently does nothing when it has not. useLayoutEffect
    // runs after the collapse has been applied to the DOM, so these rects are
    // already the post-collapse ones — no rAF or timeout needed.
    const delta =
      card.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += delta - 8;
  }, [open]);

  return (
    <li className={`reveal-item${open ? ' is-open' : ''}`} ref={itemRef}>
      <button
        type="button"
        className="reveal-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="reveal-top">
          <span className="reveal-num">{String(index + 1).padStart(2, '0')}</span>
          <span className={`reveal-status${solved ? ' is-solved' : ''}`}>
            {solved ? 'Solved' : 'Missed'}
          </span>
        </span>

        <span className="reveal-answer">{titleCaseAnswer(puzzle.answer)}</span>

        {!open && (
          <span className="reveal-teaser">
            {puzzle.definition}
            <span className="reveal-fade" aria-hidden="true" />
          </span>
        )}

        <span className="reveal-more">
          {open ? 'Show less' : 'Read more'}
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div className="reveal-panel" id={panelId}>
          <Prose text={puzzle.definition} />

          <div className="reveal-section">
            <p className="reveal-label">Recent NEET PG PYQ</p>
            <p className="mcq-stem">{puzzle.mcq.stem}</p>
            {puzzle.image && (
              <img
                className="mcq-image"
                src={puzzle.image.src}
                alt={puzzle.image.alt}
                width={puzzle.image.width}
                height={puzzle.image.height}
              />
            )}
            <ol className="mcq-options">
              {puzzle.mcq.options.map((option, i) => {
                const isCorrect = i === puzzle.mcq.correctIndex;
                return (
                  <li key={option} className={`mcq-option${isCorrect ? ' is-correct' : ''}`}>
                    <span className="mcq-letter">{OPTION_LETTERS[i]}</span>
                    <span className="mcq-text">{option}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="reveal-section">
            <p className="reveal-label">What made it tough</p>
            <ul className="tough-list">
              {puzzle.tough.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`reveal-chevron${open ? ' is-open' : ''}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

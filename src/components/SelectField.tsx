import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

const MAX_VISIBLE = 60;

export type SelectOption = {
  id: string;
  label: string;
  /** Optional second line, e.g. a college's city. */
  meta?: string | null;
};

type Props = {
  options: readonly SelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  loading?: boolean;
  loadingLabel?: string;
  /**
   * Type-to-filter. Defaults on once the list is long enough to be worth
   * searching; a six-item list is faster to just look at.
   */
  searchable?: boolean;
  /**
   * Characters required before the list drops down. For a searchable list
   * long enough to need this, showing everything on focus is just noise —
   * better to wait until typing has actually narrowed it down. Ignored when
   * not searchable, since a short list opens on click with nothing to type.
   */
  minChars?: number;
};

/**
 * One dropdown used everywhere, so the college and study-stage fields cannot
 * drift apart visually. Follows the ARIA combobox pattern: the list is
 * reachable by keyboard, not just by pointer.
 */
export function SelectField({
  options,
  value,
  onChange,
  placeholder,
  loading = false,
  loadingLabel = 'Loading…',
  searchable,
  minChars = 0,
}: Props) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const canSearch = searchable ?? options.length > 8;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Where a press on an option started, so pointerup can tell a tap from a
   *  scroll by how far it travelled — see the comment on the option's
   *  onPointerUp below. */
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  const trimmedQuery = query.trim();
  // Reopening a field that already has an answer isn't a fresh search — show
  // the list straight away regardless of the char minimum, current pick
  // included, rather than making them retype it before they can change it.
  const belowMinChars =
    canSearch && minChars > 0 && selected === null && trimmedQuery.length < minChars;
  // The field can be focused (`open`) well before there's anything worth
  // showing — this is what actually gates the dropdown appearing.
  const showList = open && !belowMinChars;

  const allMatches = useMemo(() => {
    if (belowMinChars) return [];
    const q = trimmedQuery.toLowerCase();
    let result: readonly SelectOption[] =
      !canSearch || q === ''
        ? options
        : options.filter(
            (o) =>
              o.label.toLowerCase().includes(q) || (o.meta ?? '').toLowerCase().includes(q),
          );
    // The current pick leads the list, so reopening to change it shows what's
    // chosen before anything else instead of burying it wherever it happens
    // to fall. Left out of the short, fixed-order pickers (study stage) —
    // there, drawing the same six rows in the same order every time matters
    // more than surfacing the current one first.
    if (canSearch && selected && result.some((o) => o.id === selected.id)) {
      result = [selected, ...result.filter((o) => o.id !== selected.id)];
    }
    return result;
  }, [options, trimmedQuery, canSearch, belowMinChars, selected]);

  /**
   * The college list runs to well over a thousand entries. Rendering them all
   * makes opening the dropdown visibly janky, so only the first slice is put
   * in the DOM and the rest are reached by typing.
   */
  const matches = useMemo(() => allMatches.slice(0, MAX_VISIBLE), [allMatches]);
  const hiddenCount = allMatches.length - matches.length;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) closeList();
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
    // closeList reads `selected` off the current render's closure, which is
    // exactly what's wanted: the pick as of when this listener was attached.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!showList) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, showList]);

  function openList() {
    if (loading) return;
    setOpen(true);
    setQuery('');
    setActiveIndex(0);
  }

  /** Closes without picking anything — snaps the field back to showing
   *  whatever is actually selected, rather than leaving stray search text
   *  (or nothing at all) sitting where the real answer belongs. */
  function closeList() {
    setOpen(false);
    setQuery(selected?.label ?? '');
  }

  function commit(option: SelectOption) {
    onChange(option.id);
    setQuery(option.label);
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      if (matches.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + step + matches.length) % matches.length);
      return;
    }
    if ((event.key === 'Enter' || (event.key === ' ' && !canSearch)) && open) {
      event.preventDefault();
      const pick = matches[activeIndex];
      if (pick) commit(pick);
      return;
    }
    if (event.key === 'Enter' && !open) {
      event.preventDefault();
      openList();
      return;
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeList();
    }
  }

  const shownPlaceholder = loading ? loadingLabel : placeholder;

  return (
    <div className="combo" ref={wrapRef}>
      <div className={`ombre-field${open ? ' is-open' : ''}`}>
        <div className="ombre-inner">
          {canSearch && <SearchIcon />}
          <input
            id={inputId}
            ref={inputRef}
            className="combo-input"
            type="text"
            role="combobox"
            autoComplete="off"
            readOnly={!canSearch}
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete={canSearch ? 'list' : 'none'}
            aria-activedescendant={
              showList && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined
            }
            placeholder={shownPlaceholder}
            value={query}
            disabled={loading}
            onChange={(e) => {
              if (!canSearch) return;
              setQuery(e.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onFocus={openList}
            onClick={() => (open ? undefined : openList())}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className={`combo-chevron${open ? ' is-open' : ''}`}
            tabIndex={-1}
            aria-label={open ? 'Close list' : 'Open list'}
            onClick={() => (open ? closeList() : openList())}
          >
            <ChevronIcon />
          </button>
        </div>
      </div>

      {showList && (
        <ul className="combo-list" id={listId} role="listbox" ref={listRef}>
          {matches.length === 0 && (
            <li className="combo-empty">No match for “{query.trim()}”.</li>
          )}
          {matches.map((option, index) => (
            <li
              key={option.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.id === value}
              className={`combo-option${index === activeIndex ? ' is-active' : ''}`}
              onPointerEnter={() => setActiveIndex(index)}
              // No preventDefault here: that's what originally blocked touch
              // scrolling outright, since it cancels the browser's gesture
              // recognition before it can tell a tap from the start of a
              // scroll. Position is only recorded, so onPointerUp below can
              // measure how far the pointer actually travelled.
              onPointerDown={(e) => {
                pressStartRef.current = { x: e.clientX, y: e.clientY };
              }}
              // Keeps the input focused through the tap — without this, the
              // browser's default mousedown behaviour blurs it first, which
              // would close the list (and lose the pick) before it lands.
              // Safe for touch scrolling: by the time a scroll is already
              // underway, this preventDefault is too late to stop it.
              onMouseDown={(e) => e.preventDefault()}
              // Committing here rather than on mousedown/click sidesteps a
              // second, unrelated mobile bug: Safari withholds the synthetic
              // mousedown/click on a non-native-clickable element like this
              // <li> until a *second* tap, spending the first one only on
              // :hover — which, combined with the fix above, meant every
              // option needed two taps to select. Real pointerup fires on
              // every tap immediately, no such delay, on every browser.
              onPointerUp={(e) => {
                const start = pressStartRef.current;
                pressStartRef.current = null;
                if (!start) return;
                // A tap barely moves; a scroll does. Below this threshold it
                // reads as a pick, same row a drag would instead scroll past.
                const moved =
                  Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y);
                if (moved < 10) commit(option);
              }}
            >
              <span className="combo-option-text">
                <span className="combo-option-name">{option.label}</span>
                {option.meta && <span className="combo-option-meta">{option.meta}</span>}
              </span>
              {/* The current pick is marked explicitly rather than left to be
                  inferred from its position — pinning it first is about
                  finding it fast, not about doubling as the "you are here"
                  signal. */}
              {option.id === value && <CheckIcon />}
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="combo-more" aria-hidden="true">
              {hiddenCount.toLocaleString()} more. Keep typing to narrow it down
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="combo-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="combo-option-check" viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="5 12.5 10 17.5 19 6.5" />
    </svg>
  );
}

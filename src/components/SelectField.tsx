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

  const selected = options.find((o) => o.id === value) ?? null;

  const allMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!canSearch || q === '') return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || (o.meta ?? '').toLowerCase().includes(q),
    );
  }, [options, query, canSearch]);

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
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function openList() {
    if (loading) return;
    setOpen(true);
    setQuery('');
    setActiveIndex(Math.max(0, options.findIndex((o) => o.id === value)));
  }

  function commit(option: SelectOption) {
    onChange(option.id);
    setQuery('');
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
      setQuery('');
      setOpen(false);
    }
  }

  const shownPlaceholder = loading ? loadingLabel : (selected?.label ?? placeholder);

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
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete={canSearch ? 'list' : 'none'}
            aria-activedescendant={
              open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined
            }
            data-filled={selected !== null && query === ''}
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
            onClick={() => (open ? setOpen(false) : openList())}
          >
            <ChevronIcon />
          </button>
        </div>
      </div>

      {open && (
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
              onPointerDown={(e) => {
                e.preventDefault();
                commit(option);
              }}
            >
              <span className="combo-option-name">{option.label}</span>
              {option.meta && <span className="combo-option-meta">{option.meta}</span>}
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="combo-more" aria-hidden="true">
              {hiddenCount.toLocaleString()} more — keep typing to narrow it down
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

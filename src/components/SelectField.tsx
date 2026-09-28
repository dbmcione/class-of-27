import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export type SelectOption = {
  id: string;
  label: string;
  /** Optional second line, e.g. an international college's country. */
  meta?: string | null;
};

type Props = {
  options: readonly SelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  loading?: boolean;
  loadingLabel?: string;
};

/**
 * One tap-to-pick dropdown used everywhere, so the fields cannot drift apart
 * visually. No typing: the input is read-only, so the on-screen keyboard
 * never opens. Follows the ARIA combobox pattern, so it also works from a
 * laptop keyboard.
 */
export function SelectField({
  options,
  value,
  onChange,
  placeholder,
  loading = false,
  loadingLabel = 'Loading…',
}: Props) {
  const inputId = useId();
  const listId = `${inputId}-list`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Opening a long list lands on the current pick rather than the top.
  useEffect(() => {
    if (!open) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function openList() {
    if (loading) return;
    setOpen(true);
    setActiveIndex(Math.max(0, options.findIndex((o) => o.id === value)));
  }

  function commit(option: SelectOption) {
    onChange(option.id);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      if (options.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + step + options.length) % options.length);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const pick = options[activeIndex];
      if (pick) commit(pick);
      return;
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="combo" ref={wrapRef}>
      <div className={`ombre-field${open ? ' is-open' : ''}`}>
        <div className="ombre-inner">
          <input
            id={inputId}
            className="combo-input"
            type="text"
            role="combobox"
            readOnly
            autoComplete="off"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="none"
            aria-activedescendant={
              open && options[activeIndex] ? `${listId}-${activeIndex}` : undefined
            }
            placeholder={loading ? loadingLabel : placeholder}
            value={selected?.label ?? ''}
            disabled={loading}
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
          {options.map((option, index) => (
            <li
              key={option.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.id === value}
              className={`combo-option${index === activeIndex ? ' is-active' : ''}`}
              // Mouse only: on touch there is no hover, and changing the row's
              // style as a finger lands can make iOS hold back the click.
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse') setActiveIndex(index);
              }}
              // Stops the input blurring mid-click. Never preventDefault on
              // pointerdown here: that blocks touch scrolling of the list.
              onMouseDown={(e) => e.preventDefault()}
              // Click, not pointerdown/pointerup: browsers never fire it after
              // a scroll, and nothing fires after it, so closing the list here
              // can't leak a stray tap onto the field underneath.
              onClick={() => commit(option)}
            >
              <span className="combo-option-text">
                <span className="combo-option-name">{option.label}</span>
                {option.meta && <span className="combo-option-meta">{option.meta}</span>}
              </span>
              {option.id === value && <CheckIcon />}
            </li>
          ))}
        </ul>
      )}
    </div>
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

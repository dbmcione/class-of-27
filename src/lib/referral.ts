/**
 * Where a student came from.
 *
 * Two doors lead into this game: the address marketing publishes, and a link
 * a student who has already played sent to a friend. The second kind carries
 * ?ref=<play code>, so arrivals through it can be told apart from arrivals
 * through the first.
 *
 * The code is the sharer's own finished round, which is already unique,
 * already minted by the database and already the address of their answers
 * page. Nothing new is generated to make this work.
 */

const PARAM = 'ref';

/**
 * Survives a reload, and only a reload. The ref has to outlive the landing
 * screen because nothing is written about a student until they have given a
 * phone number, several screens later — but it must not outlive the visit, or
 * a student who plays again next week would be credited to the same friend a
 * second time.
 */
const STORE_KEY = 'class-of-27:ref';

/** Same shape the database mints, and the same shape /a/<code> accepts. */
const CODE = /^[A-Za-z0-9]{4,32}$/;

function readStored(): string | null {
  try {
    const held = window.sessionStorage.getItem(STORE_KEY);
    return held && CODE.test(held) ? held : null;
  } catch {
    return null;
  }
}

/**
 * Reads the ref out of the address, remembers it, and takes it back out of
 * the address bar.
 *
 * The removal is the part worth explaining. Left in place, a student who
 * copies the URL out of their own browser to send to someone would pass on
 * the friend who referred *them*, and the chain would record a referral that
 * never happened. Stripping it means the only way to hand on a ref is to use
 * the share button, which attaches the right one.
 *
 * Called once on mount. Safe to call again; it is idempotent.
 */
export function captureRef(): string | null {
  let found: string | null = null;

  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get(PARAM);

    if (raw && CODE.test(raw)) {
      found = raw;
      try {
        window.sessionStorage.setItem(STORE_KEY, raw);
      } catch {
        // Private browsing. The ref still works for this page load.
      }
    }

    if (url.searchParams.has(PARAM)) {
      url.searchParams.delete(PARAM);
      // replaceState, not assign: no reload, and no extra history entry for
      // the back button to land on.
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  } catch {
    // A URL the browser will not parse is not worth failing a page load over.
  }

  return found ?? readStored();
}

/** The ref for this visit, without touching the address bar again. */
export function currentRef(): string | null {
  return readStored();
}

/**
 * The game's address with a referral attached.
 *
 * Every link a student hands to a friend goes through here: the share caption
 * and the two Play The Game buttons on a shared answers page.
 */
export function linkWithRef(base: string, code: string | null): string {
  if (!code || !CODE.test(code)) return base;
  const separator = base.indexOf('?') === -1 ? '?' : '&';
  return `${base}${separator}${PARAM}=${encodeURIComponent(code)}`;
}

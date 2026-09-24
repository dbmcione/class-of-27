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
 * Reads the ref out of the address and remembers it for the rest of the
 * visit.
 *
 * The ref is deliberately LEFT in the address bar. It could be stripped, and
 * then the only way to hand one on would be the share button, which always
 * attaches the right code. Leaving it means a student who copies the URL out
 * of their own browser and sends it to a friend passes on the ref that
 * brought them here, so that friend is credited to the wrong student.
 *
 * That is a known and accepted trade, made by the product owner: a share
 * counted against the wrong person is better than a share counted as if it
 * had come from marketing. Plenty of students forward a link by copying it
 * rather than by tapping the button, and every one of those would otherwise
 * be lost.
 *
 * So `referred_by_code` answers "which link did they arrive on", not "who
 * personally sent it to them". Read the sharer views with that in mind.
 *
 * Called once before the first render. Safe to call again; it is idempotent.
 */
export function captureRef(): string | null {
  let found: string | null = null;

  try {
    const raw = new URL(window.location.href).searchParams.get(PARAM);

    if (raw && CODE.test(raw)) {
      found = raw;
      try {
        window.sessionStorage.setItem(STORE_KEY, raw);
      } catch {
        // Private browsing. The ref still works for this page load.
      }
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

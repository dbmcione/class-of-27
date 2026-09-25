/**
 * The last phone number that successfully started a game on this browser, so
 * a returning student lands on the landing screen with it already filled in
 * rather than having to type it again.
 */
const KEY = 'class-of-27:last-phone';

export function getRememberedPhone(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function rememberPhone(phone: string): void {
  try {
    window.localStorage.setItem(KEY, phone);
  } catch {
    // Private browsing or full quota — they just type it again next time,
    // same as today.
  }
}

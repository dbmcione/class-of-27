import type { Puzzle } from './bank';

export const KEYBOARD_ROWS: readonly string[] = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

export function isLetter(char: string): boolean {
  return char >= 'A' && char <= 'Z';
}

/** First letter of each word, given free so the blanks have a foothold. */
export function revealedIndices(answer: string): number[] {
  const out: number[] = [];
  let atWordStart = true;
  [...answer].forEach((char, index) => {
    if (char === ' ') {
      atWordStart = true;
      return;
    }
    if (atWordStart) out.push(index);
    atWordStart = false;
  });
  return out;
}

export function toWords(answer: string): { char: string; index: number }[][] {
  const words: { char: string; index: number }[][] = [];
  let current: { char: string; index: number }[] = [];

  [...answer].forEach((char, index) => {
    if (char === ' ') {
      if (current.length > 0) words.push(current);
      current = [];
      return;
    }
    current.push({ char, index });
  });

  if (current.length > 0) words.push(current);
  return words;
}

export function longestWordLength(answer: string): number {
  return toWords(answer).reduce((max, word) => Math.max(max, word.length), 0);
}

export function isPositionShown(
  puzzle: Puzzle,
  index: number,
  guessed: ReadonlySet<string>,
): boolean {
  const char = puzzle.answer[index];
  if (char === undefined || !isLetter(char)) return false;
  return revealedIndices(puzzle.answer).includes(index) || guessed.has(char);
}

export function isSolved(puzzle: Puzzle, guessed: ReadonlySet<string>): boolean {
  return [...puzzle.answer].every(
    (char, index) => !isLetter(char) || isPositionShown(puzzle, index, guessed),
  );
}

export function answerContains(puzzle: Puzzle, letter: string): boolean {
  return puzzle.answer.includes(letter);
}

export function preRevealedLetters(puzzle: Puzzle): Set<string> {
  return new Set(
    revealedIndices(puzzle.answer)
      .map((i) => puzzle.answer[i])
      .filter((c): c is string => c !== undefined && isLetter(c)),
  );
}

/**
 * Display form: "Fibromuscular Dysplasia" rather than shouting caps.
 * Small words stay lowercase inside the term — it is "Tetralogy of Fallot",
 * never "Tetralogy Of Fallot", and getting a medical eponym's casing wrong
 * looks careless to the students being taught it.
 */
const LOWERCASE_IN_TERM = new Set(['OF', 'THE', 'AND', 'IN', 'A']);

export function titleCaseAnswer(answer: string): string {
  return answer
    .split(' ')
    .map((word, i) => {
      if (i > 0 && LOWERCASE_IN_TERM.has(word)) return word.toLowerCase();
      return word.charAt(0) + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Always minutes and zero-padded seconds: "0m 08s", "2m 18s". Used on the
 * scorecard and in the share caption, matching the campaign's wording.
 */
export function formatMinutesSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/** Compact duration for the leaderboard table: "2m 18s", or "47s" under a minute. */
/**
 * Rounded to the nearest minute, for prose. "2m 18s" is the right shape for a
 * leaderboard column and the wrong one inside a sentence a student sends a
 * friend, where it reads like a stopwatch reading rather than a brag.
 */
export function formatApproxDuration(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds} second${totalSeconds === 1 ? '' : 's'}`;
  }
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/**
 * Cuts text short deliberately mid-word, so the card reads as unfinished and
 * invites a tap. A clean break at a space or full stop reads as complete and
 * gives nobody a reason to open it.
 */
export function teaser(text: string, approxLength = 105): string {
  if (text.length <= approxLength) return text;

  let cut = approxLength;
  // Nudge forward until the cut lands inside a word rather than on a space.
  while (
    cut < text.length &&
    (text[cut] === ' ' || text[cut - 1] === ' ' || !/[a-zA-Z]/.test(text[cut] ?? ''))
  ) {
    cut += 1;
  }
  return text.slice(0, cut);
}

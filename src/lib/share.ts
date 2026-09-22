import { generateScorecard, type ScorecardInput } from './scorecard';

export type ShareOutcome =
  | { kind: 'shared'; captionCopied: boolean }
  | { kind: 'downloaded'; captionCopied: boolean }
  | { kind: 'cancelled' }
  | { kind: 'failed' };

/**
 * Where the caption sends students. Change this when the campaign moves off
 * staging — it is the only link in the share message.
 */
export const CLASS_LINK = 'https://dbmci.com/class-of-27';

/**
 * Where this game itself lives, taken from the page rather than hardcoded so
 * it stays correct if the app moves host. Includes the path, because GitHub
 * Pages serves it under /<repo>/ and the origin alone would 404.
 */
export function gameLink(): string {
  const { origin, pathname } = window.location;
  const path = pathname.replace(/index\.html$/, '');
  return (origin + path).replace(/\/+$/, '') + '/';
}

/** The WhatsApp caption. Wording matches the campaign message. */
export function buildShareCaption(input: ScorecardInput): string {
  return [
    `Hey ${input.playerName}`,
    `You scored ${input.solved}/${input.total} in ${input.timeLabel}!`,
    '',
    'The game was just to showcase a glimpse of how NEET PG questions are evolving — clinical, image-based, and multi-step.',
    '',
    'Try it yourself',
    gameLink(),
    '',
    'Evolving pattern of the NEET PG examination requires more focused preparation. The Class of \'27 helps you prepare with structured MCQ practice & recall, live faculty-led classes with real-time doubt-solving, and faculty-curated tests with spaced repetition.',
    '',
    "Join the Class of '27",
    CLASS_LINK,
  ].join('\n');
}

/**
 * Shares the scorecard image.
 *
 * WhatsApp's share target — mobile app and desktop — reliably accepts only ONE
 * of {files, text} per share; passing both makes it take the image and silently
 * drop the caption. So the caption goes to the clipboard first (inside the
 * user's own click, which is what permits the clipboard write), and only the
 * image is handed to the share sheet. The student pastes the caption.
 */
export async function shareScorecard(input: ScorecardInput): Promise<ShareOutcome> {
  const caption = buildShareCaption(input);

  let captionCopied = false;
  try {
    await navigator.clipboard.writeText(caption);
    captionCopied = true;
  } catch {
    // Clipboard blocked — the share still works, just without the caption.
  }

  const card = await generateScorecard(input);
  if (!card) return { kind: 'failed' };

  const file = new File([card.blob], 'class-of-27-scorecard.png', { type: 'image/png' });

  if (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file] });
      return { kind: 'shared', captionCopied };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { kind: 'cancelled' };
      }
      // Fall through to the download.
    }
  }

  try {
    const url = URL.createObjectURL(card.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'class-of-27-scorecard.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { kind: 'downloaded', captionCopied };
  } catch {
    return { kind: 'failed' };
  }
}

export function shareHint(outcome: ShareOutcome): string {
  switch (outcome.kind) {
    case 'shared':
      return outcome.captionCopied
        ? 'Caption copied — paste it into the message box before sending.'
        : '';
    case 'downloaded':
      return outcome.captionCopied
        ? 'Image saved and caption copied — attach the image, then paste the caption.'
        : 'Image saved — attach it to your message.';
    case 'failed':
      return 'Couldn’t create the scorecard on this device.';
    case 'cancelled':
      return '';
  }
}

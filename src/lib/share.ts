import { generateScorecard, type ScorecardInput } from './scorecard';
import { CHALLENGE_NAME } from '../flow/branding';

export type ShareOutcome =
  | { kind: 'shared' }
  | { kind: 'downloaded' }
  | { kind: 'cancelled' }
  | { kind: 'failed' };

/**
 * Where this game lives, read from the page rather than hardcoded so it stays
 * correct if the app moves host. Includes the path, because GitHub Pages
 * serves it under /<repo>/ and the origin alone would 404.
 */
export function gameLink(): string {
  const { origin, pathname } = window.location;
  const path = pathname.replace(/index\.html$/, '');
  return (origin + path).replace(/\/+$/, '') + '/';
}

/**
 * The caption that travels with the scorecard. Deliberately short: the Class
 * of '27 pitch is sent separately as a WhatsApp message after the round, so
 * this one only has to make a friend want to play.
 */
export function buildShareCaption(input: ScorecardInput): string {
  return [
    `Hey ${input.playerName}`,
    `You scored ${input.solved}/${input.total} in ${input.timeLabel}!`,
    '',
    'The game was just to showcase a glimpse of how NEET PG questions are evolving: clinical, image-based, and multi-step.',
    '',
    'Try it yourself',
    gameLink(),
  ].join('\n');
}

/**
 * One tap: hands the image and the caption to the share sheet together.
 *
 * Note for anyone debugging this: what a target does with the payload is up
 * to the target, and they disagree. iOS hands the share sheet two separate
 * items, the image and the caption, and each app decides which it accepts.
 * iMessage takes both. WhatsApp takes the image and drops the text. Slack is
 * unreliable with the combination. The page is never told which app was
 * picked, so there is no way to send one of them a different payload.
 *
 * The previous copy-to-clipboard workaround was removed deliberately; the
 * paste step cost more than the occasional lost caption.
 */
export async function shareScorecard(input: ScorecardInput): Promise<ShareOutcome> {
  const card = await generateScorecard(input);
  if (!card) return { kind: 'failed' };

  // Name and MIME must agree with what was actually encoded, or a share
  // target may reject the file as an unrecognised type.
  const extension = card.format === 'image/png' ? 'png' : 'jpg';
  const file = new File([card.blob], `class-of-27-scorecard.${extension}`, {
    type: card.format,
  });
  const payload = {
    files: [file],
    text: buildShareCaption(input),
    title: CHALLENGE_NAME,
  };

  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    // Prefer image + text; fall back to the image alone if the platform
    // refuses the combination outright.
    const send = navigator.canShare(payload)
      ? payload
      : navigator.canShare({ files: [file] })
        ? { files: [file] }
        : null;

    if (send) {
      try {
        await navigator.share(send);
        return { kind: 'shared' };
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return { kind: 'cancelled' };
        }
        // Fall through to the download.
      }
    }
  }

  // Desktop browsers with no share sheet: save the image instead.
  try {
    const url = URL.createObjectURL(card.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { kind: 'downloaded' };
  } catch {
    return { kind: 'failed' };
  }
}

export function shareHint(outcome: ShareOutcome): string {
  switch (outcome.kind) {
    case 'downloaded':
      return 'Scorecard saved to your downloads.';
    case 'failed':
      return 'Couldn’t create the scorecard on this device.';
    case 'shared':
    case 'cancelled':
      return '';
  }
}

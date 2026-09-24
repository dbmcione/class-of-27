import { useId, useState, type FormEvent } from 'react';
import { isValidPhone, normalisePhone } from '../lib/phone';
import { lookupPlayer } from '../lib/players';
import { CHALLENGE_TITLE, CHALLENGE_DESCRIPTION } from '../flow/branding';
import type { Session } from '../flow/session';


type Props = {
  /** A known number with a finished intake goes straight to the game. */
  onReturning: (session: Session) => void;
  /** A new number, or one that never finished the intake. */
  onNew: (phone: string, existingPlayerId?: string) => void;
};

export function LandingScreen({ onReturning, onNew }: Props) {
  const phoneId = useId();

  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [checking, setChecking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const phoneIsValid = isValidPhone(phone);
  const showPhoneError = touched && phone.length > 0 && !phoneIsValid;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!phoneIsValid || checking) return;

    setChecking(true);
    setFormError(null);
    const clean = normalisePhone(phone);
    const result = await lookupPlayer(clean);
    setChecking(false);

    if (result.kind === 'failed') {
      setFormError('We couldn’t reach the server. Please try again.');
      return;
    }
    if (result.kind === 'returning') {
      onReturning(result.session);
      return;
    }
    onNew(clean, result.kind === 'incomplete' ? result.playerId : undefined);
  }

  return (
    <div className="screen">
      <h1 className="challenge-title">{CHALLENGE_TITLE}</h1>
      <p className="sub">{CHALLENGE_DESCRIPTION}</p>

      <form className="form landing-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={phoneId}>Mobile Number</label>
          <div className="ombre-field" data-invalid={showPhoneError}>
            <div className="ombre-inner">
              <span className="phone-prefix" aria-hidden="true">
                +91
              </span>
              <input
                id={phoneId}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="10 digit number"
                value={phone}
                aria-invalid={showPhoneError}
                aria-describedby={showPhoneError ? `${phoneId}-error` : undefined}
                onChange={(e) => setPhone(normalisePhone(e.target.value).slice(0, 10))}
                onBlur={() => setTouched(true)}
              />
            </div>
          </div>
          <p className="field-error" id={`${phoneId}-error`} role="alert">
            {showPhoneError ? 'Enter a valid 10 digit mobile number.' : ''}
          </p>
        </div>

        {formError !== null && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <button className="btn" type="submit" disabled={!phoneIsValid || checking}>
          {checking ? 'Checking…' : 'Start'}
        </button>
      </form>
    </div>
  );
}

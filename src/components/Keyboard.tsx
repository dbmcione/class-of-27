import { KEYBOARD_ROWS } from '../flow/puzzle';

export type KeyState = 'unused' | 'correct' | 'wrong';

export function Keyboard({
  stateFor,
  disabled,
  onPress,
}: {
  stateFor: (letter: string) => KeyState;
  disabled: boolean;
  onPress: (letter: string) => void;
}) {
  return (
    <div className="keyboard" role="group" aria-label="Letter keyboard">
      {KEYBOARD_ROWS.map((row) => (
        <div className="kb-row" key={row}>
          {[...row].map((letter) => {
            const state = stateFor(letter);
            return (
              <button
                key={letter}
                type="button"
                className={`key is-${state}`}
                disabled={disabled || state !== 'unused'}
                onClick={() => onPress(letter)}
              >
                {letter}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

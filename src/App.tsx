import { useEffect, useState } from 'react';
import logoUrl from './assets/logo.png';
import { LandingScreen } from './screens/LandingScreen';
import { IntakeScreen } from './screens/IntakeScreen';
import { TransitionScreen } from './screens/TransitionScreen';
import { PuzzleScreen } from './screens/PuzzleScreen';
import { ScoreScreen } from './screens/ScoreScreen';
import { RevealScreen } from './screens/RevealScreen';
import { PlayAnswersScreen } from './screens/PlayAnswersScreen';
import { playCodeFromUrl } from './lib/play';
import { saveRound, summarise, type SaveResult } from './lib/scores';
import { loadSeen, recordServed, resetSeen } from './lib/seen';
import { loadActiveRound, saveActiveRound, clearActiveRound } from './lib/activeRound';
import { selectRound, type PuzzleProgress, type PuzzleResult } from './flow/round';
import { PUZZLE_BANK, type Puzzle } from './flow/bank';
import { nextStep, type Step } from './flow/steps';
import type { Session } from './flow/session';

export function App() {
  /**
   * A /a/<code> address is a shared answers page, not the game. Read once on
   * mount: nothing in the app navigates, so it cannot change underneath us.
   */
  const [playCode] = useState(() => playCodeFromUrl());

  const [step, setStep] = useState<Step>('landing');
  const [phone, setPhone] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [round, setRound] = useState<readonly Puzzle[]>([]);
  /** Where a saved-and-resumed round should pick back up, if any. */
  const [resume, setResume] = useState<PuzzleProgress | undefined>(undefined);
  const [results, setResults] = useState<readonly PuzzleResult[]>([]);
  // Bumped to draw a fresh round when the player goes again.
  const [roundKey, setRoundKey] = useState(0);
  /**
   * The in-flight write of this round's score. The score screen waits on it
   * before loading the leaderboard, otherwise it reads the board before the
   * player's own row has landed and reports "no scores yet".
   */
  const [pendingSave, setPendingSave] = useState<Promise<SaveResult> | null>(null);

  function advance() {
    setStep((s) => nextStep(s));
  }

  const playerId = session?.playerId;

  /**
   * Draw the round as soon as the player is registered, so the puzzle screen
   * never waits on a fetch. Recorded as served straight away — a student who
   * abandons midway should still not be shown the same five next time.
   *
   * A round already in progress on this device is resumed instead of drawing
   * a fresh one — that's the whole point of saving it. A freshly-drawn round
   * is saved immediately, before a single guess is made, so even a reload
   * before answering anything still resumes the same five in the same order
   * rather than losing the round entirely.
   */
  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;

    void (async () => {
      const active = loadActiveRound(playerId);
      if (active) {
        const restored = active.puzzleIds
          .map((id) => PUZZLE_BANK.find((p) => p.id === id))
          .filter((p): p is Puzzle => p !== undefined);
        // Every id still resolves — nothing was renamed or removed since this
        // was saved — so it's safe to resume rather than draw a fresh round.
        if (restored.length === active.puzzleIds.length) {
          if (cancelled) return;
          setRound(restored);
          setResume(active);
          setStep('puzzle');
          return;
        }
        clearActiveRound(playerId);
      }

      const seen = await loadSeen(playerId);
      const selection = selectRound(seen);
      if (cancelled) return;

      setRound(selection.puzzles);
      setResume(undefined);
      saveActiveRound(playerId, {
        puzzleIds: selection.puzzles.map((p) => p.id),
        index: 0,
        results: [],
        guessed: [],
        wrong: [],
        elapsed: 0,
      });
      if (selection.cycled) await resetSeen(playerId);
      await recordServed(
        playerId,
        selection.puzzles.map((p) => p.id),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [playerId, roundKey]);

  if (playCode) {
    return (
      <div className="device">
        <header className="topbar">
          <img className="topbar-logo" src={logoUrl} alt="DBMCI" />
        </header>
        <PlayAnswersScreen code={playCode} />
      </div>
    );
  }

  return (
    <div className="device">
      <header className="topbar">
        <img className="topbar-logo" src={logoUrl} alt="DBMCI" />
      </header>

      {step === 'landing' && (
        <LandingScreen
          onReturning={(existing) => {
            // Intake is answered once; a returning player goes to the game.
            setSession(existing);
            setPhone(existing.phone);
            setStep('transition');
          }}
          onNew={(entered) => {
            setPhone(entered);
            advance();
          }}
        />
      )}

      {step === 'intake' && phone !== null && (
        <IntakeScreen
          phone={phone}
          onDone={(created) => {
            setSession(created);
            advance();
          }}
        />
      )}

      {step === 'transition' && session && (
        <TransitionScreen
          name={session.name}
          questionCount={round.length}
          ready={round.length > 0}
          onStart={advance}
        />
      )}

      {step === 'puzzle' && round.length > 0 && session && (
        <PuzzleScreen
          puzzles={round}
          resume={resume}
          onProgress={(progress) => {
            saveActiveRound(session.playerId, {
              puzzleIds: round.map((p) => p.id),
              ...progress,
            });
          }}
          onFinish={(finished) => {
            clearActiveRound(session.playerId);
            setResume(undefined);
            setResults(finished);
            setPendingSave(
              saveRound({
                playerId: session.playerId,
                collegeId: session.college.id,
                name: session.name ?? '',
                score: summarise(finished),
                results: finished,
              }),
            );
            advance();
          }}
        />
      )}

      {step === 'score' && session && (
        <ScoreScreen
          playerId={session.playerId}
          playerName={session.name ?? ''}
          college={session.college}
          score={summarise(results)}
          pendingSave={pendingSave}
          onSeeAnswers={advance}
        />
      )}

      {step === 'reveal' && (
        <RevealScreen
          puzzles={round}
          results={results}
          onPlayAgain={() => {
            setResults([]);
            setRound([]);
            setResume(undefined);
            setPendingSave(null);
            setRoundKey((k) => k + 1);
            setStep('transition');
          }}
        />
      )}
    </div>
  );
}

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
import { selectRound, type PuzzleResult } from './flow/round';
import type { Puzzle } from './flow/bank';
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
   */
  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;

    void (async () => {
      const seen = await loadSeen(playerId);
      const selection = selectRound(seen);
      if (cancelled) return;

      setRound(selection.puzzles);
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
          onFinish={(finished) => {
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
            setPendingSave(null);
            setRoundKey((k) => k + 1);
            setStep('transition');
          }}
        />
      )}
    </div>
  );
}

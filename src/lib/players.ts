import { supabase } from './supabase';
import { normalisePhone } from './phone';
import type { Session } from '../flow/session';
import type { StudyStage } from '../flow/questions';

export type RegisterResult =
  | { ok: true; playerId: string }
  | { ok: false; message: string };

const LOCAL_STORE_KEY = 'class-of-27:players';

/**
 * Registers the player and returns their id. Writes to Supabase when it is
 * configured, and to localStorage when it is not, so the rest of the flow can
 * be built before the project is connected.
 */
export async function registerPlayer(
  collegeId: string,
  phone: string,
): Promise<RegisterResult> {
  const cleanPhone = normalisePhone(phone);

  if (!supabase) {
    const playerId = `${collegeId}:${cleanPhone}`;
    try {
      const raw = window.localStorage.getItem(LOCAL_STORE_KEY);
      const store = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      store[playerId] = { collegeId, phone: cleanPhone, savedAt: new Date().toISOString() };
      window.localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(store));
    } catch {
      // Private browsing or full quota — the flow should still continue.
    }
    return { ok: true, playerId };
  }

  const { data, error } = await supabase.rpc('register_player', {
    p_college_id: collegeId,
    p_phone: cleanPhone,
  });

  if (error || !data) {
    return {
      ok: false,
      message: 'We couldn’t save your details. Please try again in a moment.',
    };
  }

  return { ok: true, playerId: data };
}

export type Intake = {
  name: string;
  stage: StudyStage;
  answers: Record<string, string>;
};

const LOCAL_INTAKE_KEY = 'class-of-27:intake';

/**
 * Saves the Quick Intro: name and stage onto the player row, and one row per
 * questionnaire answer. Failures are swallowed — a student should never be
 * blocked from playing because an optional profile write did not land.
 */
export async function saveIntake(playerId: string, intake: Intake): Promise<void> {
  if (!supabase) {
    try {
      const raw = window.localStorage.getItem(LOCAL_INTAKE_KEY);
      const store = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      store[playerId] = { ...intake, savedAt: new Date().toISOString() };
      window.localStorage.setItem(LOCAL_INTAKE_KEY, JSON.stringify(store));
    } catch {
      // Private browsing or full quota.
    }
    return;
  }

  // One security definer call rather than a table upsert: PostgREST's upsert
  // needs a SELECT policy to read the conflicting row, and player_answers has
  // none by design.
  await supabase.rpc('save_intake', {
    p_player_id: playerId,
    p_name: intake.name,
    p_stage: intake.stage,
    p_answers: intake.answers,
  });
}

export type Lookup =
  | { kind: 'new' }
  | { kind: 'returning'; session: Session }
  | { kind: 'incomplete'; playerId: string }
  | { kind: 'failed' };

const LOCAL_INTAKE_KEY_READ = 'class-of-27:intake';

/**
 * Has this number played before? A returning player with a finished intake
 * skips straight to the game — their name, college, year and questionnaire
 * answers are written once and never revised.
 */
export async function lookupPlayer(phone: string): Promise<Lookup> {
  const cleanPhone = normalisePhone(phone);

  if (!supabase) {
    try {
      const players = JSON.parse(window.localStorage.getItem(LOCAL_STORE_KEY) ?? '{}');
      const hit = Object.entries(players as Record<string, { phone: string; collegeId: string }>)
        .find(([, v]) => v.phone === cleanPhone);
      if (!hit) return { kind: 'new' };
      const intake = JSON.parse(window.localStorage.getItem(LOCAL_INTAKE_KEY_READ) ?? '{}');
      const saved = intake[hit[0]];
      if (!saved) return { kind: 'incomplete', playerId: hit[0] };
      return {
        kind: 'returning',
        session: {
          playerId: hit[0],
          phone: cleanPhone,
          name: saved.name,
          stage: saved.stage,
          college: { id: hit[1].collegeId, name: hit[1].collegeId, state: null, country: 'IN' },
        },
      };
    } catch {
      return { kind: 'new' };
    }
  }

  const { data, error } = await supabase.rpc('lookup_player', { p_phone: cleanPhone });
  if (error) return { kind: 'failed' };

  const row = data?.[0];
  if (!row) return { kind: 'new' };
  if (!row.intake_complete) return { kind: 'incomplete', playerId: row.player_id };

  return {
    kind: 'returning',
    session: {
      playerId: row.player_id,
      phone: cleanPhone,
      name: row.display_name,
      college: { id: row.college_id, name: row.college_name, state: null, country: 'IN' },
    },
  };
}

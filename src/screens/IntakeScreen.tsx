import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { SelectField } from '../components/SelectField';
import { QuestionMatrix } from '../components/QuestionMatrix';
import { QUESTIONS, STUDY_STAGES, type StudyStage } from '../flow/questions';
import { collegeLocation, fetchColleges, type College } from '../lib/colleges';
import { registerPlayer } from '../lib/players';
import type { Session } from '../flow/session';

type Props = {
  phone: string;
  onDone: (session: Session) => void;
};

/** First step of picking a college. 'IN' is also College.country for India. */
const REGIONS = [
  { id: 'IN', label: 'India' },
  { id: 'INTL', label: 'International' },
];

export function IntakeScreen({ phone, onDone }: Props) {
  const nameId = useId();

  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [collegesFailed, setCollegesFailed] = useState(false);
  const [region, setRegion] = useState('');
  const [stateName, setStateName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [name, setName] = useState('');
  const [stage, setStage] = useState<StudyStage>();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchColleges().then((result) => {
      if (cancelled) return;
      setColleges(result.colleges);
      setCollegesFailed(result.failed);
      setLoadingColleges(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const states = useMemo(
    () =>
      [
        ...new Set(
          colleges.flatMap((c) => (c.country === 'IN' && c.state ? [c.state] : [])),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [colleges],
  );

  // Already sorted by name: fetchColleges orders the query.
  const collegeOptions = useMemo(() => {
    if (region === 'IN') {
      return colleges
        .filter((c) => c.country === 'IN' && c.state === stateName)
        .map((c) => ({ id: c.id, label: c.name }));
    }
    if (region === 'INTL') {
      // Grouped by country, A–Z, then by name within each country. The sort
      // is stable, so the name order from the query survives inside a group.
      return colleges
        .filter((c) => c.country !== 'IN')
        .map((c) => ({ id: c.id, label: c.name, meta: collegeLocation(c) }))
        .sort((a, b) => (a.meta ?? '').localeCompare(b.meta ?? ''));
    }
    return [];
  }, [colleges, region, stateName]);

  const showCollegeList = region === 'INTL' || (region === 'IN' && stateName !== '');

  const unanswered = useMemo(
    () => QUESTIONS.filter((q) => answers[q.key] === undefined),
    [answers],
  );

  const collegeMissing = collegeId === '';
  const nameMissing = name.trim() === '';
  const stageMissing = stage === undefined;
  const complete =
    !collegeMissing && !nameMissing && !stageMissing && unanswered.length === 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!complete || submitting) {
      setShowErrors(true);
      const target = collegeMissing
        ? document.getElementById('college-field')
        : nameMissing
          ? document.getElementById(nameId)
          : stageMissing
            ? document.getElementById('stage-field')
            : document.querySelector(`[data-question="${unanswered[0]?.key}"]`);
      target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setFormError(null);

    // Registration happens here, not on the landing screen, because it needs
    // the college and the phone together. register_player upserts on phone, so
    // a number that registered but abandoned the intake reuses its own row.
    const intake = { name: name.trim(), stage, answers };
    const registration = await registerPlayer(collegeId, phone, intake);
    if (!registration.ok) {
      setFormError(registration.message);
      setSubmitting(false);
      return;
    }

    const college = colleges.find((c) => c.id === collegeId);
    if (!college) {
      setFormError('Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    onDone({ playerId: registration.playerId, college, phone, ...intake });
  }

  const errorMessage = collegeMissing
    ? 'Please pick your college.'
    : nameMissing
      ? 'Please add your name.'
      : stageMissing
        ? 'Please pick what you’re currently studying.'
        : `${unanswered.length} statement${unanswered.length > 1 ? 's' : ''} left to mark.`;

  return (
    <div className="screen intake-screen">
      <h1>Quick Intro</h1>
      <p className="sub">Takes about a minute. There are no right answers.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field" id="college-field">
          <label htmlFor="college-select">Your College</label>
          <div className="field-steps">
            <SelectField
              options={REGIONS}
              value={region}
              loading={loadingColleges}
              loadingLabel="Loading colleges…"
              placeholder={collegesFailed ? 'Couldn’t load colleges' : 'India or International?'}
              onChange={(id) => {
                if (id === region) return;
                // A new region makes the state and college below it stale.
                setRegion(id);
                setStateName('');
                setCollegeId('');
              }}
            />
            {region === 'IN' && (
              <SelectField
                options={states.map((s) => ({ id: s, label: s }))}
                value={stateName}
                placeholder="Select your state"
                onChange={(s) => {
                  if (s === stateName) return;
                  setStateName(s);
                  setCollegeId('');
                }}
              />
            )}
            {showCollegeList && (
              <SelectField
                options={collegeOptions}
                value={collegeId}
                placeholder="Select your college"
                onChange={setCollegeId}
              />
            )}
          </div>
          {collegesFailed && (
            <p className="field-error" role="alert">
              We couldn’t load the college list. Check your connection and reload.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={nameId}>What’s your name?</label>
          <div className="ombre-field" data-invalid={showErrors && nameMissing}>
            <div className="ombre-inner">
              <input
                id={nameId}
                type="text"
                autoComplete="given-name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="field" id="stage-field">
          <label htmlFor="stage-select">What are you currently studying?</label>
          <SelectField
            options={STUDY_STAGES.map((s) => ({ id: s, label: s }))}
            value={stage ?? ''}
            placeholder="Select your year"
            onChange={(v) => setStage(v as StudyStage)}
          />
        </div>

        <h2 className="matrix-title">One More Step</h2>
        <p className="matrix-intro">Does this sound like you?</p>

        <QuestionMatrix
          questions={QUESTIONS}
          answers={answers}
          highlightUnanswered={showErrors}
          onAnswer={(key, answer) =>
            setAnswers((prev) => ({ ...prev, [key]: answer }))
          }
        />

        {((showErrors && !complete) || formError !== null) && (
          <p className="form-error" role="alert">
            {formError ?? errorMessage}
          </p>
        )}

        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

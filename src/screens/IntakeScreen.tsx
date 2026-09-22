import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { SelectField } from '../components/SelectField';
import { QuestionMatrix } from '../components/QuestionMatrix';
import { QUESTIONS, STUDY_STAGES, type StudyStage } from '../flow/questions';
import { collegeLocation, fetchColleges, type College } from '../lib/colleges';
import { registerPlayer, saveIntake } from '../lib/players';
import type { Session } from '../flow/session';

type Props = {
  phone: string;
  onDone: (session: Session) => void;
};

export function IntakeScreen({ phone, onDone }: Props) {
  const nameId = useId();

  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [collegesFailed, setCollegesFailed] = useState(false);
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
    const registration = await registerPlayer(collegeId, phone);
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

    const intake = { name: name.trim(), stage, answers };
    void saveIntake(registration.playerId, intake);

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
    <div className="screen">
      <h1>Quick Intro</h1>
      <p className="sub">Takes about a minute. There are no right answers.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field" id="college-field">
          <label htmlFor="college-select">Your College</label>
          <SelectField
            options={colleges.map((c) => ({
              id: c.id,
              label: c.name,
              meta: collegeLocation(c),
            }))}
            value={collegeId}
            loading={loadingColleges}
            loadingLabel="Loading colleges…"
            placeholder={
              collegesFailed ? 'Couldn’t load colleges' : 'Search your college…'
            }
            searchable
            onChange={setCollegeId}
          />
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
                placeholder="e.g. Ayesha Rao"
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

        <h2 className="matrix-title">About Your Prep</h2>
        <p className="matrix-intro">Mark each one as it applies to you.</p>

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

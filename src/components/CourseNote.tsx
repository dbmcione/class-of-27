const COURSE_URL = 'https://dbmci.com/class-of-27';

/** The Class of ’27 pitch at the foot of the answers page, after the MCQs. */
export function CourseNote() {
  return (
    <section className="score-note course-note">
      <p>
        This is how NEET PG questions look now: multi-step, clinical and a step
        beyond recall. Class of ’27 is designed to help you master this evolving
        pattern of NEET PG MCQs.
      </p>
      {/* New tab so the answers page is still there to come back to. No
          noreferrer, so dbmci.com can see the visit came from the game. */}
      <a className="btn secondary" href={COURSE_URL} target="_blank" rel="noopener">
        Know more about Class of ’27
      </a>
    </section>
  );
}

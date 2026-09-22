import type { Puzzle } from './bank';

/**
 * TEMPORARY: the five NEET PG 2026 recall questions, served as every new
 * player's first round.
 *
 * These are real recalls supplied by the team, not drafted filler, so unlike
 * PUZZLE_BANK the stems, options and keys here are reproduced as given. The
 * clues are the only written-from-scratch part: the source sheet left the
 * hangman hint column blank.
 *
 * This whole file is meant to be deleted once the full question list arrives.
 * Nothing else imports it except `selectRound`, and the ids are prefixed
 * `recall-` so they can never collide with a bank id: two of these diagnoses
 * (fibromuscular dysplasia, aortic dissection) already exist as filler.
 *
 * ⚠️ One item needs a decision before students see it. See `recall-abdominal-
 * compartment-syndrome` below.
 */
export const FIRST_ROUND_BANK: readonly Puzzle[] = [
  {
    id: 'recall-fibromuscular-dysplasia',
    clue: 'A young woman with severe hypertension whose renal artery shows a "string of beads", alternating stenosis and dilatation.',
    answer: 'FIBROMUSCULAR DYSPLASIA',
    explanation:
      'A non-atherosclerotic, non-inflammatory disease of the arterial wall causing stenosis, aneurysm, dissection or tortuosity of medium-sized arteries, most often the renal and carotid arteries. Severe hypertension in a 23-year-old with normal renal function and a clean urinalysis points away from renal parenchymal disease and towards a secondary, correctable cause. The "string of beads" on CT angiography is the giveaway: in a young woman that is fibromuscular dysplasia, not atherosclerotic stenosis. Because the hypertension is driven by a correctable renal artery lesion, percutaneous renal angioplasty is the definitive treatment. Stenting is reserved for angioplasty failure or dissection, and surgery for complex or aneurysmal disease.',
    mcq: {
      stem: 'A 23-year-old woman presents with a 6-month history of recurrent, severe headaches. The headaches are partially relieved by occasional analgesics but have progressively increased in frequency and severity. On examination, her blood pressure is 220/110 mmHg. Cardiovascular examination is unremarkable. Laboratory investigations reveal normal serum creatinine, normal serum electrolytes and normal urinalysis, with no significant proteinuria. CT angiography of the renal arteries shows a "string of beads" appearance. What is the most appropriate definitive treatment for this patient?',
      options: [
        'Renal artery stenting',
        'Percutaneous renal angioplasty',
        'Surgical revascularisation',
        'ACE inhibitor therapy alone',
      ],
      correctIndex: 1,
    },
    tags: ['Clinical vignette', 'Image-based', 'Management', 'Low base-rate'],
  },
  {
    id: 'recall-primary-hyperaldosteronism',
    clue: 'Hypertension with low potassium and a metabolic alkalosis, high aldosterone and suppressed renin.',
    answer: 'PRIMARY HYPERALDOSTERONISM',
    explanation:
      'Autonomous secretion of aldosterone independent of renin. The excess aldosterone holds on to sodium and water while dumping potassium and hydrogen ions, which is why the trio is hypertension, hypokalaemia and metabolic alkalosis. A high aldosterone with suppressed renin and a markedly raised aldosterone-to-renin ratio makes the diagnosis, and the positive saline loading test confirms the secretion is autonomous. CT of the abdomen comes first to look for an adrenal mass, but CT alone cannot say whether the aldosterone is coming from one gland or both. When surgery is on the table, adrenal vein sampling establishes laterality and decides whether a unilateral adrenalectomy will help. Biopsy is not routine and answers a different question entirely.',
    mcq: {
      stem: 'A 40-year-old hypertensive was found to have hypokalemia and metabolic alkalosis. He was evaluated for primary hyperaldosteronism and was found to have high aldosterone and low renin. The aldosterone renin ratio is >210. Saline loading test is positive. Which of the following is the next step in the further management of this patient?',
      options: [
        'CT abdomen with adrenal biopsy',
        'Adrenal vein sampling',
        'MRI abdomen',
        'MIBG',
      ],
      correctIndex: 1,
    },
    tags: ['Clinical vignette', 'Multi-step', 'Endocrine', 'Sequence-critical'],
  },
  {
    id: 'recall-aortic-dissection',
    clue: 'Sudden tearing chest pain going through to between the shoulder blades, unequal arm blood pressures, a widened mediastinum.',
    answer: 'AORTIC DISSECTION',
    explanation:
      'A tear in the aortic intima lets blood into the media, splitting the layers of the wall and creating a false lumen. Poorly controlled hypertension, sudden severe chest pain radiating between the shoulder blades, a blood pressure difference between the arms and a widened mediastinum together make this the diagnosis to exclude first. In a haemodynamically stable patient, contrast-enhanced CT angiography of the chest is the investigation of choice: it is fast and shows both the dissection and how far it extends. Normal creatinine and no iodinated contrast allergy remove the usual reasons to avoid it. Transoesophageal echocardiography is the alternative when the patient is too unstable to travel or CT is not possible.',
    mcq: {
      stem: 'A 68-year-old man with poorly controlled hypertension presents to the emergency department with sudden-onset, severe chest pain radiating to the interscapular region. On examination, blood pressure in the right arm is 180/95 mmHg and in the left arm 150/90 mmHg, pulse rate 110/min, respiratory rate 29/min, SpO2 98% on room air. A chest X-ray demonstrates widening of the mediastinum. ECG shows sinus tachycardia without ischemic changes. Serum creatinine is 0.9 mg/dl and there is no known drug allergy to iodinated dye. What is the most appropriate investigation to confirm the diagnosis in this patient?',
      options: [
        'Contrast-enhanced CT angiography of chest',
        'Ventilation-perfusion scan',
        'Transthoracic echocardiography',
        'Coronary angiography',
      ],
      correctIndex: 0,
    },
    tags: ['Clinical vignette', 'Time-critical', 'Investigation of choice', 'Multi-step'],
  },
  {
    id: 'recall-vestibular-schwannoma',
    clue: 'One-sided sensorineural hearing loss with tinnitus, plus numbness of the posterosuperior ear canal (Hitselberger sign).',
    answer: 'VESTIBULAR SCHWANNOMA',
    explanation:
      'A benign, slow-growing Schwann cell tumour of the vestibular part of the eighth nerve. Progressive one-sided sensorineural hearing loss with tinnitus is retrocochlear until proven otherwise, and reduced sensation over the posterosuperior external auditory canal points at the nerve and the cerebellopontine angle around it. Gadolinium-enhanced MRI of the cerebellopontine angle is the investigation of choice because the diagnosis needs the mass to be seen: it images the internal auditory canal well enough to pick up even small intracanalicular tumours. Pure-tone audiometry and BERA can show that the lesion is sensorineural or retrocochlear but cannot show the tumour, and high-resolution CT gives good bone detail while missing small ones.',
    mcq: {
      stem: 'A 38-year-old woman presents with a progressive unilateral sensorineural hearing loss associated with intermittent tinnitus. She also reports decreased sensation over the posterosuperior aspect of the auditory canal. There is no history of head trauma. Which of the following is the most appropriate investigation to establish the diagnosis?',
      options: [
        'Pure-tone audiometry',
        'Brainstem evoked response audiometry (BERA)',
        'Gadolinium-enhanced MRI of the cerebellopontine angle',
        'High-resolution CT of the temporal bones without contrast',
      ],
      correctIndex: 2,
    },
    tags: ['Clinical vignette', 'Investigation of choice', 'Anatomy-linked', 'Differentiation'],
  },
  {
    /**
     * ⚠️ The source sheet lists the diagnosis as abdominal compartment
     * syndrome, but its stem, options and explanation are about damage
     * control orthopaedics and never mention raised intra-abdominal
     * pressure. The "London sign" in the stem is not a sign I can verify.
     * Reproduced exactly as supplied. Flagged for the team, not silently
     * rewritten, because guessing at the intent of a recall is how a wrong
     * key gets taught as fact.
     */
    id: 'recall-abdominal-compartment-syndrome',
    clue: 'Intra-abdominal pressure above 20 mmHg after major trauma, with new organ dysfunction to go with it.',
    answer: 'ABDOMINAL COMPARTMENT SYNDROME',
    explanation:
      'Intra-abdominal pressure that stays above 20 mmHg together with new organ dysfunction or failure. In this polytrauma patient the bilateral femur and tibia fractures carry a large hidden blood loss, and the hypotension says the physiology is already failing. That makes damage control orthopaedics the approach: stabilise the fractures quickly and temporarily rather than spending hours on definitive fixation while the patient is unstable. So after haemodynamic stabilisation, external fixation of both the femur and the tibia is the right next step, with nailing or plating deferred until the patient can tolerate it.',
    mcq: {
      stem: 'A patient is brought to the emergency department following an RTA. He has sustained bilateral fracture of both the femur and tibia. On examination, he is hypotensive, London sign is positive in the right flank. Which of the following is the next best step in management after hemodynamic stabilisation?',
      options: [
        'External fixation of femur and nailing of tibia plating',
        'External fixation of tibia and nailing of femur',
        'External fixation of both femur and tibia',
        "Nailing or plating based on the surgeon's experience, whichever saves time",
      ],
      correctIndex: 2,
    },
    tags: ['Clinical vignette', 'Time-critical', 'Management', 'Multi-step'],
  },
];

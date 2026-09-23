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
    definition:'Fibromuscular dysplasia (FMD) is a non-atherosclerotic, non-inflammatory disease of the arterial wall that causes stenosis, aneurysm, dissection or tortuosity of medium-sized arteries, most commonly the renal and carotid arteries.',
    explanation:
      'A 23-year-old woman with severe hypertension (220/110 mmHg) despite normal renal function and no significant urinary abnormalities should raise suspicion for a secondary cause, particularly renovascular hypertension.\n\n' +
      'CT angiography shows the characteristic “string-of-beads” appearance of the renal artery, alternating stenosis and dilatation which in a young woman, strongly suggests renal artery fibromuscular dysplasia (FMD) rather than atherosclerotic stenosis.\n\n' +
      'As the hypertension is caused by a correctable renal artery lesion, percutaneous renal angioplasty is the preferred definitive treatment.',
    mcq: {
      stem: 'A 23-year-old woman presents with a 6-month history of recurrent, severe headaches. The headaches are partially relieved by occasional analgesics but have progressively increased in frequency and severity. On examination, her blood pressure is 220/110 mmHg. Cardiovascular examination is unremarkable. Laboratory investigations reveal normal serum creatinine, normal serum electrolytes and normal urinalysis, with no significant proteinuria. CT angiography of the renal arteries shows a “string-of-beads” appearance. What is the most appropriate definitive treatment for this patient?',
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
    definition:'Primary aldosteronism is a condition characterized by autonomous, inappropriate secretion of aldosterone from the adrenal glands, independent of renin regulation. Excess aldosterone causes sodium and water retention with potassium and hydrogen ion loss, leading to hypertension, hypokalemia and metabolic alkalosis.',
    explanation:
      'Hypertension with hypokalemia and metabolic alkalosis suggests mineralocorticoid excess. High aldosterone, suppressed renin and a markedly elevated aldosterone renin ratio suggest primary hyperaldosteronism. The positive saline loading test confirms autonomous aldosterone secretion.\n\n' +
      'Once primary hyperaldosteronism is confirmed, CT abdomen is performed first to evaluate the adrenal glands for structural abnormalities and identify any adrenal mass. However, CT alone cannot reliably determine whether aldosterone excess is coming from one adrenal gland or both.\n\n' +
      'Therefore, when the patient is being considered for potentially curative surgery, adrenal vein sampling (AVS) is performed to establish the functional laterality of aldosterone secretion and guide the decision regarding unilateral adrenalectomy.\n\n' +
      'Although CT is appropriate for initial adrenal imaging, biopsy is not routinely indicated and does not establish functional laterality.',
    mcq: {
      stem: 'A 40-year-old hypertensive was found to have hypokalemia and metabolic alkalosis. He was evaluated for primary hyperaldosteronism and was found to have high aldosterone and low renin. The aldosterone renin ratio is >210. Saline loading test is positive. Which of the following is the next step in the further management of this patient?',
      options: [
        'CT abdomen with adrenal biopsy',
        'Adrenal Vein sampling',
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
    definition:'Aortic dissection is a condition in which a tear in the aortic intima allows blood to enter the aortic media, causing separation of the layers of the aortic wall and formation of a false lumen.',
    explanation:
      'A 68-year-old man with poorly controlled hypertension and sudden severe chest pain radiating to the interscapular region raises strong suspicion for acute aortic dissection. The inter-arm blood pressure difference further supports this, while a widened mediastinum on chest X-ray provides an important radiological clue.\n\n' +
      'In a hemodynamically stable patient, contrast-enhanced CT angiography of the chest is the preferred investigation because it rapidly provides detailed visualization of the aorta and the extent of dissection. Normal renal function and no known iodinated contrast allergy further support its use.\n\n' +
      'TEE is preferred when echocardiographic imaging is required in a hemodynamically unstable patient or when CT angiography cannot be performed, as it provides better visualization of the thoracic aorta.',
    mcq: {
      stem: 'A 68-year-old man with poorly controlled hypertension presents to the emergency department with sudden-onset, severe chest pain radiating to the interscapular region. On examination, blood pressure in the right arm - 180/95 mmHg and left arm - 150/90 mmHg and pulse rate - 110/min, respiratory rate - 29/min, SpO2 - 98% on room air. A chest X-ray demonstrates widening of the mediastinum. ECG shows sinus tachycardia without ischemic changes. Serum creatinine is 0.9 mg/dl and there is no known drug allergy to iodinated dye. What is the most appropriate investigation to confirm the diagnosis in this patient?',
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
    definition:'Vestibular schwannoma is a benign, usually slow-growing Schwann-cell tumour arising from the vestibular portion of the vestibulocochlear nerve (CN VIII), typically presenting with unilateral hearing loss, tinnitus and vestibular symptoms.',
    explanation:
      'A 38-year-old woman with progressive unilateral sensorineural hearing loss and intermittent tinnitus raises suspicion for a retrocochlear lesion, particularly vestibular schwannoma. The decreased sensation over the posterosuperior external auditory canal further supports involvement of the vestibulocochlear nerve and adjacent cerebellopontine-angle structures.\n\n' +
      'With these findings suggesting a cerebellopontine-angle lesion, gadolinium-enhanced MRI of the cerebellopontine angle is the investigation of choice because it provides excellent visualization of the internal auditory canal and cerebellopontine-angle region and can detect even small vestibular schwannomas.\n\n' +
      'Therefore, contrast-enhanced MRI is preferred over physiological hearing tests or CT, as the diagnosis requires direct visualization and assessment of the retrocochlear mass. Pure-tone audiometry and BERA can establish or suggest sensorineural/retrocochlear pathology but cannot visualize the tumor, while high-resolution CT provides good bony detail but is less sensitive for small, particularly intracanalicular, vestibular schwannomas.',
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
    definition:'Abdominal compartment syndrome (ACS) is a condition in which intra-abdominal pressure (IAP) rises persistently to >20 mmHg and is associated with new-onset organ dysfunction or failure.',
    explanation:
      'A patient with polytrauma and bilateral femur and tibia fractures is at high risk of major blood loss and systemic physiological stress. Hypotension indicates physiological instability, making damage-control orthopedics (DCO) the preferred approach: rapid, temporary fracture stabilization while minimizing operative time and additional physiological stress.\n\n' +
      'Therefore, after hemodynamic stabilization, external fixation of both femur and tibia is appropriate. Definitive fixation with nailing or plating can be performed later once the patient is physiologically stable.',
    mcq: {
      stem: 'A patient is brought to the emergency department following an RTA. He has sustained bilateral fracture of both the femur and tibia. On examination, he is hypotensive, London sign is positive in the right flank. Which of the following is the next best step in management after hemodynamic stabilisation?',
      options: [
        'External fixation of femur and nailing of tibia plating',
        'External fixation of tibia and nailing of femur',
        'External fixation of both femur and tibia',
        'Nailing or plating based on the surgeon\'s experience, whichever saves time',
      ],
      correctIndex: 2,
    },
    tags: ['Clinical vignette', 'Time-critical', 'Management', 'Multi-step'],
  },
];

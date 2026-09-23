import fmdCtaUrl from '../assets/puzzles/fibromuscular-dysplasia-cta.jpg';

/**
 * The puzzle bank.
 *
 * Every field here is verbatim from "Final sheet for activity.xlsx", the
 * team's source of truth, apart from the answer keys. The sheet has no column
 * for them: four were carried over from the earlier recall sheet, which did
 * mark them, and the fifth is flagged inline below.
 *
 * Ids are stable. Changing one loses the record of which students have
 * already been shown that puzzle.
 */
export type Mcq = {
  stem: string;
  options: readonly string[];
  /** Index into `options`. */
  correctIndex: number;
};

/** A figure the stem refers to. Shown with the question on the answers page. */
export type PuzzleImage = {
  /** Imported asset URL, so the build fingerprints and serves it. */
  src: string;
  /** Described for a student who cannot see it, not just labelled. */
  alt: string;
  /**
   * Intrinsic pixel size. Not for layout, which is fluid: it reserves the
   * right height before the file arrives. The card scrolls itself into view
   * as it opens, and an image that lands afterwards would shove everything
   * below it down past the position just scrolled to.
   */
  width: number;
  height: number;
};

export type Puzzle = {
  id: string;
  clue: string;
  /** Upper case. Spaces separate words; only A-Z are guessable. */
  answer: string;
  /** What the condition is. Opens the reveal card, above the question. */
  definition: string;
  /** Why the question was hard. One line per reason, closes the card. */
  tough: readonly string[];
  mcq: Mcq;
  /** Only where the stem refers to one. */
  image?: PuzzleImage;
};

export const PUZZLE_BANK: readonly Puzzle[] = [
  {
    id: 'fibromuscular-dysplasia',
    clue:
      'A young woman presents with hypertension. CT angiography of the renal ' +
      'arteries shows a classic “string-of-beads” appearance due to alternating ' +
      'stenosis and dilatation.',
    answer: 'FIBROMUSCULAR DYSPLASIA',
    definition:
      'Fibromuscular dysplasia (FMD) is a non-atherosclerotic, non-inflammatory ' +
      'disease of the arterial wall that causes stenosis, aneurysm, dissection or ' +
      'tortuosity of medium-sized arteries, most commonly the renal and carotid ' +
      'arteries.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before selecting the ' +
      'definitive treatment.',
      'Integrated between subjects: Medicine and Radiology',
      'Image based',
      'Clinical scenario',
    ],
    image: {
      src: fmdCtaUrl,
      width: 444,
      height: 400,
      alt:
        'Axial CT angiogram of the abdomen at the level of the kidneys. The ' +
        'aorta is opacified centrally with the renal arteries branching to ' +
        'each side, showing alternating narrowing and dilatation along their ' +
        'length, the string of beads appearance.',
    },
    mcq: {
      stem:
        'A 23-year-old woman presents with a 6-month history of recurrent, severe ' +
        'headaches. The headaches are partially relieved by occasional analgesics but ' +
        'have progressively increased in frequency and severity. On examination, her ' +
        'blood pressure is 220/110 mmHg. Cardiovascular examination is unremarkable. ' +
        'Laboratory investigations reveal normal serum creatinine, normal serum ' +
        'electrolytes and normal urinalysis, with no significant proteinuria. CT ' +
        'angiography is shown below. What is the most appropriate definitive ' +
        'treatment for this patient?',
      options: [
        'Renal artery stenting',
        'Percutaneous renal angioplasty',
        'Surgical revascularisation',
        'ACE inhibitor therapy alone',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'primary-hyperaldosteronism',
    clue:
      'A young patient presents with resistant hypertension and muscle weakness. ' +
      'Investigations reveal hypokalemia, elevated aldosterone, suppressed renin, ' +
      'and a markedly increased aldosterone–renin ratio.',
    answer: 'PRIMARY HYPERALDOSTERONISM',
    definition:
      'Primary aldosteronism is a condition characterized by autonomous, ' +
      'inappropriate secretion of aldosterone from the adrenal glands, independent ' +
      'of renin regulation. Excess aldosterone causes sodium and water retention ' +
      'with potassium and hydrogen ion loss, leading to hypertension, hypokalemia ' +
      'and metabolic alkalosis.',
    tough: [
      'Integrated between subjects: Medicine and Radiology',
      'Clinical decision making: The patient has confirmed primary ' +
      'hyperaldosteronism. The next step is to determine whether the excess ' +
      'aldosterone is unilateral or bilateral, which is done by adrenal vein ' +
      'sampling. Although CT is performed before AVS, Option A is incorrect ' +
      'because it includes adrenal biopsy and biopsy is not routinely done ' +
      'before establishing lateralization.',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A 40-year-old hypertensive was found to have hypokalemia and metabolic ' +
        'alkalosis. He was evaluated for primary hyperaldosteronism and was found to ' +
        'have high aldosterone and low renin. The aldosterone renin ratio is >210. ' +
        'Saline loading test is positive. Which of the following is the next step in ' +
        'the further management of this patient?',
      options: [
        'CT abdomen with adrenal biopsy',
        'Adrenal Vein sampling',
        'MRI abdomen',
        'MIBG',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'aortic-dissection',
    clue:
      'A patient presents with sudden-onset tearing chest pain radiating to the ' +
      'back, with unequal blood pressure between the arms.',
    answer: 'AORTIC DISSECTION',
    definition:
      'Aortic dissection is a condition in which a tear in the aortic intima allows ' +
      'blood to enter the aortic media, causing separation of the layers of the ' +
      'aortic wall and formation of a false lumen.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before choosing the ' +
      'confirmatory investigation.',
      'Integrated between subjects: Medicine and Radiology',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A 68-year-old man with poorly controlled hypertension presents to the ' +
        'emergency department with sudden-onset, severe chest pain radiating to the ' +
        'interscapular region. On examination, blood pressure in the right arm - ' +
        '180/95 mmHg and left arm - 150/90 mmHg and pulse rate - 110/min, respiratory ' +
        'rate - 29/min, SpO2 - 98% on room air. A chest X-ray demonstrates widening ' +
        'of the mediastinum. ECG shows sinus tachycardia without ischemic changes. ' +
        'Serum creatinine is 0.9 mg/dl and there is no known drug allergy to ' +
        'iodinated dye. What is the most appropriate investigation to confirm the ' +
        'diagnosis in this patient?',
      options: [
        'Contrast-enhanced CT angiography of chest',
        'Ventilation-perfusion scan',
        'Transthoracic echocardiography',
        'Coronary angiography',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'vestibular-schwannoma',
    clue:
      'A patient presents with progressive unilateral hearing loss, tinnitus, and ' +
      'imbalance. MRI shows a cerebellopontine angle mass.',
    answer: 'VESTIBULAR SCHWANNOMA',
    definition:
      'Vestibular schwannoma is a benign, usually slow-growing Schwann-cell tumour ' +
      'arising from the vestibular portion of the vestibulocochlear nerve (CN ' +
      'VIII), typically presenting with unilateral hearing loss, tinnitus and ' +
      'vestibular symptoms.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before choosing the ' +
      'investigation.',
      'Integrated between subjects: ENT and Radiology',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A 38-year-old woman presents with a progressive unilateral sensorineural ' +
        'hearing loss associated with intermittent tinnitus. She also reports ' +
        'decreased sensation over the posterosuperior aspect of the auditory canal. ' +
        'There is no history of head trauma. Which of the following is the most ' +
        'appropriate investigation to establish the diagnosis?',
      options: [
        'Pure-tone audiometry',
        'Brainstem evoked response audiometry (BERA)',
        'Gadolinium-enhanced MRI of the cerebellopontine angle',
        'High-resolution CT of the temporal bones without contrast',
      ],
      correctIndex: 2,
    },
  },
  {
    id: 'tumour-lysis-syndrome',
    clue:
      'A patient with Burkitt lymphoma develops nausea, muscle cramps, and reduced ' +
      'urine output within 24 hours of starting chemotherapy.',
    answer: 'TUMOUR LYSIS SYNDROME',
    definition:
      'Tumor lysis syndrome (TLS) is an oncological emergency caused by rapid ' +
      'destruction of tumor cells, usually following chemotherapy, resulting in the ' +
      'release of intracellular contents into the bloodstream and causing ' +
      'hyperuricemia, hyperkalemia, hyperphosphatemia, and secondary hypocalcemia, ' +
      'which may lead to acute kidney injury, cardiac arrhythmias, seizures, and ' +
      'death.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before choosing the next ' +
      'step in management.',
      'Integrated between subjects: Paediatrics and Medicine',
      'Clinical scenario',
    ],
    /**
     * ⚠️ correctIndex is NOT from the sheet. The sheet has no answer key
     * column, and unlike the other four this question did not appear on the
     * earlier recall sheet either, so there was nothing to carry over.
     * Rasburicase is the standard answer for established tumour lysis with a
     * high uric acid and a rising creatinine, but it is an inference and a
     * wrong key teaches the wrong thing. Confirm before students see this.
     */
    mcq: {
      stem:
        'A 7–year–old boy presented with abdominal pain, vomiting, oliguria, and ' +
        'periorbital puffiness following chemotherapy. Investigations reveal ' +
        'hyperuricemia, raised creatinine levels, and hyperkalemia. What is the next ' +
        'best step in the management of this condition?',
      options: [
        'Hydration',
        'Probenecid',
        'Allopurinol',
        'Rasburicase',
      ],
      correctIndex: 3,
    },
  },
];

export const QUESTIONS_PER_ROUND = 5;

/** Wrong guesses allowed before a puzzle is lost. */
export const MAX_WRONG = 5;

import fmdCtaUrl from '../assets/puzzles/fibromuscular-dysplasia-cta.jpg';
import typhoidXrayUrl from '../assets/puzzles/typhoid-perforation-xray.png';
import osteoidOsteomaCtUrl from '../assets/puzzles/osteoid-osteoma-ct.png';
import retinoblastomaHistoUrl from '../assets/puzzles/retinoblastoma-histopathology.png';
import bartterFaciesUrl from '../assets/puzzles/bartter-syndrome-facies.png';
import amlSmearUrl from '../assets/puzzles/acute-myeloid-leukemia-smear.png';
import keratoconusIntacsUrl from '../assets/puzzles/keratoconus-intacs.png';
import lichenPlanusOralUrl from '../assets/puzzles/lichen-planus-oral.png';
import filariasisSmearUrl from '../assets/puzzles/lymphatic-filariasis-microfilaria.png';
import mtcSpecimenUrl from '../assets/puzzles/medullary-thyroid-carcinoma-specimen.png';

/**
 * The puzzle bank.
 *
 * Every field here is verbatim from the team's source-of-truth spreadsheet,
 * "Spot The Diagnosis - Questions.xlsx", apart from incidental whitespace,
 * typographic quotes and dashes, and paste slips (a stray "D) " or ". " in
 * front of an option, a phrase pasted twice, a trailing "What's the
 * diagnosis?" on a clue). The sheet marks the correct option with a green
 * cell fill instead of a dedicated column; every row has exactly one.
 *
 * Skeletal Fluorosis (row 16) is left out on purpose: its hangman hint in
 * the sheet is a copy of Osteoid Osteoma's, so it would point at the wrong
 * answer. Add it once the sheet has its own hint.
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
        'Adrenal vein sampling',
        'MRI abdomen',
        'MIBG',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'aortic-dissection',
    clue:
      'A patient presents with sudden-onset, severe tearing chest pain radiating ' +
      'to the back, with unequal blood pressure between the arms.',
    answer: 'AORTIC DISSECTION',
    definition:
      'Aortic dissection is a condition in which a tear in the aortic intima allows ' +
      'blood to enter the aortic media, causing separation of the layers of the ' +
      'aortic wall and formation of a false lumen.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before choosing the ' +
      'confirmatory investigation.',
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
      'imbalance. MRI shows a mass in the cerebellopontine angle.',
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
      'A patient with Burkitt’s lymphoma develops nausea, vomiting, muscle cramps ' +
      'and reduced urine output within 24 hours of starting chemotherapy.',
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
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A 7-year-old boy presented with abdominal pain, vomiting, oliguria and ' +
        'periorbital puffiness following chemotherapy. Investigations reveal ' +
        'hyperuricemia, raised creatinine levels and hyperkalemia. What is the next ' +
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
  {
    id: 'dialysis-disequilibrium-syndrome',
    clue:
      'A patient with severe uremia develops headache, nausea, and confusion ' +
      'shortly after starting hemodialysis.',
    answer: 'DIALYSIS DISEQUILIBRIUM SYNDROME',
    definition:
      'Dialysis disequilibrium syndrome (DDS) is a neurological syndrome caused by ' +
      'rapid removal of urea and other osmoles from the blood during or shortly ' +
      'after hemodialysis, leading to cerebral edema and increased intracranial ' +
      'pressure.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before selecting the ' +
      'treatment.',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A patient with hyperkalemia and elevated urea levels underwent dialysis. ' +
        'Towards the end of the session, she became drowsy and had a sudden seizure ' +
        'episode. On examination, the patient was hypotensive. What is the treatment ' +
        'for this condition?',
      options: ['Bumetanide', 'Ethacrynic acid', 'Nesiritide', 'IV Mannitol'],
      correctIndex: 3,
    },
  },
  {
    id: 'typhoid',
    clue:
      'A patient develops prolonged fever with relative bradycardia, abdominal ' +
      'symptoms, and rose spots. Blood culture grows a Gram-negative bacillus.',
    answer: 'TYPHOID',
    definition:
      'Typhoid is an acute systemic febrile illness caused by Salmonella typhi, ' +
      'transmitted primarily through the fecal-oral route.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before determining the ' +
      'underlying cause of the gastrointestinal complication.',
      'Integrated between subjects: Medicine and Radiology',
      'Image based',
      'Clinical scenario',
    ],
    image: {
      src: typhoidXrayUrl,
      width: 488,
      height: 560,
      alt:
        'Erect chest X-ray taken AP sitting, showing free air visible beneath ' +
        'both domes of the diaphragm, consistent with pneumoperitoneum from a ' +
        'perforated viscus.',
    },
    mcq: {
      stem:
        'A 38-year-old man with untreated enteric fever is admitted to the ' +
        'hospital. During the third week of illness, he develops sudden severe ' +
        'abdominal pain, abdominal distension, and features of peritonitis, ' +
        'requiring aggressive resuscitation followed by emergency surgical ' +
        'management. An X-ray abdomen is performed, as shown in the accompanying ' +
        'image. What is the most likely cause of the gastrointestinal complication ' +
        'in this patient?',
      options: [
        'Toxic megacolon',
        'Acute necrosis of the transverse colon',
        'Hyperplasia, ulceration, and necrosis of the ileocecal Peyer’s patches',
        'Rupture of a splenic abscess',
      ],
      correctIndex: 2,
    },
  },
  {
    id: 'mumps',
    clue:
      'A child presents with fever, headache and painful swelling of the parotid ' +
      'glands with difficulty chewing and swallowing.',
    answer: 'MUMPS',
    definition:
      'Mumps is an acute, contagious viral infection caused by mumps virus, a ' +
      'paramyxovirus, characterized classically by painful, nonsuppurative swelling ' +
      'of the parotid glands.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before identifying the ' +
      'vaccine strain.',
      'Clinical scenario',
      'Integrated between subjects: Pediatrics and Microbiology',
    ],
    mcq: {
      stem:
        'A child presents with fever and painful swelling of one parotid gland. ' +
        'The swelling resolves, but approximately one week later, the contralateral ' +
        'parotid gland becomes enlarged. Which live-attenuated viral strain is used ' +
        'in the vaccine that prevents this infection?',
      options: [
        'Jeryl Lynn strain',
        'Edmonston–Zagreb strain',
        '17D strain',
        'Oka strain',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'osteoid-osteoma',
    clue:
      'A young boy has severe pain in the proximal tibia that is worse at night ' +
      'and is relieved after taking ibuprofen. X-ray shows a small radiolucent ' +
      'focus surrounded by dense cortical sclerosis.',
    answer: 'OSTEOID OSTEOMA',
    definition:
      'Osteoid osteoma is a benign bone-forming tumour characterized by a small ' +
      'nidus surrounded by dense reactive sclerosis, typically presenting with ' +
      'localized pain that is characteristically worse at night.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before selecting the ' +
      'preferred non-surgical treatment.',
      'Image based',
      'Clinical scenario',
    ],
    image: {
      src: osteoidOsteomaCtUrl,
      width: 309,
      height: 448,
      alt:
        'Longitudinal CT reconstruction of the tibial shaft showing a small ' +
        'lucent nidus within the cortex, surrounded by dense fusiform sclerotic ' +
        'thickening of the surrounding bone.',
    },
    mcq: {
      stem:
        'A 23-year-old man presents with localized pain in the leg for the past 2 ' +
        'months. The pain is persistent and has not resolved with routine ' +
        'conservative measures. A CT scan with multiplanar reconstruction is ' +
        'performed, as shown in the accompanying image. Based on the clinical ' +
        'presentation and imaging findings, what is the most likely diagnosis and ' +
        'the preferred Non Surgical treatment?',
      options: [
        'Osteoid osteoma - treated with radiofrequency ablation',
        'Non-ossifying fibroma - treated with tumor embolization',
        'Acute osteomyelitis - treated with antibiotics',
        'Fibrous dysplasia - managed with rest and exercise',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'marfan-syndrome',
    clue:
      'A tall, slender young patient with long fingers and hypermobile joints ' +
      'presents with a cardiovascular abnormality. Examination reveals an ' +
      'increased arm-span-to-height ratio and lens displacement.',
    answer: 'MARFAN SYNDROME',
    definition:
      'Marfan syndrome is an autosomal dominant connective-tissue disorder caused ' +
      'by mutations in the FBN1 gene encoding fibrillin-1. It characteristically ' +
      'affects the skeleton, eyes, and cardiovascular system, particularly causing ' +
      'aortic root dilatation and ectopia lentis.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before identifying the ' +
      'underlying genetic defect.',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A tall patient with arachnodactyly, a high-arched palate, ectopia lentis ' +
        'and a diastolic murmur in the parasternal area is found to have a defect ' +
        'in which of the following?',
      options: [
        'Type VII collagen',
        'Mutation in Fibrillin-1 gene',
        'Type IV collagen defect',
        'Mutation in TGFBR2 gene',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'vitamin-b12-deficiency',
    clue:
      'A patient presents with fatigue, pallor, and numbness in the hands and ' +
      'feet. Investigations show macrocytic anemia with neurological symptoms.',
    answer: 'VITAMIN B12 DEFICIENCY',
    definition:
      'Vitamin B12 deficiency is a condition caused by inadequate vitamin B12 ' +
      'availability, resulting in impaired DNA synthesis and megaloblastic ' +
      'hematopoiesis, with possible neurological manifestations due to ' +
      'demyelination. Common causes include pernicious anemia, malabsorption, and ' +
      'inadequate dietary intake.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before selecting the ' +
      'confirmatory investigation.',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A patient underwent bariatric surgery and now presents with pedal edema, ' +
        'dyspnea, loss of sensation in the limbs. On examination he has raised JVP, ' +
        'basal crepts in lung and features of sensory and motor peripheral ' +
        'neuropathy. No history of substance abuse. CBC and urine examination was ' +
        'unremarkable. Next step for confirmation of diagnosis?',
      options: [
        'RBC Transketolase activity',
        'Vitamin B12 assay',
        'Nerve conduction studies of both peroneal nerves',
        '2D Echo',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'retinoblastoma',
    clue:
      'A young child presents with a white pupillary reflex and strabismus. ' +
      'Fundoscopic examination reveals an intraocular mass with calcification on ' +
      'imaging.',
    answer: 'RETINOBLASTOMA',
    definition:
      'Retinoblastoma is a malignant tumor of the retina occurring predominantly ' +
      'in young children, caused by inactivation of the RB1 tumor-suppressor gene ' +
      'on chromosome 13q14. It classically presents with leukocoria (white ' +
      'pupillary reflex) and may also cause strabismus.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before identifying the ' +
      'responsible gene mutation.',
      'Image based',
      'Clinical scenario',
    ],
    image: {
      src: retinoblastomaHistoUrl,
      width: 580,
      height: 430,
      alt:
        'Photomicrograph (H&E stain) of retinoblastoma showing sheets of small, ' +
        'round, hyperchromatic blue cells with scant cytoplasm, arranged around ' +
        'central lumina forming Flexner–Wintersteiner rosettes.',
    },
    mcq: {
      stem:
        'A child presents with an intraocular tumor and leukocoria. ' +
        'Histopathological examination shows the following findings. Which gene ' +
        'mutation is responsible for this condition?',
      options: [
        'Gain of function in Rb gene',
        'Loss of function in Rb gene',
        'Loss of function in p53',
        'Gain of function in p53',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'hemophilia-a',
    clue:
      'A young boy presents with recurrent hemarthrosis, prolonged aPTT, and ' +
      'normal PT and platelet count.',
    answer: 'HEMOPHILIA A',
    definition:
      'Hemophilia A is an X-linked recessive bleeding disorder caused by ' +
      'deficiency or dysfunction of coagulation factor VIII, characterized by ' +
      'recurrent deep bleeding, particularly hemarthrosis.',
    tough: [
      'Multi-step: The inheritance pattern must be identified first, before ' +
      'determining which relative is most likely to be affected.',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A male child is diagnosed with haemophilia A after recurrent episodes of ' +
        'joint bleeding and easy bruising. His elder brother is also affected, ' +
        'while his sister is normal. Which of the following relatives is most ' +
        'likely to be affected by the same condition?',
      options: ['Mother', 'Father', 'Father’s brother', 'Mother’s brother'],
      correctIndex: 3,
    },
  },
  {
    id: 'bartter-syndrome',
    clue:
      'A child has excessive thirst and urination, muscle weakness, and poor ' +
      'growth. Labs reveal hypokalemic metabolic alkalosis with increased urinary ' +
      'calcium excretion.',
    answer: 'BARTTER SYNDROME',
    definition:
      'Bartter syndrome is an inherited renal tubular disorder caused by impaired ' +
      'sodium and chloride reabsorption in the thick ascending limb of the loop of ' +
      'Henle, producing a loop-diuretic-like state with salt wasting, hypokalemic ' +
      'metabolic alkalosis, hyperreninemia, hyperaldosteronism, and usually normal ' +
      'or low blood pressure.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before determining the ' +
      'affected part of the nephron.',
      'Clinical scenario',
      'Image based',
    ],
    image: {
      src: bartterFaciesUrl,
      width: 382,
      height: 472,
      alt:
        'Photograph of a young child’s face showing prominent, deep-set eyes, ' +
        'a triangular facial shape and a drooping mouth — the characteristic ' +
        'facies described in Bartter syndrome.',
    },
    mcq: {
      stem:
        'A 10-year-old child came with poor growth, h/o increased frequency of ' +
        'urination, increased thirst. She also had triangular facies with ' +
        'drooping mouth. She had Increased urine calcium excretion, high blood pH ' +
        'and hypokalemia. Which part of nephron is affected?',
      options: ['DCT', 'PCT', 'Thick ascending Limb of Henle', 'Thin descending limb of Henle'],
      correctIndex: 2,
    },
  },
  {
    id: 'delirium',
    clue:
      'An elderly patient develops sudden confusion over the course of a day, ' +
      'with fluctuating awareness, difficulty maintaining attention, and ' +
      'disorganized thinking.',
    answer: 'DELIRIUM',
    definition:
      'Delirium is an acute neuropsychiatric syndrome characterized by a ' +
      'disturbance in attention and awareness, with an accompanying disturbance in ' +
      'cognition, which develops over a short period and fluctuates in severity ' +
      'during the day. It is usually secondary to an underlying medical condition, ' +
      'substance, medication, or multiple causes.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before selecting the ' +
      'appropriate assessment tool.',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A 73-year-old man who underwent major elective surgery for total hip ' +
        'replacement is found to be mentally confused on postoperative day 2. He ' +
        'was completely lucid on day 1. He tries to remove his IV line and shows a ' +
        'loss of concentration during conversation. Which of the following is the ' +
        'most appropriate tool for assessing his condition?',
      options: [
        'Confusion Assessment Method (CAM)',
        'Mini-Mental State Examination (MMSE)',
        'Mini-Cog',
        'Patient Health Questionnaire-9 (PHQ-9)',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'follicular-lymphoma',
    clue:
      'A young woman presents with painless cervical lymphadenopathy. The biopsy ' +
      'shows many small centrocytes with occasional centroblasts, and the cells ' +
      'are CD10⁺ and BCL-2⁺.',
    answer: 'FOLLICULAR LYMPHOMA',
    definition:
      'Follicular lymphoma is an indolent B-cell non-Hodgkin lymphoma arising from ' +
      'germinal-center B cells, commonly associated with t(14;18) translocation ' +
      'and BCL2 overexpression.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before determining the ' +
      'most common genetic defect.',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A 28-year-old female presents with multiple cervical lymphadenopathies. ' +
        'IHC markers were positive for CD10 and BCL-2. Peripheral smear shows a ' +
        'large number of small cells (centrocytes) and occasional large cells ' +
        '(centroblasts). What is the most common genetic defect in this condition?',
      options: [
        't(14;18) BCL2-IGH',
        't(2;5) ALK',
        't(11;18) MALT1',
        't(11;14) Cyclin D1-IGH',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'acute-myeloid-leukemia',
    clue:
      'An adult presents with fatigue and bleeding. The peripheral smear is ' +
      'packed with blasts, with a few showing characteristic needle-like Auer ' +
      'rods.',
    answer: 'ACUTE MYELOID LEUKEMIA',
    definition:
      'Acute myeloid leukemia (AML) is a malignant disorder of myeloid precursor ' +
      'cells, characterized by uncontrolled proliferation and accumulation of ' +
      'abnormal myeloid blasts. It results from acquired genetic abnormalities ' +
      'that disrupt normal myeloid differentiation and proliferation, leading to ' +
      'bone marrow failure with anemia, infections, and bleeding.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before determining the ' +
      'most common genetic abnormality.',
      'Clinical scenario',
      'Image based',
    ],
    image: {
      src: amlSmearUrl,
      width: 604,
      height: 410,
      alt:
        'Peripheral blood smear showing a cluster of large blast cells with ' +
        'purple granular cytoplasm among pale red cells. One cell at the lower ' +
        'right contains bundles of fine, needle-like Auer rods.',
    },
    mcq: {
      stem:
        'A 60-year-old man presents with weakness, fatigue and bleeding tendencies. ' +
        'His peripheral smear shows 25% blast-like cells, as shown in the image. ' +
        'What is the most common type of genetic abnormality seen in this ' +
        'hematological malignancy?',
      options: ['inv(16)', 't(8;21)', 'AML with NPM1', 't(15;17)'],
      correctIndex: 2,
    },
  },
  {
    id: 'keratoconus',
    clue: 'Progressive blurring of vision with a cone-shaped bulging of the cornea.',
    answer: 'KERATOCONUS',
    definition:
      'Keratoconus is a progressive, non-inflammatory corneal disorder ' +
      'characterized by thinning and cone-shaped protrusion of the cornea, ' +
      'causing irregular astigmatism and visual distortion.',
    tough: [
      'Multi-step: The procedure must be identified first, before determining its ' +
      'indication.',
      'Clinical scenario',
      'Image based',
    ],
    image: {
      src: keratoconusIntacsUrl,
      width: 434,
      height: 354,
      alt:
        'Close-up photograph of an eye with two thin, clear arc-shaped segments ' +
        'set within the cornea, encircling the pupil just inside the edge of ' +
        'the iris — intracorneal ring segments.',
    },
    mcq: {
      stem: 'What is the indication of the given procedure shown in the image?',
      options: ['Keratoconus', 'Keratoglobus', 'Vogt’s limbal girdle', 'Corneal dystrophy'],
      correctIndex: 0,
    },
  },
  {
    id: 'ankylosing-spondylitis',
    clue:
      'Young adult with chronic inflammatory back pain, morning stiffness and ' +
      'bilateral sacroiliitis with bamboo spine on X-ray.',
    answer: 'ANKYLOSING SPONDYLITIS',
    definition:
      'Ankylosing spondylitis is a chronic inflammatory disease primarily ' +
      'affecting the sacroiliac joints and spine, causing inflammatory back pain, ' +
      'progressive spinal stiffness, and in advanced disease, fusion of the ' +
      'vertebrae.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before selecting the ' +
      'next step in evaluation.',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A 27-year-old individual presents with chronic lower back pain that ' +
        'improves with physical activity and is associated with early morning ' +
        'stiffness. There is a past history of anterior uveitis. A recent X-ray of ' +
        'the sacroiliac joints appears normal. What is the most appropriate next ' +
        'step in evaluation?',
      options: [
        'MRI of the sacroiliac joints',
        'Anti-CCP antibody testing',
        'Repeat plain radiograph',
        'CT scan of the sacroiliac joints',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'lichen-planus',
    clue:
      'A patient develops intensely itchy, violaceous, flat-topped papules with ' +
      'Wickham striae, mainly affecting the flexor surfaces of the wrists and ' +
      'ankles.',
    answer: 'LICHEN PLANUS',
    definition:
      'Lichen planus is a chronic, immune-mediated inflammatory disorder of the ' +
      'skin and mucous membranes, characterized by pruritic, violaceous, ' +
      'flat-topped papules and plaques, often with Wickham striae.',
    tough: [
      'Multi-step: The oral lesion must be identified first, before determining ' +
      'the causative medication.',
      'Clinical scenario',
      'Image based',
    ],
    image: {
      src: lichenPlanusOralUrl,
      width: 648,
      height: 560,
      alt:
        'Photograph inside the mouth, with the cheek held back by a dental ' +
        'mirror, showing a lacy network of white streaks over a reddened area ' +
        'of the inner cheek beside the lower back teeth.',
    },
    mcq: {
      stem:
        'A patient presents with the following oral lesions and reports a burning ' +
        'sensation while eating spicy food. Which of the following medications is ' +
        'most likely cause these lesions?',
      options: ['Lithium', 'Beta Blockers', 'Fluconazole', 'Ciprofloxacin'],
      correctIndex: 1,
    },
  },
  {
    id: 'lymphatic-filariasis',
    clue:
      'A patient from a tropical region develops recurrent fever with painful ' +
      'lymphangitis, followed by progressive lymphedema and thickening of the ' +
      'skin of the legs.',
    answer: 'LYMPHATIC FILARIASIS',
    definition:
      'Lymphatic filariasis is a chronic parasitic infection of the lymphatic ' +
      'system caused by filarial nematodes, leading to lymphatic obstruction, ' +
      'recurrent lymphangitis, lymphedema.',
    tough: [
      'Multi-step: The parasitic infection must be identified first, before ' +
      'determining the underlying pathophysiologic mechanism.',
      'Clinical scenario',
      'Image based',
    ],
    image: {
      src: filariasisSmearUrl,
      width: 440,
      height: 296,
      alt:
        'Stained peripheral blood smear showing a single long, slender, ' +
        'thread-like purple worm curving across the field — a microfilaria — ' +
        'among scattered dark-stained white cell nuclei.',
    },
    mcq: {
      stem:
        'A man from an endemic region has developed progressive leg swelling. ' +
        'Peripheral smear reveals the following parasitic organism. Which ' +
        'pathophysiologic mechanism is most likely responsible?',
      options: [
        'Hypoalbuminemia',
        'Lymphatic obstruction',
        'Hypoproteinemia',
        'Increased hydrostatic pressure',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'pheochromocytoma',
    clue:
      'A tumor of the adrenal medulla causes episodic headache, sweating, ' +
      'palpitations and hypertension.',
    answer: 'PHEOCHROMOCYTOMA',
    definition:
      'Pheochromocytoma is a catecholamine-secreting tumor arising from chromaffin ' +
      'cells, most commonly in the adrenal medulla. It produces excess epinephrine ' +
      'and norepinephrine, classically causing episodic headache, sweating, ' +
      'palpitations and hypertension.',
    tough: [
      'Multi-step: The diagnosis must be identified first, before selecting the ' +
      'appropriate drug.',
      'Clinical scenario',
    ],
    mcq: {
      stem:
        'A patient with hypertensive episodes, with an MRI abdomen showing a ' +
        'suprarenal mass, is planned for surgery. 24-hour urine shows metanephrine ' +
        'levels to be elevated. What drug will be given preoperatively and also ' +
        'intraoperatively?',
      options: ['Nicardipine', 'Esmolol', 'Clonidine', 'Phenoxybenzamine'],
      correctIndex: 0,
    },
  },
  {
    id: 'medullary-thyroid-carcinoma',
    clue:
      'A thyroid tumor arising from parafollicular cells, often associated with ' +
      'elevated calcitonin levels.',
    answer: 'MEDULLARY THYROID CARCINOMA',
    definition:
      'Medullary thyroid carcinoma (MTC) is a malignant tumor arising from the ' +
      'parafollicular C cells of the thyroid gland, characterized by calcitonin ' +
      'secretion. It may occur sporadically or as part of MEN 2 due to RET ' +
      'mutations.',
    tough: [
      'Multi-step: The surgical procedure and underlying diagnosis must be ' +
      'identified first, before determining the likely postoperative ' +
      'complication.',
      'Clinical scenario',
    ],
    image: {
      src: mtcSpecimenUrl,
      width: 404,
      height: 400,
      alt:
        'Photograph of a surgically removed thyroid gland laid flat, showing ' +
        'both lobes joined by the isthmus, with a yellow arrow pointing to the ' +
        'upper part of the left-hand lobe.',
    },
    mcq: {
      stem:
        'A malignant neck swelling was surgically removed from a patient, shown in ' +
        'the image below. What will the patient likely present with 2-3 days after ' +
        'the procedure?',
      options: [
        'Deviation of angle of mouth',
        'Hoarseness of voice',
        'Carpopedal spasm',
        'Migratory thrombophlebitis',
      ],
      correctIndex: 2,
    },
  },
];

export const QUESTIONS_PER_ROUND = 5;

/** Wrong guesses allowed before a puzzle is lost. */
export const MAX_WRONG = 5;

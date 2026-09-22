/**
 * The puzzle bank.
 *
 * ⚠️ CONTENT NEEDS FACULTY REVIEW. Clues, answers, explanations, MCQs and
 * tags here are drafted from standard NEET-PG associations so the game has a
 * full bank to draw from. Every item should be checked by a subject expert
 * before students see it — an MCQ with a wrong key teaches the wrong thing.
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

export type Puzzle = {
  id: string;
  clue: string;
  /** Upper case. Spaces separate words; only A-Z are guessable. */
  answer: string;
  /** What the condition is. Opens the reveal card, above the question. */
  definition: string;
  /** How you reason from the vignette to the answer. Closes the card. */
  explanation: string;
  mcq: Mcq;
  /**
   * Why this one is hard. Not currently rendered: the "what made it hard"
   * caption was dropped from the reveal card. Kept because the judgement in
   * it would be tedious to reconstruct if the section comes back.
   */
  tags: readonly string[];
};

export const PUZZLE_BANK: readonly Puzzle[] = [
  {
    id: 'fibromuscular-dysplasia',
    clue: 'Cause of renal artery stenosis with a "string-of-pearls" appearance on CT angiography.',
    answer: 'FIBROMUSCULAR DYSPLASIA',
    definition: 'A non-inflammatory, non-atherosclerotic arterial disease causing alternating narrowing and dilation of the vessel wall.',
    explanation: 'Classically a young woman with hypertension. Atherosclerosis is the commoner cause in older patients.',
    mcq: {
      stem: 'A 23-year-old woman has a 6-month history of worsening headaches. Her blood pressure is 220/110 mm Hg and CT angiography shows a "string of pearls" in the right renal artery.',
      options: [
        'Renal artery stenting',
        'Percutaneous renal angioplasty',
        'Surgical revascularisation',
        'ACE inhibitor therapy alone',
      ],
      correctIndex: 1,
    },
    tags: ['Clinical vignette', 'Image-based', 'Multi-step', 'Low base-rate'],
  },
  {
    id: 'achalasia-cardia',
    clue: '"Bird-beak" narrowing of the distal oesophagus on barium swallow, with proximal dilation.',
    answer: 'ACHALASIA CARDIA',
    definition: 'Failure of the lower oesophageal sphincter to relax, from loss of myenteric plexus ganglion cells.',
    explanation: 'Manometry shows absent peristalsis with incomplete LES relaxation.',
    mcq: {
      stem: 'A 38-year-old has two years of dysphagia to both solids and liquids, with regurgitation of undigested food. Barium swallow shows a dilated oesophagus tapering to a beak.',
      options: [
        '24-hour pH study',
        'Upper GI endoscopy',
        'Oesophageal manometry',
        'CT of the chest',
      ],
      correctIndex: 2,
    },
    tags: ['Investigation of choice', 'Image-based', 'Clinical vignette'],
  },
  {
    id: 'intussusception',
    clue: '"Target" or "doughnut" sign on abdominal ultrasound in a child with red-currant jelly stool.',
    answer: 'INTUSSUSCEPTION',
    definition: 'Telescoping of one bowel segment into another, most often ileocolic in infants.',
    explanation: 'Ultrasound is the investigation of choice; pneumatic reduction is both diagnostic and therapeutic.',
    mcq: {
      stem: 'A 9-month-old has colicky pain, vomiting and red-currant jelly stool. He is haemodynamically stable after fluid resuscitation and ultrasound shows a target sign.',
      options: [
        'Observation for 24 hours',
        'Barium enema for diagnosis only',
        'Immediate laparotomy',
        'Pneumatic reduction under fluoroscopy',
      ],
      correctIndex: 3,
    },
    tags: ['Management', 'Paediatrics', 'Image-based'],
  },
  {
    id: 'pyloric-stenosis',
    clue: 'Projectile non-bilious vomiting at 3–6 weeks with a palpable olive-shaped mass.',
    answer: 'PYLORIC STENOSIS',
    definition: 'Hypertrophy of the pyloric muscle causing gastric outlet obstruction.',
    explanation: 'Produces a hypochloraemic, hypokalaemic metabolic alkalosis; treated by Ramstedt pyloromyotomy after fluid correction.',
    mcq: {
      stem: 'A 5-week-old boy has projectile non-bilious vomiting after every feed. A firm olive-shaped mass is palpable in the epigastrium.',
      options: [
        'Hypochloraemic hypokalaemic metabolic alkalosis',
        'Normal anion gap acidosis',
        'Respiratory alkalosis',
        'Hyperchloraemic metabolic acidosis',
      ],
      correctIndex: 0,
    },
    tags: ['Integrated', 'Paediatrics', 'Multi-step'],
  },
  {
    id: 'osteosarcoma',
    clue: '"Sunburst" periosteal reaction with Codman triangle in the metaphysis of a teenager.',
    answer: 'OSTEOSARCOMA',
    definition: 'The commonest primary malignant bone tumour, peaking in adolescence around the knee.',
    explanation: 'Diagnosis is confirmed on biopsy showing malignant osteoid.',
    mcq: {
      stem: 'A 15-year-old has pain and swelling around the right knee. X-ray shows a sunburst periosteal reaction with a Codman triangle in the distal femoral metaphysis.',
      options: [
        'Bone scan',
        'Open biopsy of the lesion',
        'Serum alkaline phosphatase',
        'Repeat X-ray in six weeks',
      ],
      correctIndex: 1,
    },
    tags: ['Image-based', 'Oncology', 'Multi-step'],
  },
  {
    id: 'ewing-sarcoma',
    clue: '"Onion-skin" periosteal reaction in the diaphysis of a long bone, with fever and raised ESR.',
    answer: 'EWING SARCOMA',
    definition: 'A small round blue cell tumour carrying the t(11;22) EWSR1-FLI1 translocation.',
    explanation: 'Often mimics osteomyelitis clinically.',
    mcq: {
      stem: 'A 12-year-old has fever, a painful mid-shaft femoral swelling and a raised ESR. X-ray shows onion-skin periosteal layering.',
      options: [
        't(15;17)',
        't(9;22)',
        't(11;22)',
        't(14;18)',
      ],
      correctIndex: 2,
    },
    tags: ['Genetics', 'Buzzword recall', 'Mimics infection'],
  },
  {
    id: 'tetralogy-of-fallot',
    clue: '"Boot-shaped" heart on chest X-ray in a cyanotic child who squats for relief.',
    answer: 'TETRALOGY OF FALLOT',
    definition: 'Four features: VSD, overriding aorta, right ventricular outflow obstruction and RV hypertrophy.',
    explanation: 'Squatting raises systemic vascular resistance and reduces the right-to-left shunt.',
    mcq: {
      stem: 'A 3-year-old with a boot-shaped heart on chest X-ray becomes cyanosed while crying and squats down, after which he improves.',
      options: [
        'Squatting lowers pulmonary vascular resistance',
        'Squatting increases cardiac output directly',
        'Squatting reduces systemic venous return',
        'Squatting raises systemic vascular resistance and reduces right-to-left shunt',
      ],
      correctIndex: 3,
    },
    tags: ['Physiology', 'Clinical vignette', 'Paediatrics'],
  },
  {
    id: 'transposition-great-arteries',
    clue: '"Egg-on-side" cardiac silhouette in a neonate cyanosed within hours of birth.',
    answer: 'TRANSPOSITION OF GREAT ARTERIES',
    definition: 'The aorta arises from the right ventricle and the pulmonary artery from the left, creating two parallel circulations.',
    explanation: 'Survival depends on mixing. Prostaglandin E1 keeps the duct open pending balloon atrial septostomy.',
    mcq: {
      stem: 'A term neonate is deeply cyanosed at 4 hours of age. Chest X-ray shows an egg-on-side silhouette and echocardiography confirms discordant ventriculo-arterial connections.',
      options: [
        'Prostaglandin E1 infusion',
        '100 per cent oxygen by hood',
        'Indomethacin infusion',
        'Immediate arterial switch operation',
      ],
      correctIndex: 0,
    },
    tags: ['Management', 'Neonatology', 'Multi-step'],
  },
  {
    id: 'mitral-stenosis',
    clue: '"Fish-mouth" valve with a mid-diastolic murmur and loud first heart sound.',
    answer: 'MITRAL STENOSIS',
    definition: 'Almost always rheumatic in origin.',
    explanation: 'Left atrial enlargement leads to atrial fibrillation, pulmonary congestion and systemic embolism.',
    mcq: {
      stem: 'A 32-year-old woman has exertional dyspnoea. On auscultation there is a loud first heart sound, an opening snap and a mid-diastolic murmur at the apex.',
      options: [
        'Chest X-ray',
        'Transthoracic echocardiography',
        'Cardiac catheterisation',
        'Exercise stress test',
      ],
      correctIndex: 1,
    },
    tags: ['Investigation of choice', 'Auscultation', 'Clinical vignette'],
  },
  {
    id: 'aortic-dissection',
    clue: 'Tearing interscapular chest pain with unequal upper limb blood pressures.',
    answer: 'AORTIC DISSECTION',
    definition: 'A tear in the intima lets blood track within the media, creating a false lumen.',
    explanation: 'Stanford type A involves the ascending aorta and needs surgery; type B is usually managed medically.',
    mcq: {
      stem: 'A 58-year-old hypertensive man has sudden tearing interscapular pain. Blood pressure is 180/100 in the right arm and 140/80 in the left. CT shows an intimal flap in the ascending aorta.',
      options: [
        'Percutaneous stenting of the descending aorta',
        'Intravenous beta blockade alone',
        'Emergency surgical repair',
        'Thrombolysis',
      ],
      correctIndex: 2,
    },
    tags: ['Management', 'Multi-step', 'Time-critical'],
  },
  {
    id: 'subarachnoid-haemorrhage',
    clue: 'Sudden "worst headache of my life" with neck stiffness and a normal CT at 12 hours.',
    answer: 'SUBARACHNOID HAEMORRHAGE',
    definition: 'Usually from a ruptured berry aneurysm.',
    explanation: 'If CT is negative but suspicion remains, lumbar puncture showing xanthochromia confirms it.',
    mcq: {
      stem: 'A 45-year-old has a sudden "worst headache of my life" with neck stiffness. Non-contrast CT at 12 hours is reported as normal.',
      options: [
        'MRI brain in one week',
        'Start nimodipine empirically',
        'Discharge with analgesia',
        'Lumbar puncture looking for xanthochromia',
      ],
      correctIndex: 3,
    },
    tags: ['Multi-step', 'Time-critical', 'Clinical vignette'],
  },
  {
    id: 'extradural-haematoma',
    clue: 'Biconvex hyperdense collection on CT after temporal trauma, with a lucid interval.',
    answer: 'EXTRADURAL HAEMATOMA',
    definition: 'Arterial bleed, classically from the middle meningeal artery.',
    explanation: 'The collection does not cross suture lines, giving the lens shape.',
    mcq: {
      stem: 'A 20-year-old is struck on the temple, briefly loses consciousness, recovers, then deteriorates. CT shows a biconvex hyperdense collection that does not cross suture lines.',
      options: [
        'Bridging cortical veins',
        'Anterior cerebral artery',
        'Cavernous sinus',
        'Middle meningeal artery',
      ],
      correctIndex: 3,
    },
    tags: ['Anatomy-linked', 'Image-based', 'Buzzword recall'],
  },
  {
    id: 'subdural-haematoma',
    clue: 'Crescent-shaped collection crossing suture lines in an elderly patient on anticoagulants.',
    answer: 'SUBDURAL HAEMATOMA',
    definition: 'Venous bleed from torn bridging veins.',
    explanation: 'Because it lies beneath the dura, it crosses sutures but not the midline.',
    mcq: {
      stem: 'An 78-year-old on warfarin becomes progressively drowsy after a minor fall. CT shows a crescent-shaped collection over the convexity that crosses suture lines.',
      options: [
        'Middle meningeal artery',
        'Torn bridging veins',
        'Circle of Willis aneurysm',
        'Vertebral artery dissection',
      ],
      correctIndex: 1,
    },
    tags: ['Anatomy-linked', 'Image-based', 'Geriatrics'],
  },
  {
    id: 'multiple-sclerosis',
    clue: '"Dawson fingers": periventricular lesions perpendicular to the ventricles on MRI.',
    answer: 'MULTIPLE SCLEROSIS',
    definition: 'Demyelination disseminated in time and space.',
    explanation: 'CSF shows oligoclonal bands not matched in serum.',
    mcq: {
      stem: 'A 28-year-old woman has a second episode of neurological deficit in a year. MRI shows periventricular lesions arranged perpendicular to the ventricles.',
      options: [
        'Low CSF glucose',
        'Raised CSF protein with normal cells',
        'Oligoclonal bands in CSF not matched in serum',
        'Positive CSF India ink',
      ],
      correctIndex: 2,
    },
    tags: ['Investigation of choice', 'Image-based', 'Integrated'],
  },
  {
    id: 'guillain-barre-syndrome',
    clue: 'Ascending flaccid paralysis with albuminocytological dissociation in the CSF.',
    answer: 'GUILLAIN BARRE SYNDROME',
    definition: 'Post-infectious demyelinating polyradiculoneuropathy, often after Campylobacter jejuni.',
    explanation: 'Treated with IVIg or plasma exchange. Steroids do not help.',
    mcq: {
      stem: 'A 30-year-old develops ascending weakness two weeks after an episode of bloody diarrhoea. CSF shows raised protein with normal cell count.',
      options: [
        'Oral azathioprine',
        'Acyclovir',
        'High-dose corticosteroids',
        'Intravenous immunoglobulin',
      ],
      correctIndex: 3,
    },
    tags: ['Management', 'Negative-knowledge', 'Clinical vignette'],
  },
  {
    id: 'myasthenia-gravis',
    clue: 'Fatigable ptosis with a decremental response on repetitive nerve stimulation.',
    answer: 'MYASTHENIA GRAVIS',
    definition: 'Antibodies against the postsynaptic acetylcholine receptor.',
    explanation: 'Always image the mediastinum. Thymoma is present in about 10 per cent.',
    mcq: {
      stem: 'A 40-year-old woman has drooping eyelids and double vision that worsen through the day. Repetitive nerve stimulation shows a decremental response.',
      options: [
        'CT of the thorax',
        'Nerve conduction of the lower limbs',
        'Muscle biopsy',
        'MRI brain',
      ],
      correctIndex: 0,
    },
    tags: ['Multi-step', 'Association', 'Clinical vignette'],
  },
  {
    id: 'wilson-disease',
    clue: 'Kayser-Fleischer rings with low serum caeruloplasmin in a young patient with tremor.',
    answer: 'WILSON DISEASE',
    definition: 'Autosomal recessive defect in ATP7B causing copper accumulation in liver, brain and cornea.',
    explanation: 'Treated with chelation using penicillamine or trientine.',
    mcq: {
      stem: 'A 19-year-old has a coarse tremor, dysarthria and deranged liver enzymes. Slit-lamp examination shows Kayser-Fleischer rings.',
      options: [
        'Deferoxamine',
        'D-penicillamine',
        'Prednisolone',
        'Ursodeoxycholic acid',
      ],
      correctIndex: 1,
    },
    tags: ['Management', 'Integrated', 'Genetics'],
  },
  {
    id: 'haemochromatosis',
    clue: '"Bronze diabetes": skin pigmentation, diabetes and raised transferrin saturation.',
    answer: 'HAEMOCHROMATOSIS',
    definition: 'HFE gene mutation causing excess intestinal iron absorption.',
    explanation: 'Venesection is first-line; untreated it leads to cirrhosis and hepatocellular carcinoma.',
    mcq: {
      stem: 'A 50-year-old man has slate-grey skin, new diabetes and arthralgia. Transferrin saturation is 72 per cent and ferritin is markedly raised.',
      options: [
        'Liver transplantation',
        'Iron chelation with deferasirox',
        'Regular venesection',
        'Low-iron diet alone',
      ],
      correctIndex: 2,
    },
    tags: ['Management', 'Integrated', 'Buzzword recall'],
  },
  {
    id: 'primary-biliary-cholangitis',
    clue: 'Middle-aged woman with pruritus, raised alkaline phosphatase and antimitochondrial antibody.',
    answer: 'PRIMARY BILIARY CHOLANGITIS',
    definition: 'Autoimmune destruction of small intrahepatic bile ducts.',
    explanation: 'Ursodeoxycholic acid slows progression.',
    mcq: {
      stem: 'A 52-year-old woman has months of pruritus and fatigue. Alkaline phosphatase is markedly raised with near-normal transaminases.',
      options: [
        'Anti-LKM1 antibody',
        'Anti-dsDNA antibody',
        'Anti-smooth muscle antibody',
        'Antimitochondrial antibody',
      ],
      correctIndex: 3,
    },
    tags: ['Investigation of choice', 'Autoimmune', 'Clinical vignette'],
  },
  {
    id: 'crohn-disease',
    clue: 'Skip lesions with cobblestone mucosa and transmural non-caseating granulomas.',
    answer: 'CROHN DISEASE',
    definition: 'Can affect any part of the gut from mouth to anus, terminal ileum most often.',
    explanation: 'Fistulae and strictures follow from the transmural inflammation.',
    mcq: {
      stem: 'A 26-year-old has chronic diarrhoea and weight loss. Colonoscopy shows patchy cobblestone mucosa with normal segments in between.',
      options: [
        'Transmural non-caseating granulomas',
        'Caseating granulomas',
        'Signet ring cells',
        'Crypt abscesses limited to mucosa',
      ],
      correctIndex: 0,
    },
    tags: ['Histopathology', 'Differentiation', 'Clinical vignette'],
  },
  {
    id: 'ulcerative-colitis',
    clue: '"Lead-pipe" colon with continuous mucosal inflammation starting at the rectum.',
    answer: 'ULCERATIVE COLITIS',
    definition: 'Inflammation is limited to mucosa and submucosa and is continuous, unlike Crohn disease.',
    explanation: 'Carries a long-term risk of colorectal carcinoma.',
    mcq: {
      stem: 'A 34-year-old has bloody diarrhoea with continuous inflammation from the rectum proximally. Barium enema shows loss of haustra.',
      options: [
        'Fistula formation',
        'Toxic megacolon',
        'Perianal skin tags',
        'Terminal ileal stricture',
      ],
      correctIndex: 1,
    },
    tags: ['Differentiation', 'Complication', 'Image-based'],
  },
  {
    id: 'coeliac-disease',
    clue: 'Villous atrophy with crypt hyperplasia and positive anti-tissue transglutaminase antibody.',
    answer: 'COELIAC DISEASE',
    definition: 'Gluten-sensitive enteropathy associated with HLA-DQ2 and DQ8.',
    explanation: 'Dermatitis herpetiformis is the skin manifestation.',
    mcq: {
      stem: 'A 24-year-old has chronic diarrhoea, iron deficiency and an itchy vesicular rash on the elbows. Duodenal biopsy shows villous atrophy with crypt hyperplasia.',
      options: [
        'Anti-parietal cell antibody',
        'Anti-mitochondrial antibody',
        'Anti-tissue transglutaminase IgA',
        'Anti-Saccharomyces antibody',
      ],
      correctIndex: 2,
    },
    tags: ['Investigation of choice', 'Integrated', 'Dermatology link'],
  },
  {
    id: 'pheochromocytoma',
    clue: 'Episodic headache, sweating and palpitations with raised plasma free metanephrines.',
    answer: 'PHEOCHROMOCYTOMA',
    definition: 'Catecholamine-secreting tumour of adrenal medullary chromaffin cells.',
    explanation: 'Alpha blockade must precede beta blockade to avoid unopposed alpha stimulation.',
    mcq: {
      stem: 'A 44-year-old has episodic headache, palpitations and drenching sweats with paroxysmal hypertension. Plasma free metanephrines are four times the upper limit.',
      options: [
        'Start both simultaneously',
        'Proceed straight to surgery',
        'Start beta blockade, then alpha blockade',
        'Start alpha blockade, then beta blockade',
      ],
      correctIndex: 3,
    },
    tags: ['Management', 'Sequence-critical', 'Pharmacology-linked'],
  },
  {
    id: 'cushing-syndrome',
    clue: 'Purple abdominal striae, proximal myopathy and failure to suppress on low-dose dexamethasone.',
    answer: 'CUSHING SYNDROME',
    definition: 'Chronic glucocorticoid excess.',
    explanation: 'Exogenous steroids are the commonest cause overall; pituitary adenoma is the commonest endogenous one.',
    mcq: {
      stem: 'A 36-year-old woman has central obesity, purple abdominal striae and proximal muscle weakness. She is not on any steroid medication.',
      options: [
        'Overnight low-dose dexamethasone suppression test',
        'Serum ACTH alone',
        'Adrenal CT as the first test',
        'Random serum cortisol',
      ],
      correctIndex: 0,
    },
    tags: ['Investigation of choice', 'Multi-step', 'Endocrine'],
  },
  {
    id: 'addison-disease',
    clue: 'Hyperpigmented palmar creases with hyponatraemia, hyperkalaemia and postural hypotension.',
    answer: 'ADDISON DISEASE',
    definition: 'Primary adrenal insufficiency, autoimmune in most of the developed world and tuberculous in much of India.',
    explanation: 'Short Synacthen test confirms it.',
    mcq: {
      stem: 'A 30-year-old has fatigue, postural dizziness and pigmented palmar creases. Sodium is 128 mmol/L and potassium is 5.8 mmol/L.',
      options: [
        'Overnight dexamethasone suppression test',
        'Short Synacthen (ACTH stimulation) test',
        'Water deprivation test',
        'Insulin tolerance test',
      ],
      correctIndex: 1,
    },
    tags: ['Investigation of choice', 'Electrolytes', 'Clinical vignette'],
  },
];

export const QUESTIONS_PER_ROUND = 5;
export const MAX_WRONG = 5;

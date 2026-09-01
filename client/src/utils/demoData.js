export const DEMO_USER = {
  id: 'demo-user-001',
  name: 'Alex Kim',
  email: 'alex.kim@student.edu',
  avatar: null,
  isDemo: true,
  streak: 7,
  totalStudyHours: 142,
  joinDate: '2025-09-01'
}

export const DEMO_COURSES = [
  { id: 'course-1', name: 'Physics', code: 'PHY', color: '#4daaff', credits: 1 },
  { id: 'course-2', name: 'Chemistry', code: 'CHEM', color: '#c44dff', credits: 1 },
  { id: 'course-3', name: 'Mathematics', code: 'MATH', color: '#ff6b9d', credits: 1 },
  { id: 'course-4', name: 'Biology', code: 'BIO', color: '#4dff91', credits: 1 },
  { id: 'course-5', name: 'English Core', code: 'ENG', color: '#ffd6a0', credits: 1 },
]

const now = new Date()
const daysFromNow = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000).toISOString()

export const DEMO_ASSIGNMENTS = [
  {
    id: 'assign-1',
    title: 'Kinematics Numericals — Chapter 3',
    courseId: 'course-1',
    courseName: 'Physics',
    dueDate: daysFromNow(2),
    status: 'pending',
    priority: 'high',
    description: 'Solve all numericals from NCERT Chapter 3 — Motion in a Straight Line.',
    estimatedHours: 3,
    grade: null
  },
  {
    id: 'assign-2',
    title: 'Chemical Bonding Worksheet',
    courseId: 'course-2',
    courseName: 'Chemistry',
    dueDate: daysFromNow(4),
    status: 'in-progress',
    priority: 'high',
    description: 'Complete NCERT back exercises + coaching sheet on ionic and covalent bonding.',
    estimatedHours: 2,
    grade: null
  },
  {
    id: 'assign-3',
    title: 'Trigonometry Problem Set — Ex 3.3',
    courseId: 'course-3',
    courseName: 'Mathematics',
    dueDate: daysFromNow(3),
    status: 'pending',
    priority: 'high',
    description: 'Exercise 3.3 from NCERT — trigonometric functions and identities.',
    estimatedHours: 2,
    grade: null
  },
  {
    id: 'assign-4',
    title: 'Cell Biology Diagram — Label & Explain',
    courseId: 'course-4',
    courseName: 'Biology',
    dueDate: daysFromNow(5),
    status: 'pending',
    priority: 'medium',
    description: 'Draw and label plant & animal cell diagrams. Explain each organelle function.',
    estimatedHours: 1.5,
    grade: null
  },
  {
    id: 'assign-5',
    title: 'Reading Comprehension — Unseen Passage Practice',
    courseId: 'course-5',
    courseName: 'English Core',
    dueDate: daysFromNow(6),
    status: 'pending',
    priority: 'medium',
    description: 'Practice 3 unseen passages with short-answer and long-answer questions.',
    estimatedHours: 1,
    grade: null
  },
  {
    id: 'assign-6',
    title: 'Laws of Motion — NCERT Exemplar',
    courseId: 'course-1',
    courseName: 'Physics',
    dueDate: daysFromNow(-3),
    status: 'completed',
    priority: 'medium',
    description: 'NCERT Exemplar problems for Chapter 5.',
    estimatedHours: 2,
    grade: 88
  },
  {
    id: 'assign-7',
    title: 'Mole Concept Numericals',
    courseId: 'course-2',
    courseName: 'Chemistry',
    dueDate: daysFromNow(8),
    status: 'pending',
    priority: 'medium',
    description: 'Practice problems on mole concept, molar mass, and stoichiometry.',
    estimatedHours: 2,
    grade: null
  },
  {
    id: 'assign-8',
    title: 'Limits & Derivatives Practice',
    courseId: 'course-3',
    courseName: 'Mathematics',
    dueDate: daysFromNow(-5),
    status: 'graded',
    priority: 'low',
    description: 'RD Sharma exercises on limits and introduction to derivatives.',
    estimatedHours: 3,
    grade: { pointsEarned: 42, pointsPossible: 50 }
  },
  {
    id: 'assign-9',
    title: 'Biomolecules Notes Summary',
    courseId: 'course-4',
    courseName: 'Biology',
    dueDate: daysFromNow(10),
    status: 'pending',
    priority: 'low',
    description: 'Summarize Chapter 9 — proteins, carbohydrates, lipids, and nucleic acids.',
    estimatedHours: 1,
    grade: null
  },
  {
    id: 'assign-10',
    title: 'Letter Writing — Formal & Informal',
    courseId: 'course-5',
    courseName: 'English Core',
    dueDate: daysFromNow(7),
    status: 'pending',
    priority: 'low',
    description: 'Write one formal letter to the editor and one informal letter to a friend.',
    estimatedHours: 1,
    grade: null
  }
]

export const DEMO_EVENTS = [
  {
    id: 'event-1',
    title: 'Physics Doubt Session',
    start: daysFromNow(1),
    type: 'academic',
    description: 'Bring kinematics questions — teacher available after school',
    color: '#4daaff'
  },
  {
    id: 'event-2',
    title: 'Chemistry Lab — Salt Analysis',
    start: daysFromNow(3),
    type: 'academic',
    description: 'Practical exam prep — systematic qualitative analysis',
    color: '#c44dff'
  },
  {
    id: 'event-3',
    title: 'Maths Group Study',
    start: daysFromNow(2),
    type: 'study',
    description: 'Trigonometry and coordinate geometry revision with friends',
    color: '#ff6b9d'
  },
  {
    id: 'event-4',
    title: 'Biology Diagram Practice',
    start: daysFromNow(4),
    type: 'study',
    description: 'Practice NCERT diagrams — cell structure, mitosis, meiosis',
    color: '#4dff91'
  },
  {
    id: 'event-5',
    title: 'Physics Unit Test',
    start: daysFromNow(8),
    type: 'exam',
    description: 'Kinematics + Laws of Motion — 40 marks, 1 hour',
    color: '#ff4d6a'
  },
  {
    id: 'event-6',
    title: 'English Creative Writing',
    start: daysFromNow(5),
    type: 'academic',
    description: 'Article writing and report writing practice',
    color: '#ffd6a0'
  },
  {
    id: 'event-7',
    title: 'Chemistry Class Test',
    start: daysFromNow(10),
    type: 'exam',
    description: 'Chemical Bonding + Periodic Table — 30 marks',
    color: '#c44dff'
  },
  {
    id: 'event-8',
    title: 'Maths Half-Yearly Revision',
    start: daysFromNow(14),
    type: 'study',
    description: 'Start revising all chapters for half-yearly exams',
    color: '#ff6b9d'
  }
]

export const DEMO_NOTES = [
  {
    id: 'note-demo-1',
    title: 'Physics — Kinematics Formulas',
    content: '# Kinematics — Key Formulas\n\n## Equations of Motion (Uniform Acceleration)\n- v = u + at\n- s = ut + ½at²\n- v² = u² + 2as\n- s = ½(u + v)t\n\n## Projectile Motion\n- Horizontal range: R = u²sin2θ / g\n- Max height: H = u²sin²θ / 2g\n- Time of flight: T = 2u sinθ / g\n\n## Relative Velocity\n- v_AB = v_A − v_B\n\n## Tips\n- Always draw a diagram first\n- Choose direction for positive/negative carefully\n- Use g = 9.8 m/s² or 10 m/s² as specified',
    courseId: 'course-1',
    color: '#4daaff',
    pinned: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 30,
  },
  {
    id: 'note-demo-2',
    title: 'Chemistry — Periodic Table Trends',
    content: '# Periodic Table Trends\n\n## Across a Period (Left → Right)\n- Atomic radius **decreases**\n- Ionisation energy **increases**\n- Electronegativity **increases**\n- Metallic character **decreases**\n\n## Down a Group (Top → Bottom)\n- Atomic radius **increases**\n- Ionisation energy **decreases**\n- Electronegativity **decreases**\n- Metallic character **increases**\n\n## Important Exceptions\n- Electron affinity: Fluorine < Chlorine (small size of F)\n- Ionisation energy: Be > B, N > O (half-filled stability)\n\n## NCERT Questions to Revise\n- Ex 3.1, 3.2, 3.4, 3.7',
    courseId: 'course-2',
    color: '#c44dff',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    updatedAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: 'note-demo-3',
    title: 'Maths — Trigonometric Identities',
    content: '# Trigonometric Identities\n\n## Fundamental\n- sin²θ + cos²θ = 1\n- 1 + tan²θ = sec²θ\n- 1 + cot²θ = cosec²θ\n\n## Compound Angles\n- sin(A ± B) = sinA cosB ± cosA sinB\n- cos(A ± B) = cosA cosB ∓ sinA sinB\n- tan(A ± B) = (tanA ± tanB) / (1 ∓ tanA tanB)\n\n## Double Angle\n- sin2A = 2sinA cosA\n- cos2A = cos²A − sin²A = 2cos²A − 1 = 1 − 2sin²A\n- tan2A = 2tanA / (1 − tan²A)\n\n**Practice**: NCERT Ex 3.3, Ex 3.4\n**RD Sharma**: Chapter 5 solved examples',
    courseId: 'course-3',
    color: '#ff6b9d',
    pinned: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    updatedAt: Date.now() - 1000 * 60 * 10,
  },
]

export const DEMO_COURSE_WEIGHTS = {
  'course-1': [
    { id: 'cat-phy-hw', name: 'Homework', weight: 15 },
    { id: 'cat-phy-test', name: 'Unit Tests', weight: 30 },
    { id: 'cat-phy-prac', name: 'Practicals', weight: 15 },
    { id: 'cat-phy-exam', name: 'Final Exam', weight: 40 },
  ],
  'course-2': [
    { id: 'cat-chem-hw', name: 'Homework', weight: 15 },
    { id: 'cat-chem-test', name: 'Unit Tests', weight: 30 },
    { id: 'cat-chem-prac', name: 'Practicals', weight: 15 },
    { id: 'cat-chem-exam', name: 'Final Exam', weight: 40 },
  ],
}

export const DEMO_DECKS = [
  {
    id: 'deck-demo-1',
    name: 'Physics — Laws of Motion',
    courseId: 'course-1',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    cards: [
      { id: 'c1', front: "State Newton's First Law of Motion.", back: "A body remains at rest or in uniform motion in a straight line unless acted upon by an external force.\n\nAlso called the Law of Inertia.", streak: 3, nextReview: Date.now() + 86400000 },
      { id: 'c2', front: "Write Newton's Second Law as a formula.", back: "F = ma\n\nForce = mass × acceleration\nSI unit of force: Newton (N) = kg·m/s²", streak: 2, nextReview: Date.now() - 1000 },
      { id: 'c3', front: "State Newton's Third Law.", back: "For every action, there is an equal and opposite reaction.\n\nF₁₂ = −F₂₁\nAction and reaction act on different bodies.", streak: 0, nextReview: null },
      { id: 'c4', front: 'What is the formula for friction force?', back: 'f = μN\n\nwhere μ is the coefficient of friction and N is the normal force.', streak: 1, nextReview: Date.now() - 1000 },
      { id: 'c5', front: 'What is conservation of linear momentum?', back: 'In an isolated system (no external forces), the total momentum before and after collision remains the same.\n\nm₁u₁ + m₂u₂ = m₁v₁ + m₂v₂', streak: 0, nextReview: null },
    ]
  },
  {
    id: 'deck-demo-2',
    name: 'Chemistry — Chemical Bonding',
    courseId: 'course-2',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    cards: [
      { id: 'c6', front: 'What is an ionic bond?', back: 'A bond formed by the complete transfer of electrons from a metal to a non-metal.\n\nExample: NaCl — Na loses 1e⁻ → Na⁺, Cl gains 1e⁻ → Cl⁻', streak: 2, nextReview: Date.now() - 1000 },
      { id: 'c7', front: 'What is a covalent bond?', back: 'A bond formed by the mutual sharing of electrons between two non-metals.\n\nExample: H₂ — each H shares 1 electron.', streak: 3, nextReview: Date.now() + 172800000 },
      { id: 'c8', front: 'What is VSEPR theory used for?', back: 'Valence Shell Electron Pair Repulsion theory predicts the shape/geometry of molecules based on electron pairs around the central atom.', streak: 1, nextReview: Date.now() - 1000 },
      { id: 'c9', front: 'Define electronegativity.', back: 'The tendency of an atom in a molecule to attract the shared pair of electrons towards itself.\n\nPauling scale: F (4.0) is the most electronegative element.', streak: 0, nextReview: null },
    ]
  }
]

export const DEMO_GRADES = {
  'course-1': {
    'hw1': { name: 'Kinematics Worksheet', pointsEarned: 18, pointsPossible: 20 },
    'hw2': { name: 'Motion Numericals', pointsEarned: 23, pointsPossible: 25 },
    'test1': { name: 'Unit Test — Kinematics', pointsEarned: 34, pointsPossible: 40 },
    'prac1': { name: 'Practical — Vernier Callipers', pointsEarned: 14, pointsPossible: 15 },
  },
  'course-2': {
    'hw1': { name: 'Atomic Structure Exercises', pointsEarned: 22, pointsPossible: 25 },
    'hw2': { name: 'Periodic Table Worksheet', pointsEarned: 19, pointsPossible: 20 },
    'test1': { name: 'Unit Test — Chemical Bonding', pointsEarned: 28, pointsPossible: 35 },
    'prac1': { name: 'Salt Analysis Practical', pointsEarned: 13, pointsPossible: 15 },
  },
  'course-3': {
    'hw1': { name: 'Sets & Functions', pointsEarned: 24, pointsPossible: 25 },
    'hw2': { name: 'Trigonometry — Ex 3.2', pointsEarned: 18, pointsPossible: 20 },
    'test1': { name: 'Unit Test — Algebra', pointsEarned: 37, pointsPossible: 40 },
  },
  'course-4': {
    'hw1': { name: 'Cell Structure Diagram', pointsEarned: 9, pointsPossible: 10 },
    'hw2': { name: 'Biomolecules Questions', pointsEarned: 17, pointsPossible: 20 },
    'test1': { name: 'Unit Test — Cell Biology', pointsEarned: 26, pointsPossible: 30 },
  },
  'course-5': {
    'hw1': { name: 'Reading Comprehension — Practice 1', pointsEarned: 13, pointsPossible: 15 },
    'hw2': { name: 'Grammar Exercises', pointsEarned: 19, pointsPossible: 20 },
    'test1': { name: 'Descriptive Essay', pointsEarned: 8, pointsPossible: 10 },
  }
}

// Pre-seeded quiz history for demo mode
export const DEMO_QUIZ_HISTORY = [
  { date: Date.now() - 86400000 * 2, score: 4, total: 5, title: 'Physics — Kinematics' },
  { date: Date.now() - 86400000 * 5, score: 7, total: 8, title: 'Chemistry — Periodic Table' },
  { date: Date.now() - 86400000 * 9, score: 4, total: 5, title: 'Mathematics — Trigonometry' },
]

// Pre-seeded leaderboard data for demo mode
export const DEMO_LEADERBOARD = [
  { id: 'friend-1', name: 'Aarav S.', avatar: 'A', streak: 12, completionRate: 94, gpa: '91.2', score: 214, isMe: false },
  { id: 'friend-2', name: 'Priya K.', avatar: 'P', streak: 5, completionRate: 78, gpa: '85.0', score: 120, isMe: false },
]

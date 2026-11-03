// CBSE Board subject suggestions grouped by class group.
// Used as quick-pick chips in the Add Course / Add Assignment forms.
// Users can always type anything custom — these are just suggestions.

export const CBSE_CLASS_GROUPS = [
  {
    label: 'Class 9 – 10',
    subjects: [
      'Mathematics', 'Science', 'Social Science', 'English', 'Hindi',
      'Sanskrit', 'Computer Applications', 'Information Technology',
      'Physical Education', 'Home Science', 'Painting', 'Music',
    ],
  },
  {
    label: 'Class 11 – 12 · Science',
    subjects: [
      'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science',
      'Informatics Practices', 'English Core', 'Physical Education', 'Biotechnology',
    ],
  },
  {
    label: 'Class 11 – 12 · Commerce',
    subjects: [
      'Accountancy', 'Business Studies', 'Economics', 'Mathematics',
      'English Core', 'Physical Education', 'Informatics Practices', 'Entrepreneurship',
    ],
  },
  {
    label: 'Class 11 – 12 · Humanities',
    subjects: [
      'History', 'Political Science', 'Geography', 'Sociology', 'Psychology',
      'Economics', 'English Core', 'Hindi Elective', 'Fine Arts', 'Physical Education',
    ],
  },
]

// Flat list of all unique subjects for autocomplete / search
export const ALL_CBSE_SUBJECTS = [
  ...new Set(CBSE_CLASS_GROUPS.flatMap(g => g.subjects)),
].sort()

// ── Learner syllabus — chapters with granular CBSE sub-concepts ──
// Drives the Learner Memory store, Quiz Me, the reader drawer and the
// exam planner. Concepts are the exact units tracked for mastery.

export const LEARNER_SYLLABUS = [
  {
    classLevel: 'Class 10',
    subject: 'Science',
    chapters: [
      {
        id: 'sci10-light',
        number: 10,
        title: 'Light: Reflection and Refraction',
        summary: 'Laws of reflection, spherical mirrors and image formation, refraction, refractive index, lenses, lens formula and power of a lens.',
        concepts: [
          'Laws of reflection',
          'Image formation by spherical mirrors',
          'Mirror formula and magnification',
          'Refraction and refractive index',
          'Lens formula and power of a lens',
        ],
      },
      {
        id: 'sci10-electricity',
        number: 11,
        title: 'Electricity',
        summary: 'Electric current and circuit, potential difference, Ohm\'s law, resistance and resistivity, series and parallel resistors, heating effect and electric power.',
        concepts: [
          'Electric current and circuit diagrams',
          'Ohm\'s law and V-I relationship',
          'Resistance, resistivity and factors affecting them',
          'Series vs parallel combinations',
          'Heating effect of current and electric power',
        ],
      },
      {
        id: 'sci10-carbon',
        number: 4,
        title: 'Carbon and its Compounds',
        summary: 'Covalent bonding, allotropes of carbon, functional groups, homologous series, nomenclature, ethanol and ethanoic acid.',
        concepts: [
          'Covalent bonding in carbon compounds',
          'Functional groups and homologous series',
          'Nomenclature of carbon compounds',
          'Ethanol and ethanoic acid reactions',
          'Soaps and detergents: micelle formation',
        ],
      },
    ],
  },
  {
    classLevel: 'Class 10',
    subject: 'Mathematics',
    chapters: [
      {
        id: 'math10-trigo',
        number: 8,
        title: 'Introduction to Trigonometry',
        summary: 'Trigonometric ratios of acute angles, ratios of 0°, 30°, 45°, 60° and 90°, identities and complementary angles.',
        concepts: [
          'Trigonometric ratios (sin, cos, tan and reciprocals)',
          'Ratios of 0°, 30°, 45°, 60° and 90°',
          'Trigonometric identities',
          'Complementary angle relationships',
        ],
      },
      {
        id: 'math10-quadratic',
        number: 4,
        title: 'Quadratic Equations',
        summary: 'Standard form, solution by factorisation and by quadratic formula, nature of roots via discriminant.',
        concepts: [
          'Standard form of a quadratic equation',
          'Solution by factorisation',
          'Quadratic formula and discriminant',
          'Nature of roots (real, equal, complex)',
        ],
      },
    ],
  },
  {
    classLevel: 'Class 11',
    subject: 'Physics',
    chapters: [
      {
        id: 'phy11-motion',
        number: 2,
        title: 'Motion in a Straight Line',
        summary: 'Position, path length and displacement, velocity and acceleration, kinematic equations, relative velocity.',
        concepts: [
          'Displacement vs distance',
          'Velocity and acceleration definitions',
          'Kinematic equations for uniform acceleration',
          'Position-time and velocity-time graphs',
          'Relative velocity',
        ],
      },
      {
        id: 'phy11-laws',
        number: 4,
        title: 'Laws of Motion',
        summary: 'Newton\'s three laws, inertia, momentum, impulse, friction and circular motion dynamics.',
        concepts: [
          'Newton\'s first law and inertia',
          'Newton\'s second law: F = ma and momentum',
          'Newton\'s third law: action-reaction pairs',
          'Impulse and force-time graphs',
          'Friction: static and kinetic',
        ],
      },
    ],
  },
  {
    classLevel: 'Class 11',
    subject: 'Chemistry',
    chapters: [
      {
        id: 'chem11-basic',
        number: 1,
        title: 'Some Basic Concepts of Chemistry',
        summary: 'Mole concept, stoichiometry, empirical vs molecular formula, concentration terms.',
        concepts: [
          'Mole concept and Avogadro\'s number',
          'Empirical vs molecular formula',
          'Molarity, molality and mole fraction',
          'Stoichiometry and limiting reagent',
        ],
      },
      {
        id: 'chem11-atom',
        number: 2,
        title: 'Structure of Atom',
        summary: 'Quantum numbers, orbitals and shapes, electronic configuration, Aufbau/Hund/Pauli rules.',
        concepts: [
          'Quantum numbers and their meaning',
          'Shapes of s, p and d orbitals',
          'Aufbau principle and electronic configuration',
          'Hund\'s rule and Pauli exclusion principle',
        ],
      },
    ],
  },
  {
    classLevel: 'Class 11',
    subject: 'Computer Science',
    chapters: [
      {
        id: 'cs11-mysql-ddl',
        number: 9,
        title: 'MySQL Basics & DDL',
        summary: 'Relational model, degree and cardinality, keys, CREATE TABLE with constraints, ALTER TABLE, DROP TABLE and DESC.',
        concepts: [
          'Degree and cardinality',
          'Candidate, primary, foreign and alternate keys',
          'CREATE TABLE with constraints',
          'CHAR vs VARCHAR and DECIMAL(M,D)',
          'ALTER TABLE and DROP TABLE',
        ],
      },
      {
        id: 'cs11-mysql-dml',
        number: 10,
        title: 'MySQL DML & Queries',
        summary: 'INSERT, SELECT with DISTINCT and aliases, WHERE operators, LIKE, IS NULL, UPDATE, DELETE, aggregate functions, GROUP BY and HAVING, joins.',
        concepts: [
          'INSERT INTO (full and partial rows)',
          'SELECT, DISTINCT and column aliases',
          'WHERE operators: BETWEEN, IN, LIKE, IS NULL',
          'UPDATE and DELETE semantics',
          'Aggregate functions and GROUP BY / HAVING',
          'Equi-join, INNER JOIN and NATURAL JOIN',
        ],
      },
    ],
  },
  {
    classLevel: 'Class 11',
    subject: 'English',
    chapters: [
      {
        id: 'eng11-writing',
        number: 0,
        title: 'Grammar & Comprehension Skills',
        summary: 'Tenses, subject-verb agreement, reported speech, determiners and reading-comprehension strategy.',
        concepts: [
          'Tense consistency',
          'Subject-verb agreement',
          'Reported speech transformations',
          'Determiners and error correction',
          'Comprehension: inference and vocabulary in context',
        ],
      },
    ],
  },
]

export function getLearnerChapters() {
  const out = []
  for (const s of LEARNER_SYLLABUS) {
    for (const ch of s.chapters) {
      out.push({ ...ch, subject: s.subject, classLevel: s.classLevel })
    }
  }
  return out
}

export function getLearnerChapter(chapterId) {
  return getLearnerChapters().find((ch) => ch.id === chapterId) || null
}

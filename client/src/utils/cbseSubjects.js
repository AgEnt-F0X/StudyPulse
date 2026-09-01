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

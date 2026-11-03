// SQL Pulse — CBSE Class 11 & 12 Computer Science (083) / Informatics
// Practices (065) SQL campaign. 6 worlds × 4 missions.
//
// Every mission's `solution` is executed through the sqlEngine on a fresh
// seed at runtime to produce the expected target output — the grader and
// the student always see identical semantics.

export const WORLDS = [
  { id: 1, title: 'Relational Foundations & DDL', tag: 'CS 083 · Ch 1-2 / IP 065 · Ch 2', concepts: ['Degree vs Cardinality', 'Candidate / Primary / Foreign / Alternate keys', 'CREATE TABLE', 'CHAR vs VARCHAR', 'INT / FLOAT / DECIMAL(M,D) / DATE', 'Constraints', 'DESC'] },
  { id: 2, title: 'Schema Restructuring (DDL)', tag: 'CS 083 · Ch 2 / IP 065 · Ch 2', concepts: ['ALTER TABLE ADD', 'MODIFY', 'DROP COLUMN', 'ADD / DROP PRIMARY KEY', 'DROP TABLE'] },
  { id: 3, title: 'DML & Precision Filtering', tag: 'CS 083 · Ch 2 / IP 065 · Ch 2', concepts: ['INSERT INTO', 'SELECT', 'DISTINCT', 'aliases', 'WHERE + AND/OR/NOT', 'BETWEEN', 'IN / NOT IN', 'LIKE', 'IS NULL', 'UPDATE', 'DELETE'] },
  { id: 4, title: 'Sorting & Single-Row Functions', tag: 'CS 083 · Ch 2 / IP 065 · Ch 2-3', concepts: ['ORDER BY ASC/DESC', 'String functions', 'Numeric functions', 'Date functions'] },
  { id: 5, title: 'Aggregation & Grouping', tag: 'CS 083 · Ch 2 / IP 065 · Ch 2', concepts: ['SUM / AVG / MAX / MIN', 'COUNT(*) vs COUNT(col)', 'GROUP BY', 'HAVING'] },
  { id: 6, title: 'Joins & Multi-Table Queries', tag: 'CS 083 · Ch 2 / IP 065 · Ch 2', concepts: ['Cartesian product', 'Degree D1+D2 / Cardinality C1×C2', 'Equi-join', 'INNER JOIN … ON', 'NATURAL JOIN', 'Table aliases'] },
]

const XP_PER_MISSION = 40

export const MISSIONS = [
  // ── WORLD 1 — Relational Foundations & DDL ──────────────────
  {
    id: 'w1m1', world: 1, kind: 'quiz', bundle: 'school',
    title: 'Degree, Cardinality & Keys',
    concept: 'Relational model theory',
    brief: [
      'Before writing SQL, pin down the vocabulary the board exam tests every year. Inspect the STUDENT table in the Schema Inspector (8 columns, 12 rows) and answer the four checks below.',
    ],
    questions: [
      {
        q: 'The STUDENT table has 8 columns and 12 rows. Its Degree and Cardinality are:',
        options: ['Degree = 12, Cardinality = 8', 'Degree = 8, Cardinality = 12', 'Degree = 8, Cardinality = 8', 'Degree = 12, Cardinality = 12'],
        answer: 1,
        explain: 'Degree counts COLUMNS (attributes); Cardinality counts ROWS (tuples).',
      },
      {
        q: 'SPORTS.ADMNO references STUDENT.ADMNO. Inside the SPORTS table, ADMNO is a:',
        options: ['Candidate key', 'Primary key', 'Foreign key', 'Alternate key'],
        answer: 2,
        explain: 'A foreign key is a column in one table that references the primary/candidate key of another table.',
      },
      {
        q: 'Which data type always stores exactly the specified number of characters (padding or truncating shorter values)?',
        options: ['VARCHAR(20)', 'CHAR(20)', 'DECIMAL(20,2)', 'INT'],
        answer: 1,
        explain: 'CHAR is fixed-length; VARCHAR is variable-length and stores only what is used.',
      },
      {
        q: 'A candidate key that is NOT chosen as the primary key is called the:',
        options: ['Foreign key', 'Composite key', 'Alternate key', 'Secondary key'],
        answer: 2,
        explain: 'All candidate keys can identify a row uniquely; the unselected ones become alternate keys.',
      },
    ],
    xp: XP_PER_MISSION, hints: [],
  },
  {
    id: 'w1m2', world: 1, kind: 'ddl', bundle: 'school',
    title: 'Inspect a Table with DESC',
    concept: 'DESC / DESCRIBE',
    brief: [
      'Every SQL paper starts with reading a schema. Display the structure of the STUDENT table using the MySQL describe command.',
      'Target: the 6-column MySQL structure report — Field | Type | Null | Key | Default | Extra.',
    ],
    solution: 'DESC STUDENT;',
    required: [{ re: /\b(DESC|DESCRIBE)\b/i, label: 'DESC / DESCRIBE' }],
    xp: XP_PER_MISSION,
    hints: ['DESC takes the table name only — no columns, no WHERE clause.', 'The command is DESC STUDENT; — terminate it with a semicolon.'],
  },
  {
    id: 'w1m3', world: 1, kind: 'ddl', bundle: 'school',
    title: 'CREATE TABLE with Constraints',
    concept: 'CREATE TABLE, data types, constraints',
    brief: [
      'Create a table MARKS with exactly these columns and constraints:',
      'ADMNO CHAR(6) as PRIMARY KEY · NAME VARCHAR(25) NOT NULL · SUBJECT VARCHAR(15) with DEFAULT \'CS\' · SCORES DECIMAL(5,2).',
      'Finish by displaying the new table\'s structure with DESC — that structure report is the graded output.',
    ],
    solution: "CREATE TABLE MARKS (ADMNO CHAR(6) PRIMARY KEY, NAME VARCHAR(25) NOT NULL, SUBJECT VARCHAR(15) DEFAULT 'CS', SCORES DECIMAL(5,2)); DESC MARKS;",
    required: [
      { re: /\bPRIMARY\s+KEY\b/i, label: 'PRIMARY KEY' },
      { re: /\bNOT\s+NULL\b/i, label: 'NOT NULL' },
      { re: /\bDEFAULT\b/i, label: 'DEFAULT' },
    ],
    xp: XP_PER_MISSION,
    hints: ['CHAR(6) is fixed length for the admission number; VARCHAR(25) is variable for names.', 'DEFAULT supplies a value when INSERT omits the column: SUBJECT VARCHAR(15) DEFAULT \'CS\'.'],
  },
  {
    id: 'w1m4', world: 1, kind: 'ddl', bundle: 'school',
    title: 'Foreign Key Linkage',
    concept: 'FOREIGN KEY … REFERENCES',
    brief: [
      'Create a table ENROLL that links enrolments to students:',
      'ENRNO INT as PRIMARY KEY · ADMNO CHAR(6) · GAMENAME VARCHAR(20)',
      'with a FOREIGN KEY on ADMNO referencing STUDENT(ADMNO). End with DESC ENROLL.',
    ],
    solution: 'CREATE TABLE ENROLL (ENRNO INT PRIMARY KEY, ADMNO CHAR(6), GAMENAME VARCHAR(20), FOREIGN KEY (ADMNO) REFERENCES STUDENT(ADMNO)); DESC ENROLL;',
    required: [
      { re: /\bFOREIGN\s+KEY\b/i, label: 'FOREIGN KEY' },
      { re: /\bREFERENCES\b/i, label: 'REFERENCES' },
    ],
    xp: XP_PER_MISSION,
    hints: ['The FK is declared table-level: FOREIGN KEY (ADMNO) REFERENCES STUDENT(ADMNO).', 'The referenced column must be a key in the parent table — STUDENT.ADMNO is its PRIMARY KEY.'],
  },

  // ── WORLD 2 — Schema Restructuring ──────────────────────────
  {
    id: 'w2m1', world: 2, kind: 'ddl', bundle: 'employee',
    title: 'ALTER TABLE — ADD a Column',
    concept: 'ALTER TABLE … ADD',
    brief: [
      'EMPLOYEE is getting email addresses. Add a new column EMAIL of type VARCHAR(30) to the EMPLOYEE table, then display its structure with DESC.',
    ],
    solution: 'ALTER TABLE EMPLOYEE ADD COLUMN EMAIL VARCHAR(30); DESC EMPLOYEE;',
    required: [{ re: /\bALTER\s+TABLE\b/i, label: 'ALTER TABLE' }, { re: /\bADD\b/i, label: 'ADD' }],
    xp: XP_PER_MISSION,
    hints: ['ALTER TABLE EMPLOYEE ADD COLUMN EMAIL VARCHAR(30); — structure change, not data change.', 'Existing rows keep NULL in the new column; you can chain DESC EMPLOYEE; after the ALTER.'],
  },
  {
    id: 'w2m2', world: 2, kind: 'ddl', bundle: 'employee',
    title: 'ALTER TABLE — MODIFY a Type',
    concept: 'ALTER TABLE … MODIFY COLUMN',
    brief: [
      'Salaries are outgrowing their precision. Change the data type of SALARY in EMPLOYEE to DECIMAL(9,2) using MODIFY, then DESC the table.',
      'Target: the SALARY row must report Type = DECIMAL(9,2).',
    ],
    solution: 'ALTER TABLE EMPLOYEE MODIFY SALARY DECIMAL(9,2); DESC EMPLOYEE;',
    required: [{ re: /\bMODIFY\b/i, label: 'MODIFY' }],
    xp: XP_PER_MISSION,
    hints: ['MODIFY restates the whole column definition: ALTER TABLE EMPLOYEE MODIFY SALARY DECIMAL(9,2);', 'MODIFY can also add/remove NOT NULL in the same statement.'],
  },
  {
    id: 'w2m3', world: 2, kind: 'ddl', bundle: 'employee',
    title: 'DROP COLUMN + ADD PRIMARY KEY',
    concept: 'ALTER TABLE … DROP COLUMN / ADD PRIMARY KEY',
    brief: [
      'Two restructures in one pass on EMPLOYEE:',
      '1. Remove the obsolete MGR column.',
      '2. Promote EMPNO to PRIMARY KEY.',
      'Finish with DESC EMPLOYEE — MGR must be gone and EMPNO must show Key = PRI.',
    ],
    solution: 'ALTER TABLE EMPLOYEE DROP COLUMN MGR; ALTER TABLE EMPLOYEE ADD PRIMARY KEY (EMPNO); DESC EMPLOYEE;',
    required: [
      { re: /\bDROP\s+(?:COLUMN\s+)?(?!PRIMARY\b|KEY\b|INDEX\b|FOREIGN\b|CONSTRAINT\b|CHECK\b)[A-Za-z_]/i, label: 'DROP COLUMN' },
      { re: /\bADD\s+PRIMARY\s+KEY\b/i, label: 'ADD PRIMARY KEY' },
    ],
    xp: XP_PER_MISSION,
    hints: ['DROP COLUMN is permanent for that column and its data — DDL has no undo here beyond Reset DB.', 'ADD PRIMARY KEY (EMPNO) works because every EMPNO value is unique and NOT NULL.'],
  },
  {
    id: 'w2m4', world: 2, kind: 'ddl', bundle: 'employee',
    title: 'DROP PRIMARY KEY + DROP TABLE',
    concept: 'ALTER TABLE … DROP PRIMARY KEY, DROP TABLE, SHOW TABLES',
    brief: [
      'Cleanup pass:',
      '1. Remove the PRIMARY KEY constraint from DEPT.',
      '2. Destroy the legacy DEPT_BACKUP table entirely.',
      'Finish with SHOW TABLES; — the graded output must list DEPT and EMPLOYEE only.',
    ],
    solution: 'ALTER TABLE DEPT DROP PRIMARY KEY; DROP TABLE DEPT_BACKUP; SHOW TABLES;',
    required: [
      { re: /\bDROP\s+PRIMARY\s+KEY\b/i, label: 'DROP PRIMARY KEY' },
      { re: /\bDROP\s+TABLE\b/i, label: 'DROP TABLE' },
      { re: /\bSHOW\s+TABLES\b/i, label: 'SHOW TABLES' },
    ],
    xp: XP_PER_MISSION,
    hints: ['DROP PRIMARY KEY removes the constraint, not the column — the data stays.', 'DROP TABLE removes the whole relation; SHOW TABLES afterwards proves the catalog state.'],
  },

  // ── WORLD 3 — DML & Precision Filtering ─────────────────────
  {
    id: 'w3m1', world: 3, kind: 'dml', bundle: 'school',
    title: 'INSERT — Full Row & Partial Row',
    concept: 'INSERT INTO (all columns / specific columns)',
    brief: [
      'Enrol two new sports rows:',
      '1. Full row: ADMNO \'A1010\', GAMENAME \'Chess\', COACH \'Mr. Rao\', FEE 250.',
      '2. Partial row: only ADMNO \'A1011\' and GAMENAME \'Football\' — COACH and FEE must stay NULL.',
      'Verify with SELECT * FROM SPORTS WHERE ADMNO IN (\'A1010\', \'A1011\'); — that 2-row output is graded.',
    ],
    solution: "INSERT INTO SPORTS VALUES ('A1010','Chess','Mr. Rao',250); INSERT INTO SPORTS (ADMNO, GAMENAME) VALUES ('A1011','Football'); SELECT * FROM SPORTS WHERE ADMNO IN ('A1010','A1011');",
    required: [{ re: /\bINSERT\s+INTO\b/i, label: 'INSERT INTO' }],
    xp: XP_PER_MISSION,
    hints: ['A full-row INSERT lists values for every column in table order; a partial INSERT names the columns first.', 'Columns omitted from a partial INSERT receive NULL (or the column DEFAULT).'],
  },
  {
    id: 'w3m2', world: 3, kind: 'query', bundle: 'school',
    title: 'DISTINCT + Aliases + WHERE',
    concept: 'SELECT DISTINCT, AS, relational operators',
    brief: [
      'Report the distinct cities (aliased CITY_NAME via AS) of every student whose MARKS exceed 80.',
      'Target: one column CITY_NAME, 4 rows — students scoring above 80 live in 4 distinct cities.',
    ],
    solution: 'SELECT DISTINCT CITY AS CITY_NAME FROM STUDENT WHERE MARKS > 80;',
    required: [{ re: /\bAS\b/i, label: 'column alias (AS)' }],
    xp: XP_PER_MISSION,
    hints: ['DISTINCT collapses duplicate rows — place it right after SELECT.', 'NULL marks never satisfy MARKS > 80 — the comparison is unknown for them, so they drop out on their own.'],
  },
  {
    id: 'w3m3', world: 3, kind: 'query', bundle: 'hospital',
    title: 'BETWEEN + IN + LIKE',
    concept: 'Range, set and pattern filtering',
    brief: [
      'From HOSPITAL, display PNO, PNAME and DOCNAME for patients meeting ALL of:',
      "ADMIT BETWEEN '2024-01-01' AND '2024-06-30' · DISEASE IN ('Fever', 'Fracture') · DOCNAME LIKE 'Dr. A%'.",
      'Target: 3 rows.',
    ],
    solution: "SELECT PNO, PNAME, DOCNAME FROM HOSPITAL WHERE ADMIT BETWEEN '2024-01-01' AND '2024-06-30' AND DISEASE IN ('Fever','Fracture') AND DOCNAME LIKE 'Dr. A%';",
    required: [],
    xp: XP_PER_MISSION,
    hints: ["BETWEEN is inclusive on both bounds — '2024-06-30' admissions count.", "LIKE 'Dr. A%' matches any doctor name starting with 'Dr. A'; % swallows the rest of the string, _ replaces exactly one character."],
  },
  {
    id: 'w3m4', world: 3, kind: 'dml', bundle: 'hospital',
    title: 'IS NULL + UPDATE + DELETE',
    concept: 'NULL filtering, DML mutations',
    brief: [
      'Three operations on HOSPITAL:',
      '1. UPDATE: set CHARGES = 1500 for every patient whose DISCHARGE_DATE IS NULL (still admitted).',
      "2. DELETE: remove all rows where DISEASE = 'Gastritis'.",
      '3. SELECT: display PNO, PNAME, CHARGES, DISCHARGE_DATE for every remaining row — this is graded.',
    ],
    solution: "UPDATE HOSPITAL SET CHARGES = 1500 WHERE DISCHARGE_DATE IS NULL; DELETE FROM HOSPITAL WHERE DISEASE = 'Gastritis'; SELECT PNO, PNAME, CHARGES, DISCHARGE_DATE FROM HOSPITAL;",
    required: [{ re: /\bIS\s+NULL\b/i, label: 'IS NULL' }],
    xp: XP_PER_MISSION,
    hints: ['UPDATE … SET pairs column = value, and the WHERE decides which rows mutate — omit WHERE and every row changes.', 'DELETE FROM removes whole rows; the structure survives. Compare with DROP TABLE which destroys the table itself.'],
  },

  // ── WORLD 4 — Sorting & Single-Row Functions ────────────────
  {
    id: 'w4m1', world: 4, kind: 'query', bundle: 'school',
    title: 'ORDER BY — Multi-Key Sort',
    concept: 'ORDER BY ASC / DESC',
    brief: [
      'Display NAME and MARKS of class \'12\' students, sorted by MARKS in descending order; break ties alphabetically by NAME ascending.',
      'Target: 6 rows (NULL marks sort last in DESC — same rule as MySQL).',
    ],
    solution: "SELECT NAME, MARKS FROM STUDENT WHERE CLASS = '12' ORDER BY MARKS DESC, NAME ASC;",
    required: [{ re: /\bDESC\b/i, label: 'DESC sort direction' }],
    xp: XP_PER_MISSION,
    hints: ['ORDER BY MARKS DESC, NAME ASC — the second key only applies when the first key ties.', 'ASC is the default direction; writing it explicitly is fine.'],
  },
  {
    id: 'w4m2', world: 4, kind: 'query', bundle: 'hospital',
    title: 'String Functions',
    concept: 'UCASE / LCASE / LENGTH / MID',
    brief: [
      "For HOSPITAL rows where DISEASE = 'Fever', display in one query:",
      'PNAME · UCASE(PNAME) aliased UPPER_NAME · LENGTH(PNAME) aliased NAME_LEN · MID(PNAME, 1, 4) aliased PREFIX.',
      'Target: 4 rows.',
    ],
    solution: "SELECT PNAME, UCASE(PNAME) AS UPPER_NAME, LENGTH(PNAME) AS NAME_LEN, MID(PNAME, 1, 4) AS PREFIX FROM HOSPITAL WHERE DISEASE = 'Fever';",
    required: [],
    xp: XP_PER_MISSION,
    hints: ['MID(s, pos, len) is 1-based: MID(PNAME, 1, 4) takes the first 4 characters.', "UCASE/LCASE are the MySQL spellings of UPPER/LOWER — the board expects both to be recognised."],
  },
  {
    id: 'w4m3', world: 4, kind: 'query', bundle: 'school',
    title: 'Numeric Functions',
    concept: 'ROUND / TRUNCATE / POW',
    brief: [
      "For every student whose CITY = 'Jaipur', display:",
      'NAME · MARKS · ROUND(MARKS, 0) aliased ROUNDED · TRUNCATE(MARKS, 1) aliased TRUNC_VAL · POW(MARKS, 2) aliased SQUARE.',
      'Target: 4 rows — ROUND rounds, TRUNCATE chops without rounding.',
    ],
    solution: "SELECT NAME, MARKS, ROUND(MARKS, 0) AS ROUNDED, TRUNCATE(MARKS, 1) AS TRUNC_VAL, POW(MARKS, 2) AS SQUARE FROM STUDENT WHERE CITY = 'Jaipur';",
    required: [],
    xp: XP_PER_MISSION,
    hints: ['ROUND(92.75, 0) = 93; TRUNCATE(92.75, 1) = 92.7 — no rounding, digits are cut.', 'POW(MARKS, 2) squares the value; MOD(a, b) gives the remainder if you need it later.'],
  },
  {
    id: 'w4m4', world: 4, kind: 'query', bundle: 'hospital',
    title: 'Date Functions',
    concept: 'YEAR / MONTHNAME / DAYNAME',
    brief: [
      'Display PNO, PNAME and the admission date parts for 2024 patients:',
      'YEAR(ADMIT) aliased ADMIT_YEAR · MONTHNAME(ADMIT) aliased ADMIT_MONTH · DAYNAME(ADMIT) aliased ADMIT_DAY.',
      'Filter with WHERE YEAR(ADMIT) = 2024. Target: 6 rows.',
    ],
    solution: "SELECT PNO, PNAME, YEAR(ADMIT) AS ADMIT_YEAR, MONTHNAME(ADMIT) AS ADMIT_MONTH, DAYNAME(ADMIT) AS ADMIT_DAY FROM HOSPITAL WHERE YEAR(ADMIT) = 2024;",
    required: [],
    xp: XP_PER_MISSION,
    hints: ['YEAR / MONTH / DAY extract numbers; MONTHNAME / DAYNAME return words like April / Tuesday.', 'CURDATE() and NOW() return the current date / timestamp — handy for ageing queries.'],
  },

  // ── WORLD 5 — Aggregation & Grouping ────────────────────────
  {
    id: 'w5m1', world: 5, kind: 'query', bundle: 'employee',
    title: 'Aggregate Fundamentals',
    concept: 'MAX / MIN / SUM / AVG',
    brief: [
      'In ONE row, report over EMPLOYEE.SALARY:',
      'MAX(SALARY) aliased MAX_SAL · MIN(SALARY) aliased MIN_SAL · SUM(SALARY) aliased TOTAL_SAL · AVG(SALARY) aliased AVG_SAL.',
    ],
    solution: 'SELECT MAX(SALARY) AS MAX_SAL, MIN(SALARY) AS MIN_SAL, SUM(SALARY) AS TOTAL_SAL, AVG(SALARY) AS AVG_SAL FROM EMPLOYEE;',
    required: [],
    xp: XP_PER_MISSION,
    hints: ['Aggregate functions collapse many rows into one summary row — no GROUP BY needed for the whole table.', 'AVG ignores NULLs entirely; it is SUM(non-NULL) / COUNT(non-NULL).'],
  },
  {
    id: 'w5m2', world: 5, kind: 'query', bundle: 'employee',
    title: 'COUNT(*) vs COUNT(col)',
    concept: 'Trap 3 — NULL-aware counting',
    brief: [
      'Report in one row over EMPLOYEE:',
      'COUNT(*) aliased ALL_ROWS · COUNT(COMM) aliased WITH_COMM.',
      'COMM contains NULLs — COUNT(COMM) must ignore them. Target: ALL_ROWS = 9, WITH_COMM = 4.',
    ],
    solution: 'SELECT COUNT(*) AS ALL_ROWS, COUNT(COMM) AS WITH_COMM FROM EMPLOYEE;',
    required: [
      { re: /\bCOUNT\s*\(\s*\*\s*\)/i, label: 'COUNT(*) — includes NULL rows' },
      { re: /\bCOUNT\s*\(\s*COMM\s*\)/i, label: 'COUNT(COMM) — ignores NULLs' },
    ],
    trapChecks: [{
      id: 'count-star-only',
      trap: 'Trap 3',
      title: 'COUNT(*) used where COUNT(col) is required',
      message: 'COUNT(*) counts every row including NULLs; COUNT(column) counts only non-NULL values of that column. This mission needs both forms side by side.',
    }],
    xp: XP_PER_MISSION,
    hints: ['COUNT(*) = total tuples (9 here). COUNT(COMM) skips rows where COMM IS NULL.', 'COUNT(DISTINCT col) is a valid third form if you ever need unique counts.'],
  },
  {
    id: 'w5m3', world: 5, kind: 'query', bundle: 'employee',
    title: 'GROUP BY',
    concept: 'Grouping rows',
    brief: [
      'Per department, report: DEPTNO · COUNT(*) aliased NUM_EMP · AVG(SALARY) aliased AVG_SAL.',
      'Target: 3 rows (departments 10, 20, 30). The result must be produced by GROUP BY — hardcoding rows is rejected.',
    ],
    solution: 'SELECT DEPTNO, COUNT(*) AS NUM_EMP, AVG(SALARY) AS AVG_SAL FROM EMPLOYEE GROUP BY DEPTNO;',
    required: [],
    xp: XP_PER_MISSION,
    hints: ['Every column in the SELECT list must be either grouped (DEPTNO) or aggregated (COUNT, AVG).', 'GROUP BY DEPTNO partitions the 9 rows into 3 groups before aggregation runs.'],
  },
  {
    id: 'w5m4', world: 5, kind: 'query', bundle: 'employee',
    title: 'HAVING — Filtering Groups',
    concept: 'Trap 2 — HAVING vs WHERE',
    brief: [
      'Show DEPTNO and AVG(SALARY) aliased AVG_SAL for departments whose average salary exceeds 50000 — using GROUP BY … HAVING.',
      'Target: 2 rows. WHERE would be rejected here; the filter must be HAVING.',
    ],
    solution: 'SELECT DEPTNO, AVG(SALARY) AS AVG_SAL FROM EMPLOYEE GROUP BY DEPTNO HAVING AVG(SALARY) > 50000;',
    required: [],
    xp: XP_PER_MISSION,
    hints: ['HAVING sits after GROUP BY and filters the aggregated groups, not the raw rows.', 'Sequence: FROM → WHERE (rows) → GROUP BY → HAVING (groups) → SELECT → ORDER BY.'],
  },

  // ── WORLD 6 — Joins & Multi-Table Queries ───────────────────
  {
    id: 'w6m1', world: 6, kind: 'query', bundle: 'org',
    title: 'Cartesian Product',
    concept: 'CROSS JOIN, Degree D1+D2, Cardinality C1×C2',
    brief: [
      'Produce the Cartesian product of DEPT (4 rows, degree 3) and GAMES (3 rows, degree 3).',
      'Write SELECT * FROM DEPT CROSS JOIN GAMES; — Target: 12 rows × 6 columns — Degree = D1 + D2 = 6, Cardinality = C1 × C2 = 12.',
    ],
    solution: 'SELECT * FROM DEPT CROSS JOIN GAMES;',
    required: [{ re: /\bCROSS\s+JOIN\b|FROM\s+DEPT\s*,\s*GAMES/i, label: 'CROSS JOIN (or comma join)' }],
    xp: XP_PER_MISSION,
    hints: ['Every DEPT row pairs with every GAMES row: cardinality = 4 × 3 = 12.', 'Degree adds: 3 + 3 = 6 columns in the product.'],
  },
  {
    id: 'w6m2', world: 6, kind: 'query', bundle: 'employee',
    title: 'Equi-Join via WHERE',
    concept: 'Join with equality predicate',
    brief: [
      'Join EMPLOYEE and DEPT on matching DEPTNO using a WHERE equality predicate (no JOIN keyword yet). Display ENAME, SALARY and DNAME, qualifying columns with full table names.',
      'Target: 9 rows.',
    ],
    solution: 'SELECT EMPLOYEE.ENAME, EMPLOYEE.SALARY, DEPT.DNAME FROM EMPLOYEE, DEPT WHERE EMPLOYEE.DEPTNO = DEPT.DEPTNO;',
    required: [
      { re: /\bWHERE\b/i, label: 'WHERE join predicate' },
      { re: /\bEMPLOYEE\s*\.\s*DEPTNO\s*=\s*DEPT\s*\.\s*DEPTNO\b|\bDEPT\s*\.\s*DEPTNO\s*=\s*EMPLOYEE\s*\.\s*DEPTNO\b/i, label: 'A.col = B.col equality condition' },
    ],
    xp: XP_PER_MISSION,
    hints: ['Without the WHERE condition you get the Cartesian product (36 rows); the equality keeps only matching pairs (9 rows).', 'Qualify ambiguous columns as TABLE.COLUMN — both tables have a DEPTNO.'],
  },
  {
    id: 'w6m3', world: 6, kind: 'query', bundle: 'employee',
    title: 'INNER JOIN … ON with Aliases',
    concept: 'INNER JOIN, table aliases',
    brief: [
      'Rewrite the previous join in modern form: FROM EMPLOYEE E INNER JOIN DEPT D ON E.DEPTNO = D.DEPTNO (short aliases as in the brief). Display E.ENAME, E.SALARY, D.DNAME.',
      'Target: 9 rows — same data as the WHERE equi-join.',
    ],
    solution: 'SELECT E.ENAME, E.SALARY, D.DNAME FROM EMPLOYEE E INNER JOIN DEPT D ON E.DEPTNO = D.DEPTNO;',
    required: [
      { re: /\bINNER\s+JOIN\b/i, label: 'INNER JOIN' },
      { re: /\bON\b/i, label: 'ON condition' },
    ],
    xp: XP_PER_MISSION,
    hints: ['The alias is defined right after the table name: EMPLOYEE E — then E replaces EMPLOYEE everywhere.', 'INNER JOIN … ON and the WHERE equi-join return identical rows; ON separates join logic from filters.'],
  },
  {
    id: 'w6m4', world: 6, kind: 'query', bundle: 'library',
    title: 'NATURAL JOIN',
    concept: 'NATURAL JOIN on shared columns',
    brief: [
      'BOOKS and ISSUED share the column BNO. Use NATURAL JOIN to display SNAME, BNAME, ISSUE_DATE for every issued book.',
      'Target: 7 rows — the join matches rows on BNO automatically.',
    ],
    solution: 'SELECT SNAME, BNAME, ISSUE_DATE FROM BOOKS NATURAL JOIN ISSUED;',
    required: [{ re: /\bNATURAL\s+JOIN\b/i, label: 'NATURAL JOIN' }],
    xp: XP_PER_MISSION,
    hints: ['NATURAL JOIN implicitly equates ALL shared columns — here only BNO.', 'Book 103 is issued twice, so it appears twice in the result.'],
  },
]

export function getWorldMissions(worldId) {
  return MISSIONS.filter((m) => m.world === worldId)
}

export function getMission(id) {
  return MISSIONS.find((m) => m.id === id) || null
}

export function getMissionWorld(mission) {
  return WORLDS.find((w) => w.id === mission?.world) || null
}

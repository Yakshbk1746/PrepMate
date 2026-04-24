

// ── Subject List (customize per exam) ────────────────────────────────────────
const GATE_CSE_SUBJECTS = [
  'Algorithms',
  'Data Structures',
  'Operating Systems',
  'DBMS',
  'Computer Networks',
  'Theory of Computation',
  'Discrete Mathematics',
  'Compiler Design',
  'Digital Logic',
  'Computer Organization',
  'Programming',
  'General Aptitude',
  'Engineering Mathematics',
  'Revision',
];

const GATE_ECE_SUBJECTS = [
  'Engineering Mathematics',
  'Network Theory',
  'Signals and Systems',
  'Electronic Devices',
  'Analog Circuits',
  'Digital Circuits',
  'Control Systems',
  'Communications',
  'Electromagnetics',
  'General Aptitude',
  'Revision',
];

const GATE_EE_SUBJECTS = [
  'Engineering Mathematics',
  'Electric Circuits',
  'Electromagnetic Fields',
  'Signals and Systems',
  'Electrical Machines',
  'Power Systems',
  'Control Systems',
  'Electrical Measurements',
  'Analog and Digital Electronics',
  'General Aptitude',
  'Revision',
];

const GATE_ME_SUBJECTS = [
  'Engineering Mathematics',
  'Applied Mechanics',
  'Strength of Materials',
  'Theory of Machines',
  'Fluid Mechanics',
  'Heat Transfer',
  'Thermodynamics',
  'Manufacturing',
  'Industrial Engineering',
  'General Aptitude',
  'Revision',
];

const GATE_CE_SUBJECTS = [
  'Engineering Mathematics',
  'Structural Engineering',
  'Geotechnical Engineering',
  'Water Resources',
  'Environmental Engineering',
  'Transportation Engineering',
  'Surveying',
  'Construction Management',
  'General Aptitude',
  'Revision',
];

const JEE_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Mock Tests', 'Revision'];
const NEET_SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Mock Tests', 'Revision'];
const CAT_SUBJECTS = ['VARC', 'DILR', 'Quantitative Aptitude', 'Mock Tests', 'Revision'];
const UPSC_SUBJECTS = ['History', 'Geography', 'Polity', 'Economy', 'Environment', 'Science and Tech', 'Current Affairs', 'CSAT', 'Essay', 'Revision'];
const SSC_SUBJECTS = ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness', 'Mock Tests', 'Revision'];
const CLAT_SUBJECTS = ['Legal Reasoning', 'Logical Reasoning', 'English', 'Current Affairs', 'Quantitative Techniques', 'Mock Tests', 'Revision'];
const NDA_SUBJECTS = ['Mathematics', 'General Ability Test', 'English', 'Science', 'Mock Tests', 'Revision'];

const EXAM_SUBJECTS = {
  gate: {
    cse: GATE_CSE_SUBJECTS,
    ece: GATE_ECE_SUBJECTS,
    ee: GATE_EE_SUBJECTS,
    me: GATE_ME_SUBJECTS,
    ce: GATE_CE_SUBJECTS,
    default: GATE_CSE_SUBJECTS,
  },
  jee: JEE_SUBJECTS,
  neet: NEET_SUBJECTS,
  cat: CAT_SUBJECTS,
  upsc: UPSC_SUBJECTS,
  'ssc cgl': SSC_SUBJECTS,
  'ssc chsl': SSC_SUBJECTS,
  clat: CLAT_SUBJECTS,
  nda: NDA_SUBJECTS,
};

const FALLBACK_SUBJECTS = GATE_CSE_SUBJECTS;

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const normalizeGateStream = (stream) => {
  const s = normalizeText(stream);
  if (!s) return 'default';
  if (s.includes('cse') || s.includes('computer')) return 'cse';
  if (s.includes('ece') || s.includes('electronics')) return 'ece';
  if (s === 'ee' || s.includes('electrical')) return 'ee';
  if (s === 'me' || s.includes('mechanical')) return 'me';
  if (s === 'ce' || s.includes('civil')) return 'ce';
  return 'default';
};

const normalizeExamKey = (exam) => {
  const e = normalizeText(exam);
  if (!e) return 'gate';
  if (e.includes('gate')) return 'gate';
  if (e.includes('upsc')) return 'upsc';
  if (e.includes('ssc cgl')) return 'ssc cgl';
  if (e.includes('ssc chsl')) return 'ssc chsl';
  if (e.includes('cat')) return 'cat';
  if (e.includes('jee')) return 'jee';
  if (e.includes('neet')) return 'neet';
  if (e.includes('clat')) return 'clat';
  if (e.includes('nda')) return 'nda';
  return 'gate';
};

const TOPICS_BY_SUBJECT = {
  'Algorithms': ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Greedy', 'Backtracking', 'Sorting'],
  'Data Structures': ['Stacks', 'Queues', 'Hashing', 'Heaps', 'Binary Search Trees'],
  'Operating Systems': ['Process Mgmt', 'CPU Scheduling', 'Deadlocks', 'Memory Mgmt', 'File Systems', 'Virtual Memory'],
  'DBMS': ['ER Model', 'SQL', 'Normalization', 'Transactions', 'Indexing', 'Concurrency'],
  'Computer Networks': ['OSI Model', 'TCP/IP', 'Routing', 'Network Security', 'DNS', 'HTTP'],
  'Theory of Computation': ['Automata', 'Grammars', 'Turing Machines', 'Decidability', 'Regular Expressions'],
  'Discrete Mathematics': ['Logic', 'Sets and Relations', 'Combinatorics', 'Graph Theory', 'Recurrence Relations'],
  'Compiler Design': ['Lexical Analysis', 'Parsing', 'Syntax Directed Translation', 'Code Generation'],
  'Digital Logic': ['Boolean Algebra', 'Logic Gates', 'Combinational Circuits', 'Sequential Circuits', 'Number Systems'],
  'Computer Organization': ['Machine Instructions', 'Addressing Modes', 'ALU', 'Memory Hierarchy', 'I/O Interface'],
  'Programming': ['C Basics', 'Pointers', 'Functions', 'Recursion', 'Scope'],
  'General Aptitude': ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'],
  'Engineering Mathematics': ['Linear Algebra', 'Calculus', 'Probability', 'Discrete Mathematics'],
  'Mathematics': ['Algebra', 'Calculus', 'Coordinate Geometry', 'Probability'],
  'Physics': ['Mechanics', 'Electrodynamics', 'Modern Physics', 'Optics'],
  'Chemistry': ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry'],
  'Biology': ['Botany', 'Zoology', 'Human Physiology', 'Genetics'],
  'VARC': ['Reading Comprehension', 'Para Jumbles', 'Summary', 'Critical Reasoning'],
  'DILR': ['Data Interpretation', 'Bar Graphs', 'Puzzles', 'Arrangements'],
  'Quantitative Aptitude': ['Number System', 'Arithmetic', 'Algebra', 'Geometry'],
  'History': ['Ancient', 'Medieval', 'Modern India', 'World History'],
  'Geography': ['Physical Geography', 'Indian Geography', 'Maps', 'Resources'],
  'Polity': ['Constitution', 'Parliament', 'Judiciary', 'Governance'],
  'Economy': ['Macroeconomics', 'Budget', 'Banking', 'Inflation'],
  'Environment': ['Ecology', 'Biodiversity', 'Climate Change', 'Conventions'],
  'Science and Tech': ['Space', 'Biotech', 'Computing', 'Defence Tech'],
  'Current Affairs': ['National', 'International', 'Schemes', 'Reports'],
  'CSAT': ['Comprehension', 'Reasoning', 'Decision Making', 'Basic Numeracy'],
  'Essay': ['Social Topics', 'Economy Topics', 'Governance Topics'],
  'Legal Reasoning': ['Legal Principles', 'Contracts', 'Torts', 'Criminal Law'],
  'Logical Reasoning': ['Syllogisms', 'Critical Reasoning', 'Statements', 'Puzzles'],
  'English': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Cloze Test'],
  'General Awareness': ['Static GK', 'Current Affairs', 'History', 'Science'],
  'General Ability Test': ['English', 'GK', 'Science', 'Current Affairs'],
  'Science': ['Physics Basics', 'Chemistry Basics', 'Biology Basics'],
  'Mock Tests': ['Full Mock 1', 'Full Mock 2', 'Sectional Mock'],
  'Revision': ['Full Sylabus Test', 'Subject wise PYQs', 'Formula Revision'],
};

const SUBJECT_COLORS = {
  'Algorithms': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', accent: 'bg-blue-500' },
  'Operating Systems': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500' },
  'DBMS': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', accent: 'bg-purple-500' },
  'Theory of Computation': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', accent: 'bg-orange-500' },
  'Discrete Mathematics': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', accent: 'bg-amber-500' },
  'Digital Logic': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: 'bg-cyan-500' },
  'Computer Organization': { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', accent: 'bg-pink-500' },
  'General Aptitude': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', accent: 'bg-yellow-500' },
  'Revision': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500' },
  // Default/Fallback
  'default': { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', accent: 'bg-slate-500' }
};

const DYNAMIC_PALETTE = [
  { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', accent: 'bg-rose-500' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', accent: 'bg-amber-500' },
  { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-400', accent: 'bg-lime-500' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500' },
  { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', accent: 'bg-teal-500' },
  { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', accent: 'bg-sky-500' },
  { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', accent: 'bg-indigo-500' },
  { bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', accent: 'bg-fuchsia-500' },
];

const stringToHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

// ── Helper Functions ──────────────────────────────────────────────────────────
const getMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
};

const getWeekRange = (year, month, weekNumber) => {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(1 + ((weekNumber - 1) * 7));
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return { start: startDate, end: endDate };
};

// ── Main Service ──────────────────────────────────────────────────────────────
export const plannerService = {

  resolveProfile(profileOrExam, maybeStream) {
    if (typeof profileOrExam === 'object' && profileOrExam !== null) {
      return {
        exam: profileOrExam.exam || 'GATE',
        stream: profileOrExam.stream || '',
      };
    }

    return {
      exam: profileOrExam || 'GATE',
      stream: maybeStream || '',
    };
  },

  // ── Get available subjects ──────────────────────────────────────────────────
  getSubjects(profileOrExam = { exam: 'GATE', stream: '' }, maybeStream = '') {
    const profile = this.resolveProfile(profileOrExam, maybeStream);
    const examKey = normalizeExamKey(profile.exam);
    const sortSubjects = (items) => [...items].sort((a, b) => a.localeCompare(b));

    if (examKey === 'gate') {
      const streamKey = normalizeGateStream(profile.stream);
      const gateMap = EXAM_SUBJECTS.gate;
      return sortSubjects(gateMap[streamKey] || gateMap.default);
    }

    return sortSubjects(EXAM_SUBJECTS[examKey] || FALLBACK_SUBJECTS);
  },

  getTopics(subject) {
    return TOPICS_BY_SUBJECT[subject] || [];
  },

  getSubjectColorObj(subject) {
    if (SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject];
    const hash = stringToHash(subject);
    const index = Math.abs(hash) % DYNAMIC_PALETTE.length;
    return DYNAMIC_PALETTE[index];
  },

  getSubjectColor(subject) {
    return (SUBJECT_COLORS[subject] || SUBJECT_COLORS['default']).accent;
  },

  // ── Yearly Planner: Get subject coverage per month ──────────────────────────
  getYearlyPlan(year = new Date().getFullYear()) {
    // Returns which subjects are studied in which months
    // Backend will store: { userId, year, plans: [{ subject, months: [0,1,2,...] }] }
    return {
      year,
      subjects: this.getSubjects(),
      months: Array.from({ length: 12 }, (_, i) => i), // 0-11
    };
  },

  // ── Monthly Planner: Get weekly topics per subject ──────────────────────────
  getMonthlyPlan(year, month) {
    // Returns topics assigned to each week of the month, per subject
    return {
      year,
      month,
      monthName: getMonthName(month),
      weeks: [1, 2, 3, 4],
      subjects: this.getSubjects(),
    };
  },

  // ── Weekly Planner: Get daily topics ────────────────────────────────────────
  getWeeklyPlan(year, month, weekNumber) {
    const { start, end } = getWeekRange(year, month, weekNumber);
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        date: new Date(d),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: d.toDateString() === new Date().toDateString(),
      });
    }
    return {
      year,
      month,
      weekNumber,
      weekRange: `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      days,
      subjects: this.getSubjects(),
    };
  },

  // ── Daily Planner: Get task list for a specific date ────────────────────────
  getDailyPlan(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: dateStr,
      dateObj: date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      dateLabel: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
  },

  // ── Validation ───────────────────────────────────────────────────────────────
  validateTask(task) {
    const errors = [];
    if (!task.subject || !task.subject.trim()) errors.push('Subject is required');
    if (!task.title || !task.title.trim()) errors.push('Task title is required');
    if (task.estimatedMinutes && task.estimatedMinutes < 1) errors.push('Time estimate must be positive');
    return { valid: errors.length === 0, errors };
  },

  // ── Time Utilities ──────────────────────────────────────────────────────────

  /** Parse "HH:MM" (24h) to minutes since midnight */
  parseTime24h(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },

  /** Calculate duration in minutes from start/end (24h "HH:MM"). Handles day rollover. */
  calculateDuration(startTime, endTime) {
    const startMin = this.parseTime24h(startTime);
    const endMin = this.parseTime24h(endTime);
    if (endMin > startMin) return endMin - startMin;
    if (endMin < startMin) return (24 * 60 - startMin) + endMin; // day rollover
    return 0;
  },

  /** Format minutes into human-readable like "1h 30m" */
  formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  },

  /** Format "HH:MM" (24h) to "h:MM AM/PM" */
  formatTime12h(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  },

};

// ── Mock Data for Development ─────────────────────────────────────────────────
export const mockPlannerData = {

  // Yearly: Subject → Month mappings
  getYearlyData() {
    return {
      'Algorithms': [5, 6, 7], // June, July, Aug
      'Data Structures': [5, 6], // June, July
      'Operating Systems': [6, 7, 8], // July, Aug, Sep
      'DBMS': [7, 8, 9], // Aug, Sep, Oct
      'Computer Networks': [8, 9, 10], // Sep, Oct, Nov
      'Theory of Computation': [9, 10], // Oct, Nov
      'Digital Logic': [10, 11], // Nov, Dec
      'General Aptitude': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // All year
    };
  },

  // Monthly: Week → Topics per subject
  getMonthlyData(subject) {
    const topicsBySubject = {
      'Algorithms': {
        week1: ['Recursion', 'Divide & Conquer'],
        week2: ['Dynamic Programming Basics', 'Knapsack Problem'],
        week3: ['Graph Algorithms - BFS/DFS', 'Shortest Path'],
        week4: ['Greedy Algorithms', 'Backtracking'],
      },
      'Operating Systems': {
        week1: ['Process Management', 'CPU Scheduling'],
        week2: ['Process Synchronization', 'Deadlocks'],
        week3: ['Memory Management', 'Virtual Memory'],
        week4: ['File Systems', 'Disk Scheduling'],
      },
      'DBMS': {
        week1: ['ER Model', 'Relational Model'],
        week2: ['SQL Queries', 'Joins & Subqueries'],
        week3: ['Normalization', 'Functional Dependencies'],
        week4: ['Transactions', 'Concurrency Control'],
      },
    };
    return topicsBySubject[subject] || {
      week1: [`${subject} - Topic 1`, `${subject} - Topic 2`],
      week2: [`${subject} - Topic 3`, `${subject} - Topic 4`],
      week3: [`${subject} - Topic 5`, `${subject} - Topic 6`],
      week4: [`${subject} - Topic 7`, `${subject} - Topic 8`],
    };
  },

  // Weekly: Day → Topics
  getWeeklyData() {
    return {
      'Mon': [
        { subject: 'Algorithms', topic: 'Solve 10 DP problems', color: 'blue' },
        { subject: 'General Aptitude', topic: 'Quantitative - Time & Work', color: 'yellow' },
      ],
      'Tue': [
        { subject: 'Operating Systems', topic: 'CPU Scheduling Algorithms', color: 'violet' },
        { subject: 'General Aptitude', topic: 'Logical Reasoning', color: 'yellow' },
      ],
      'Wed': [
        { subject: 'DBMS', topic: 'Normalization (3NF, BCNF)', color: 'cyan' },
        { subject: 'Algorithms', topic: 'Graph Algorithms - DFS/BFS', color: 'blue' },
      ],
      'Thu': [
        { subject: 'Computer Networks', topic: 'TCP/IP Protocol Suite', color: 'orange' },
      ],
      'Fri': [
        { subject: 'Algorithms', topic: 'Solve GATE PYQ 2023', color: 'blue' },
        { subject: 'Operating Systems', topic: 'Memory Management', color: 'violet' },
      ],
      'Sat': [
        { subject: 'DBMS', topic: 'SQL Practice - Complex Joins', color: 'cyan' },
        { subject: 'General Aptitude', topic: 'Mock Test - Full Aptitude', color: 'yellow' },
      ],
      'Sun': [
        { subject: 'Revision', topic: 'Weekly Revision - All Topics', color: 'emerald' },
      ],
    };
  },

  // Daily: Task list
  getDailyTasks() {
    return [
      {
        id: 1,
        subject: 'Algorithms',
        title: 'Solve 20 problems – Trees & Graphs',
        estimatedMinutes: 120,
        priority: 'high',
        done: false,
      },
      {
        id: 2,
        subject: 'Operating Systems',
        title: 'Read Chapter 4 – Memory Management',
        estimatedMinutes: 60,
        priority: 'medium',
        done: false,
      },
      {
        id: 3,
        subject: 'General Aptitude',
        title: 'Solve 50 Quant problems – Time & Work',
        estimatedMinutes: 90,
        priority: 'medium',
        done: false,
      },
      {
        id: 4,
        subject: 'DBMS',
        title: 'Practice SQL – 20 complex queries',
        estimatedMinutes: 75,
        priority: 'high',
        done: false,
      },
      {
        id: 5,
        subject: 'Algorithms',
        title: 'Watch Abdul Bari – DP Lecture 3',
        estimatedMinutes: 45,
        priority: 'low',
        done: false,
      },
    ];
  },

};


// ── Subject List (customize per exam) ────────────────────────────────────────
const GATE_CSE_SUBJECTS = [
  'Algorithms',
  'Data Structures',
  'Operating Systems',
  'DBMS',
  'Computer Networks',
  'Theory of Computation',
  'Compiler Design',
  'Digital Logic',
  'Computer Organization',
  'Programming',
  'General Aptitude',
  'Engineering Mathematics',
];

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

  // ── Get available subjects ──────────────────────────────────────────────────
  getSubjects() {
    return GATE_CSE_SUBJECTS;
  },

  // ── Yearly Planner: Get subject coverage per month ──────────────────────────
  getYearlyPlan(year = new Date().getFullYear()) {
    // Returns which subjects are studied in which months
    // Backend will store: { userId, year, plans: [{ subject, months: [0,1,2,...] }] }
    return {
      year,
      subjects: GATE_CSE_SUBJECTS,
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
      subjects: GATE_CSE_SUBJECTS,
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
      subjects: GATE_CSE_SUBJECTS,
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
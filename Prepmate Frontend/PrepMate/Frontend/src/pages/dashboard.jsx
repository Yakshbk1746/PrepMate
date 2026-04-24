import React, { useEffect, useMemo, useState } from 'react';
import { 
  RefreshCw, CheckCircle2, Clock, TrendingUp, ArrowUpRight,
  ChevronRight, ChevronLeft, Zap, Quote, Plus, Edit2, Trash2, ExternalLink,
  BarChart2, Play, AlertCircle, X, Save, Award, CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { loginWithGoogle } from '../firebase/authService';
import {
  createTask,
  createDistraction,
  createRevision,
  deleteTask,
  getDeadlines,
  getDashboardData,
  getDashboardStats,
  getDistractions,
  getHabits,
  getReflections,
  markRevisionComplete,
  toggleHabitDate,
  updateTask,
} from '../services/api';
import {
  clearGoogleCalendarToken,
  fetchGoogleCalendarEventsByDate,
  getGoogleCalendarToken,
} from '../services/googleCalendarService';

const fallbackTasks = [
  { id: 1, title: 'Solve 20 DSA problems', completed: false },
  { id: 2, title: 'Read OS Chapter 3', completed: false },
  { id: 3, title: 'Practice SQL queries', completed: true },
  { id: 4, title: 'Revise DP concepts', completed: false },
];

const fallbackRevisions = [
  { id: 1, title: 'Dynamic Programming', subject: 'Algorithms', interval: '1 day', completed: false },
  { id: 2, title: 'Process Scheduling', subject: 'OS', interval: '3 days', completed: false },
  { id: 3, title: 'SQL Queries', subject: 'DBMS', interval: '7 days', completed: false },
];

const toDashboardTasks = (taskList = []) =>
  taskList.map((task) => ({
    id: task.id,
    title: task.title || 'Untitled Task',
    completed: typeof task.completed === 'boolean' ? task.completed : task.status === 'completed',
    date: task.date || null,
  }));

const toDashboardRevisions = (revisionList = []) =>
  revisionList.map((revision) => {
    const intervalDays = revision.intervalDays ?? 1;
    const isCompleted = typeof revision.completed === 'boolean' ? revision.completed : revision.status === 'completed';

    return {
      id: revision.id,
      title: revision.topicName || revision.title || 'Untitled Revision',
      subject: revision.subject || 'General',
      interval: `${intervalDays} day${intervalDays === 1 ? '' : 's'}`,
      completed: isCompleted,
      dueDate: revision.scheduledDate || null,
    };
  });

const parseCompletedDates = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch {
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  return [];
};

const toDashboardHabits = (habitList = []) => {
  const today = new Date().toISOString().split('T')[0];

  return habitList.map((habit) => {
    const completedDates = parseCompletedDates(habit?.completedDates);
    return {
      id: habit?.id,
      label: habit?.name || 'Untitled Habit',
      done: completedDates.includes(today),
      streak: Number.isFinite(Number(habit?.streak)) ? Number(habit.streak) : 0,
      longestStreak: Number.isFinite(Number(habit?.longestStreak)) ? Number(habit.longestStreak) : 0,
      completedDates,
    };
  });
};

const toDashboardDistractions = (distractionList = []) =>
  distractionList.map((item) => {
    const duration = Number.isFinite(Number(item?.duration)) ? Number(item.duration) : 0;
    const rawDate = item?.date ? String(item.date) : '';
    const date = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
    const time = item?.time || '--:--';

    return {
      id: item?.id,
      type: item?.type || item?.source || 'Other',
      time: `${duration} min`,
      minutes: duration,
      timestamp: date ? `${date} ${time}` : time,
    };
  });

const resolveBackendUserId = (user, contextUserId) => {
  // First priority: backendUserId from authContext (most reliable)
  if (contextUserId && Number.isInteger(Number(contextUserId))) return Number(contextUserId);

  const candidateIds = [
    user?.backendUserId,
    user?.id,
    localStorage.getItem('prepmateUserId'),
    localStorage.getItem('backendUserId'),
  ];

  for (const candidate of candidateIds) {
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }

  return null; // return null instead of 1 — never fake a userId
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, backendUserId: contextUserId } = useAuth();
  const userId = useMemo(
    () => resolveBackendUserId(user, contextUserId),
    [contextUserId, user?.backendUserId, user?.id]
  );
  const [tasks, setTasks] = useState([]);
  const [revisions, setRevisions] = useState([]);

  const [distractions, setDistractions] = useState([]);

  const [quickDistType, setQuickDistType] = useState('');
  const [quickDistTime, setQuickDistTime] = useState('');

  const handleAddDistraction = () => {
    if (!quickDistType.trim() || !quickDistTime) return;

    if (!userId) return;

    createDistraction(userId, {
      type: quickDistType.trim(),
      source: quickDistType.trim(),
      duration: Number(quickDistTime),
      impact: 'Medium',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    })
      .then((saved) => {
        setDistractions((prev) => [toDashboardDistractions([saved])[0], ...prev]);
      })
      .catch(console.error);

    setQuickDistType('');
    setQuickDistTime('');
  };

  // Task Modal States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');

  // Revision Modal States
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionData, setRevisionData] = useState({ title: '', subject: '', interval: '1' });
  const [studyHoursText, setStudyHoursText] = useState('0.0h');
  const [streakText, setStreakText] = useState('0 Days');
  const [revisionTrend, setRevisionTrend] = useState('0 active');
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [isLoadingSidebar, setIsLoadingSidebar] = useState(true);
  const [sidebarError, setSidebarError] = useState('');
  const [upcomingDeadline, setUpcomingDeadline] = useState(null);
  const [deadlineDates, setDeadlineDates] = useState([]);
  const [tomorrowPlan, setTomorrowPlan] = useState('');

  const [currentDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [googleEventsByDate, setGoogleEventsByDate] = useState({});
  const [isGoogleCalendarLoading, setIsGoogleCalendarLoading] = useState(false);
  const [googleCalendarError, setGoogleCalendarError] = useState('');
  const [hasGoogleCalendarToken, setHasGoogleCalendarToken] = useState(() => Boolean(getGoogleCalendarToken()));

  const [quoteIdx, setQuoteIdx] = useState(0);
  const quotesList = [
    { type: 'Quote', text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier", color: "text-blue-600 dark:text-blue-400" },
    { type: 'Affirmation', text: "I am becoming better every single day. My focus is unwavering.", author: "Daily Affirmation", color: "text-purple-600 dark:text-purple-400" },
    { type: 'Topper\'s Tip', text: "Focus on understanding the core concepts instead of memorizing logic.", author: "AIR 13", color: "text-emerald-600 dark:text-emerald-400" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % quotesList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoadingDashboard(true);
      setDashboardError('');
      try {
        if (!userId) {
          setIsLoadingDashboard(false);
          return;
        }
        const [data, stats] = await Promise.all([
          getDashboardData(userId),
          getDashboardStats(userId),
        ]);
        if (!isMounted) return;

        setTasks(toDashboardTasks(data.tasks));
        setRevisions(toDashboardRevisions(data.revisions));
        const todayStudyMinutes = Number(stats?.todayStudyMinutes) || 0;
        const currentStreak = Number(stats?.currentMaxStreak) || 0;
        const activeRevisionsCount = Number(stats?.activeRevisions) || 0;

        setStudyHoursText(`${(todayStudyMinutes / 60).toFixed(1)}h`);
        setStreakText(`${currentStreak} Days`);
        setRevisionTrend(`${activeRevisionsCount} active`);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        if (!isMounted) return;

        setTasks(fallbackTasks);
        setRevisions(fallbackRevisions);
        setDashboardError('Failed to load dashboard data.');
      } finally {
        if (isMounted) {
          setIsLoadingDashboard(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    Promise.all([getDeadlines(userId), getReflections(userId)])
      .then(([deadlines, reflections]) => {
        const today = new Date().toISOString().split('T')[0];
        const nextDeadline = (Array.isArray(deadlines) ? deadlines : [])
          .filter((item) => !item.completed && item.date && item.date >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;
        setUpcomingDeadline(nextDeadline);
        setDeadlineDates(
          (Array.isArray(deadlines) ? deadlines : [])
            .filter((item) => !item.completed && item.date)
            .map((item) => item.date)
        );

        const sortedReflections = (Array.isArray(reflections) ? reflections : [])
          .filter((item) => item.tomorrowPlan)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setTomorrowPlan(sortedReflections[0]?.tomorrowPlan || '');
      })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    setHasGoogleCalendarToken(Boolean(getGoogleCalendarToken()));
  }, [user?.uid]);

  useEffect(() => {
    const token = getGoogleCalendarToken();
    if (!token) {
      setGoogleEventsByDate({});
      setGoogleCalendarError('');
      return;
    }

    const monthStart = new Date(Date.UTC(calYear, calMonth, 1));
    const monthEnd = new Date(Date.UTC(calYear, calMonth + 1, 1));

    setIsGoogleCalendarLoading(true);
    setGoogleCalendarError('');

    fetchGoogleCalendarEventsByDate({ token, monthStart, monthEnd })
      .then((eventsByDate) => {
        setGoogleEventsByDate(eventsByDate);
      })
      .catch((error) => {
        console.error(error);
        if (error?.code === 'GOOGLE_CALENDAR_UNAUTHORIZED') {
          clearGoogleCalendarToken();
          setHasGoogleCalendarToken(false);
        }
        setGoogleEventsByDate({});
        setGoogleCalendarError('Unable to sync Google Calendar. Reconnect and try again.');
      })
      .finally(() => {
        setIsGoogleCalendarLoading(false);
      });
  }, [calYear, calMonth, hasGoogleCalendarToken]);

  const connectGoogleCalendar = async () => {
    setGoogleCalendarError('');
    try {
      await loginWithGoogle();
      setHasGoogleCalendarToken(Boolean(getGoogleCalendarToken()));
    } catch (error) {
      setGoogleCalendarError(error?.message || 'Google Calendar connect failed.');
    }
  };
  
  const dailyQuote = quotesList[quoteIdx];

  const completedTasks = tasks.filter(t => t.completed).length;
  const taskProgress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
  const activeRevisions = revisions.filter(r => !r.completed).length;
  const totalDistractionTime = distractions.reduce((sum, d) => sum + (Number.isFinite(Number(d.minutes)) ? Number(d.minutes) : parseInt(d.time, 10) || 0), 0);

  // Task Functions
  const toggleTask = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.completed ? 'todo' : 'completed';
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    updateTask(id, { status: newStatus }).catch(console.error);
  };

  const openTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
    } else {
      setEditingTask(null);
      setTaskTitle('');
    }
    setShowTaskModal(true);
  };

  const saveTask = async () => {
    if (!taskTitle.trim()) return;

    if (!userId) return;

    const trimmedTitle = taskTitle.trim();
    const today = new Date().toISOString().split('T')[0];

    if (editingTask) {
      const prevTasks = tasks;
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, title: trimmedTitle } : t)));

      setShowTaskModal(false);
      setTaskTitle('');
      setEditingTask(null);

      try {
        const updated = await updateTask(editingTask.id, { title: trimmedTitle });
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...updated, completed: typeof updated.completed === 'boolean' ? updated.completed : updated.status === 'completed' } : t)));
      } catch (error) {
        console.error(error);
        setTasks(prevTasks);
      }
      return;
    }

    const tempId = Date.now();
    const optimisticTask = { id: tempId, title: trimmedTitle, completed: false, date: today };
    setTasks((prev) => [...prev, optimisticTask]);
    setShowTaskModal(false);
    setTaskTitle('');
    setEditingTask(null);

    try {
      const saved = await createTask(userId, { title: trimmedTitle, status: 'todo', date: today });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === tempId
            ? {
                ...task,
                ...saved,
                completed: typeof saved?.completed === 'boolean' ? saved.completed : saved?.status === 'completed',
              }
            : task
        )
      );
    } catch (error) {
      console.error(error);
      setTasks((prev) => prev.filter((task) => task.id !== tempId));
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;

    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTask(id);
    } catch (error) {
      console.error(error);
      setTasks(prevTasks);
    }
  };

  // Revision Functions
  const toggleRevision = async (id) => {
    setRevisions((prev) => prev.map((r) => (r.id === id ? { ...r, completed: true } : r)));
    markRevisionComplete(id).catch(console.error);
  };

  const openRevisionModal = () => {
    setRevisionData({ title: '', subject: '', interval: '1' });
    setShowRevisionModal(true);
  };

  const saveRevision = async () => {
    if (!revisionData.title.trim() || !revisionData.subject.trim()) {
      alert('Please fill all fields');
      return;
    }

    if (!userId) return;

    try {
      const saved = await createRevision(userId, {
        topicName: revisionData.title,
        subject: revisionData.subject,
        intervalDays: Number(revisionData.interval),
      });

      setRevisions((prev) => [toDashboardRevisions([saved])[0], ...prev]);
      setShowRevisionModal(false);
      setRevisionData({ title: '', subject: '', interval: '1' });
    } catch (error) {
      console.error(error);
    }
  };

  // Daily Habits state
  const [habits, setHabits] = useState([]);

  const toggleHabit = (id) => {
    const today = new Date().toISOString().split('T')[0];
    let previousHabit = null;

    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== id) return habit;

        previousHabit = habit;

        const completedDates = Array.isArray(habit.completedDates) ? [...habit.completedDates] : [];
        const doneToday = completedDates.includes(today);

        if (doneToday) {
          const nextCompletedDates = completedDates.filter((date) => date !== today);
          return {
            ...habit,
            done: false,
            completedDates: nextCompletedDates,
            streak: Math.max(0, habit.streak - 1),
          };
        }

        const newStreak = habit.streak + 1;
        return {
          ...habit,
          done: true,
          completedDates: [today, ...completedDates],
          streak: newStreak,
          longestStreak: Math.max(newStreak, habit.longestStreak),
        };
      })
    );

    if (!previousHabit) return;

    toggleHabitDate(id, today)
      .then((saved) => {
        setHabits((prev) =>
          prev.map((habit) =>
            habit.id === id ? toDashboardHabits([saved])[0] : habit
          )
        );
      })
      .catch((error) => {
        console.error(error);
        // Revert optimistic toggle if backend fails.
        setHabits((prev) => prev.map((habit) => (habit.id === id ? previousHabit : habit)));
      });
  };

  useEffect(() => {
    let isMounted = true;

    const loadSidebarData = async () => {
      setIsLoadingSidebar(true);
      setSidebarError('');
      try {
        if (!userId) {
          setIsLoadingSidebar(false);
          return;
        }

        const [habitData, distractionData] = await Promise.all([
          getHabits(userId),
          getDistractions(userId),
        ]);

        if (!isMounted) return;
        setHabits(toDashboardHabits(habitData));
        setDistractions(toDashboardDistractions(distractionData));
      } catch (error) {
        console.error('Failed to load habits/distractions:', error);
        if (!isMounted) return;
        setSidebarError('Failed to load habits/distractions.');
      } finally {
        if (isMounted) {
          setIsLoadingSidebar(false);
        }
      }
    };

    loadSidebarData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleQuickAction = (action) => {
    if (action === 'analytics') navigate('/analytics');
    if (action === 'study') navigate('/timers');
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const deadlineDaysLeft = upcomingDeadline
    ? Math.max(
        0,
        Math.ceil((new Date(upcomingDeadline.date) - new Date(new Date().toISOString().split('T')[0])) / (1000 * 60 * 60 * 24))
      )
    : null;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden">
      {isLoadingDashboard && (
        <div className="w-full p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-500 dark:text-slate-300">
          Loading dashboard...
        </div>
      )}
      {dashboardError && (
        <div className="w-full p-3 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-xs text-red-600 dark:text-red-300 flex items-center justify-between gap-3">
          <span>{dashboardError}</span>
          <button
            onClick={() => {
              if (!userId) return;
              setDashboardError('');
              setIsLoadingDashboard(true);
              Promise.all([getDashboardData(userId), getDashboardStats(userId)])
                .then(([data, stats]) => {
                  setTasks(toDashboardTasks(data.tasks));
                  setRevisions(toDashboardRevisions(data.revisions));
                  const todayStudyMinutes = Number(stats?.todayStudyMinutes) || 0;
                  const currentStreak = Number(stats?.currentMaxStreak) || 0;
                  const activeRevisionsCount = Number(stats?.activeRevisions) || 0;
                  setStudyHoursText(`${(todayStudyMinutes / 60).toFixed(1)}h`);
                  setStreakText(`${currentStreak} Days`);
                  setRevisionTrend(`${activeRevisionsCount} active`);
                })
                .catch((error) => {
                  console.error(error);
                })
                .finally(() => setIsLoadingDashboard(false));
            }}
            className="px-2 py-1 rounded bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 font-semibold"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* LEFT COLUMN - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-6 lg:pb-0">
        
        {/* Quote */}
        <div className="glass-panel p-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-violet-50/80 dark:from-blue-600/20 dark:via-violet-600/20 dark:to-blue-600/20 border-blue-200 dark:border-blue-500/30 transition-all duration-500">
          <div className="flex items-start gap-3">
            <Quote className={`${dailyQuote.color} shrink-0 mt-0.5 transition-colors duration-500`} size={20} />
            <div className="animate-in fade-in duration-500" key={quoteIdx}>
              <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${dailyQuote.color}`}>{dailyQuote.type}</div>
              <p className="text-slate-800 dark:text-white font-medium text-sm italic">"{dailyQuote.text}"</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">— {dailyQuote.author}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div onClick={() => navigate('/revision')} className="cursor-pointer">
            <StatCard icon={<RefreshCw size={18} />} title="Active Revisions" value={activeRevisions.toString()} trend={revisionTrend} color="blue" />
          </div>
          <div onClick={() => navigate('/daily')} className="cursor-pointer">
            <StatCard icon={<CheckCircle2 size={18} />} title="Tasks Done" value={`${taskProgress}%`} trend="Above avg" color="emerald" />
          </div>
          <div onClick={() => navigate('/timers')} className="cursor-pointer">
            <StatCard icon={<Clock size={18} />} title="Study Hours" value={studyHoursText} trend="Today" color="violet" />
          </div>
          <div onClick={() => navigate('/habits')} className="cursor-pointer">
            <StatCard icon={<TrendingUp size={18} />} title="Streak" value={streakText} trend="Live" color="orange" />
          </div>
        </div>

        {upcomingDeadline && (
          <div className="glass-panel p-4 bg-gradient-to-r from-red-50/80 to-orange-50/80 dark:from-red-500/10 dark:to-orange-500/10 border-red-200 dark:border-red-500/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-300">Exam Countdown</p>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{upcomingDeadline.title}</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-red-600 dark:text-red-300">{deadlineDaysLeft}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">days left</p>
              </div>
            </div>
          </div>
        )}

        {tomorrowPlan && (
          <div className="glass-panel p-4 border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Tomorrow Plan</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{tomorrowPlan}</p>
          </div>
        )}

        {/* Tasks */}
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <div onClick={() => navigate('/daily')} className="flex items-center gap-2 cursor-pointer group/header">
              <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400 group-hover/header:scale-110 transition-transform" />
              <h2 className="font-semibold text-slate-800 dark:text-white text-sm group-hover/header:text-blue-600 dark:group-hover/header:text-blue-400 transition-colors">Daily Tasks</h2>
              <span className="text-xs text-slate-500">({completedTasks}/{tasks.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/daily')} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 font-bold">
                View All <ExternalLink size={12} />
              </button>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {tasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 group transition-colors">
                <div onClick={() => toggleTask(task.id)} className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                  task.completed ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-300 dark:border-slate-600 group-hover:border-emerald-400'
                }`}>
                  {task.completed && (
                    <svg className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm flex-1 ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{task.title}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openTaskModal(task)} className="p-1 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${taskProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Revisions */}
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <div onClick={() => navigate('/revision')} className="flex items-center gap-2 cursor-pointer group/header">
              <RefreshCw size={16} className="text-blue-500 dark:text-blue-400 group-hover/header:rotate-180 transition-transform duration-500" />
              <h2 className="font-semibold text-slate-800 dark:text-white text-sm group-hover/header:text-blue-600 dark:group-hover/header:text-blue-400 transition-colors">Revision Queue</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/revision')} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 font-bold">
                View All <ExternalLink size={12} />
              </button>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {revisions.slice(0, 3).map((rev) => (
              <div key={rev.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 group transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${rev.completed ? 'bg-slate-300 dark:bg-slate-700' : 'bg-yellow-500 animate-pulse'}`} />
                  <div>
                    <span className={`text-sm font-medium ${rev.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{rev.title}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{rev.subject}</span>
                      <span>•</span>
                      <span>{rev.interval}</span>
                    </div>
                  </div>
                </div>
                {!rev.completed && (
                  <button onClick={() => toggleRevision(rev.id)} className="px-3 py-1 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel p-4">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-3 text-sm flex items-center gap-2">
            <Zap className="text-violet-500 dark:text-violet-400" size={16} />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleQuickAction('study')} className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-left flex items-center gap-2">
              <Play size={14} className="text-violet-500 dark:text-violet-400" />
              <span>Start Study Session</span>
            </button>
            <button onClick={() => handleQuickAction('analytics')} className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-left flex items-center gap-2">
              <BarChart2 size={14} className="text-blue-500 dark:text-blue-400" />
              <span>View Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR - Static */}
      <div className="w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto custom-scrollbar pb-6 lg:pb-0">

        {/* Calendar — navigable */}
        {(() => {
          const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
          const firstDayOffset = new Date(calYear, calMonth, 1).getDay();
          const calMonthName = new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          const isCurrentMonth = calMonth === new Date().getMonth() && calYear === new Date().getFullYear();
          const todayDate = new Date().getDate();
          const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
          const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };
          return (
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                <h2 className="font-semibold text-slate-800 dark:text-white text-sm">{calMonthName}</h2>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"><ChevronRight size={16} /></button>
              </div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {hasGoogleCalendarToken ? (isGoogleCalendarLoading ? 'Syncing Google Calendar...' : 'Google Calendar synced') : 'Google Calendar not connected'}
                </span>
                <button
                  onClick={connectGoogleCalendar}
                  className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                >
                  {hasGoogleCalendarToken ? 'Reconnect' : 'Connect'}
                </button>
              </div>
              {googleCalendarError && (
                <p className="mb-2 text-[10px] text-red-500 dark:text-red-300">{googleCalendarError}</p>
              )}
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-slate-500 font-medium py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[...Array(firstDayOffset)].map((_, i) => <div key={`e-${i}`} />)}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const isToday = isCurrentMonth && day === todayDate;
                  const isoDay = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasTask = tasks.some((task) => task.date === isoDay);
                  const hasRevision = revisions.some((revision) => revision.dueDate === isoDay);
                  const hasDeadline = deadlineDates.includes(isoDay);
                  const googleEventsCount = googleEventsByDate[isoDay] || 0;
                  const hasGoogleEvent = googleEventsCount > 0;
                  return (
                    <div key={day} className={`aspect-square flex items-center justify-center text-xs rounded cursor-pointer transition-all ${
                      isToday ? 'bg-blue-600 dark:bg-blue-500 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}>
                      <span className="relative">
                        {day}
                        {(hasTask || hasRevision || hasDeadline || hasGoogleEvent) && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                            {hasTask && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                            {hasRevision && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                            {hasDeadline && <span className="w-1 h-1 rounded-full bg-red-500" />}
                            {hasGoogleEvent && <span className="w-1 h-1 rounded-full bg-amber-400" title={`${googleEventsCount} Google event(s)`} />}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Today</span>
                  <span className="text-slate-800 dark:text-white font-bold">{studyHoursText}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Distractions */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-500 dark:text-orange-400" />
              Distractions Today
            </h2>
            <button onClick={() => navigate('/distraction')} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              <ExternalLink size={12} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <input 
              type="text" 
              placeholder="What distracted you?" 
              value={quickDistType}
              onChange={(e) => setQuickDistType(e.target.value)}
              className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-400 dark:text-white"
            />
            <input 
              type="number" 
              placeholder="Min" 
              value={quickDistTime}
              onChange={(e) => setQuickDistTime(e.target.value)}
              className="w-16 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-orange-400 dark:text-white"
            />
            <button onClick={handleAddDistraction} className="p-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
            {distractions.map((dist) => (
              <div key={dist.id} className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-800 dark:text-white font-medium">{dist.type}</span>
                  <span className="text-xs text-orange-600 dark:text-orange-400">{dist.time}</span>
                </div>
                <span className="text-xs text-slate-500">{dist.timestamp}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total wasted</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold">{totalDistractionTime} min</span>
            </div>
          </div>
        </div>

        {/* Daily Habits */}
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div onClick={() => navigate('/habits')} className="flex items-center gap-2 cursor-pointer group/header">
              <CheckSquare size={16} className="text-violet-500 dark:text-violet-400 group-hover/header:scale-110 transition-transform" />
              <h2 className="font-semibold text-slate-800 dark:text-white text-sm group-hover/header:text-violet-600 dark:group-hover/header:text-violet-400 transition-colors">
                Daily Habits
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {habits.filter(h => h.done).length}/{habits.length}
            </span>
          </div>
          <div className="space-y-2">
            {isLoadingSidebar && habits.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">Loading habits...</p>
            )}
            {sidebarError && (
              <div className="text-xs text-red-500 dark:text-red-300 flex items-center justify-between gap-2">
                <span>{sidebarError}</span>
                <button
                  onClick={() => {
                    if (!userId) return;
                    setSidebarError('');
                    setIsLoadingSidebar(true);
                    Promise.all([getHabits(userId), getDistractions(userId)])
                      .then(([habitData, distractionData]) => {
                        setHabits(toDashboardHabits(habitData));
                        setDistractions(toDashboardDistractions(distractionData));
                      })
                      .catch((error) => {
                        console.error(error);
                      })
                      .finally(() => setIsLoadingSidebar(false));
                  }}
                  className="px-2 py-1 rounded bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 font-semibold"
                >
                  Retry
                </button>
              </div>
            )}
            {habits.map((habit) => (
              <div key={habit.id} onClick={() => toggleHabit(habit.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer group transition-colors">
                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center shrink-0 transition-all ${
                  habit.done ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-300 dark:border-slate-600 group-hover:border-emerald-400'
                }`}>
                  {habit.done && (
                    <svg className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm flex-1 ${habit.done ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{habit.label}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-violet-500 transition-all duration-1000" style={{ width: `${habits.length === 0 ? 0 : (habits.filter(h => h.done).length / habits.length) * 100}%` }} />
          </div>
          <button onClick={() => navigate('/habits')} className="w-full mt-3 py-2 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/20 rounded-lg transition-colors flex items-center justify-center gap-1">
            Go to Habits <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTaskModal(false)}>
          <div className="glass-panel p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 mb-4"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && saveTask()}
            />
            <div className="flex gap-2">
              <button onClick={saveTask} className="flex-1 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <Save size={16} />
                {editingTask ? 'Update' : 'Add Task'}
              </button>
              <button onClick={() => setShowTaskModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRevisionModal(false)}>
          <div className="glass-panel p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Revision</h3>
              <button onClick={() => setShowRevisionModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Topic Name</label>
                <input
                  type="text"
                  value={revisionData.title}
                  onChange={(e) => setRevisionData({...revisionData, title: e.target.value})}
                  placeholder="e.g., Dynamic Programming"
                  className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Subject</label>
                <input
                  type="text"
                  value={revisionData.subject}
                  onChange={(e) => setRevisionData({...revisionData, subject: e.target.value})}
                  placeholder="e.g., Algorithms"
                  className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Revision Interval (days)</label>
                <select
                  value={revisionData.interval}
                  onChange={(e) => setRevisionData({...revisionData, interval: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="21">21 days</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveRevision} className="flex-1 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <Save size={16} />
                Add Revision
              </button>
              <button onClick={() => setShowRevisionModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, trend, color }) => {
  const colors = {
    blue: "border-blue-200 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/5",
    emerald: "border-emerald-200 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5",
    violet: "border-violet-200 dark:border-violet-500/50 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/5",
    orange: "border-orange-200 dark:border-orange-500/50 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/5",
  };

  const currentColors = colors[color];
  const bgClass = currentColors.split(' ').find(c => c.startsWith('bg-'));
  const textClass = currentColors.split(' ').find(c => c.startsWith('text-'));
  const darkBgClass = currentColors.split(' ').find(c => c.startsWith('dark:bg-'));

  return (
    <div className={`glass-panel p-4 border-l-4 ${colors[color]} hover:translate-y-[-2px] transition-all duration-300`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-1.5 rounded-lg bg-white dark:bg-white/5 ${textClass}`}>{icon}</div>
        <ArrowUpRight size={14} className="text-slate-400 dark:text-slate-500" />
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{value}</h3>
          <span className="text-[10px] text-slate-500 font-medium">{trend}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
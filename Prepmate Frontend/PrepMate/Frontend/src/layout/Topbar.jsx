import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { useTheme } from '../context/ThemeContext';
import {
  getDashboardStats,
  getDeadlines,
  getGoals,
  getRevisions,
  getTasks,
  getTests,
} from '../services/api';
import { Menu, Bell, Search, Sun, Moon, Flame, X } from 'lucide-react';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your competitive exam command centre' },
  '/revision': { title: 'Revision', subtitle: 'Spaced repetition and mastery tracking' },
  '/yearly': { title: 'Yearly Planner', subtitle: 'Strategic subject coverage planning' },
  '/monthly': { title: 'Monthly Planner', subtitle: 'Month-by-month topic breakdown' },
  '/weekly': { title: 'Weekly Planner', subtitle: 'Weekly study schedule' },
  '/daily': { title: 'Daily Planner', subtitle: "Today's study tasks" },
  '/tests': { title: 'Tests and Errors', subtitle: 'Track performance and mistakes' },
  '/timers': { title: 'Study Timers', subtitle: 'Pomodoro and stopwatch tools' },
  '/habits': { title: 'Habit Tracker', subtitle: 'Build consistent study routines' },
  '/distraction': { title: 'Distraction Log', subtitle: 'Track and minimize interruptions' },
  '/resources': { title: 'File Manager', subtitle: 'Organize study materials' },
  '/reflection': { title: 'Daily Reflection', subtitle: 'Journal your study journey' },
  '/reports': { title: 'Weekly Report', subtitle: 'Analytics and insights' },
  '/flashcards': { title: 'Flashcards', subtitle: 'Active recall and spaced repetition cards' },
  '/wellbeing': { title: 'Wellbeing', subtitle: 'Burnout prevention and health tracker' },
  '/goals': { title: 'Goals and Vision', subtitle: 'Goal setting and vision board' },
  '/deadlines': { title: 'Deadlines', subtitle: 'Exam and submission date tracker' },
  '/analytics': { title: 'Analytics', subtitle: 'Advanced performance dashboard' },
  '/settings': { title: 'Settings', subtitle: 'Integrations, data and account' },
};

const STATIC_COMMANDS = [
  { label: 'Open Dashboard', route: '/dashboard', type: 'Navigation' },
  { label: 'Open Revision Queue', route: '/revision', type: 'Navigation' },
  { label: 'Open Daily Planner', route: '/daily', type: 'Navigation' },
  { label: 'Open Timers', route: '/timers', type: 'Navigation' },
  { label: 'Open Weekly Report', route: '/reports', type: 'Navigation' },
  { label: 'Open Analytics', route: '/analytics', type: 'Navigation' },
];

const toDateOnly = (value) => {
  if (!value) return '';
  const asString = String(value);
  return asString.includes('T') ? asString.split('T')[0] : asString;
};

const Topbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { backendUserId } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [query, setQuery] = useState('');
  const [commands, setCommands] = useState(STATIC_COMMANDS);

  const currentPage = PAGE_TITLES[location.pathname] || { title: 'PrepMate', subtitle: 'Study Platform' };

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
      if (event.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!backendUserId) return;

    Promise.all([
      getDashboardStats(backendUserId),
      getRevisions(backendUserId),
      getTasks(backendUserId),
      getTests(backendUserId),
      getGoals(backendUserId),
      getDeadlines(backendUserId),
    ])
      .then(([stats, revisions, tasks, tests, goals, deadlines]) => {
        const streak = Number(stats?.currentMaxStreak) || 0;
        setStreakCount(streak);

        const today = new Date().toISOString().split('T')[0];
        const dueRevisions = (Array.isArray(revisions) ? revisions : []).filter((item) => {
          const dueDate = toDateOnly(item.scheduledDate || item.dueDate);
          const completed = !!item.completed || String(item.status || '').toLowerCase() === 'completed';
          return dueDate && dueDate <= today && !completed;
        });

        const dueDeadlines = (Array.isArray(deadlines) ? deadlines : []).filter((item) => {
          const date = toDateOnly(item.date);
          return date && date >= today;
        });

        const topNotifications = [
          ...dueRevisions.slice(0, 4).map((item) => ({
            id: `rev-${item.id}`,
            text: `Revision due: ${item.topicName || item.title || 'Untitled topic'}`,
            type: 'revision',
          })),
          ...dueDeadlines.slice(0, 2).map((item) => ({
            id: `ddl-${item.id}`,
            text: `Upcoming deadline: ${item.title || 'Untitled event'}`,
            type: 'deadline',
          })),
        ];

        if (topNotifications.length === 0) {
          topNotifications.push({ id: 'clean', text: 'No urgent reminders right now', type: 'info' });
        }

        setNotifications(topNotifications);

        const dynamicCommands = [
          ...STATIC_COMMANDS,
          ...(Array.isArray(tasks) ? tasks : []).slice(0, 6).map((item) => ({
            label: `Task: ${item.title || 'Untitled task'}`,
            route: '/daily',
            type: 'Task',
          })),
          ...(Array.isArray(revisions) ? revisions : []).slice(0, 6).map((item) => ({
            label: `Revision: ${item.topicName || item.title || 'Untitled revision'}`,
            route: '/revision',
            type: 'Revision',
          })),
          ...(Array.isArray(tests) ? tests : []).slice(0, 6).map((item) => ({
            label: `Test: ${item.name || 'Untitled test'}`,
            route: '/tests',
            type: 'Test',
          })),
          ...(Array.isArray(goals) ? goals : []).slice(0, 6).map((item) => ({
            label: `Goal: ${item.title || 'Untitled goal'}`,
            route: '/goals',
            type: 'Goal',
          })),
        ];

        setCommands(dynamicCommands);
      })
      .catch(console.error);
  }, [backendUserId]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands.slice(0, 14);

    const q = query.trim().toLowerCase();
    return commands.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 14);
  }, [commands, query]);

  const unreadCount = notifications.filter((item) => item.type !== 'info').length;

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/50 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 w-full transition-colors duration-300">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onMenuClick} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all">
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">{currentPage.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">{currentPage.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <Search size={14} />
            <span className="text-xs">Search</span>
            <span className="text-[10px] uppercase text-slate-400">Ctrl/Cmd+K</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-full">
            <Flame size={16} className="text-orange-500" />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streakCount}</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-40 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-white/5">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-4 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        <p className="text-sm text-slate-700 dark:text-slate-300">{notif.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {showCommandPalette && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCommandPalette(false)}>
          <div className="max-w-2xl mx-auto mt-16 bg-white dark:bg-[#0a0f1e] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-white/10">
              <Search size={16} className="text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages, tasks, revisions, tests, goals"
                className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-200"
                autoFocus
              />
              <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setShowCommandPalette(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {filteredCommands.length === 0 && (
                <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No results found.</div>
              )}
              {filteredCommands.map((item, index) => (
                <button
                  key={`${item.type}-${item.label}-${index}`}
                  onClick={() => {
                    navigate(item.route);
                    setShowCommandPalette(false);
                    setQuery('');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5"
                >
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.type}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;

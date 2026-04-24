import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { useTheme } from '../context/ThemeContext';
import logout from '../firebase/logoutAuth';
import { Menu, Bell, LogOut, Settings, ChevronDown, Search, Sun, Moon } from 'lucide-react';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your competitive exam command centre' },
  '/revision': { title: 'Revision Queue', subtitle: 'Spaced repetition tracking' },
  '/yearly': { title: 'Yearly Planner', subtitle: 'Strategic subject coverage planning' },
  '/monthly': { title: 'Monthly Planner', subtitle: 'Month-by-month topic breakdown' },
  '/weekly': { title: 'Weekly Planner', subtitle: 'Weekly study schedule' },
  '/daily': { title: 'Daily Planner', subtitle: "Today's study tasks" },
  '/tests': { title: 'Tests & Errors', subtitle: 'Track performance and mistakes' },
  '/timers': { title: 'Study Timers', subtitle: 'Pomodoro and stopwatch tools' },
  '/habits': { title: 'Habit Tracker', subtitle: 'Build consistent study routines' },
  '/distraction': { title: 'Distraction Log', subtitle: 'Track and minimize interruptions' },
  '/resources': { title: 'File Manager', subtitle: 'Organize study materials' },
  '/reflection': { title: 'Daily Reflection', subtitle: 'Journal your study journey' },
  '/reports': { title: 'Weekly Report', subtitle: 'Analytics and insights' },
  '/flashcards': { title: 'Flashcards', subtitle: 'Active recall & spaced repetition cards' },
  '/wellbeing': { title: 'Wellbeing', subtitle: 'Burnout prevention & health tracker' },
  '/goals': { title: 'Goals & Vision', subtitle: 'Goal setting & vision board' },
  '/timetable': { title: 'Timetable', subtitle: 'Daily & weekly routine planner' },
  '/deadlines': { title: 'Deadlines', subtitle: 'Exam & submission date tracker' },
  '/analytics': { title: 'Analytics', subtitle: 'Advanced performance dashboard' },
  '/settings': { title: 'Settings', subtitle: 'Integrations, data & account' },
};

const Topbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Searching for:', searchQuery);
      alert(`Search functionality coming soon! Query: ${searchQuery}`);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const currentPage = PAGE_TITLES[location.pathname] || { title: 'PrepMate', subtitle: 'Study Platform' };

  // Notifications (empty for now until backend support is added)
  const notifications = [];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/50 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 w-full transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{currentPage.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">{currentPage.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Working Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5 hover:border-slate-300 dark:hover:border-white/20 transition-all">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 w-40" 
          />
        </form>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Working Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-40 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-white/5">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notif => (
                    <div key={notif.id} className="p-4 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{notif.text}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-100 dark:border-white/5 text-center">
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium">View all notifications</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm text-slate-700 dark:text-white font-medium">{displayName}</span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-40 overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-white/5">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button onClick={() => navigate('/settings')} className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-all">
                    <Settings size={16} />
                    Settings
                  </button>
                  <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-all">
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
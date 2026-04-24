import React, { useState } from 'react';
import {
  LayoutGrid, Target, CalendarDays, CalendarRange,
  CalendarCheck, RefreshCw, ClipboardList, Timer,
  FolderOpen, CheckSquare, Zap, BookOpen,
  BarChart2, LogOut, X, Layers, Heart,
  Flag, Clock, BarChart3, Settings
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { logout } from '../firebase/authService';
import logo from '../assets/logo.png';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', route: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { id: 'yearly',    route: '/yearly',    icon: CalendarDays,  label: 'Yearly Planner'  },
      { id: 'monthly',   route: '/monthly',   icon: CalendarRange, label: 'Monthly Planner' },
      { id: 'weekly',    route: '/weekly',    icon: CalendarCheck, label: 'Weekly Planner'  },
      { id: 'daily',     route: '/daily',     icon: Target,        label: 'Daily Planner'   },
      { id: 'timetable', route: '/timetable', icon: Clock,         label: 'Timetable'       },
      { id: 'deadlines', route: '/deadlines', icon: Flag,          label: 'Deadlines'       },
    ],
  },
  {
    label: 'Study',
    items: [
      { id: 'revision',   route: '/revision',   icon: RefreshCw,     label: 'Revision', badge: 3 },
      { id: 'flashcards', route: '/flashcards', icon: Layers,        label: 'Flashcards'      },
      { id: 'tests',      route: '/tests',      icon: ClipboardList, label: 'Tests & Errors'  },
      { id: 'timers',     route: '/timers',     icon: Timer,         label: 'Study Timers'    },
    ],
  },
  {
    label: 'Resources',
    items: [
      { id: 'resources', route: '/resources', icon: FolderOpen, label: 'File Manager' },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { id: 'habits',      route: '/habits',      icon: CheckSquare, label: 'Habit Tracker'   },
      { id: 'distraction', route: '/distraction', icon: Zap,         label: 'Distraction Log' },
      { id: 'wellbeing',   route: '/wellbeing',   icon: Heart,       label: 'Wellbeing'       },
      { id: 'goals',       route: '/goals',       icon: Target,      label: 'Goals'           },
    ],
  },
  {
    label: 'Reports',
    items: [
      { id: 'reflection', route: '/reflection', icon: BookOpen,   label: 'Reflection'    },
      { id: 'reports',    route: '/reports',    icon: BarChart2,  label: 'Weekly Report' },
      { id: 'analytics',  route: '/analytics',  icon: BarChart3,  label: 'Analytics'     },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'settings', route: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const activeRoute = location.pathname;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('[Sidebar] Logout failed:', err.message);
    }
  };

  const handleNavClick = (item) => {
    if (item.route) {
      navigate(item.route);
      // Only close sidebar on mobile (below lg breakpoint)
      if (window.innerWidth < 1024 && onClose) onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-50 h-screen flex flex-col shrink-0 bg-slate-50 dark:bg-[#0a0d1c] border-r border-slate-200 dark:border-white/[0.05] transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 w-60' : '-translate-x-full lg:translate-x-0 lg:w-[68px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-5 border-b border-slate-200 dark:border-white/[0.05] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-blue-500/25">
              <img src={logo} alt="PrepMate Logo" className="w-full h-full object-cover" />
            </div>
            {isOpen && (
              <span className="text-slate-900 dark:text-white font-black text-lg tracking-tight whitespace-nowrap">
                Prep<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">Mate</span>
              </span>
            )}
          </div>
          
          {/* Close button - Mobile only */}
          {isOpen && (
            <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white p-1">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" style={{ scrollbarWidth: 'none' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {isOpen ? (
               <div className="px-4 pt-4 pb-1">
                 <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-600">{group.label}</span>
               </div>
              ) : <div className="h-3" />}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute === item.route;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    title={!isOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3.5 px-[18px] py-2.5 text-left relative transition-all duration-150 group ${
                      isActive 
                        ? 'text-blue-600 dark:text-white bg-blue-50 dark:bg-blue-500/10 border-r-2 border-blue-600 dark:border-blue-500' 
                        : 'text-slate-600 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon size={18} className={`shrink-0 transition-colors ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    }`} />
                    
                    {isOpen && (
                      <span className={`text-[13px] font-medium whitespace-nowrap ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                    )}
                    
                    {item.badge && isOpen && (
                      <span className="ml-auto text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                        {item.badge}
                      </span>
                    )}
                    
                    {item.badge && !isOpen && (
                      <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="shrink-0 border-t border-slate-200 dark:border-white/[0.05] p-3">
          <div className={`flex items-center gap-2.5 p-2 rounded-xl ${isOpen ? 'justify-between' : 'justify-center'}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {avatarLetter}
              </div>
              {isOpen && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-300 truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-600 truncate">{user?.email}</p>
                </div>
              )}
            </div>
            {isOpen && (
              <button 
                onClick={handleLogout} 
                title="Sign out" 
                className="text-slate-500 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
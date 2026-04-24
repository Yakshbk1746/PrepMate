import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, Target, CalendarDays, CalendarRange,
  CalendarCheck, RefreshCw, ClipboardList, Timer,
  FolderOpen, CheckSquare, Zap, BookOpen,
  LogOut, X, Layers,
  Flag, BarChart3, Settings, Heart, Image, FileText
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { logout } from '../firebase/authService';
import { getRevisions } from '../services/api';

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
      { id: 'deadlines', route: '/deadlines', icon: Flag,          label: 'Deadlines'       },
    ],
  },
  {
    label: 'Study',
    items: [
      { id: 'revision',   route: '/revision',   icon: RefreshCw,     label: 'Revision' },
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
      { id: 'goals',       route: '/goals',       icon: Target,      label: 'Goals'           },
      { id: 'wellbeing',   route: '/wellbeing',   icon: Heart,       label: 'Wellbeing'       },
      { id: 'vision',      route: '/vision',      icon: Image,       label: 'Vision Board'    },
    ],
  },
  {
    label: 'Reports',
    items: [
      { id: 'reflection', route: '/reflection', icon: BookOpen,   label: 'Reflection'    },
      { id: 'analytics',  route: '/analytics',  icon: BarChart3,  label: 'Analytics'     },
      { id: 'reports',    route: '/reports',    icon: FileText,   label: 'Weekly Report' },
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
  const { user, backendUserId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [revisionDueCount, setRevisionDueCount] = useState(0);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const activeRoute = location.pathname;

  // Live badge count via backend revisions due today or overdue
  useEffect(() => {
    if (!backendUserId) {
      setRevisionDueCount(0);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    getRevisions(backendUserId)
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        const count = list.filter((item) => {
          if (item?.completed === true) return false;
          if (!item?.scheduledDate) return false;
          const due = new Date(item.scheduledDate);
          due.setHours(0, 0, 0, 0);
          return due <= today;
        }).length;
        setRevisionDueCount(count);
      })
      .catch((error) => {
        console.error(error);
        setRevisionDueCount(0);
      });
  }, [backendUserId]);

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
            <img src="/logo.png" alt="PrepMate logo" className="w-9 h-9 object-contain shrink-0" />
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
                const isRevision = item.id === 'revision';
                const badgeCount = isRevision ? revisionDueCount : 0;

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
                    
                    {/* Dynamic revision badge */}
                    {isRevision && badgeCount > 0 && isOpen && (
                      <span className="ml-auto text-[10px] font-black bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {badgeCount}
                      </span>
                    )}
                    
                    {isRevision && badgeCount > 0 && !isOpen && (
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
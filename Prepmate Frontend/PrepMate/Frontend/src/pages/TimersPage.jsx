import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Zap, TrendingUp, Lightbulb, Edit2, Trash2, BarChart3, Gauge } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { useAuth } from '../context/authContext';
import { getTimerSessions, logTimerSession, deleteTimerSession } from '../services/api';

const TimersPage = () => {
  const { backendUserId } = useAuth();
  const {
    // Pomodoro
    pomCycle, pomMode, pomTime, pomRunning,
    switchPomCycle, resetPomodoro, togglePomodoro,
    // Stopwatch
    sessionTime, questionTime, trackerRunning, questionsSolved, questionLaps, sessionName,
    setTrackerRunning, setSessionName, handleNextQuestion, handleEndSession,
    // Log
    sessions, currentSubject, setCurrentSubject, deleteSession, editSessionName,
    // Derived
    formatTime,
    CYCLES,
  } = useTimer();

  const [isEditingSessionName, setIsEditingSessionName] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionValue, setEditSessionValue] = useState('');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [autoStartNextPhase, setAutoStartNextPhase] = useState(true);
  const [pomodoroGoal, setPomodoroGoal] = useState(8);
  const [questionGoal, setQuestionGoal] = useState(30);
  const [cycleToast, setCycleToast] = useState('');
  const [autoKickoff, setAutoKickoff] = useState(false);
  const lastLocalSessionCount = useRef(0);
  const prevPomModeRef = useRef(pomMode);

  const mapApiSessionToUi = (item) => {
    const rawDate = item?.date ? new Date(item.date) : new Date();
    const safeDate = Number.isNaN(rawDate.getTime()) ? new Date() : rawDate;

    return {
      id: item?.id ?? Date.now(),
      type: item?.label || item?.type || 'Session',
      duration: Math.max(0, Math.round((Number(item?.duration) || 0) / 60)),
      completed: true,
      subject: item?.subject || null,
      time: safeDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: safeDate.toISOString().split('T')[0],
    };
  };

  const deriveBackendType = (sessionTypeText) => {
    const text = String(sessionTypeText || '').toLowerCase();
    if (text.includes('pomodoro')) return 'pomodoro';
    if (text.includes('focus')) return 'focus';
    return 'custom';
  };

  useEffect(() => {
    if (!backendUserId) return;
    getTimerSessions(backendUserId)
      .then((data) => {
        const mapped = data.map(mapApiSessionToUi);
        setSessionHistory(mapped);
      })
      .catch(console.error);
  }, [backendUserId]);

  useEffect(() => {
    const raw = localStorage.getItem('prepmate:timer-prefill');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.sessionName) {
        setSessionName(parsed.sessionName);
      }
      if (parsed.subject && typeof parsed.subject === 'string') {
        setCurrentSubject(parsed.subject);
      }
      setAutoKickoff(true);
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('prepmate:timer-prefill');
    }
  }, [setCurrentSubject, setSessionName]);

  useEffect(() => {
    if (!autoKickoff) return;
    if (!pomRunning) {
      togglePomodoro();
    }
    setAutoKickoff(false);
  }, [autoKickoff, pomRunning, togglePomodoro]);

  useEffect(() => {
    if (prevPomModeRef.current === pomMode) return;

    setCycleToast(pomMode === 'work' ? 'Focus started' : 'Break started');

    if (autoStartNextPhase && !pomRunning && pomTime > 0) {
      const id = setTimeout(() => togglePomodoro(), 350);
      prevPomModeRef.current = pomMode;
      return () => clearTimeout(id);
    }

    prevPomModeRef.current = pomMode;
  }, [pomMode, autoStartNextPhase, pomRunning, pomTime, togglePomodoro]);

  useEffect(() => {
    if (!cycleToast) return;
    const id = setTimeout(() => setCycleToast(''), 1800);
    return () => clearTimeout(id);
  }, [cycleToast]);

  useEffect(() => {
    if (!backendUserId) {
      lastLocalSessionCount.current = sessions.length;
      return;
    }

    if (sessions.length <= lastLocalSessionCount.current) {
      lastLocalSessionCount.current = sessions.length;
      return;
    }

    const latest = sessions[0];
    if (!latest) {
      lastLocalSessionCount.current = sessions.length;
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticSession = { ...latest, id: tempId };

    setSessionHistory((prev) => {
      const exists = prev.some(
        (s) =>
          s.id === optimisticSession.id ||
          (s.type === optimisticSession.type &&
            s.duration === optimisticSession.duration &&
            s.time === optimisticSession.time &&
            s.date === optimisticSession.date)
      );
      if (exists) return prev;
      return [optimisticSession, ...prev];
    });

    const match = String(latest.type || '').match(/\((\d+)\s*Qs/i);
    const questionCount = match ? Number(match[1]) : undefined;

    logTimerSession(backendUserId, {
      type: deriveBackendType(latest.type),
      duration: Math.max(0, (Number(latest.duration) || 0) * 60),
      subject: latest.subject || '',
      label: latest.type || '',
      date: new Date().toISOString().split('T')[0],
      ...(Number.isFinite(questionCount) ? { questionCount } : {}),
    })
      .then((saved) => {
        if (!saved?.id) return;
        setSessionHistory((prev) =>
          prev.map((s) => (s.id === tempId ? mapApiSessionToUi(saved) : s))
        );
      })
      .catch(console.error);

    lastLocalSessionCount.current = sessions.length;
  }, [backendUserId, sessions]);

  const totalStudyTime = sessionHistory
    .filter((s) => String(s.type || '').toLowerCase().startsWith('pomodoro'))
    .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  const todayIso = new Date().toISOString().split('T')[0];
  const todaySessions = sessionHistory.filter(
    (s) =>
      String(s.type || '').toLowerCase().startsWith('pomodoro') &&
      (s.date || todayIso) === todayIso
  ).length;

  const todaysSessionHistory = sessionHistory.filter((s) => (s.date || todayIso) === todayIso);
  const todaysTotalMinutes = todaysSessionHistory.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
  const todaysAverageMinutes = todaysSessionHistory.length > 0 ? Math.round(todaysTotalMinutes / todaysSessionHistory.length) : 0;
  const todaysLongestSession = todaysSessionHistory.length > 0
    ? Math.max(...todaysSessionHistory.map((s) => Number(s.duration) || 0))
    : 0;
  const todaysPomodoros = todaysSessionHistory.filter((s) => String(s.type || '').toLowerCase().includes('pomodoro')).length;
  const todaysQuestionSessions = todaysSessionHistory.length - todaysPomodoros;

  const currentPomTotal = CYCLES[pomCycle]?.[pomMode] || CYCLES['25/5'][pomMode];
  const pomProgressPercent = Math.max(0, Math.min(100, ((currentPomTotal - pomTime) / currentPomTotal) * 100));
  const pomGoalPercent = pomodoroGoal > 0 ? Math.min(100, (todaySessions / pomodoroGoal) * 100) : 0;
  const avgPerQuestionSeconds = questionsSolved > 0 ? Math.floor(sessionTime / questionsSolved) : 0;
  const fastestLap = questionLaps.length > 0 ? Math.min(...questionLaps) : 0;
  const slowestLap = questionLaps.length > 0 ? Math.max(...questionLaps) : 0;
  const questionGoalPercent = questionGoal > 0 ? Math.min(100, (questionsSolved / questionGoal) * 100) : 0;

  const parseSessionMeta = (typeText = '') => {
    const raw = String(typeText || '');
    const pattern = /\((\d+)\s*Qs(?:,\s*Avg:\s*([0-9]{2}:[0-9]{2}))?\)/i;
    const match = raw.match(pattern);

    if (!match) {
      return {
        baseName: raw,
        questionCount: null,
        avgTime: null,
        suffix: '',
      };
    }

    const baseName = raw.replace(pattern, '').trim();
    return {
      baseName,
      questionCount: Number(match[1]) || null,
      avgTime: match[2] || null,
      suffix: match[0],
    };
  };

  const startEditingSessionLog = (session) => {
    const meta = parseSessionMeta(session.type);
    setEditingSessionId(session.id);
    setEditSessionValue(meta.baseName || session.type);
  };

  const saveSessionLogName = (id) => {
    const current = sessionHistory.find((session) => session.id === id);
    if (!current) {
      setEditingSessionId(null);
      return;
    }

    const meta = parseSessionMeta(current.type);
    const nextName = (editSessionValue || '').trim() || (meta.baseName || 'Session');
    const nextType = meta.suffix ? `${nextName} ${meta.suffix}` : nextName;

    editSessionName(id, nextType);
    setSessionHistory((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, type: nextType } : session
      )
    );
    setEditingSessionId(null);
  };

  const handleDeleteSession = (id) => {
    deleteTimerSession(id).catch(console.error);
    deleteSession(id);
    setSessionHistory((prev) => prev.filter((session) => session.id !== id));
  };

  return (
    <div className="space-y-6">
      {cycleToast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold uppercase tracking-wider shadow-xl">
          {cycleToast}
        </div>
      )}
      
      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <Lightbulb size={18} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">⏱️ Pomodoro Technique Tips</h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Work in focused 25 or 50-minute blocks followed by 5 or 10-minute breaks</li>
              <li>• After 4 pomodoros, take a longer 15-30 minute break</li>
              <li>• Remove all distractions during pomodoro sessions</li>
              <li>• Use stopwatch for tasks that need continuous focus without breaks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Clock size={20} className="text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{totalStudyTime}m</div>
              <div className="text-xs text-slate-500 font-medium">Today's Study Time</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Zap size={20} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{todaySessions}</div>
              <div className="text-xs text-slate-500 font-medium">Pomodoros Done</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
              <TrendingUp size={20} className="text-violet-500 dark:text-violet-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{sessionHistory.length}</div>
              <div className="text-xs text-slate-500 font-medium">Total Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pomodoro Timer */}
        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-8 text-center shadow-sm dark:shadow-none">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock size={20} className="text-blue-500 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Pomodoro Timer</h2>
          </div>

          {/* Mode indicator */}
          <div className={`text-xs font-black uppercase tracking-widest mb-6 ${pomMode === 'work' ? 'text-rose-500' : 'text-emerald-500'}`}>
            {pomMode === 'work' ? '🔴 Focus Time' : '🟢 Break Time'}
          </div>

          <div className="mb-5 space-y-3">
            <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${pomMode === 'work' ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{ width: `${pomProgressPercent}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>{Math.round(pomProgressPercent)}% done</span>
              <span>{pomMode === 'work' ? 'Focus block' : 'Break block'}</span>
            </div>
          </div>
          
          <div className="text-7xl font-black text-slate-900 dark:text-white mb-8 font-mono tracking-tight">
            {formatTime(pomTime)}
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={togglePomodoro}
              disabled={pomTime === 0}
              className="p-5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded-full transition-all shadow-lg shadow-blue-500/30"
            >
              {pomRunning ? 
                <Pause size={28} className="text-white" /> : 
                <Play size={28} className="text-white" />
              }
            </button>
            <button
              onClick={resetPomodoro}
              className="p-5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all"
            >
              <RotateCcw size={28} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          
          {/* Cycle selector: 50/10 and 25/5 */}
          <div className="flex items-center justify-center gap-2">
            {['50/10', '25/5'].map(cycle => (
              <button
                key={cycle}
                onClick={() => switchPomCycle(cycle)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  pomCycle === cycle
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                {cycle}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Daily Pomodoro Goal</span>
                <span className="text-xs font-black text-blue-500 dark:text-blue-400">{todaySessions}/{pomodoroGoal}</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pomGoalPercent}%` }} />
              </div>
              <input
                type="number"
                min={1}
                max={30}
                value={pomodoroGoal}
                onChange={(e) => setPomodoroGoal(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-2 py-1 rounded-md bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 outline-none"
              />
            </div>

            <label className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Auto Start Next Phase</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Continue work/break automatically</div>
              </div>
              <input
                type="checkbox"
                checked={autoStartNextPhase}
                onChange={(e) => setAutoStartNextPhase(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Question Tracker */}
        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-8 text-center flex flex-col items-center shadow-sm dark:shadow-none">
          <div className="flex flex-col items-center justify-center gap-2 mb-6 w-full">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-emerald-500 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Question Tracker</h2>
            </div>
            
            {isEditingSessionName ? (
              <input 
                type="text" 
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onBlur={() => setIsEditingSessionName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingSessionName(false)}
                className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-center text-sm outline-none focus:border-emerald-500 transition-colors w-full max-w-xs mt-2"
                autoFocus
              />
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer group hover:text-emerald-400 transition-colors mt-2"
                onClick={() => setIsEditingSessionName(true)}
              >
                <span className="text-slate-900 dark:text-white font-bold text-lg">{sessionName}</span>
                <Edit2 size={14} className="text-slate-500 group-hover:text-emerald-400" />
              </div>
            )}
          </div>
          
          <div className="w-full flex justify-between items-center mb-6 px-4">
             <div className="text-left w-[80px]">
               <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Time</div>
               <div className="text-xl md:text-2xl font-mono font-bold text-slate-900 dark:text-white">{formatTime(sessionTime)}</div>
             </div>
             <div className="text-center w-[80px]">
               <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Avg/Q</div>
               <div className="text-xl md:text-2xl font-mono font-bold text-blue-500 dark:text-blue-400">
                 {questionsSolved > 0 ? formatTime(avgPerQuestionSeconds) : '00:00'}
               </div>
             </div>
             <div className="text-right w-[80px]">
               <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Solved</div>
               <div className="text-xl md:text-2xl font-black text-emerald-500 dark:text-emerald-400">{questionsSolved}</div>
             </div>
          </div>

          <div className="text-7xl font-black text-emerald-500 dark:text-emerald-400 mb-8 font-mono tracking-tight transition-all">
            {formatTime(questionTime)}
          </div>
          
          <div className="flex w-full items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setTrackerRunning(!trackerRunning)}
              className="w-16 h-16 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 rounded-full transition-all shadow-lg shadow-emerald-500/30"
            >
              {trackerRunning ? 
                <Pause size={28} className="text-white" /> : 
                <Play size={28} className="text-white ml-1" />
              }
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={!trackerRunning}
              className="flex-1 max-w-[140px] h-16 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 dark:text-white font-bold rounded-2xl flex items-center justify-center transition-all uppercase tracking-wider text-sm border border-slate-200 dark:border-white/5"
            >
              Next Q
            </button>
          </div>
          
          {(sessionTime > 0) && (
            <button
              onClick={handleEndSession}
              className="w-full mt-auto px-6 py-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-rose-500/20 transition-all shadow-sm"
            >
              End Session & Log
            </button>
          )}

          <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <Gauge size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Question Goal</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${questionGoalPercent}%` }} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={questionGoal}
                  onChange={(e) => setQuestionGoal(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 px-2 py-1 rounded-md bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 outline-none"
                />
                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">{questionsSolved}/{questionGoal}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={14} className="text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Pace Insights</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div>Fastest: <span className="font-bold text-emerald-500">{fastestLap ? formatTime(fastestLap) : '--:--'}</span></div>
                <div>Slowest: <span className="font-bold text-rose-500">{slowestLap ? formatTime(slowestLap) : '--:--'}</span></div>
                <div>Questions logged: <span className="font-bold text-blue-500">{questionLaps.length}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Log */}
      <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm dark:shadow-none">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Today's Sessions</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400">Total Time</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{todaysTotalMinutes}m</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400">Avg Session</div>
            <div className="text-lg font-black text-blue-500 dark:text-blue-400">{todaysAverageMinutes}m</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400">Longest</div>
            <div className="text-lg font-black text-emerald-500 dark:text-emerald-400">{todaysLongestSession}m</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-3">
            <div className="text-[10px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400">Focus / Q</div>
            <div className="text-lg font-black text-violet-500 dark:text-violet-400">{todaysPomodoros}/{todaysQuestionSessions}</div>
          </div>
        </div>
        
        {todaysSessionHistory.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={48} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">No sessions yet today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysSessionHistory.map((session) => {
              const meta = parseSessionMeta(session.type);

              return (
              <div 
                key={session.id} 
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  String(session.type || '').toLowerCase().startsWith('pomodoro') 
                    ? 'bg-blue-500/5 border-blue-500/20' 
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    String(session.type || '').toLowerCase().startsWith('pomodoro') ? 'bg-blue-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1">
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editSessionValue}
                        onChange={(e) => setEditSessionValue(e.target.value)}
                        onBlur={() => saveSessionLogName(session.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveSessionLogName(session.id); }}
                        className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg px-2 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500 transition-colors w-full"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="flex items-center gap-2 cursor-pointer group hover:text-emerald-400 transition-colors"
                        onClick={() => startEditingSessionLog(session)}
                      >
                        <span className={`text-sm font-semibold ${session.type.startsWith('Pomodoro') ? 'text-blue-500 dark:text-blue-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                          {meta.baseName || session.type}
                        </span>
                        <Edit2 size={12} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    {(meta.questionCount !== null || meta.avgTime) && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {meta.questionCount !== null && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                            {meta.questionCount} Qs
                          </span>
                        )}
                        {meta.avgTime && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-500">
                            Avg {meta.avgTime}
                          </span>
                        )}
                      </div>
                    )}
                    {session.subject && (
                      <span className="text-xs text-slate-500 mt-1 block">{session.subject}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{session.duration} min</span>
                  <span>{session.time}</span>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimersPage;
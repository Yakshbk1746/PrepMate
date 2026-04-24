import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './authContext';
import { getUserByFirebaseUid } from '../services/api';

const TimerContext = createContext(null);

// ─── Pomodoro Cycle Configs ──────────────────────────────────────────────────
const CYCLES = {
  '50/10': { work: 50 * 60, break: 10 * 60 },
  '25/5':  { work: 25 * 60, break: 5 * 60 },
  custom: { work: 25 * 60, break: 5 * 60 },
};

export const TimerProvider = ({ children }) => {
  const { user } = useAuth();
  // ── Pomodoro ──────────────────────────────────────────────────────────────
  const [pomCycle, setPomCycle]       = useState('25/5');
  const [pomMode, setPomMode]         = useState('work');   // 'work' | 'break'
  const [pomTime, setPomTime]         = useState(CYCLES['25/5'].work);
  const [pomRunning, setPomRunning]   = useState(false);

  // ── Stopwatch / Question Tracker ──────────────────────────────────────────
  const [sessionTime, setSessionTime]       = useState(0);
  const [questionTime, setQuestionTime]     = useState(0);
  const [trackerRunning, setTrackerRunning] = useState(false);
  const [questionsSolved, setQuestionsSolved] = useState(0);
  const [questionLaps, setQuestionLaps]     = useState([]);
  const [sessionName, setSessionName]       = useState('Question Solving Session');

  // ── Session Log ───────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState([]);
  const [currentSubject, setCurrentSubject] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    getUserByFirebaseUid(user.uid)
      .then((profile) => {
        const workMinutes = Number(profile?.pomodoroTime);
        if (!Number.isFinite(workMinutes) || workMinutes <= 0) return;

        if (workMinutes === 25) {
          setPomCycle('25/5');
          setPomMode('work');
          setPomTime(CYCLES['25/5'].work);
          setPomRunning(false);
          return;
        }

        if (workMinutes === 50) {
          setPomCycle('50/10');
          setPomMode('work');
          setPomTime(CYCLES['50/10'].work);
          setPomRunning(false);
          return;
        }

        const breakMinutes = workMinutes >= 45 ? 10 : 5;
        CYCLES.custom = { work: workMinutes * 60, break: breakMinutes * 60 };
        setPomCycle('custom');
        setPomMode('work');
        setPomTime(CYCLES.custom.work);
        setPomRunning(false);
      })
      .catch(console.error);
  }, [user?.uid]);

  // ── Format helper ─────────────────────────────────────────────────────────
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const logSession = useCallback((type, duration) => {
    const now = new Date();
    setSessions(prev => [{
      id: Date.now(),
      type,
      duration,
      completed: true,
      subject: currentSubject || null,
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }, ...prev]);
  }, [currentSubject]);

  // ── Pomodoro interval ─────────────────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (pomRunning && pomTime > 0) {
      interval = setInterval(() => {
        setPomTime(t => {
          if (t <= 1) {
            setPomRunning(false);
            // Auto-switch mode
            setPomMode(prev => {
              const next = prev === 'work' ? 'break' : 'work';
              setPomTime(CYCLES[pomCycle][next]);
              return next;
            });
            if (pomMode === 'work') {
              logSession('Pomodoro', Math.floor(CYCLES[pomCycle].work / 60));
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pomRunning, pomTime, pomCycle, pomMode, logSession]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const previousModeRef = useRef(pomMode);
  useEffect(() => {
    if (previousModeRef.current === pomMode) return;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      if (pomMode === 'break') {
        new Notification('Break started', {
          body: 'Focus block complete. Take a short break.',
        });
      } else {
        new Notification('Back to focus', {
          body: 'Break is over. Time for the next focus block.',
        });
      }
    }

    previousModeRef.current = pomMode;
  }, [pomMode]);

  // ── Stopwatch interval ────────────────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (trackerRunning) {
      interval = setInterval(() => {
        setSessionTime(t => t + 1);
        setQuestionTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [trackerRunning]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const switchPomCycle = useCallback((cycleKey) => {
    if (!CYCLES[cycleKey]) return;
    setPomCycle(cycleKey);
    setPomMode('work');
    setPomTime(CYCLES[cycleKey].work);
    setPomRunning(false);
  }, []);

  const resetPomodoro = useCallback(() => {
    setPomTime(CYCLES[pomCycle][pomMode]);
    setPomRunning(false);
  }, [pomCycle, pomMode]);

  const togglePomodoro = useCallback(() => {
    if (pomTime === 0) return;
    setPomRunning(r => !r);
  }, [pomTime]);

  const handleNextQuestion = useCallback(() => {
    if (questionTime === 0 && sessionTime === 0) return;
    setQuestionLaps(prev => [...prev, questionTime]);
    setQuestionsSolved(s => s + 1);
    setQuestionTime(0);
  }, [questionTime, sessionTime]);

  const handleEndSession = useCallback(() => {
    if (sessionTime === 0) return;
    const avgSeconds = questionsSolved > 0 ? Math.floor(sessionTime / questionsSolved) : 0;
    const avgFormatted = formatTime(avgSeconds);
    logSession(`${sessionName} (${questionsSolved} Qs, Avg: ${avgFormatted})`, Math.floor(sessionTime / 60));
    setTrackerRunning(false);
    setSessionTime(0);
    setQuestionTime(0);
    setQuestionsSolved(0);
    setQuestionLaps([]);
  }, [sessionTime, questionsSolved, sessionName, formatTime, logSession]);

  const deleteSession = useCallback((id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const editSessionName = useCallback((id, newName) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, type: newName } : s));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalStudyTime = sessions
    .filter(s => s.type === 'Pomodoro')
    .reduce((sum, s) => sum + s.duration, 0);
  const todaySessions = sessions.filter(s => s.type === 'Pomodoro').length;

  // Is any timer actively running?
  const isAnyTimerActive = pomRunning || trackerRunning;
  // Is any timer in use (running or paused mid-countdown)?
  const isTimerInUse = pomRunning || trackerRunning || pomTime !== CYCLES[pomCycle][pomMode] || sessionTime > 0;

  const value = {
    // Pomodoro
    pomCycle, pomMode, pomTime, pomRunning,
    switchPomCycle, resetPomodoro, togglePomodoro,
    // Stopwatch
    sessionTime, questionTime, trackerRunning, questionsSolved, questionLaps, sessionName,
    setTrackerRunning, setSessionName, handleNextQuestion, handleEndSession,
    // Log
    sessions, currentSubject, setCurrentSubject,
    logSession, deleteSession, editSessionName,
    // Derived
    totalStudyTime, todaySessions, formatTime,
    isAnyTimerActive, isTimerInUse,
    // Cycle info for UI
    CYCLES,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
};

export default TimerContext;

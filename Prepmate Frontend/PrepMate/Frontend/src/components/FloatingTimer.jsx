import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Clock, X, Minimize2, Maximize2 } from 'lucide-react';
import { useTimer } from '../context/TimerContext';

const FloatingTimer = () => {
  const {
    pomTime, pomRunning, pomMode, pomCycle,
    togglePomodoro, resetPomodoro,
    sessionTime, trackerRunning,
    formatTime, isTimerInUse,
  } = useTimer();

  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't render if no timer is in use or if dismissed
  if (!isTimerInUse || dismissed) return null;

  const isPomActive = pomRunning || pomTime !== (pomCycle === '50/10' ? 50 * 60 : 25 * 60);
  const displayTime = isPomActive ? formatTime(pomTime) : formatTime(sessionTime);
  const timerLabel = isPomActive
    ? `${pomMode === 'work' ? '🔴 Focus' : '🟢 Break'} (${pomCycle})`
    : '⏱️ Stopwatch';
  const isRunning = pomRunning || trackerRunning;

  const content = (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 99999 }}
      className="select-none"
    >
      <div className={`bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden transition-all duration-300 ${expanded ? 'w-72' : 'w-auto'}`}>
        {/* Compact pill */}
        <div className="flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing">
          {/* Pulsing dot */}
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />

          {/* Timer display */}
          <span className="text-white font-mono font-black text-lg tracking-tight min-w-[60px]">
            {displayTime}
          </span>

          {/* Label */}
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider truncate hidden sm:block">
            {timerLabel}
          </span>

          <div className="flex items-center gap-1 ml-auto">
            {isPomActive && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); togglePomodoro(); }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  {pomRunning ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); resetPomodoro(); }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
              </>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 transition-colors"
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/30 text-slate-400 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Expanded section */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
            {/* Pomodoro details */}
            {isPomActive && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Mode</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${pomMode === 'work' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {pomMode === 'work' ? 'Focus Time' : 'Break Time'}
                </span>
              </div>
            )}

            {/* Progress bar */}
            {isPomActive && (
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 rounded-full ${pomMode === 'work' ? 'bg-blue-500' : 'bg-emerald-500'}`}
                  style={{
                    width: `${(1 - pomTime / (pomCycle === '50/10'
                      ? (pomMode === 'work' ? 50 * 60 : 10 * 60)
                      : (pomMode === 'work' ? 25 * 60 : 5 * 60)
                    )) * 100}%`
                  }}
                />
              </div>
            )}

            {/* Stopwatch details */}
            {!isPomActive && sessionTime > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Elapsed</span>
                <span className="text-xs font-bold text-emerald-400">{formatTime(sessionTime)}</span>
              </div>
            )}

            <div className="text-[10px] text-slate-600 text-center">
              Drag to reposition • Click × to dismiss
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default FloatingTimer;

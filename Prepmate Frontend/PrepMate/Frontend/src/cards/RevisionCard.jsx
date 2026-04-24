import React from 'react';
import { revisionService } from '../services/revisionService';

/**
 * RevisionCard Component
 * Displays an individual revision task with urgency indicators.
 */
const RevisionCard = ({ task, onComplete }) => {
  const urgency = revisionService.getUrgencyStatus(task.scheduled_date);
  const relativeDate = revisionService.formatRelativeDate(task.original_date);

  // Theme mapping for different intervals
  const intervalStyles = {
    1: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
    3: 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10',
    7: 'border-purple-500/50 text-purple-400 bg-purple-500/10',
    21: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
  };

  return (
    <div className={`group relative flex items-center justify-between p-4 mb-3 rounded-2xl border transition-all duration-300 hover:scale-[1.01] hover:bg-white/5 ${
      urgency === 'overdue' ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/5'
    }`}>
      <div className="flex items-center space-x-4">
        {/* Interval Badge */}
        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border ${intervalStyles[task.interval_day] || 'border-slate-500'}`}>
          <span className="text-[10px] font-black uppercase tracking-tighter leading-none opacity-70">Day</span>
          <span className="text-lg font-black leading-none">{task.interval_day}</span>
        </div>

        {/* Content */}
        <div>
          <h4 className="text-slate-100 font-semibold tracking-wide group-hover:text-indigo-400 transition-colors">
            {task.sub_topic_name || "Untitled Session"}
          </h4>
          <p className="text-xs text-slate-400 mt-1 italic">
            Studied {relativeDate}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={() => onComplete(task.id)}
        className="h-10 w-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-500 hover:border-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all active:scale-90"
        title="Mark as Revised"
      >
        <i className="fa-solid fa-check text-sm"></i>
      </button>
    </div>
  );
};

export default RevisionCard;
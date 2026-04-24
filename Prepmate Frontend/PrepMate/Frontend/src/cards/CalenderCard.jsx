import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from "./GlassCard";

const DAYS = ["S","M","T","W","T","F","S"];

export default function CalenderCard() {
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOffset = new Date(calYear, calMonth, 1).getDay();
  const calMonthName = new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth = calMonth === new Date().getMonth() && calYear === new Date().getFullYear();
  const todayDate = new Date().getDate();

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  return (
    <GlassCard title="Calendar">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
        <span className="text-sm text-white/80 font-medium">{calMonthName}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"><ChevronRight size={16} /></button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {DAYS.map((d, i) => (
          <span key={i} className="text-white/50">{d}</span>
        ))}
        {[...Array(firstDayOffset)].map((_, i) => <span key={`e-${i}`} />)}
        {[...Array(daysInMonth)].map((_, i) => {
          const day = i + 1;
          const isToday = isCurrentMonth && day === todayDate;
          return (
            <span
              key={day}
              className={`py-1 rounded-md ${isToday ? "bg-blue-500/30 text-white font-bold" : "text-white/70 hover:bg-white/10 cursor-pointer"}`}
            >
              {day}
            </span>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-white/60">
        GATE Exam • <span className="text-white">52 days remaining</span>
      </p>
    </GlassCard>
  );
}

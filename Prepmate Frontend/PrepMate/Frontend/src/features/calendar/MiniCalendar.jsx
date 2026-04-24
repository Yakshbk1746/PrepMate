import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MiniCalendar = ({ viewDate, setViewDate, today, firstDay, daysInMonth }) => (
  <div className="xl:col-span-4 h-fit bg-[#111327]/60 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-xl transition-all hover:border-white/10">
    <h2 className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-700 mb-10">Calendar</h2>
    <div className="flex justify-between items-center mb-8">
      <ChevronLeft size={18} className="cursor-pointer hover:text-white transition-transform hover:-translate-x-1" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} />
      <span className="text-[11px] font-black text-slate-300 tracking-[3px] uppercase">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
      <ChevronRight size={18} className="cursor-pointer hover:text-white transition-transform hover:translate-x-1" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} />
    </div>
    <div className="grid grid-cols-7 gap-y-6 text-center text-[11px] mb-10">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <div key={d} className="text-slate-700 font-black">{d}</div>)}
      {Array.from({ length: firstDay }).map((_, i) => <div key={`b-${i}`} />)}
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const isRealToday = day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
        return (
          <div key={day} className={`relative py-2 cursor-pointer transition-all hover:text-white ${isRealToday ? 'text-white font-bold' : 'text-slate-600 hover:scale-110'}`}>
            {isRealToday && <div className="absolute inset-0 bg-blue-600 rounded-xl -z-10 shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-pulse" />}
            {day}
          </div>
        );
      })}
    </div>
    <div className="pt-10 border-t border-white/5 text-center group">
      <p className="text-[10px] font-black text-slate-600 tracking-[0.5em] mb-4 uppercase">GATE Exam</p>
      <div className="flex justify-center items-baseline gap-2 transition-transform group-hover:scale-110 duration-500">
        <span className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">52</span>
        <span className="text-[10px] text-slate-600 uppercase tracking-widest font-black">days left</span>
      </div>
    </div>
  </div>
);

export default MiniCalendar;
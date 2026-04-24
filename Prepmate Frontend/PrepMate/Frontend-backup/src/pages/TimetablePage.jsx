import React, { useState, useEffect } from 'react';
import { Plus, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getTimetableEventsByDate, createTimetableEvent as createTimetableEventApi, deleteTimetableEvent as deleteTimetableEventApi } from '../services/api';

const HOUR_HEIGHT = 60; // 1 hour = 60px

const COLORS = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300', solid: 'bg-blue-500' },
  { bg: 'bg-violet-500/20', border: 'border-violet-500/40', text: 'text-violet-300', solid: 'bg-violet-500' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300', solid: 'bg-emerald-500' },
  { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-300', solid: 'bg-orange-500' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-300', solid: 'bg-cyan-500' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/40', text: 'text-pink-300', solid: 'bg-pink-500' },
  { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-300', solid: 'bg-yellow-500' },
];

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const formatTime12 = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const TimetablePage = () => {
  const { dbUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch timetable events from backend
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchEvents = async () => {
      try {
        const dateStr = currentDate.toISOString().split('T')[0];
        const res = await getTimetableEventsByDate(dbUser.id, dateStr);
        setEvents(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching timetable events:', error);
      }
    };
    fetchEvents();
  }, [dbUser?.id, currentDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const prevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const nextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const addEvent = async (e) => {
    e.preventDefault();
    if (!dbUser?.id) return;
    const fd = new FormData(e.target);
    const newEvent = {
      title: fd.get('title'),
      date: currentDate.toISOString().split('T')[0],
      start: fd.get('start'),
      end: fd.get('end'),
      color: events.length % COLORS.length,
    };
    try {
      const res = await createTimetableEventApi(dbUser.id, newEvent);
      setEvents(prev => [...prev, res.data]);
    } catch (error) {
      console.error('Error creating timetable event:', error);
    }
    setShowAddModal(false);
  };

  const removeEvent = async (id) => {
    if(confirm('Delete event?')) {
      try {
        await deleteTimetableEventApi(id);
        setEvents(prev => prev.filter(e => e.id !== id));
      } catch (error) {
        console.error('Error deleting timetable event:', error);
      }
    }
  };

  const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Current time indicator
  const now = new Date();
  const isToday = currentDate.toDateString() === now.toDateString();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Layout logic for overlapping events
  const sortedEvents = [...events].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  
  const getLayout = (eventsList) => {
     let laidOut = [];
     let currentGroup = [];
     let groupEnd = 0;
     
     eventsList.forEach(ev => {
        let start = timeToMinutes(ev.start);
        let end = timeToMinutes(ev.end);
        
        if (start >= groupEnd) {
           if (currentGroup.length > 0) {
              setGroupMetrics(currentGroup);
              laidOut = laidOut.concat(currentGroup);
           }
           currentGroup = [{...ev}];
           groupEnd = end;
        } else {
           currentGroup.push({...ev});
           groupEnd = Math.max(groupEnd, end);
        }
     });
     
     if (currentGroup.length > 0) {
        setGroupMetrics(currentGroup);
        laidOut = laidOut.concat(currentGroup);
     }
     return laidOut;
  };
  
  const setGroupMetrics = (group) => {
      let columns = [];
      group.forEach(ev => {
         let start = timeToMinutes(ev.start);
         let end = timeToMinutes(ev.end);
         let colIdx = 0;
         while (columns[colIdx] && columns[colIdx].some(p => timeToMinutes(p.start) < end && timeToMinutes(p.end) > start)) {
             colIdx++;
         }
         if (!columns[colIdx]) columns[colIdx] = [];
         columns[colIdx].push(ev);
         ev.colIndex = colIdx;
      });
      const numCols = columns.length;
      group.forEach(ev => {
          ev.numCols = numCols;
      });
  };

  const layoutEvents = getLayout(sortedEvents);

  return (
    <div className="space-y-6">

      {/* Day Navigation */}
      <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={prevDay} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-slate-400" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currentDate.getDate()}</h2>
              <p className="text-xs text-slate-500">{dateStr}</p>
            </div>
            <button onClick={nextDay} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToToday} className="text-xs font-semibold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 border border-blue-500/20 transition-all">
              Today
            </button>
            <button onClick={() => setShowAddModal(true)} className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 transition-all flex items-center gap-1.5">
              <Plus size={14} />
              Add Event
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
          <span>{events.length} events scheduled</span>
          <span>•</span>
          <span>{events.reduce((sum, e) => sum + (timeToMinutes(e.end) - timeToMinutes(e.start)), 0) / 60}h planned</span>
        </div>
      </div>

      {/* Calendar Day View */}
      <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="overflow-y-auto max-h-[calc(100vh-300px)] custom-scrollbar relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          
          {/* Hour lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-slate-100 dark:border-white/[0.04] flex"
              style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <div className="w-16 shrink-0 px-3 pt-1">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-600">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
              <div className="flex-1 border-l border-slate-100 dark:border-white/[0.04]" />
            </div>
          ))}

          {/* Current time indicator */}
          {isToday && (
            <div
              className="absolute left-16 right-0 z-30 flex items-center pointer-events-none"
              style={{ top: `${(currentMinutes / 60) * HOUR_HEIGHT}px` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5" />
              <div className="flex-1 h-[2px] bg-red-500" />
            </div>
          )}

          {/* Event blocks */}
          {layoutEvents.map((event) => {
            const startMin = timeToMinutes(event.start);
            const endMin = timeToMinutes(event.end);
            const top = (startMin / 60) * HOUR_HEIGHT;
            const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20);
            const color = COLORS[event.color % COLORS.length];

            const widthPct = 100 / (event.numCols || 1);
            const leftPct = widthPct * (event.colIndex || 0);

            return (
              <div
                key={event.id}
                className={`absolute ${color.bg} ${color.border} border rounded-xl px-2 py-1.5 md:px-3 md:py-2 z-20 group cursor-pointer hover:opacity-90 transition-all overflow-hidden`}
                style={{ 
                  top: `${top}px`, 
                  height: `${height}px`,
                  left: `calc(72px + (100% - 84px) * ${leftPct / 100})`, // 72px left indent + 12px padding
                  width: `calc((100% - 84px) * ${widthPct / 100})`
                }}
              >
                <div className="flex items-start justify-between min-w-0">
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs md:text-sm font-bold ${color.text} truncate`}>{event.title}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-slate-500 shrink-0" />
                      <span className="text-[9px] md:text-[10px] text-slate-500 truncate">{formatTime12(event.start)} - {formatTime12(event.end)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeEvent(event.id); }}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-all shrink-0 ml-1 md:ml-2"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#0f1629] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Event</h3>
            <form onSubmit={addEvent}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 font-semibold block mb-1">Event Title</label>
                  <input
                    name="title"
                    type="text"
                    placeholder="e.g., Algorithms - DP Practice"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-blue-500/50"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">Start Time</label>
                    <input
                      name="start"
                      type="time"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">End Time</label>
                    <input
                      name="end"
                      type="time"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 px-4 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.1] hover:bg-slate-200 dark:hover:bg-white/[0.08] font-medium transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 px-4 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all">Add Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;

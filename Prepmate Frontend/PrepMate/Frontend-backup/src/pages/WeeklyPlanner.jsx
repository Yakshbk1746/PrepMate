import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, ArrowRight, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { getWeeklyTopics as getWeeklyPlan, createWeeklyTopic as createWeeklyPlanApi, deleteWeeklyTopic as deleteWeeklyPlanApi, getSubjectsByExamNameAndStreamName, getSubjectsByStreamName } from '../services/api';

const DEFAULT_SUBJECT_COLORS = {
  'Algorithms': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', accent: 'bg-blue-500' },
  'Operating Systems': { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', accent: 'bg-violet-500' },
  'DBMS': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: 'bg-cyan-500' },
  'Computer Networks': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', accent: 'bg-orange-500' },
  'General Aptitude': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', accent: 'bg-yellow-500' },
  'Revision': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: 'bg-emerald-500' },
};

const WeeklyPlanner = () => {
  const { dbUser } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [weekData, setWeekData] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchData = async () => {
      try {
        // Find week start date for API
        const weekStartDateStr = weekStart.toISOString().split('T')[0];
        const res = await getWeeklyPlan(dbUser.id, weekStartDateStr);
        
        // Group by day format 'Mon', 'Tue' etc
        const groupedData = {};
        if (Array.isArray(res.data)) {
          res.data.forEach(plan => {
            const dateObj = new Date(plan.date);
            const dayKey = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            if (!groupedData[dayKey]) groupedData[dayKey] = [];
            groupedData[dayKey].push(plan);
          });
        }
        setWeekData(groupedData);

        // Fetch subjects for dropdown if stream is available
        if (dbUser.exam && dbUser.stream) {
            try {
                const subRes = await getSubjectsByExamNameAndStreamName(dbUser.exam, dbUser.stream);
                setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
            } catch (error) {
                console.warn('Error fetching subjects by exam+stream, falling back to stream only:', error);
                try {
                    const subRes = await getSubjectsByStreamName(dbUser.stream);
                    setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
                } catch (streamError) {
                    console.warn('Error fetching subjects:', streamError);
                    setSubjects([]);
                }
            }
        } else if (dbUser.stream) {
            try {
                const subRes = await getSubjectsByStreamName(dbUser.stream);
                setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
            } catch (error) {
                console.warn('Error fetching subjects:', error);
                setSubjects([]);
            }
        } else {
            setSubjects([]);
        }

      } catch (error) {
        console.error('Error fetching weekly data:', error);
      }
    };
    fetchData();
  }, [dbUser?.id, dbUser?.exam, dbUser?.stream, weekStart.toISOString()]);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const openAddModal = (day) => {
    setSelectedDay(day);
    setShowAddModal(true);
  };

  const addTopic = async (subjectName, topic, timeFrom, timeTo) => {
    if (!selectedDay || !subjectName || !topic.trim() || !dbUser?.id) return;
    const dayKey = selectedDay.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = selectedDay.toISOString().split('T')[0];

    const newPlan = {
      subject: subjectName,
      topic,
      timeFrom: timeFrom || null,
      timeTo: timeTo || null,
      weekStartDate: dateStr,
      dayOfWeek: dayKey
    };

    try {
      console.log('[WeeklyPlanner] Creating weekly topic with data:', newPlan);
      const res = await createWeeklyPlanApi(dbUser.id, newPlan);
      console.log('[WeeklyPlanner] Weekly topic created successfully:', res.data);
      setWeekData(prev => ({
        ...prev,
        [dayKey]: [...(prev[dayKey] || []), res.data],
      }));
    } catch (error) {
      console.error('[WeeklyPlanner] Error creating weekly plan:', error.message);
      console.error('[WeeklyPlanner] Error details:', error.response?.data || error);
      alert('Failed to create weekly plan: ' + (error.response?.data?.message || error.message));
    }

    setShowAddModal(false);
    setSelectedDay(null);
  };

  const removeTopic = async (dayKey, planId, index) => {
    if(confirm('Delete this plan?')) {
      try {
        await deleteWeeklyPlanApi(planId);
        setWeekData(prev => ({
          ...prev,
          [dayKey]: prev[dayKey].filter(p => p.id !== planId),
        }));
      } catch (error) {
         console.error('Error deleting weekly plan:', error);
      }
    }
  };

  const goToDailyPlanner = (date) => {
    navigate(`/daily?date=${date.toISOString().split('T')[0]}`);
  };

  const weekRange = `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-6">

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={goToToday} className="text-xs font-semibold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 border border-blue-500/20 transition-all">Today</button>
          <div className="flex items-center gap-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] px-3 py-1.5 rounded-lg">
            <button onClick={prevWeek} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[140px] text-center">{weekRange}</span>
            <button onClick={nextWeek} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))' }}>
        {weekDays.map((date, i) => {
          const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
          const topics = weekData[dayKey] || [];
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date() && !isToday;

          return (
            <div key={i} className={`bg-white dark:bg-[#0a0f1e]/60 border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col min-w-0 ${isToday ? 'border-blue-500/50 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.09]'} ${isPast ? 'opacity-60' : ''}`}>
              
              <div className={`px-4 py-3 border-b flex items-center justify-between ${isToday ? 'bg-blue-500/10 border-blue-500/20' : 'border-slate-100 dark:border-white/[0.05]'}`}>
                <div className="min-w-0">
                  <div className={`text-xs font-black uppercase tracking-wider ${isToday ? 'text-blue-400' : 'text-slate-500'}`}>{dayKey}</div>
                  <div className={`text-2xl font-black leading-none mt-1 ${isToday ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{date.getDate()}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-600 font-medium mt-0.5">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                </div>
                {isToday && <div className="flex flex-col items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Now</span></div>}
              </div>

              <div className="flex-1 p-3 space-y-2 min-h-[250px] max-h-[400px] overflow-y-auto min-w-0">
                {topics.map((item, idx) => {
                  const colors = DEFAULT_SUBJECT_COLORS[item.subject] || DEFAULT_SUBJECT_COLORS['Algorithms'];
                  const hasTime = item.timeFrom && item.timeTo;
                  return (
                    <div key={item.id || idx} className={`group p-3 rounded-xl border ${colors.bg} ${colors.border} hover:scale-[1.02] transition-all duration-200 cursor-pointer relative min-w-0`}>
                      {hasTime && <div className="flex items-center gap-1.5 mb-2"><Clock size={10} className={colors.text} /><span className={`text-[10px] font-bold ${colors.text} truncate`}>{item.timeFrom} - {item.timeTo}</span></div>}
                      <div className="flex items-center gap-2 mb-1.5 min-w-0"><div className={`w-1 h-4 rounded-full shrink-0 ${colors.accent}`} /><span className={`text-xs font-bold ${colors.text} truncate`}>{item.subject}</span></div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-3 line-clamp-2 break-words">{item.topic}</p>
                      <button onClick={(e) => { e.stopPropagation(); removeTopic(dayKey, item.id, idx); }} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-all duration-200"><X size={10} /></button>
                    </div>
                  );
                })}
                {topics.length === 0 && <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-700"><div className="text-center"><CalendarIcon size={24} className="mx-auto mb-2 opacity-30" /><p className="text-xs italic">No topics</p></div></div>}
              </div>

              <div className="px-3 pb-3 flex gap-2 border-t border-slate-100 dark:border-white/[0.05] pt-3">
                <button onClick={() => openAddModal(date)} className="flex-1 py-2 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-200 flex items-center justify-center gap-1.5"><Plus size={14} /> Add</button>
                <button onClick={() => goToDailyPlanner(date)} className="py-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-all duration-200 flex items-center gap-1"><ArrowRight size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Topic Modal */}
      {showAddModal && selectedDay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#0f1629] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add Topic</h3>
            <p className="text-sm text-slate-500 mb-4">{selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <form onSubmit={e => {
              e.preventDefault();
              addTopic(e.target.subject.value, e.target.topic.value, e.target.timeFrom.value, e.target.timeTo.value);
              e.target.reset();
            }}>
              <div className="space-y-3">
                <select name="subject" required className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50">
                  <option value="">Select subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.name}>{subject.name}</option>
                  ))}
                </select>
                <input name="topic" type="text" placeholder="Enter topic name..." required className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-blue-500/50" />
                <div className="border-t border-slate-100 dark:border-white/[0.05] pt-3 mt-3">
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-2"><Clock size={12} />Time slot (optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="timeFrom" type="time" className="px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50" />
                    <input name="timeTo" type="time" className="px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 px-4 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.1] hover:bg-slate-200 dark:hover:bg-white/[0.08] font-medium transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all">Add Topic</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanner;

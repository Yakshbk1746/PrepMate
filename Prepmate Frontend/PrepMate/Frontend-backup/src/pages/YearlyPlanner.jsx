import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, ChevronLeft, ChevronRight, Plus, Map, Flag, Award } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getYearlyPlans, createYearlyPlan as createYearlyPlanApi, getSubjectsByExamNameAndStreamName, getSubjectsByStreamName } from '../services/api';

// Default subjects removed

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const YearlyPlanner = () => {
  const { dbUser } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [subjects, setSubjects] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    subjectId: '',
    topic: '',
    startMonth: 0,
    startDate: '',
    endMonth: 1,
    endDate: ''
  });

  // High level goals or timeline markers for the year
  const [timelineMarkers, setTimelineMarkers] = useState([]);

  const [planMatrix, setPlanMatrix] = useState([]);

  // Fetch data
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchYearlyData = async () => {
      try {
        const res = await getYearlyPlans(dbUser.id, currentYear);
        setPlanMatrix(Array.isArray(res.data) ? res.data : []);

        let fetchedSubs = [];
        
        // Try to fetch subjects by both exam and stream
        if (dbUser.exam && dbUser.stream) {
            try {
                const subRes = await getSubjectsByExamNameAndStreamName(dbUser.exam, dbUser.stream);
                if (Array.isArray(subRes.data) && subRes.data.length > 0) {
                    fetchedSubs = subRes.data;
                }
            } catch (error) {
                console.warn('Error fetching subjects by exam+stream, falling back to stream only:', error);
                // Fallback: try fetching by stream name only
                try {
                    const subRes = await getSubjectsByStreamName(dbUser.stream);
                    if (Array.isArray(subRes.data) && subRes.data.length > 0) {
                        fetchedSubs = subRes.data;
                    }
                } catch (streamError) {
                    console.warn('Error fetching subjects by stream:', streamError);
                }
            }
        } else if (dbUser.stream) {
            // If only stream is available
            try {
                const subRes = await getSubjectsByStreamName(dbUser.stream);
                if (Array.isArray(subRes.data) && subRes.data.length > 0) {
                    fetchedSubs = subRes.data;
                }
            } catch (error) {
                console.warn('Error fetching subjects by stream:', error);
            }
        }
        
        // Map fetched subjects with colors and icons
        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 'bg-orange-500', 'bg-cyan-500'];
        const icons = ['📐', '⚡', '🧪', '💻', '📘', '🧠'];
        const mappedSubs = fetchedSubs.map((s, i) => ({
            id: String(s.id),
            name: s.name,
            color: s.color || colors[i % colors.length],
            icon: s.icon || icons[i % icons.length]
        }));
        
        if (mappedSubs.length > 0) {
            setNewGoal(prev => ({...prev, subjectId: prev.subjectId || mappedSubs[0].id}));
        }
        setSubjects(mappedSubs);
      } catch (error) {
        console.error('Error fetching yearly plans:', error);
      }
    };
    fetchYearlyData();
  }, [dbUser?.id, dbUser?.exam, dbUser?.stream, currentYear]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.topic.trim() || !newGoal.subjectId || !dbUser?.id) return;
    
    const subjectObj = subjects.find(s => s.id === newGoal.subjectId);
    const subjectName = subjectObj ? subjectObj.name : newGoal.subjectId;
    
    const sMonth = parseInt(newGoal.startMonth);
    const eMonth = parseInt(newGoal.endMonth);
    
    // Parse date, default Start Date to 1, End Date to 30 if empty
    let sDate = newGoal.startDate ? parseInt(newGoal.startDate) : 1;
    let eDate = newGoal.endDate ? parseInt(newGoal.endDate) : 30;

    let sFraction = sMonth + Math.min(Math.max((sDate - 1) / 30, 0), 0.99);
    let eFraction = eMonth + Math.min(Math.max((eDate - 1) / 30, 0), 0.99);

    // Ensure start is <= end month
    if (sFraction > eFraction) {
      const temp = sFraction;
      sFraction = eFraction;
      eFraction = temp;
    }

    const goalItem = {
      year: currentYear,
      subject: subjectName,
      topic: newGoal.topic,
      startMonth: sFraction,
      endMonth: eFraction,
      progress: 0
    };
    
    try {
      const res = await createYearlyPlanApi(dbUser.id, goalItem);
      setPlanMatrix([...planMatrix, res.data]);
    } catch (error) {
       console.error('Error creating yearly plan:', error);
    }
    
    setNewGoal({ subjectId: subjects[0]?.id || '', topic: '', startMonth: 0, startDate: '', endMonth: 1, endDate: '' });
    setShowAddModal(false);
  };

  const increaseYear = () => setCurrentYear(y => y + 1);
  const decreaseYear = () => setCurrentYear(y => y - 1);

  const getTypeColor = (type) => {
    switch(type) {
      case 'milestone': return 'text-violet-500 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20';
      case 'goal': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'phase': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      case 'exam': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
      default: return 'text-slate-500 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10';
    }
  };

  const getSubjectColor = (subjectName) => subjects.find(s=>s.name === subjectName || s.id === subjectName)?.color || 'bg-slate-500';
  const getSubjectIcon = (subjectName) => subjects.find(s=>s.name === subjectName || s.id === subjectName)?.icon || '📚';

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-2">
          <div className="flex items-center gap-4">
            <button onClick={decreaseYear} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-slate-300 dark:border-transparent text-slate-700 dark:text-white">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
              <Map size={24} className="text-blue-500"/> {currentYear} ROADMAP
            </h2>
            <button onClick={increaseYear} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-slate-300 dark:border-transparent text-slate-700 dark:text-white">
              <ChevronRight size={20} />
            </button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} /> New Goal
          </button>
        </div>

        {/* Subjects Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {subjects.map(subject => (
            <div key={subject.id} className="flex items-center gap-2 bg-white dark:bg-[#0a0f1e]/60 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/[0.06] shadow-sm">
              <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{subject.name}</span>
            </div>
          ))}
        </div>

        {/* Gantt Chart Area */}
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm relative">
          
          {/* Months Header row */}
          <div className="grid grid-cols-12 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
            {MONTHS.map((month, idx) => (
              <div key={idx} className="py-3 text-center border-r last:border-0 border-slate-200 dark:border-white/[0.06] relative">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{month}</span>
                {/* Milestone Marker if present */}
                {timelineMarkers.filter(m => m.monthIdx === idx).map(marker => (
                  <div key={marker.id} className={`absolute -bottom-8 left-1/2 -translate-x-1/2 border px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider whitespace-nowrap z-10 ${getTypeColor(marker.type)} shadow-sm`}>
                    <div className="flex items-center gap-1">
                      {marker.type === 'milestone' && <Flag size={10}/>}
                      {marker.type === 'exam' && <Target size={10}/>}
                      {marker.type === 'goal' && <Award size={10}/>}
                      {marker.title}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Spacer for milestones */}
          <div className="h-10 border-b border-slate-200 dark:border-white/[0.06] grid grid-cols-12">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border-r last:border-0 border-slate-200 dark:border-white/[0.06] opacity-30"></div>
            ))}
          </div>

          {/* Plan Blocks */}
          <div className="relative p-4 space-y-4">
            {/* Grid background lines */}
            <div className="absolute inset-x-4 top-0 bottom-0 grid grid-cols-12 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="border-r border-slate-200 border-dashed dark:border-white/[0.03] last:border-0"></div>
              ))}
            </div>

            {/* Blocks */}
            {planMatrix.map(item => {
              const startPercent = (item.startMonth / 12) * 100;
              const widthPercent = ((item.endMonth - item.startMonth + 1) / 12) * 100;
              const bgColor = getSubjectColor(item.subject);
              const icon = getSubjectIcon(item.subject);

              return (
                <div key={item.id} className="relative h-12 w-full flex items-center group">
                  <div 
                    className={`absolute h-10 ${bgColor} bg-opacity-90 rounded-lg shadow-sm border border-black/10 overflow-hidden flex items-center px-3 transition-transform hover:scale-[1.01] cursor-pointer hover:shadow-md hover:brightness-110`}
                    style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                  >
                    {/* Progress Bar Background fill */}
                    <div className="absolute inset-y-0 left-0 bg-black/20" style={{ width: `${item.progress}%` }}></div>
                    
                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-between w-full min-w-0 gap-2">
                       <span className="text-white text-xs font-bold truncate tracking-wide hidden sm:block">
                         {icon} {item.topic}
                       </span>
                       <span className="text-white text-[10px] font-black opacity-80 shrink-0 bg-black/20 px-1.5 py-0.5 rounded">
                         {item.progress}%
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Legend for Types */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Phases</span>
            <div className="w-8 h-1 bg-emerald-500 rounded"></div>
          </div>
          <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-violet-800 dark:text-violet-400 uppercase tracking-widest">Milestones</span>
            <Flag size={16} className="text-violet-500"/>
          </div>
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest">Goals</span>
            <Award size={16} className="text-blue-500"/>
          </div>
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-widest">Exams</span>
            <Target size={16} className="text-rose-500"/>
          </div>
        </div>

      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-4 border-b border-slate-100 dark:border-white/10">Add New Topic</h3>
            
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Subject</label>
                <select
                  value={newGoal.subjectId}
                  onChange={(e) => setNewGoal({...newGoal, subjectId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Topic Name</label>
                <input
                  type="text"
                  required
                  value={newGoal.topic}
                  onChange={(e) => setNewGoal({...newGoal, topic: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., Integration"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Start Date</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="DD"
                      value={newGoal.startDate}
                      onChange={(e) => setNewGoal({...newGoal, startDate: e.target.value})}
                      className="w-20 px-3 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                    <select
                      value={newGoal.startMonth}
                      onChange={(e) => setNewGoal({...newGoal, startMonth: e.target.value})}
                      className="flex-1 px-3 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">End Date</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="DD"
                      value={newGoal.endDate}
                      onChange={(e) => setNewGoal({...newGoal, endDate: e.target.value})}
                      className="w-20 px-3 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                    <select
                      value={newGoal.endMonth}
                      onChange={(e) => setNewGoal({...newGoal, endMonth: e.target.value})}
                      className="flex-1 px-3 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default YearlyPlanner;
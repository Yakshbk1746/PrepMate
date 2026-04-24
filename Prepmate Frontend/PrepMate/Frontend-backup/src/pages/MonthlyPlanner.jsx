import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, MoreHorizontal, Target, CheckCircle2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getMonthlyTasks as getMonthlyPlan, createMonthlyTask as createMonthlyPlanApi, deleteMonthlyTask as deleteMonthlyPlanApi, getSubjectsByExamNameAndStreamName, getSubjectsByStreamName } from '../services/api';

// Default subjects array removed
const MonthPlanner = () => {
  const { dbUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [subjects, setSubjects] = useState([]);
  const [weeksData, setWeeksData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ weekId: 1, subjectId: '', topic: '' });

  // Fetch data
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchMonthlyData = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // 1-12
        const res = await getMonthlyPlan(dbUser.id, year, month);
        
        // Group by week
        const baseWeeks = [
          { id: 1, name: 'Week 1', dateRange: '1st - 7th', tasks: [] },
          { id: 2, name: 'Week 2', dateRange: '8th - 14th', tasks: [] },
          { id: 3, name: 'Week 3', dateRange: '15th - 21st', tasks: [] },
          { id: 4, name: 'Week 4', dateRange: '22nd - End', tasks: [] }
        ];

        if (Array.isArray(res.data)) {
          res.data.forEach(task => {
            const weekIndex = task.weekNumber - 1;
            if (baseWeeks[weekIndex]) {
               baseWeeks[weekIndex].tasks.push(task);
            }
          });
        }
        setWeeksData(baseWeeks);

        let fetchedSubs = [];
        if (dbUser.exam && dbUser.stream) {
            try {
                const subRes = await getSubjectsByExamNameAndStreamName(dbUser.exam, dbUser.stream);
                if (Array.isArray(subRes.data) && subRes.data.length > 0) {
                    fetchedSubs = subRes.data;
                }
            } catch (error) {
                console.warn('Error fetching subjects by exam+stream, falling back to stream only:', error);
                if (dbUser.stream) {
                    try {
                        const subRes = await getSubjectsByStreamName(dbUser.stream);
                        if (Array.isArray(subRes.data) && subRes.data.length > 0) {
                            fetchedSubs = subRes.data;
                        }
                    } catch (streamError) {
                        console.warn('Error fetching subjects by stream:', streamError);
                    }
                }
            }
        } else if (dbUser.stream) {
            try {
                const subRes = await getSubjectsByStreamName(dbUser.stream);
                if (Array.isArray(subRes.data) && subRes.data.length > 0) {
                    fetchedSubs = subRes.data;
                }
            } catch (error) {
                console.warn('Error fetching subjects:', error);
            }
        }

        const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 'bg-orange-500', 'bg-cyan-500'];
        const mappedSubs = fetchedSubs.map((s, i) => ({
            id: String(s.id),
            name: s.name,
            color: s.color || colors[i % colors.length]
        }));
        
        if (mappedSubs.length > 0) {
            setNewTask(prev => ({...prev, subjectId: prev.subjectId || mappedSubs[0].id}));
        }
        setSubjects(mappedSubs);
      } catch (error) {
        console.error('Error fetching monthly plan:', error);
      }
    };
    fetchMonthlyData();
  }, [dbUser?.id, dbUser?.exam, dbUser?.stream, currentDate.getMonth(), currentDate.getFullYear()]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.topic.trim() || !newTask.subjectId || !dbUser?.id) return;
    
    // subjectId to actual name since API might just store string depending on schema
    const subjectObj = subjects.find(s => s.id === newTask.subjectId);
    const subjectName = subjectObj ? subjectObj.name : newTask.subjectId;

    const newPlan = {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
      weekNumber: parseInt(newTask.weekId),
      subject: subjectName,
      topic: newTask.topic
    };

    try {
      const res = await createMonthlyPlanApi(dbUser.id, newPlan);
      setWeeksData(weeksData.map(w => {
        if (w.id === Number(newTask.weekId)) {
          return {
            ...w,
            tasks: [...w.tasks, res.data]
          };
        }
        return w;
      }));
    } catch (error) {
      console.error('Error creating monthly plan:', error);
    }

    setShowAddModal(false);
    setNewTask({ ...newTask, topic: '' });
  };

  const removeTask = async (weekId, taskId) => {
    if(confirm('Remove this topic?')) {
      try {
        await deleteMonthlyPlanApi(taskId);
        setWeeksData(weeksData.map(w => {
          if (w.id === weekId) {
            return { ...w, tasks: w.tasks.filter(t => t.id !== taskId) };
          }
          return w;
        }));
      } catch (error) {
        console.error('Error deleting monthly plan:', error);
      }
    }
  };

  const getSubjectColor = (subjectName) => {
    return subjects.find(s => s.name === subjectName || s.id === subjectName)?.color || 'bg-slate-500';
  };

  const getSubjectName = (subjectName) => {
    return subjects.find(s => s.name === subjectName || s.id === subjectName)?.name || subjectName || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">

        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2">
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-slate-300 dark:border-transparent text-slate-700 dark:text-white">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-wide uppercase">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-slate-300 dark:border-transparent text-slate-700 dark:text-white">
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} /> Assign Topic
          </button>
        </div>

        {/* Subjects Legend */}
        <div className="glass-panel flex flex-wrap items-center gap-4 mb-8 p-4 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-2">
            <Target size={14} /> Subjects
          </span>
          {subjects.map(subject => (
            <div key={subject.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{subject.name}</span>
            </div>
          ))}
        </div>

        {/* Weekly Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {weeksData.map((week) => (
            <div key={week.id} className="glass-panel rounded-2xl p-5 flex flex-col h-[500px] shadow-sm hover:border-blue-400/50 transition-colors relative group">

              {/* Week Header */}
              <div className="mb-4 pb-4 border-b border-slate-200 dark:border-white/[0.06] flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <CalendarDays size={18} className="text-blue-500" />
                    {week.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{week.dateRange}</p>
                </div>
                <button
                  onClick={() => { setNewTask({ ...newTask, weekId: week.id }); setShowAddModal(true); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {week.tasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                    <p className="text-xs font-medium text-center">No topics assigned<br />for this week</p>
                  </div>
                ) : (
                  week.tasks.map(task => (
                    <div key={task.id} className="group/task relative bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${getSubjectColor(task.subject)}`}></div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          {getSubjectName(task.subject)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 pr-6 leading-tight">
                        {task.topic}
                      </p>

                      {/* Delete button appears on hover */}
                      <button
                        onClick={() => removeTask(week.id, task.id)}
                        className="absolute top-3 right-3 opacity-0 group-hover/task:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                      >
                        <Trash2 size={14} className="lucide lucide-trash-2" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Week Footer summary */}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Total Topics:</span>
                <span className="bg-slate-200 dark:bg-white/10 px-2 py-1 rounded-md text-slate-800 dark:text-white">
                  {week.tasks.length}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="glass-panel p-6 max-w-sm w-full rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wider">Assign Topic</h3>
            <form onSubmit={handleAddTask} className="space-y-4 text-slate-800 dark:text-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Week</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  value={newTask.weekId}
                  onChange={(e) => setNewTask({ ...newTask, weekId: e.target.value })}
                >
                  {weeksData.map(w => <option key={w.id} value={w.id}>{w.name} ({w.dateRange})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Subject</label>
                <select
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-500 text-slate-800 dark:text-slate-200"
                  value={newTask.subjectId}
                  onChange={(e) => setNewTask({ ...newTask, subjectId: e.target.value })}
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Topic Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-500 placeholder-slate-400 dark:text-slate-200"
                  value={newTask.topic}
                  onChange={(e) => setNewTask({ ...newTask, topic: e.target.value })}
                  placeholder="e.g. Definite Integrals"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-lg transition-colors font-bold uppercase tracking-wider text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold uppercase tracking-wider text-sm">
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MonthPlanner;
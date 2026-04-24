import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Target, Trash2, X } from 'lucide-react';
import { plannerService } from '../services/plannerService';
import { useAuth } from '../context/authContext';
import { getMonthlyTasks, createMonthlyTask, updateMonthlyTask, deleteMonthlyTask, getUserByFirebaseUid, getYearlyPlans } from '../services/api';

const DEFAULT_PROFILE = { exam: 'GATE', stream: 'CSE' };

const toSubjectId = (name = '') =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const resolveSubjectNameFromYearlyId = (rawSubjectId, subjects) => {
  if (!rawSubjectId) return '';

  if (subjects.includes(rawSubjectId)) {
    return rawSubjectId;
  }

  const idToNameMap = new Map(subjects.map((name) => [toSubjectId(name), name]));
  const aliases = {
    math: 'engineering-mathematics',
    cs: 'programming',
  };

  const alias = aliases[rawSubjectId] || rawSubjectId;
  if (idToNameMap.has(alias)) {
    return idToNameMap.get(alias);
  }

  const normalized = toSubjectId(rawSubjectId);
  if (idToNameMap.has(normalized)) {
    return idToNameMap.get(normalized);
  }

  return '';
};

const getSubjectColorClasses = (subjectName) => {
  return plannerService.getSubjectColorObj(subjectName);
};

const getOrdinal = (day) => {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  const suffixes = ['th', 'st', 'nd', 'rd'];
  return `${day}${suffixes[day % 10] || 'th'}`;
};

const MonthPlanner = () => {
  const { user, backendUserId } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const [subjects, setSubjects] = useState(plannerService.getSubjects(DEFAULT_PROFILE));
  const [yearlySubjects, setYearlySubjects] = useState([]);

  const buildEmptyWeeks = (month, year) => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    return [
    {
      id: 1,
      name: 'Week 1',
      dateRange: '1st - 7th',
      tasks: []
    },
    {
      id: 2,
      name: 'Week 2',
      dateRange: '8th - 14th',
      tasks: []
    },
    {
      id: 3,
      name: 'Week 3',
      dateRange: '15th - 21st',
      tasks: []
    },
    {
      id: 4,
      name: 'Week 4',
      dateRange: `22nd - ${getOrdinal(lastDayOfMonth)}`,
      tasks: []
    }
    ];
  };

  const [weeksData, setWeeksData] = useState(() => buildEmptyWeeks(currentMonth, currentYear));

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ weekId: 1, subjectId: '', selectedTopics: [] });

  useEffect(() => {
    if (!user?.uid) return;

    getUserByFirebaseUid(user.uid)
      .then((profile) => {
        setSubjects(plannerService.getSubjects({ exam: profile?.exam, stream: profile?.stream }));
      })
      .catch(console.error);
  }, [user?.uid]);

  useEffect(() => {
    if (!backendUserId || subjects.length === 0) return;

    getYearlyPlans(backendUserId, currentYear)
      .then((plans) => {
        const unique = new Set();
        (Array.isArray(plans) ? plans : []).forEach((item) => {
          const name = resolveSubjectNameFromYearlyId(item?.subjectId, subjects);
          if (name) unique.add(name);
        });

        setYearlySubjects(Array.from(unique).sort((a, b) => a.localeCompare(b)));
      })
      .catch(console.error);
  }, [backendUserId, currentYear, subjects]);

  useEffect(() => {
    if (!backendUserId) return;

    getMonthlyTasks(backendUserId, currentMonth + 1, currentYear)
      .then((data) => {
        const grouped = buildEmptyWeeks(currentMonth, currentYear).map((week) => ({ ...week, tasks: [] }));

        data.forEach((task) => {
          const weekIndex = Math.max(1, Math.min(4, Number(task.weekNumber || 1))) - 1;
          grouped[weekIndex].tasks.push({
            id: task.id,
            subjectId: task.subjectId,
            subject: task.subjectId,
            topics: [task.topic],
            status: task.status || 'pending',
          });
        });

        setWeeksData(grouped);
      })
      .catch(console.error);
  }, [backendUserId, currentMonth, currentYear]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    const selectedSubjectId = availableSubjects.includes(newTask.subjectId)
      ? newTask.subjectId
      : (availableSubjects[0] || '');
    if (!selectedSubjectId || newTask.selectedTopics.length === 0 || !backendUserId) return;

    const weekNumber = Number(newTask.weekId);

    Promise.all(
      newTask.selectedTopics.map((topic) =>
        createMonthlyTask(backendUserId, {
          month: currentMonth + 1,
          year: currentYear,
          weekNumber,
          subjectId: selectedSubjectId,
          topic,
          status: 'pending',
        })
      )
    )
      .then((savedTasks) => {
        setWeeksData((prev) =>
          prev.map((w) => {
            if (w.id !== weekNumber) return w;
            return {
              ...w,
              tasks: [
                ...w.tasks,
                ...savedTasks.map((saved) => ({
                  id: saved.id,
                  subjectId: saved.subjectId,
                  subject: saved.subjectId,
                  topics: [saved.topic],
                  status: saved.status || 'pending',
                })),
              ],
            };
          })
        );
      })
      .catch(console.error);

    setShowAddModal(false);
    setNewTask({ weekId: newTask.weekId, subjectId: '', selectedTopics: [] });
  };

  const removeTask = (weekId, taskId) => {
    deleteMonthlyTask(taskId)
      .then(() => {
        setWeeksData((prev) =>
          prev.map((w) => {
            if (w.id !== weekId) return w;
            return { ...w, tasks: w.tasks.filter((t) => t.id !== taskId) };
          })
        );
      })
      .catch(console.error);
  };

  const toggleTaskStatus = (weekId, taskId) => {
    const week = weeksData.find((w) => w.id === weekId);
    const task = week?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const status = task.status === 'completed' ? 'pending' : 'completed';
    updateMonthlyTask(taskId, { status })
      .then((updated) => {
        setWeeksData((prev) =>
          prev.map((w) => {
            if (w.id !== weekId) return w;
            return {
              ...w,
              tasks: w.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      status: updated.status || status,
                      subjectId: updated.subjectId || t.subjectId,
                      subject: updated.subjectId || t.subject,
                      topics: [updated.topic || t.topics?.[0] || ''],
                    }
                  : t
              ),
            };
          })
        );
      })
      .catch(console.error);
  };

  const toggleTopic = (topic) => {
    setNewTask(prev => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter(t => t !== topic)
        : [...prev.selectedTopics, topic]
    }));
  };

  const yearlyOptionSubjects = yearlySubjects;
  const otherOptionSubjects = subjects
    .filter((subject) => !yearlyOptionSubjects.includes(subject))
    .sort((a, b) => a.localeCompare(b));
  const availableSubjects = [...yearlyOptionSubjects, ...otherOptionSubjects];
  const resolvedNewTaskSubjectId = availableSubjects.includes(newTask.subjectId)
    ? newTask.subjectId
    : (availableSubjects[0] || '');
  const availableTopics = resolvedNewTaskSubjectId ? plannerService.getTopics(resolvedNewTaskSubjectId) : [];
  const subjectProgress = weeksData
    .flatMap((week) => week.tasks)
    .reduce((acc, task) => {
      const key = task.subject || task.subjectId || 'General';
      if (!acc[key]) {
        acc[key] = { total: 0, completed: 0 };
      }
      acc[key].total += 1;
      if (task.status === 'completed') {
        acc[key].completed += 1;
      }
      return acc;
    }, {});

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
            <div key={subject} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getSubjectColorClasses(subject).accent}`}></div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{subject}</span>
            </div>
          ))}
        </div>

        {Object.keys(subjectProgress).length > 0 && (
          <div className="glass-panel p-4 rounded-xl mb-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Subject Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(subjectProgress).map(([subject, stat]) => {
                const percent = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
                return (
                  <div key={subject}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{subject}</span>
                      <span className="text-slate-500">{percent}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Breakdown Grid - Responsive */}
        <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-6 pb-6 lg:pb-0 snap-x custom-scrollbar">
          {weeksData.map((week) => (
            <div key={week.id} className="glass-panel rounded-2xl p-5 flex flex-col h-[500px] shadow-sm hover:border-blue-400/50 transition-colors relative group min-w-[280px] md:min-w-0 snap-center">

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
                  week.tasks.map(task => {
                    const subjectLabel = task.subject || task.subjectId;
                    const colors = getSubjectColorClasses(subjectLabel);
                    return (
                      <div onClick={() => toggleTaskStatus(week.id, task.id)} key={task.id} className={`group/task relative bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors ${colors.border}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${colors.accent}`}></div>
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${colors.text}`}>
                            {subjectLabel}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {task.topics.map((topic, i) => (
                            <span key={i} className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                              {topic}
                            </span>
                          ))}
                        </div>

                        {/* Delete button appears on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTask(week.id, task.id);
                          }}
                          className="absolute top-3 right-3 opacity-0 group-hover/task:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Week Footer summary */}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Total Topics:</span>
                <span className="bg-slate-200 dark:bg-white/10 px-2 py-1 rounded-md text-slate-800 dark:text-white">
                  {week.tasks.reduce((sum, task) => sum + task.topics.length, 0)}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="glass-panel p-6 max-w-sm w-full rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Assign Topic</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
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
                  value={resolvedNewTaskSubjectId}
                  disabled={availableSubjects.length === 0}
                  onChange={(e) => setNewTask({ ...newTask, subjectId: e.target.value, selectedTopics: [] })}
                >
                  <option value="">{availableSubjects.length === 0 ? 'No yearly subjects found' : 'Select subject'}</option>
                  {yearlyOptionSubjects.length > 0 && (
                    <optgroup label="📌 In Yearly Plan">
                      {yearlyOptionSubjects.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </optgroup>
                  )}
                  {otherOptionSubjects.length > 0 && (
                    <optgroup label="Other Subjects">
                      {otherOptionSubjects.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {yearlyOptionSubjects.length === 0 && otherOptionSubjects.length > 0 && (
                  <p className="text-[10px] text-amber-500 font-bold mt-1">No Yearly subjects yet. Showing profile subjects.</p>
                )}
                {availableSubjects.length === 0 && (
                  <p className="text-[10px] text-amber-500 font-bold mt-1">No subjects available. Check your exam/stream in Settings.</p>
                )}
              </div>

              {/* Topic checkboxes */}
              {resolvedNewTaskSubjectId && availableTopics.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Select Topics</label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                    {availableTopics.map(topic => (
                      <label key={topic} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={newTask.selectedTopics.includes(topic)}
                          onChange={() => toggleTopic(topic)}
                          className="w-4 h-4 rounded accent-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{topic}</span>
                      </label>
                    ))}
                  </div>
                  {newTask.selectedTopics.length > 0 && (
                    <p className="text-[10px] text-blue-500 font-bold mt-2">{newTask.selectedTopics.length} topic(s) selected</p>
                  )}
                </div>
              )}

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
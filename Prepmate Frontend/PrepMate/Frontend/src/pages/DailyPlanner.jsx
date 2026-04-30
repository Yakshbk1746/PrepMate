import React, { useEffect, useState } from 'react';
import { Target, CheckCircle2, Clock, Plus, GripVertical, Play, CheckSquare, Edit2, Trash2, Maximize2, Minimize2, Save, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { plannerService } from '../services/plannerService';
import { getTasks, createTask, updateTask, deleteTask, getUserByFirebaseUid, logTimerSession } from '../services/api';
import { showToast } from '../utils/toast';

const DEFAULT_PROFILE = { exam: 'GATE', stream: 'CSE' };

// ─── Spaced Repetition Helper ────────────────────────────────────────────────

function getInitialIntervalDays(confidence) {
  if (confidence === 'shaky') return 1;
  if (confidence === 'solid') return 7;
  return 3; // okay
}

// ─── Main Component ─────────────────────────────────────────────────────────

const DailyPlanner = () => {
  const { user, backendUserId } = useAuth();
  const [subjects, setSubjects] = useState(plannerService.getSubjects(DEFAULT_PROFILE));

  const [tasks, setTasks] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    startHour: '09',
    startMin: '00',
    startPeriod: 'AM',
    endHour: '10',
    endMin: '00',
    endPeriod: 'AM',
    type: 'reading'
  });

  // Helper to convert 12h pieces to 24h string "HH:MM"
  const get24HTime = (hour, min, period) => {
    let h = parseInt(hour, 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min}`;
  };

  // ── Scratchpad State ──
  const [scratchpadContent, setScratchpadContent] = useState(() => localStorage.getItem('prepmate:scratchpad') || "• Don't forget to review Deadlock Avoidance algo.\n\n• Check tomorrow's mock test timings.");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Study Log Modal State ──
  const [showLogModal, setShowLogModal] = useState(false);
  const [pendingLogTask, setPendingLogTask] = useState(null);
  const [logForm, setLogForm] = useState({
    sessionTitle: '',
    subject: '',
    hoursStudied: '1',
    confidenceOnStudy: 'okay',
    notes: ''
  });
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;

    getUserByFirebaseUid(user.uid)
      .then((profile) => {
        setSubjects(plannerService.getSubjects({ exam: profile?.exam, stream: profile?.stream }));
      })
      .catch(console.error);
  }, [user?.uid]);

  useEffect(() => {
    if (!backendUserId) return;
    const today = new Date().toISOString().split('T')[0];

    getTasks(backendUserId)
      .then((data) => {
        const todayTasks = data.filter((t) => t.date === today);
        setTasks(todayTasks.sort((a, b) => plannerService.parseTime24h(a.startTime) - plannerService.parseTime24h(b.startTime)));
      })
      .catch(console.error);
  }, [backendUserId]);

  useEffect(() => {
    localStorage.setItem('prepmate:scratchpad', scratchpadContent);
  }, [scratchpadContent]);

  // Auto-calculate duration for the add form
  const durationMins = showAddModal ? plannerService.calculateDuration(
    get24HTime(newTask.startHour, newTask.startMin, newTask.startPeriod),
    get24HTime(newTask.endHour, newTask.endMin, newTask.endPeriod)
  ) : 0;
  
  const isRollover = showAddModal && (
    plannerService.parseTime24h(get24HTime(newTask.endHour, newTask.endMin, newTask.endPeriod)) < 
    plannerService.parseTime24h(get24HTime(newTask.startHour, newTask.startMin, newTask.startPeriod))
  );

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.subject.trim() || !backendUserId) return;

    const taskItem = {
      title: newTask.title,
      subject: newTask.subject,
      startTime: get24HTime(newTask.startHour, newTask.startMin, newTask.startPeriod),
      endTime: get24HTime(newTask.endHour, newTask.endMin, newTask.endPeriod),
      type: newTask.type,
      status: 'todo'
    };

    const payload = {
      title: taskItem.title,
      subject: taskItem.subject,
      startTime: taskItem.startTime,
      endTime: taskItem.endTime,
      date: new Date().toISOString().split('T')[0],
      status: 'todo',
      priority: taskItem.priority || 'medium',
      type: taskItem.type
    };

    if (editingTaskId) {
      updateTask(editingTaskId, payload)
        .then((updated) => {
          setTasks((prev) =>
            prev.map((task) => (task.id === editingTaskId ? { ...task, ...updated } : task))
          );
          showToast({ title: 'Task Updated', message: `${payload.title} was updated.` });
        })
        .catch(console.error);
    } else {
      createTask(backendUserId, payload)
        .then((saved) => {
          setTasks((prev) => [...prev, saved]);
          showToast({ title: 'Task Saved', message: `${payload.title} added to today.` });
        })
        .catch(console.error);
    }

    setNewTask({ title: '', subject: '', startHour: '09', startMin: '00', startPeriod: 'AM', endHour: '10', endMin: '00', endPeriod: 'AM', type: 'reading' });
    setEditingTaskId(null);
    setShowAddModal(false);
  };

  // Derive total hours dynamically from all tasks
  const computeTotalMinutes = () => {
    return tasks.reduce((acc, t) => acc + plannerService.calculateDuration(t.startTime, t.endTime), 0);
  };

  const stats = {
    totalHours: plannerService.formatDuration(computeTotalMinutes()),
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalTasks: tasks.length,
    progress: tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
  };

  const sortedTasks = tasks;

  const getTypeColor = (type) => {
    const colors = {
      reading: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
      practice: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
      revision: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20',
      video: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20'
    };
    return colors[type] || 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20';
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 size={20} className="text-emerald-500" />;
    if (status === 'in-progress') return <Play size={20} className="text-blue-500" />;
    return <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />;
  };

  const toggleTaskStatus = (id) => {
    const currentTask = tasks.find((task) => task.id === id);
    if (!currentTask) return;

    const nextStatus = currentTask.status === 'completed' ? 'todo' : 'completed';

    updateTask(id, { status: nextStatus })
      .then((updated) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));

        if (nextStatus === 'completed') {
          setPendingLogTask(updated);
          const mins = plannerService.calculateDuration(updated.startTime, updated.endTime);
          const hours = String(Math.round((mins / 60) * 2) / 2 || 0.5);

          setLogForm({
            sessionTitle: updated.title,
            subject: updated.subject || '',
            hoursStudied: hours,
            confidenceOnStudy: 'okay',
            notes: ''
          });
          setShowLogModal(true);
        }
      })
      .catch(console.error);
  };

  const openEditTaskModal = (task) => {
    const start = plannerService.formatTime12h(task.startTime);
    const end = plannerService.formatTime12h(task.endTime);
    const [startTime, startPeriod] = start.split(' ');
    const [endTime, endPeriod] = end.split(' ');
    const [startHour, startMin] = startTime.split(':');
    const [endHour, endMin] = endTime.split(':');

    setNewTask({
      title: task.title || '',
      subject: task.subject || '',
      startHour: startHour || '09',
      startMin: startMin || '00',
      startPeriod: startPeriod || 'AM',
      endHour: endHour || '10',
      endMin: endMin || '00',
      endPeriod: endPeriod || 'AM',
      type: task.type || 'reading'
    });
    setEditingTaskId(task.id);
    setShowAddModal(true);
  };

  const handleDragStart = (taskId) => {
    setDraggedTaskId(taskId);
  };

  const handleDrop = (targetTaskId) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    setTasks((prev) => {
      const sourceIndex = prev.findIndex((task) => task.id === draggedTaskId);
      const targetIndex = prev.findIndex((task) => task.id === targetTaskId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });

    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const resolveUserId = () => {
    if (backendUserId) return backendUserId;
    const fallback = localStorage.getItem('prepmateUserId');
    const parsed = Number.parseInt(fallback, 10);
    return Number.isInteger(parsed) ? parsed : null;
  };

  const handleDeleteTask = (id) => {
    const userId = resolveUserId();
    if (!userId) {
      showToast({ title: 'Unable to delete', message: 'User not synced yet. Please refresh and try again.', type: 'error' });
      return;
    }

    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    deleteTask(id, userId)
      .then(() => {
        showToast({ title: 'Task Deleted', message: 'Task removed from your plan.', type: 'info' });
      })
      .catch((error) => {
        console.error(error);
        setTasks(prevTasks);
        showToast({ title: 'Delete failed', message: 'Could not delete the task. Please try again.', type: 'error' });
      });
  };

  // ── Save Study Log ──
  const handleSaveStudyLog = async () => {
    if (!logForm.sessionTitle.trim() || !logForm.subject.trim()) return;

    const initialInterval = getInitialIntervalDays(logForm.confidenceOnStudy);

    const toastData = {
      title: logForm.sessionTitle.trim(),
      subject: logForm.subject.trim(),
      days: initialInterval,
    };

    setShowLogModal(false);
    setPendingLogTask(null);

    try {
      await logTimerSession(backendUserId, {
        type: 'focus',
        duration: (parseFloat(logForm.hoursStudied) || 1) * 3600,
        subject: logForm.subject,
        label: logForm.sessionTitle,
        date: new Date().toISOString().split('T')[0],
      });
      setSuccessToast({ ...toastData, error: false });
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error('Failed to save study session:', err);
      setSuccessToast({ ...toastData, error: true });
      setTimeout(() => setSuccessToast(null), 5000);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Column: Tasks */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Header & Stats */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Today's Plan</h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{currentDate}</p>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Time</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                      <Clock size={16} className="text-blue-600 dark:text-blue-500"/> {stats.totalHours}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-slate-200 dark:bg-white/10 hidden md:block"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tasks</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-1">
                      <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-500"/> {stats.completedTasks}/{stats.totalTasks}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Daily Progress</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{stats.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000" 
                    style={{ width: `${stats.progress}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Target size={18} className="text-blue-600 dark:text-blue-500"/> Schedule
                </h3>
                <button onClick={() => { setEditingTaskId(null); setShowAddModal(true); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                  <Plus size={14}/> Add Task
                </button>
              </div>

              <div className="space-y-3">
                {sortedTasks.map(task => {
                  const durationStr = plannerService.formatDuration(plannerService.calculateDuration(task.startTime, task.endTime));
                  const timeDisplay = `${plannerService.formatTime12h(task.startTime)} - ${plannerService.formatTime12h(task.endTime)}`;
                  
                  return (
                    <div 
                      key={task.id} 
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(task.id)}
                      onDragEnd={handleDragEnd}
                      className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        task.status === 'completed' 
                          ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] opacity-60' 
                          : task.status === 'in-progress'
                          ? 'bg-blue-50/50 dark:bg-blue-500/[0.02] border-blue-200 dark:border-blue-500/20 shadow-sm'
                          : 'bg-white dark:bg-[#060914] border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.1] shadow-sm'
                      }`}
                    >
                      <div className="cursor-move text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <GripVertical size={20} />
                      </div>
                      
                      <button onClick={() => toggleTaskStatus(task.id)} className="shrink-0 transition-transform hover:scale-110">
                        {getStatusIcon(task.status)}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h4 className={`text-base font-bold truncate ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                            <Clock size={12}/> {timeDisplay} ({durationStr})
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getTypeColor(task.type)}`}>
                            {task.type}
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <CheckSquare size={12}/> {task.subject}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditTaskModal(task)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors" title="Edit task">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Right Column: Quick Notes */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm flex flex-col h-[300px]">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Scratchpad</h3>
                <button onClick={() => setIsFullscreen(true)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><Maximize2 size={16}/></button>
              </div>
              <textarea 
                className="flex-1 w-full bg-slate-50 dark:bg-[#060914] border border-slate-200 dark:border-white/5 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-300 placeholder-slate-400 resize-none outline-none focus:border-blue-400 dark:focus:border-blue-500/50 custom-scrollbar"
                placeholder="Jot down quick thoughts, formulas, or reminders..."
                value={scratchpadContent}
                onChange={(e) => setScratchpadContent(e.target.value)}
              />
            </div>
          </div>

        </div>
      </div>

      {/* ═══════ Scratchpad Fullscreen Overlay ═══════ */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Scratchpad</h3>
              <button onClick={() => setIsFullscreen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors">
                <Minimize2 size={20} />
              </button>
            </div>
            <textarea 
              className="flex-1 w-full bg-slate-50 dark:bg-[#060914] border border-slate-200 dark:border-white/5 rounded-xl p-6 text-base text-slate-800 dark:text-slate-300 placeholder-slate-400 resize-none outline-none focus:border-blue-400 dark:focus:border-blue-500/50 custom-scrollbar"
              placeholder="Jot down quick thoughts, formulas, or reminders..."
              value={scratchpadContent}
              onChange={(e) => setScratchpadContent(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* ═══════ Add Task Modal ═══════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowAddModal(false); setEditingTaskId(null); }}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-4 border-b border-slate-100 dark:border-white/10">{editingTaskId ? 'Edit Task' : 'Add New Task'}</h3>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Task Title</label>
                <input type="text" required value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors" placeholder="e.g., Read Chapter 4" autoFocus />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Subject</label>
                <select required value={newTask.subject} onChange={(e) => setNewTask({...newTask, subject: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select subject</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Start Time</label>
                  <div className="flex gap-2">
                    <select value={newTask.startHour} onChange={(e) => setNewTask({...newTask, startHour: e.target.value})} className="w-16 px-2 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors">
                      {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={`sh-${h}`} value={h}>{h}</option>)}
                    </select>
                    <span className="text-xl font-bold text-slate-400 flex items-center">:</span>
                    <select value={newTask.startMin} onChange={(e) => setNewTask({...newTask, startMin: e.target.value})} className="w-16 px-2 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors">
                      {['00', '15', '30', '45'].map(m => <option key={`sm-${m}`} value={m}>{m}</option>)}
                    </select>
                    <select value={newTask.startPeriod} onChange={(e) => setNewTask({...newTask, startPeriod: e.target.value})} className="flex-1 px-2 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">End Time</label>
                  <div className="flex gap-2">
                    <select value={newTask.endHour} onChange={(e) => setNewTask({...newTask, endHour: e.target.value})} className="w-16 px-2 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors">
                      {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(h => <option key={`eh-${h}`} value={h}>{h}</option>)}
                    </select>
                    <span className="text-xl font-bold text-slate-400 flex items-center">:</span>
                    <select value={newTask.endMin} onChange={(e) => setNewTask({...newTask, endMin: e.target.value})} className="w-16 px-2 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors">
                      {['00', '15', '30', '45'].map(m => <option key={`em-${m}`} value={m}>{m}</option>)}
                    </select>
                    <select value={newTask.endPeriod} onChange={(e) => setNewTask({...newTask, endPeriod: e.target.value})} className="flex-1 px-2 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Validation / Duration Feedback */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Duration: <span className="font-bold text-slate-800 dark:text-white">{plannerService.formatDuration(durationMins)}</span>
                </span>
                {isRollover && (
                  <span className="text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded">
                    Rolls over to next day
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Type</label>
                <select value={newTask.type} onChange={(e) => setNewTask({...newTask, type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors">
                  <option value="reading">Reading</option>
                  <option value="practice">Practice</option>
                  <option value="revision">Revision</option>
                  <option value="video">Video Lec</option>
                  <option value="custom">Custom (Play, Exercise, etc.)</option>
                </select>
              </div>
              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingTaskId(null); }} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">{editingTaskId ? 'Update Task' : 'Add Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ Log Study Session Modal ═══════ */}
      {showLogModal && pendingLogTask && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLogModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/10">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Log study session</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">This schedules automatic revisions for what you just studied.</p>
              </div>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-full p-1"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">What did you study?</label>
                <input type="text" value={logForm.sessionTitle} onChange={e => setLogForm({...logForm, sessionTitle: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors" placeholder="e.g. CPU Scheduling — FCFS, SJF, Priority" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Subject</label>
                <select value={logForm.subject} onChange={e => setLogForm({...logForm, subject: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select subject</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Hours studied</label>
                <select value={logForm.hoursStudied} onChange={e => setLogForm({...logForm, hoursStudied: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors">
                  {['0.5','1','1.5','2','2.5','3','3.5','4'].map(h => (
                    <option key={h} value={h}>{h} {h === '1' ? 'hour' : 'hours'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">How confident do you feel?</label>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">This sets when your first revision fires — be honest.</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'shaky', label: 'Shaky', sub: 'Revise tomorrow', color: 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' },
                    { value: 'okay', label: 'Okay', sub: 'Revise in 3 days', color: 'border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' },
                    { value: 'solid', label: 'Solid', sub: 'Revise in 7 days', color: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setLogForm({...logForm, confidenceOnStudy: opt.value})} className={`p-3 rounded-xl border-2 text-center transition-all ${logForm.confidenceOnStudy === opt.value ? opt.color + ' border-2' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500'}`}>
                      <div className="font-bold text-sm">{opt.label}</div>
                      <div className="text-[10px] mt-0.5 opacity-80">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Quick note <span className="font-normal normal-case">(optional)</span></label>
                <textarea rows={2} value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} placeholder="Anything tricky? Concepts to flag?" className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors resize-none custom-scrollbar" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-white/10">
              <button onClick={() => setShowLogModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors">Skip</button>
              <button onClick={handleSaveStudyLog} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"><Save size={16} /> Save & schedule revisions</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-4 md:p-5 flex items-start gap-4 max-w-sm">
            {!successToast.error ? (
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-emerald-500" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <X size={20} className="text-red-500" />
              </div>
            )}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">
                {!successToast.error ? 'Session Logged' : 'Failed to save'}
              </h4>
              {!successToast.error && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-700 dark:text-slate-300">"{successToast.title}"</span> scheduled for revision in {successToast.days} days.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyPlanner;
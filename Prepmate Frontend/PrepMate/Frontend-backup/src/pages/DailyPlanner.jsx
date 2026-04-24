import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Clock, Plus, GripVertical, ChevronRight, Play, CheckSquare, Settings, Edit2, Trash2, Maximize2 } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getTasksByDate, createTask as createTaskApi, updateTask as updateTaskApi, updateTaskStatus, deleteTask as deleteTaskApi, getHabits } from '../services/api';

const DailyPlanner = () => {
  const { dbUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);

  // Fetching real habits from backend
  const [habits, setHabits] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    duration: '30m',
    type: 'reading'
  });

  // Fetch tasks for today
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchTasks = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await getTasksByDate(dbUser.id, todayStr);
        setTasks(Array.isArray(res.data) ? res.data : []);
        
        try {
          const habitsRes = await getHabits(dbUser.id);
          setHabits(Array.isArray(habitsRes.data) ? habitsRes.data : []);
        } catch(e) {
          console.error("Error fetching habits for daily planner", e);
        }
      } catch (error) {
        console.error('Error fetching today tasks:', error);
      }
    };
    fetchTasks();
  }, [dbUser?.id]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.subject.trim() || !dbUser?.id) return;

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await createTaskApi(dbUser.id, {
        ...newTask,
        status: 'todo',
        date: todayStr
      });
      setTasks([res.data, ...tasks]);
    } catch (error) {
      console.error('Error creating task:', error);
    }

    setNewTask({ title: '', subject: '', duration: '30m', type: 'reading' });
    setShowAddModal(false);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask.title.trim() || !editingTask.subject.trim() || !dbUser?.id) return;

    try {
      const res = await updateTaskApi(editingTask.id, editingTask);
      setTasks(tasks.map(t => t.id === editingTask.id ? res.data : t));
    } catch (error) {
      console.error('Error updating task:', error);
    }
    setEditingTask(null);
  };

  const parseDurationToMinutes = (durationStr) => {
    if (!durationStr) return 0;
    if (durationStr.includes('h')) {
      const parts = durationStr.split(' ');
      let h = 0, m = 0;
      parts.forEach(p => {
        if (p.includes('h')) h = parseFloat(p);
        if (p.includes('m')) m = parseFloat(p);
      });
      return h * 60 + m;
    }
    return parseInt(durationStr) || 0;
  };

  const formatMinutesToHours = (totalMins) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const totalMins = tasks.reduce((sum, t) => sum + parseDurationToMinutes(t.duration), 0);

  const stats = {
    totalHours: formatMinutesToHours(totalMins) || '0m',
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalTasks: tasks.length,
    progress: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
  };

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

  const toggleTaskStatus = async (id, currentStatus) => {
    let nextStatus = 'todo';
    if (currentStatus === 'todo') nextStatus = 'in-progress';
    else if (currentStatus === 'in-progress') nextStatus = 'completed';
    
    try {
      await updateTaskStatus(id, nextStatus);
      setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const deleteTask = async (id) => {
    if (confirm('Delete this task?')) {
      try {
        await deleteTaskApi(id);
        setTasks(tasks.filter(t => t.id !== id));
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const toggleHabit = (id) => {
    setHabits(habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
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
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Time Goal</p>
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
                  <Target size={18} className="text-blue-600 dark:text-blue-500"/> Priority Tasks
                </h3>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">
                  <Plus size={14}/> Add Task
                </button>
              </div>

              <div className="space-y-3">
                {tasks.map(task => (
                  <div 
                    key={task.id} 
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
                    
                    <button onClick={() => toggleTaskStatus(task.id, task.status)} className="shrink-0 transition-transform hover:scale-110">
                      {getStatusIcon(task.status)}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-base font-bold truncate ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getTypeColor(task.type)}`}>
                          {task.type}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <CheckSquare size={12}/> {task.subject}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock size={12}/> {task.duration}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.status !== 'completed' && (
                        <button className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors">
                          <Play size={16} className="ml-0.5" />
                        </button>
                      )}
                      <button onClick={() => setEditingTask(task)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="p-2 hover:bg-slate-100 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Habits & Quick Notes */}
          <div className="space-y-6">
            
            {/* Habits Widget */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 size={18}/> Daily Habits
                </h3>
                <button className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400"><Settings size={16}/></button>
              </div>
              
              <div className="space-y-3">
                {habits.map(habit => (
                  <label key={habit.id} className="flex items-start gap-3 p-3 bg-white dark:bg-black/20 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-black/40 transition-colors border border-emerald-100 dark:border-white/5">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="peer sr-only"
                        checked={habit.completed}
                        onChange={() => toggleHabit(habit.id)}
                      />
                      <div className="w-5 h-5 border-2 border-emerald-300 dark:border-emerald-600 rounded bg-white dark:bg-transparent peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
                      <CheckCircle2 size={14} className="absolute text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                    </div>
                    <span className={`text-sm font-bold ${habit.completed ? 'text-slate-400 dark:text-emerald-500/50 line-through' : 'text-slate-800 dark:text-emerald-100'}`}>
                      {habit.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quick Notes */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm flex flex-col h-[300px]">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Scratchpad</h3>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><Maximize2 size={16}/></button>
              </div>
              <textarea 
                className="flex-1 w-full bg-slate-50 dark:bg-[#060914] border border-slate-200 dark:border-white/5 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-300 placeholder-slate-400 resize-none outline-none focus:border-blue-400 dark:focus:border-blue-500/50 custom-scrollbar"
                placeholder="Jot down quick thoughts, formulas, or reminders here..."
                defaultValue={"• Don't forget to review Deadlock Avoidance algo.\n\n• Check tomorrow's mock test timings."}
              />
            </div>

          </div>

        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingTask(null)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-4 border-b border-slate-100 dark:border-white/10">Edit Task</h3>
            
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Task Title</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., Read Chapter 4"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={editingTask.subject}
                  onChange={(e) => setEditingTask({...editingTask, subject: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., Physics"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Duration</label>
                  <select
                    value={editingTask.duration}
                    onChange={(e) => setEditingTask({...editingTask, duration: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="15m">15 mins</option>
                    <option value="30m">30 mins</option>
                    <option value="45m">45 mins</option>
                    <option value="60m">1 hour</option>
                    <option value="90m">1.5 hours</option>
                    <option value="2h">2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Type</label>
                  <select
                    value={editingTask.type}
                    onChange={(e) => setEditingTask({...editingTask, type: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="reading">Reading</option>
                    <option value="practice">Practice</option>
                    <option value="revision">Revision</option>
                    <option value="video">Video Lec</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                <button type="button" onClick={() => setEditingTask(null)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-4 border-b border-slate-100 dark:border-white/10">Add New Task</h3>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., Read Chapter 4"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={newTask.subject}
                  onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., Physics"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Duration</label>
                  <select
                    value={newTask.duration}
                    onChange={(e) => setNewTask({...newTask, duration: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="15m">15 mins</option>
                    <option value="30m">30 mins</option>
                    <option value="45m">45 mins</option>
                    <option value="60m">1 hour</option>
                    <option value="90m">1.5 hours</option>
                    <option value="2h">2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="reading">Reading</option>
                    <option value="practice">Practice</option>
                    <option value="revision">Revision</option>
                    <option value="video">Video Lec</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DailyPlanner;
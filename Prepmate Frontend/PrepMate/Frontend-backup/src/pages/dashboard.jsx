import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, CheckCircle2, Clock, TrendingUp, ArrowUpRight,
  ChevronRight, Zap, Quote, Plus, Edit2, Trash2, ExternalLink,
  BarChart2, Play, AlertCircle, X, Save, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { 
  getDashboardStats, getTasks, getTasksByDate, createTask, updateTask, 
  updateTaskStatus, deleteTask as deleteTaskApi,
  getUpcomingRevisions, createRevision as createRevisionApi,
  markRevisionComplete, getDistractions
} from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { dbUser } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [distractions, setDistractions] = useState([]);
  const [stats, setStats] = useState({});
  const [dataLoading, setDataLoading] = useState(true);

  // Task Modal States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');

  // Revision Modal States
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionData, setRevisionData] = useState({ topicName: '', subject: '', intervalDays: '1', scheduledDate: new Date().toISOString().split('T')[0] });

  const [currentDate] = useState(new Date());

  const [quoteIdx, setQuoteIdx] = useState(0);
  const quotesList = [
    { type: 'Quote', text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier", color: "text-blue-600 dark:text-blue-400" },
    { type: 'Affirmation', text: "I am becoming better every single day. My focus is unwavering.", author: "Daily Affirmation", color: "text-purple-600 dark:text-purple-400" },
    { type: "Topper's Tip", text: "Focus on understanding the core concepts instead of memorizing logic.", author: "AIR 13", color: "text-emerald-600 dark:text-emerald-400" }
  ];

  // Fetch all dashboard data
  useEffect(() => {
    if (!dbUser?.id) return;
    
    const fetchData = async () => {
      setDataLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [statsRes, tasksRes, revisionsRes, distractionsRes] = await Promise.all([
          getDashboardStats(dbUser.id).catch(() => ({ data: {} })),
          getTasksByDate(dbUser.id, today).catch(() => ({ data: [] })),
          getUpcomingRevisions(dbUser.id).catch(() => ({ data: [] })),
          getDistractions(dbUser.id).catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data || {});
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
        setRevisions(Array.isArray(revisionsRes.data) ? revisionsRes.data : []);
        setDistractions(Array.isArray(distractionsRes.data) ? distractionsRes.data : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [dbUser?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % quotesList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);
  
  const dailyQuote = quotesList[quoteIdx];

  const completedTasks = tasks.filter(t => t.completed || t.status === 'COMPLETED').length;
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const activeRevisions = revisions.filter(r => !r.completed).length;
  const totalDistractionTime = distractions.reduce((sum, d) => sum + (parseInt(d.durationMinutes || d.time) || 0), 0);

  // Task Functions
  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = (task.completed || task.status === 'COMPLETED') ? 'PENDING' : 'COMPLETED';
    try {
      await updateTaskStatus(id, newStatus);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newStatus === 'COMPLETED', status: newStatus } : t));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const openTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
    } else {
      setEditingTask(null);
      setTaskTitle('');
    }
    setShowTaskModal(true);
  };

  const saveTask = async () => {
    if (!taskTitle.trim() || !dbUser?.id) return;
    
    try {
      if (editingTask) {
        const res = await updateTask(editingTask.id, { ...editingTask, title: taskTitle });
        setTasks(prev => prev.map(t => t.id === editingTask.id ? res.data : t));
      } else {
        const res = await createTask(dbUser.id, { 
          title: taskTitle, 
          status: 'PENDING',
          date: new Date().toISOString().split('T')[0]
        });
        setTasks(prev => [...prev, res.data]);
      }
      setShowTaskModal(false);
      setTaskTitle('');
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDeleteTask = async (id) => {
    if (confirm('Delete this task?')) {
      try {
        await deleteTaskApi(id);
        setTasks(prev => prev.filter(t => t.id !== id));
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  // Revision Functions
  const toggleRevision = async (id) => {
    try {
      await markRevisionComplete(id);
      setRevisions(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    } catch (error) {
      console.error('Error toggling revision:', error);
    }
  };

  const openRevisionModal = () => {
    setRevisionData({ topicName: '', subject: '', intervalDays: '1', scheduledDate: new Date().toISOString().split('T')[0] });
    setShowRevisionModal(true);
  };

  const saveRevision = async () => {
    if (!revisionData.topicName.trim() || !revisionData.subject.trim() || !dbUser?.id) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      const res = await createRevisionApi(dbUser.id, {
        topicName: revisionData.topicName,
        subject: revisionData.subject,
        intervalDays: parseInt(revisionData.intervalDays),
        scheduledDate: revisionData.scheduledDate,
        completed: false
      });
      setRevisions(prev => [...prev, res.data]);
      setShowRevisionModal(false);
      setRevisionData({ topicName: '', subject: '', intervalDays: '1', scheduledDate: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error('Error saving revision:', error);
    }
  };

  const handleQuickAction = (action) => {
    if (action === 'reports') navigate('/reports');
    if (action === 'study') navigate('/timers');
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNum = currentDate.getDate();

  // Stats from backend (with fallbacks)
  const studyHours = stats.todayStudyMinutes ? `${(stats.todayStudyMinutes / 60).toFixed(1)}h` : '0h';
  const currentStreak = stats.currentMaxStreak || 0;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">

        {/* ── TOP: OVERVIEW GRID ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

          {/* LEFT - Date / Quote Block */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{dayName}</p>
                  <h1 className="text-5xl font-black text-slate-900 dark:text-white leading-none">{dayNum}</h1>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{monthName}</p>
                </div>
              </div>
            </div>
            {/* Quote */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/[0.05]">
              <div className="flex items-start gap-3">
                <Quote size={20} className={`${dailyQuote.color} shrink-0 mt-1 opacity-60`} />
                <div key={quoteIdx} className="animate-in fade-in slide-in-from-bottom-1 duration-500">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${dailyQuote.color} mb-1 block`}>{dailyQuote.type}</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">"{dailyQuote.text}"</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5 uppercase tracking-wider">— {dailyQuote.author}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - Daily Stats */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Task Progress */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm border-l-4 border-l-blue-500 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg"><CheckCircle2 className="text-blue-500" size={16} /></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tasks</span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{taskProgress}%</div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{completedTasks}/{tasks.length} done</p>
            </div>

            {/* Study Time */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm border-l-4 border-l-emerald-500 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><Clock className="text-emerald-500" size={16} /></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Study Time</span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{studyHours}</div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Today</p>
            </div>

            {/* Revision Count */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm border-l-4 border-l-violet-500 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-violet-50 dark:bg-violet-500/10 rounded-lg"><RefreshCw className="text-violet-500" size={16} /></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revisions</span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{activeRevisions}</div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Active</p>
            </div>

            {/* Streak */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm border-l-4 border-l-orange-500 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-lg"><Award className="text-orange-500" size={16} /></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Streak</span>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{currentStreak}</div>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Days</p>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT - Tasks Panel */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
              <h2 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={18} className="text-blue-500" /> Today's Tasks
              </h2>
              <button onClick={() => openTaskModal()} className="text-blue-500 hover:text-blue-400 transition-colors p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <Plus size={18} />
              </button>
            </div>

            <div className="p-5 md:p-6 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No tasks for today. Add one!</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${task.completed || task.status === 'COMPLETED' ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/[0.04] opacity-60' : 'bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] hover:border-blue-200 dark:hover:border-blue-500/20'}`}>
                    <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${task.completed || task.status === 'COMPLETED' ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'}`}>
                      {(task.completed || task.status === 'COMPLETED') && <CheckCircle2 size={12} className="text-white" />}
                    </button>
                    <span className={`text-sm font-medium flex-1 ${task.completed || task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openTaskModal(task)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-7 space-y-6">

            {/* Revision Queue */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
                <h2 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw size={18} className="text-violet-500" /> Revision Queue
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={openRevisionModal} className="text-violet-500 hover:text-violet-400 transition-colors p-1.5 bg-violet-50 dark:bg-violet-500/10 rounded-lg">
                    <Plus size={18} />
                  </button>
                  <button onClick={() => navigate('/revision')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1.5 bg-slate-50 dark:bg-white/5 rounded-lg">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <div className="p-5 md:p-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {revisions.length === 0 ? (
                  <div className="text-center py-6">
                    <RefreshCw size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No upcoming revisions</p>
                  </div>
                ) : (
                  revisions.filter(r => !r.completed).slice(0, 5).map(revision => (
                    <div key={revision.id} className="flex items-center gap-3 p-3 rounded-xl border border-violet-100 dark:border-violet-500/20 bg-violet-50/30 dark:bg-violet-500/5 hover:bg-violet-50/60 dark:hover:bg-violet-500/10 transition-all group">
                      <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{revision.topicName || revision.title}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                          <span>{revision.subject}</span>
                          <span>•</span>
                          <span>{revision.intervalDays ? `${revision.intervalDays}d` : revision.interval}</span>
                        </div>
                      </div>
                      <button onClick={() => toggleRevision(revision.id)} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0">
                        Done
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions + Distraction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm">
                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-yellow-500" /> Quick Actions
                </h3>
                <div className="space-y-2">
                  <button onClick={() => handleQuickAction('study')} className="w-full text-left p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 transition-all flex items-center justify-between group">
                    <span className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400"><Play size={14} /> Start Focus Timer</span>
                    <ArrowUpRight className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                  </button>
                  <button onClick={() => handleQuickAction('reports')} className="w-full text-left p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-all flex items-center justify-between group">
                    <span className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-400"><BarChart2 size={14} /> Weekly Report</span>
                    <ArrowUpRight className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                  </button>
                </div>
              </div>

              {/* Distraction Tracker */}
              <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-500" /> Distractions
                  </h3>
                  <button onClick={() => navigate('/distraction')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1.5 bg-slate-50 dark:bg-white/5 rounded-lg">
                    <ChevronRight size={18} />
                  </button>
                </div>
                {distractions.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-400 font-medium">No distractions logged today 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {distractions.slice(0, 3).map(d => (
                      <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50/30 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{d.type || d.category}</span>
                        <span className="text-xs font-bold text-red-500">{d.durationMinutes ? `${d.durationMinutes} min` : d.time}</span>
                      </div>
                    ))}
                    <div className="text-xs font-bold text-red-600 dark:text-red-400 text-center mt-2">
                      Total: {totalDistractionTime} min lost
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TASK MODAL ────────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveTask()}
              placeholder="What do you need to do?"
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowTaskModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-colors text-sm font-semibold">Cancel</button>
              <button onClick={saveTask} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                <Save size={16} /> {editingTask ? 'Save' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REVISION MODAL ────────────────────────────────── */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRevisionModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Revision</h3>
              <button onClick={() => setShowRevisionModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" value={revisionData.topicName} onChange={(e) => setRevisionData({ ...revisionData, topicName: e.target.value })} placeholder="Topic name" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500 text-sm" autoFocus />
              <input type="text" value={revisionData.subject} onChange={(e) => setRevisionData({ ...revisionData, subject: e.target.value })} placeholder="Subject" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={revisionData.intervalDays} onChange={(e) => setRevisionData({ ...revisionData, intervalDays: e.target.value })} className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500">
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
                <input type="date" value={revisionData.scheduledDate} onChange={(e) => setRevisionData({ ...revisionData, scheduledDate: e.target.value })} className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRevisionModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-colors text-sm font-semibold">Cancel</button>
              <button onClick={saveRevision} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20">
                <Save size={16} /> Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
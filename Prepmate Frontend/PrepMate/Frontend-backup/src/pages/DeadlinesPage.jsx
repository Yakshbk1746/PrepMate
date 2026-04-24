import React, { useState, useEffect } from 'react';
import { CalendarDays, AlertCircle, Clock, CheckCircle2, Archive, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getDeadlines, createDeadline as createDeadlineApi, toggleDeadlineComplete, deleteDeadline as deleteDeadlineApi } from '../services/api';

const DeadlinesPage = () => {
  const { dbUser } = useAuth();
  const [deadlines, setDeadlines] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState({ title: '', date: '', type: 'Exam', priority: 'Medium' });

  // Fetch deadlines from backend
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchDeadlines = async () => {
      try {
        const res = await getDeadlines(dbUser.id);
        setDeadlines(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching deadlines:', error);
      }
    };
    fetchDeadlines();
  }, [dbUser?.id]);

  const calculateDaysLeft = (targetDate) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const activeDeadlines = deadlines.filter(d => !d.completed).sort((a, b) => new Date(a.date) - new Date(b.date));
  const completedDeadlines = deadlines.filter(d => d.completed);

  const toggleComplete = async (id) => {
    try {
      await toggleDeadlineComplete(id);
      setDeadlines(deadlines.map(d => d.id === id ? { ...d, completed: !d.completed } : d));
    } catch (error) {
      console.error('Error toggling deadline:', error);
    }
  };

  const deleteDeadline = async (id) => {
    try {
      await deleteDeadlineApi(id);
      setDeadlines(deadlines.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting deadline:', error);
    }
  };

  const addDeadline = async (e) => {
    e.preventDefault();
    if (!newDeadline.title || !newDeadline.date || !dbUser?.id) return;
    
    try {
      const res = await createDeadlineApi(dbUser.id, {
        ...newDeadline,
        completed: false
      });
      setDeadlines([...deadlines, res.data]);
    } catch (error) {
      console.error('Error creating deadline:', error);
    }
    
    setShowAddModal(false);
    setNewDeadline({ title: '', date: '', type: 'Exam', priority: 'Medium' });
  };

  const getPriorityColor = (priority, daysLeft) => {
    if (daysLeft < 0) return 'text-slate-500 bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20'; // Overdue/Completed
    if (priority === 'High' || daysLeft <= 14) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30';
    if (priority === 'Medium' || daysLeft <= 45) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30';
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        
        <div className="flex justify-end mb-8">
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold flex items-center gap-2 transition-colors">
            <Plus size={16} /> Add Event
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Deadlines */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <Clock size={18} className="text-orange-500 dark:text-orange-400"/> Upcoming Deadlines
            </h2>
            
            {activeDeadlines.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/5 rounded-xl text-slate-500">
                No active deadlines. You are all caught up!
              </div>
            ) : (
              activeDeadlines.map(deadline => {
                const daysLeft = calculateDaysLeft(deadline.date);
                const colorTheme = getPriorityColor(deadline.priority, daysLeft);
                
                return (
                  <div key={deadline.id} className={`bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.1] rounded-xl p-5 flex items-center gap-4 transition-all group ${daysLeft <= 14 ? 'shadow-lg shadow-red-500/5' : 'shadow-sm'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${colorTheme}`}>
                          {deadline.type}
                        </span>
                        {daysLeft <= 14 && daysLeft >= 0 && <span className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-500 font-bold bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded"><AlertCircle size={10}/> Urging</span>}
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{deadline.title}</h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(deadline.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-4xl font-black ${daysLeft < 0 ? 'text-red-500' : colorTheme.split(' ')[0]}`}>
                        {Math.abs(daysLeft)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {daysLeft < 0 ? 'Days Overdue' : daysLeft === 0 ? 'Today' : 'Days Left'}
                      </div>
                    </div>

                    <div className="w-px h-12 bg-slate-200 dark:bg-white/10 mx-2 hidden md:block"></div>

                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleComplete(deadline.id)} className="p-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/30" title="Mark Completed"><CheckCircle2 size={16}/></button>
                      <button onClick={() => deleteDeadline(deadline.id)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors" title="Delete"><Trash2 size={16}/></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Archive Sidebar */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <Archive size={18} className="text-slate-400"/> Completed Archive
            </h2>
            
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 max-h-[500px] overflow-y-auto shadow-sm">
              {completedDeadlines.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">No completed items.</div>
              ) : (
                <div className="space-y-3">
                  {completedDeadlines.map(deadline => (
                    <div key={deadline.id} className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] rounded-lg group text-slate-500">
                      <div className="flex justify-between items-start line-through decoration-slate-400 dark:decoration-slate-600">
                        <div className="text-sm font-semibold">{deadline.title}</div>
                        <button onClick={() => deleteDeadline(deadline.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-opacity p-1"><X size={14}/></button>
                      </div>
                      <div className="text-[10px] mt-1">Completed: {new Date(deadline.date).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Deadline</h3>
            <form onSubmit={addDeadline} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Event Title</label>
                <input required type="text" value={newDeadline.title} onChange={e => setNewDeadline({...newDeadline, title: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white outline-none focus:border-orange-500" placeholder="e.g. Admit Card Release"/>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Date</label>
                <input required type="date" value={newDeadline.date} onChange={e => setNewDeadline({...newDeadline, date: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white outline-none focus:border-orange-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Type</label>
                  <select value={newDeadline.type} onChange={e => setNewDeadline({...newDeadline, type: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white outline-none focus:border-orange-500">
                    <option>Exam</option>
                    <option>Form</option>
                    <option>Result</option>
                    <option>Application</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Priority</label>
                  <select value={newDeadline.priority} onChange={e => setNewDeadline({...newDeadline, priority: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-800 dark:text-white outline-none focus:border-orange-500">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-lg transition-colors font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-semibold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadlinesPage;

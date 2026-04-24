import React, { useState, useEffect } from 'react';
import { Menu, Plus, BookOpen, Calendar, TrendingUp, Smile, ChevronLeft, ChevronRight, Edit2, Trash2, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { logout } from '../firebase/authService';
import { getReflections, createReflection, updateReflection, deleteReflection } from '../services/api';

const MOODS = [
  { emoji: '😊', label: 'Great', color: 'text-emerald-500 dark:text-emerald-400' },
  { emoji: '🙂', label: 'Good', color: 'text-blue-500 dark:text-blue-400' },
  { emoji: '😐', label: 'Okay', color: 'text-yellow-500 dark:text-yellow-400' },
  { emoji: '😕', label: 'Difficult', color: 'text-orange-500 dark:text-orange-400' },
  { emoji: '😞', label: 'Struggling', color: 'text-red-500 dark:text-red-400' },
];

const ReflectionPage = () => {
  const navigate = useNavigate();
  const { backendUserId } = useAuth();
  const [entries, setEntries] = useState([
    {
      id: 1,
      date: '2026-02-20',
      mood: '😊',
      studyHours: 7.5,
      energyLevel: 4,
      wentWell: 'Completed DP module, solved 15 problems',
      toImprove: 'Got distracted during afternoon session',
      tomorrowPlan: 'Start Greedy algorithms, solve 20 problems',
    },
    {
      id: 2,
      date: '2026-02-19',
      mood: '🙂',
      studyHours: 6,
      energyLevel: 3,
      wentWell: 'Good focus in morning',
      toImprove: 'Need more breaks',
      tomorrowPlan: 'Continue DP practice',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!backendUserId) return;
    getReflections(backendUserId).then(setEntries).catch(console.error);
  }, [backendUserId]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error(err.message);
    }
  };

  const addEntry = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const today = new Date().toISOString().split('T')[0];
    createReflection(backendUserId, {
      mood: formData.get('mood'),
      wentWell: formData.get('wentWell'),
      toImprove: formData.get('toImprove'),
      tomorrowPlan: formData.get('tomorrowPlan'),
      date: today,
    }).then(saved => setEntries(prev => [saved, ...prev]))
      .catch(console.error);
    setShowAddModal(false);
    e.target.reset();
  };

  const updateEntry = (id, payload) => {
    updateReflection(id, payload)
      .then(updated => setEntries(prev => prev.map(r => r.id===id ? updated : r)))
      .catch(console.error);
  };

  const deleteEntry = (id) => {
    deleteReflection(id).then(() => setEntries(prev => prev.filter(r => r.id !== id))).catch(console.error);
    setSelectedEntry(null);
  };

  const today = new Date().toISOString().split('T')[0];
  const hasEntryToday = entries.some(e => e.date === today);
  
  // Calculate streak
  const sortedDates = entries.map(e => e.date).sort().reverse();
  let streak = 0;
  let checkDate = new Date();
  
  for (let date of sortedDates) {
    const entryDate = new Date(date);
    const daysDiff = Math.floor((checkDate - entryDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }

  // Calendar data
  const getEntriesForMonth = (month) => {
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    return entries.filter(e => {
      const entryDate = new Date(e.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === monthNum;
    });
  };

  const monthEntries = getEntriesForMonth(currentMonth);

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Options */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
             <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={24} className="text-purple-500" /> Daily Reflection
              </h2>
          </div>
          <div className="flex items-center gap-3">
             {!hasEntryToday && (
              <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-500/30 uppercase tracking-wider text-sm">
                <Plus size={18} /> Today's Entry
              </button>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-100 dark:border-purple-500/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <Lightbulb size={24} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-2">Power of Reflection</h3>
              <ul className="text-xs font-medium text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
                <li>• Daily reflection improves learning by 20-30% (research-backed).</li>
                <li>• Identify patterns: What study methods work best for you?</li>
                <li>• Track emotional state: Energy levels affect performance.</li>
                <li>• Plan ahead: Write tomorrow's priorities before sleeping.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Stats & Calendar */}
          <div className="space-y-6">
            
            {/* Streak */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-100 dark:border-orange-500/20 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-4xl font-black text-slate-900 dark:text-white leading-none">{streak}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Day Streak 🔥</div>
                </div>
              </div>
              {streak >= 7 && (
                <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mt-3">Amazing! Keep the momentum going!</p>
              )}
            </div>

            {/* Calendar Heatmap */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-[10px] text-slate-400 text-center font-bold uppercase">{d}</div>
                ))}
                
                {Array.from({ length: 35 }, (_, i) => {
                  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
                  const day = i - firstDay + 1;
                  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                  
                  if (day < 1 || day > daysInMonth) {
                    return <div key={i} className="aspect-square" />;
                  }
                  
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasEntry = entries.some(e => e.date === dateStr);
                  
                  return (
                    <div 
                      key={i}
                      className={`aspect-square rounded flex items-center justify-center text-[10px] font-bold transition-all shadow-sm ${
                        hasEntry 
                          ? 'bg-purple-500 text-white shadow-purple-500/20' 
                          : 'bg-slate-50 dark:bg-white/[0.03] text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-100 dark:border-transparent'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <div className="w-3 h-3 rounded bg-purple-500 shadow-sm" />
                <span>Has entry</span>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-5">This Month</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Entries</span>
                  <span className="text-base font-black text-slate-800 dark:text-white">{monthEntries.length}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg Study Hours</span>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400">
                    {monthEntries.length > 0 ? (monthEntries.reduce((sum, e) => sum + e.studyHours, 0) / monthEntries.length).toFixed(1) : 0}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg Energy</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {monthEntries.length > 0 ? (monthEntries.reduce((sum, e) => sum + e.energyLevel, 0) / monthEntries.length).toFixed(1) : 0}/5
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Entries Timeline */}
          <div className="lg:col-span-2">
            
            <div className="space-y-5">
              {entries.map((entry, i) => (
                <div 
                  key={entry.id}
                  className="group bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 hover:border-slate-300 dark:hover:border-white/[0.1] transition-all duration-300 shadow-sm"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{entry.mood}</div>
                      <div>
                        <div className="text-lg font-black text-slate-800 dark:text-white mb-1">{entry.date}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded shadow-sm border border-blue-100 dark:border-blue-500/20">{entry.studyHours}h studied</span>
                          <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded shadow-sm border border-emerald-100 dark:border-emerald-500/20">Energy: {entry.energyLevel}/5</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelectedEntry(entry)} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-transparent flex items-center justify-center transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteEntry(entry.id)} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-slate-200 dark:border-transparent flex items-center justify-center transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 p-4 rounded-xl">
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">✓ What went well</div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{entry.wentWell}</p>
                    </div>
                    <div className="bg-orange-50/50 dark:bg-orange-500/5 border border-orange-100/50 dark:border-orange-500/10 p-4 rounded-xl">
                      <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">△ What to improve</div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{entry.toImprove}</p>
                    </div>
                    <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10 p-4 rounded-xl">
                      <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">→ Tomorrow's plan</div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{entry.tomorrowPlan}</p>
                    </div>
                  </div>
                </div>
              ))}

              {entries.length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] border-dashed rounded-2xl flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                     <BookOpen size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">No reflections yet</h3>
                  <p className="text-sm font-medium text-slate-500 mb-6">Take a moment to reflect on your day and plan for tomorrow.</p>
                  <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-purple-500/20">Write your first entry</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wider border-b border-slate-100 dark:border-white/10 pb-4">Today's Reflection</h3>
            <form onSubmit={addEntry} className="space-y-6">
              
              {/* Mood */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">How was your day?</label>
                <div className="flex gap-2">
                  {MOODS.map((mood, idx) => (
                    <label key={idx} className="flex-1 cursor-pointer group">
                      <input type="radio" name="mood" value={mood.emoji} defaultChecked={idx===2} required className="sr-only peer" />
                      <div className="p-3 md:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] group-hover:bg-slate-100 dark:group-hover:bg-white/[0.05] peer-checked:bg-purple-50 peer-checked:dark:bg-purple-500/10 peer-checked:border-purple-500 peer-checked:shadow-md peer-checked:shadow-purple-500/10 transition-all text-center">
                        <div className="text-2xl md:text-3xl mb-2 grayscale group-hover:grayscale-0 peer-checked:grayscale-0 transition-all transform peer-checked:scale-110">{mood.emoji}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{mood.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Study Hours & Energy */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Study Hours</label>
                  <input name="studyHours" type="number" step="0.5" placeholder="7.5" required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] text-slate-900 dark:text-white outline-none focus:border-purple-500 transition-colors font-medium text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Energy (1-5)</label>
                  <input name="energyLevel" type="number" min="1" max="5" placeholder="4" required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] text-slate-900 dark:text-white outline-none focus:border-purple-500 transition-colors font-medium text-sm" />
                </div>
              </div>

              {/* Reflections */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">✓ What went well today?</label>
                  <textarea name="wentWell" rows="2" placeholder="e.g., Completed DP module..." required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-emerald-500/20 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 transition-colors outline-none resize-none text-sm font-medium" />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">△ What could be improved?</label>
                  <textarea name="toImprove" rows="2" placeholder="e.g., Got distracted during afternoon..." required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-orange-500/20 text-slate-900 dark:text-white placeholder-slate-400 focus:border-orange-500 transition-colors outline-none resize-none text-sm font-medium" />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">→ Tomorrow's plan</label>
                  <textarea name="tomorrowPlan" rows="2" placeholder="e.g., Start Greedy algorithms..." required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-blue-500/20 text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 transition-colors outline-none resize-none text-sm font-medium" />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-white/10 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white font-bold uppercase tracking-wider text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl bg-purple-600 text-white font-bold uppercase tracking-wider text-sm hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedEntry(null)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Edit Reflection</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Mood</label>
                <select
                  value={selectedEntry.mood}
                  onChange={(e) => setSelectedEntry((prev) => ({ ...prev, mood: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm"
                >
                  {MOODS.map((m) => (
                    <option key={m.emoji} value={m.emoji}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 block">What went well</label>
                <textarea
                  rows="2"
                  value={selectedEntry.wentWell || ''}
                  onChange={(e) => setSelectedEntry((prev) => ({ ...prev, wentWell: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1 block">What to improve</label>
                <textarea
                  rows="2"
                  value={selectedEntry.toImprove || ''}
                  onChange={(e) => setSelectedEntry((prev) => ({ ...prev, toImprove: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1 block">Tomorrow plan</label>
                <textarea
                  rows="2"
                  value={selectedEntry.tomorrowPlan || ''}
                  onChange={(e) => setSelectedEntry((prev) => ({ ...prev, tomorrowPlan: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  updateEntry(selectedEntry.id, {
                    mood: selectedEntry.mood,
                    wentWell: selectedEntry.wentWell,
                    toImprove: selectedEntry.toImprove,
                    tomorrowPlan: selectedEntry.tomorrowPlan,
                  });
                  setSelectedEntry(null);
                }}
                className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase tracking-wider"
              >
                Save
              </button>
              <button onClick={() => setSelectedEntry(null)} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white text-xs font-bold uppercase tracking-wider">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReflectionPage;
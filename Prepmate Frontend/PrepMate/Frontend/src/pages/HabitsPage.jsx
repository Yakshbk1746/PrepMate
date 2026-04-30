import React, { useState, useEffect } from 'react';
import { Plus, Flame, CheckCircle2, X, Trophy, TrendingUp, Edit2, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { useHabits } from '../context/HabitContext';

const HabitsPage = () => {
  const { backendUserId } = useAuth();
  const { habits, isLoading, loadHabits, createHabit, updateHabit, toggleCompletion, deleteHabit } = useHabits();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // Load habits when user ID is available
  useEffect(() => {
    if (backendUserId) {
      loadHabits(backendUserId);
    }
  }, [backendUserId, loadHabits]);

  // Generate last 21 days as date strings
  const getLast21Days = () => {
    const days = [];
    for (let i = 20; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const last21Days = getLast21Days();

  const handleToggleCompletion = async (habitId) => {
    const today = new Date().toISOString().split('T')[0];
    await toggleCompletion(habitId, today);
  };

  const handleAddHabit = async (name, frequency) => {
    await createHabit(backendUserId, { name, frequency });
    setShowAddModal(false);
  };

  const handleUpdateHabit = async (habitId, name) => {
    const currentHabit = habits.find(h => h.id === habitId);
    if (!currentHabit || !name.trim()) {
      setEditingHabit(null);
      return;
    }
    await updateHabit(habitId, { name: name.trim() });
    setEditingHabit(null);
  };

  const handleDeleteHabit = async (habitId) => {
    await deleteHabit(habitId);
    setEditingHabit(null);
  };

  const today = new Date().toISOString().split('T')[0];
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  const todayCompleted = habits.filter(h => h.completedDates.includes(today)).length;
  const completionRate = habits.length > 0 ? Math.round((todayCompleted / habits.length) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header with Add Button */}
      <div className="flex items-center justify-end">
        <button 
          onClick={() => setShowAddModal(true)} 
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/30"
        >
          <Plus size={16} />
          Add Habit
        </button>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Lightbulb size={16} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">🔥 21-Day Habit Formation Science</h3>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-300">
              <li>• Research shows it takes 21 days to form a new habit</li>
              <li>• Focus on consistency over perfection - one day at a time</li>
              <li>• Your streak is your commitment - don't break the chain!</li>
              <li>• Start small: Better to do 20 minutes daily than 2 hours once a week</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="text-orange-400" size={18} />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Streak</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalStreak} days</div>
          <p className="text-xs text-slate-500 mt-1">Combined across all habits</p>
        </div>

        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="text-emerald-400" size={18} />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Today's Progress</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{completionRate}%</div>
          <p className="text-xs text-slate-500 mt-1">{todayCompleted}/{habits.length} completed</p>
        </div>

        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-yellow-400" size={18} />
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Habits</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{habits.length}</div>
          <p className="text-xs text-slate-500 mt-1">Tracking daily</p>
        </div>
      </div>

      {/* Habits List */}
      <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm dark:shadow-none">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Your Habits</h3>
        
        {habits.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">No habits yet</p>
            <button onClick={() => setShowAddModal(true)} className="mt-4 text-xs font-semibold text-emerald-400 hover:text-emerald-300">
              Add your first habit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => {
              const completedToday = habit.completedDates.includes(today);
              return (
                <div key={habit.id} className={`p-5 rounded-xl border transition-all ${
                  completedToday 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                } group`}>
                  <div className="flex items-center justify-between mb-3">
                    
                    <div className="flex items-center gap-4 flex-1">
                      {/* TOGGLEABLE Checkbox */}
                      <button 
                        onClick={() => handleToggleCompletion(habit.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          completedToday 
                            ? 'bg-emerald-500 hover:bg-emerald-600' 
                            : 'bg-white dark:bg-white/5 hover:bg-emerald-500/20 border-2 border-emerald-500/30 hover:border-emerald-500'
                        }`}
                      >
                        {completedToday && <CheckCircle2 size={20} className="text-white" />}
                      </button>

                      <div className="flex-1">
                        {editingHabit?.id === habit.id ? (
                          <input 
                            type="text"
                            defaultValue={habit.name}
                            onBlur={(e) => handleUpdateHabit(habit.id, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateHabit(habit.id, e.target.value)}
                            className="bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded px-2 py-1 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                            autoFocus
                          />
                        ) : (
                          <>
                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{habit.name}</h4>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Flame size={12} className="text-orange-400" />
                                {habit.streak} day streak
                              </span>
                              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase text-[10px] font-bold tracking-wider">
                                {habit.frequency}
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy size={12} className="text-yellow-400" />
                                Best: {habit.longestStreak}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingHabit(habit)} className="p-2 hover:bg-blue-500/10 rounded text-slate-400 hover:text-blue-400">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteHabit(habit.id)} className="p-2 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 21-Day Dot Tracker */}
                  <div className="pl-14">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {last21Days.map((dateStr, idx) => {
                        const isCompleted = habit.completedDates.includes(dateStr);
                        const isCurrentDay = dateStr === today;
                        return (
                          <div
                            key={dateStr}
                            title={`${new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${isCompleted ? ' ✓' : ''}`}
                            className={`w-3 h-3 rounded-full transition-all ${
                              isCompleted 
                                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' 
                                : 'bg-slate-200 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600'
                            } ${isCurrentDay ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-white dark:ring-offset-[#0a0f1e]' : ''}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                      <span>21 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Habit</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.habitName.value.trim();
              const frequency = e.target.frequency.value;
              if (name) handleAddHabit(name, frequency);
            }} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-2">Habit Name</label>
                <input 
                  type="text" 
                  name="habitName" 
                  required
                  placeholder="e.g., Solve 20 DSA Problems"
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white outline-none focus:border-emerald-500 placeholder-slate-400 dark:placeholder-slate-600"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-2">Frequency</label>
                <select
                  name="frequency"
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  defaultValue="daily"
                >
                  <option value="daily">Daily</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/30"
              >
                Add Habit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsPage;
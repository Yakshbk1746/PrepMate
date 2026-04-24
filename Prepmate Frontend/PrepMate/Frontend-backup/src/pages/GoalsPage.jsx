import React, { useState, useEffect } from 'react';
import { Target, Flag, Rocket, Image as ImageIcon, Star, Plus, MapPin, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getGoals, createGoal as createGoalApi, deleteGoal as deleteGoalApi, getVisionImages, createVisionImage as createVisionImageApi, deleteVisionImage as deleteVisionImageApi } from '../services/api';

const GOAL_TYPES = [
  { value: 'long', label: 'Long-term', icon: Star, color: 'orange' },
  { value: 'medium', label: 'Medium-term', icon: Flag, color: 'blue' },
  { value: 'short', label: 'Short-term', icon: Rocket, color: 'emerald' },
];

const GOAL_COLORS = {
  long: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', hoverBg: 'hover:bg-orange-500/10', text: 'text-orange-400', iconBg: 'bg-orange-500', shadow: 'shadow-orange-500/20', label: 'Ultimate Goal' },
  medium: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', hoverBg: 'hover:bg-blue-500/10', text: 'text-blue-400', iconBg: 'bg-blue-500', shadow: 'shadow-blue-500/20', label: 'Mid-Term' },
  short: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', hoverBg: 'hover:bg-emerald-500/10', text: 'text-emerald-400', iconBg: 'bg-emerald-500', shadow: 'shadow-emerald-500/20', label: 'Short-Term' },
};

const GoalsPage = () => {
  const { dbUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [visionBoard, setVisionBoard] = useState([]);
  // Load goals and vision images from backend
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchData = async () => {
      try {
        const [goalsRes, visionRes] = await Promise.all([
          getGoals(dbUser.id),
          getVisionImages(dbUser.id)
        ]);
        setGoals(Array.isArray(goalsRes.data) ? goalsRes.data : []);
        setVisionBoard(Array.isArray(visionRes.data) ? visionRes.data : []);
      } catch (error) {
        console.error('Error fetching goals/vision board:', error);
      }
    };
    fetchData();
  }, [dbUser?.id]);

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showImageForm, setShowImageForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalType, setNewGoalType] = useState('short');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const addGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !dbUser?.id) return;
    
    try {
      const res = await createGoalApi(dbUser.id, {
        type: newGoalType,
        title: newGoalTitle.trim(),
        deadline: newGoalDeadline || null,
        completed: false
      });
      setGoals(prev => [...prev, res.data]);
    } catch (error) {
      console.error('Error creating goal:', error);
    }
    
    setNewGoalTitle('');
    setNewGoalType('short');
    setNewGoalDeadline('');
    setShowGoalForm(false);
  };

  const deleteGoal = async (id) => {
    try {
      await deleteGoalApi(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const addVisionImage = async (e) => {
    e.preventDefault();
    if (!newImageUrl.trim() || !dbUser?.id) return;
    
    try {
      const res = await createVisionImageApi(dbUser.id, {
        imageUrl: newImageUrl.trim()
      });
      setVisionBoard(prev => [...prev, res.data]);
    } catch (error) {
      console.error('Error creating vision image:', error);
    }
    setNewImageUrl('');
    setShowImageForm(false);
  };

  const removeVisionImage = async (id) => {
    try {
      await deleteVisionImageApi(id);
      setVisionBoard(prev => prev.filter(img => img.id !== id));
    } catch (error) {
      console.error('Error deleting vision image:', error);
    }
  };

  // Group goals by type
  const goalsByType = { long: [], medium: [], short: [] };
  goals.forEach(g => {
    if (goalsByType[g.type]) goalsByType[g.type].push(g);
  });

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Goals Timeline */}
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm dark:shadow-none">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><MapPin size={18} className="text-orange-400"/> Milestones</h3>
              <button onClick={() => setShowGoalForm(!showGoalForm)} className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1">
                {showGoalForm ? <X size={14} /> : <Plus size={14}/>}
                {showGoalForm ? 'Cancel' : 'Add Goal'}
              </button>
            </div>

            {/* Add Goal Form */}
            {showGoalForm && (
              <form onSubmit={addGoal} className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="Goal title..."
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-blue-500/50 text-sm"
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newGoalType}
                      onChange={(e) => setNewGoalType(e.target.value)}
                      className="px-4 py-2.5 rounded-lg bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50 text-sm"
                    >
                      {GOAL_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newGoalDeadline}
                      onChange={(e) => setNewGoalDeadline(e.target.value)}
                      placeholder="Deadline (e.g., Feb 2027)"
                      className="px-4 py-2.5 rounded-lg bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-blue-500/50 text-sm"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all text-sm">
                    Add Goal
                  </button>
                </div>
              </form>
            )}

            {/* Timeline */}
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[19px] before:translate-x-[-1px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-orange-500/50 before:to-blue-500/20">
              {goals.map((goal) => {
                const colors = GOAL_COLORS[goal.type] || GOAL_COLORS.short;
                const GoalIcon = GOAL_TYPES.find(t => t.value === goal.type)?.icon || Rocket;
                return (
                  <div key={goal.id} className="relative flex items-center group">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0a0f1e] ${colors.iconBg} text-white shrink-0 shadow-lg ${colors.shadow} z-10`}>
                      <GoalIcon size={16} />
                    </div>
                    <div className={`ml-4 flex-1 p-4 rounded-xl border ${colors.border} ${colors.bg} ${colors.hoverBg} transition-colors`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold ${colors.text} uppercase tracking-wider`}>{colors.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{goal.deadline}</span>
                          <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{goal.title}</h4>
                    </div>
                  </div>
                );
              })}

              {goals.length === 0 && (
                <div className="text-center py-8 pl-14">
                  <Target size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500">No goals yet. Add your first milestone!</p>
                </div>
              )}
            </div>
          </div>

          {/* Vision Board */}
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm dark:shadow-none">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><ImageIcon size={18} className="text-pink-400"/> Vision Board</h3>
              <button onClick={() => setShowImageForm(!showImageForm)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 bg-slate-100 dark:bg-white/5 rounded-lg transition-colors">
                {showImageForm ? <X size={16}/> : <Plus size={16}/>}
              </button>
            </div>

            {/* Add Image URL Form */}
            {showImageForm && (
              <form onSubmit={addVisionImage} className="mb-4 flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  required
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-blue-500/50 text-sm"
                />
                <button type="submit" className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-lg transition-all text-sm">
                  Add
                </button>
              </form>
            )}

            <div className="grid grid-cols-2 gap-3 pb-2">
                  {visionBoard.map((img, idx) => (
                    <div key={img.id || img.imageUrl} className={`${idx === 0 ? 'col-span-2 h-48' : 'h-32'} relative group overflow-hidden rounded-xl border border-slate-200 dark:border-white/10`}>
                      <img src={img.imageUrl || img} alt="Vision board" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {idx === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <span className="text-white font-bold">Dream Campus</span>
                    </div>
                  )}
                  <button
                    onClick={() => removeVisionImage(idx)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-500/80 flex items-center justify-center text-white hover:bg-red-600 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {/* Add placeholder card */}
              <div
                onClick={() => setShowImageForm(true)}
                className="relative overflow-hidden rounded-xl h-32 border border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-white/5 hover:cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <div className="text-center text-slate-400 dark:text-slate-500">
                  <Plus size={24} className="mx-auto mb-2" />
                  <span className="text-xs font-medium">Add Image</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default GoalsPage;

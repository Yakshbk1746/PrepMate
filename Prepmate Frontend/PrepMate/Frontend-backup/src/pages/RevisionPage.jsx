import React, { useState, useEffect } from 'react';
import { RefreshCw, Calendar, CheckCircle2, Plus, AlertCircle, X, Save, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getRevisions, createRevision as createRevisionApi, updateRevision as updateRevisionApi, markRevisionComplete, deleteRevision as deleteRevisionApi } from '../services/api';

const RevisionPage = () => {
  const { dbUser } = useAuth();
  const [revisions, setRevisions] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingRevision, setEditingRevision] = useState(null);
  const [formData, setFormData] = useState({
    topicName: '',
    subject: '',
    intervalDays: '1',
    scheduledDate: new Date().toISOString().split('T')[0]
  });

  // Load revisions from backend
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchRevisions = async () => {
      try {
        const res = await getRevisions(dbUser.id);
        setRevisions(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching revisions:', error);
      }
    };
    fetchRevisions();
  }, [dbUser?.id]);

  const toggleRevision = async (id) => {
    try {
      await markRevisionComplete(id);
      setRevisions(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    } catch (error) {
      console.error('Error toggling revision:', error);
    }
  };

  const deleteRevision = async (id) => {
    if (confirm('Delete this revision?')) {
      try {
        await deleteRevisionApi(id);
        setRevisions(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        console.error('Error deleting revision:', error);
      }
    }
  };

  const openModal = (revision = null) => {
    if (revision) {
      setEditingRevision(revision);
      setFormData({
        topicName: revision.topicName,
        subject: revision.subject,
        intervalDays: revision.intervalDays.toString(),
        scheduledDate: revision.scheduledDate
      });
    } else {
      setEditingRevision(null);
      setFormData({
        topicName: '',
        subject: '',
        intervalDays: '1',
        scheduledDate: new Date().toISOString().split('T')[0]
      });
    }
    setShowModal(true);
  };

  const saveRevision = async () => {
    if (!formData.topicName.trim() || !formData.subject.trim() || !dbUser?.id) {
      alert('Please fill all required fields');
      return;
    }

    try {
      if (editingRevision) {
        const res = await updateRevisionApi(editingRevision.id, {
          topicName: formData.topicName,
          subject: formData.subject,
          intervalDays: parseInt(formData.intervalDays),
          scheduledDate: formData.scheduledDate
        });
        setRevisions(prev => prev.map(r => r.id === editingRevision.id ? res.data : r));
      } else {
        const res = await createRevisionApi(dbUser.id, {
          topicName: formData.topicName,
          subject: formData.subject,
          intervalDays: parseInt(formData.intervalDays),
          scheduledDate: formData.scheduledDate,
          completed: false
        });
        setRevisions(prev => [...prev, res.data]);
      }
    } catch (error) {
      console.error('Error saving revision:', error);
    }

    setShowModal(false);
    setEditingRevision(null);
  };

  const getUrgencyStatus = (scheduledDate) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const scheduled = new Date(scheduledDate); scheduled.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((scheduled - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 2) return 'upcoming';
    return 'scheduled';
  };

  const getRelativeDate = (date) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date); targetDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === -1) return '1 day overdue';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const urgencyColors = {
    overdue: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
    today: { bg: 'bg-orange-50 dark:bg-yellow-500/10', border: 'border-orange-200 dark:border-yellow-500/30', text: 'text-orange-600 dark:text-yellow-400', dot: 'bg-orange-500 dark:bg-yellow-500' },
    upcoming: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
    scheduled: { bg: 'bg-slate-50 dark:bg-slate-500/10', border: 'border-slate-200 dark:border-slate-500/30', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-500' },
  };

  const activeRevisions = revisions.filter(r => !r.completed);
  const completedRevisions = revisions.filter(r => r.completed);

  const overdueOrToday = activeRevisions.filter(r => {
    const urgency = getUrgencyStatus(r.scheduledDate);
    return urgency === 'overdue' || urgency === 'today';
  });

  const upcoming = activeRevisions.filter(r => {
    const urgency = getUrgencyStatus(r.scheduledDate);
    return urgency === 'upcoming' || urgency === 'scheduled';
  });

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Options */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-3">
              <RefreshCw size={28} className="text-blue-600 dark:text-blue-500" /> Active Recall
            </h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Spaced Repetition System</p>
          </div>
          <button onClick={() => openModal()} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
            <Plus size={18} /> Schedule Topic
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm border-l-4 border-l-red-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Action Needed</span>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{overdueOrToday.length}</div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due today or overdue</p>
          </div>
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <Calendar className="text-blue-500" size={20} />
              </div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Upcoming</span>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{upcoming.length}</div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next few days</p>
          </div>
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="text-emerald-500" size={20} />
              </div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Completed</span>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{completedRevisions.length}</div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">All time done</p>
          </div>
        </div>

        {/* Due Today / Overdue */}
        {overdueOrToday.length > 0 && (
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm mb-6">
            <div className="bg-red-50/50 dark:bg-red-500/[0.02] border-b border-red-100 dark:border-white/5 p-5 flex items-center justify-between">
              <h2 className="font-black text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-3 text-sm">
                <AlertCircle size={20} /> Today's Priority ({overdueOrToday.length})
              </h2>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              {overdueOrToday.map((revision) => {
                const urgency = getUrgencyStatus(revision.scheduledDate);
                const colors = urgencyColors[urgency];
                return (
                  <div key={revision.id} className={`p-4 md:p-5 rounded-2xl border transition-all ${colors.border} ${colors.bg} group flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md`}>
                    <div className="flex items-start sm:items-center gap-4 flex-1">
                      <div className={`mt-1.5 sm:mt-0 w-3 h-3 rounded-full shrink-0 ${colors.dot} animate-pulse`} />
                      <div className="flex-1">
                        <h3 className="text-slate-900 dark:text-white font-black text-lg mb-1">{revision.topicName}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <span className="bg-white/50 dark:bg-white/5 px-2 py-1 rounded shadow-sm border border-slate-200/50 dark:border-white/5">{revision.subject}</span>
                          <span className="bg-white/50 dark:bg-white/5 px-2 py-1 rounded shadow-sm border border-slate-200/50 dark:border-white/5">{revision.intervalDays}d interval</span>
                          <span className={`${colors.text} bg-white/50 dark:bg-white/5 px-2 py-1 rounded shadow-sm border border-slate-200/50 dark:border-white/5`}>{getRelativeDate(revision.scheduledDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-200/50 dark:border-white/5 sm:border-t-0">
                      <button onClick={() => toggleRevision(revision.id)} className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20">
                        Mark Done
                      </button>
                      <button onClick={() => openModal(revision)} className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-500 transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteRevision(revision.id)} className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm mb-6">
            <div className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 p-5 flex items-center justify-between">
              <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-3 text-sm">
                <Calendar className="text-blue-500" size={20} /> Upcoming Revisions ({upcoming.length})
              </h2>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              {upcoming.map((revision) => {
                const urgency = getUrgencyStatus(revision.scheduledDate);
                const colors = urgencyColors[urgency];
                return (
                  <div key={revision.id} className={`p-4 md:p-5 rounded-2xl border transition-all ${colors.border} ${colors.bg} group flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md`}>
                    <div className="flex items-start sm:items-center gap-4 flex-1">
                      <div className={`mt-1.5 sm:mt-0 w-3 h-3 rounded-full shrink-0 ${colors.dot}`} />
                      <div className="flex-1">
                        <h3 className="text-slate-900 dark:text-white font-black text-lg mb-1">{revision.topicName}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                           <span className="bg-white/50 dark:bg-white/5 px-2 py-1 rounded shadow-sm border border-slate-200/50 dark:border-white/5">{revision.subject}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-200/50 dark:border-white/5 sm:border-t-0 justify-between sm:justify-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg shadow-sm">{getRelativeDate(revision.scheduledDate)}</span>
                      <div className="flex gap-2">
                        <button onClick={() => openModal(revision)} className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-500 transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deleteRevision(revision.id)} className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedRevisions.length > 0 && (
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm opacity-70">
            <div className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 p-5 flex items-center gap-3">
               <CheckCircle2 className="text-emerald-500" size={20} />
               <h2 className="font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-sm">
                Completed ({completedRevisions.length})
              </h2>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              {completedRevisions.map((revision) => (
                <div key={revision.id} className="p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4 flex-1">
                    <div className="mt-1.5 sm:mt-0 w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <h3 className="text-slate-500 font-bold text-lg mb-1 line-through">{revision.topicName}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span className="line-through">{revision.subject}</span>
                        <span>•</span>
                        <span className="line-through">{revision.intervalDays}d interval</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-200 dark:border-white/5 sm:border-t-0">
                    <button onClick={() => toggleRevision(revision.id)} className="flex-1 sm:flex-none px-5 py-2 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
                      Undo
                    </button>
                    <button onClick={() => deleteRevision(revision.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors sm:opacity-0 sm:group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {revisions.length === 0 && (
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-16 text-center shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
              <RefreshCw className="text-slate-400" size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wider">No Revisions Yet</h3>
            <p className="text-slate-500 text-sm font-medium mb-8 max-w-sm">Start adding topics you've covered to build your personalized spaced repetition schedule.</p>
            <button onClick={() => openModal()} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors inline-flex items-center gap-2 font-bold uppercase tracking-wider text-sm shadow-lg shadow-blue-500/20">
              <Plus size={18} /> Schedule First Topic
            </button>
          </div>
        )}

      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">{editingRevision ? 'Edit Revision' : 'Schedule Topic'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 rounded-full p-1 border border-slate-200 dark:border-transparent">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Topic Name</label>
                <input
                  type="text"
                  value={formData.topicName}
                  onChange={(e) => setFormData({...formData, topicName: e.target.value})}
                  placeholder="e.g., Dynamic Programming"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors font-medium text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Subject Category</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="e.g., Algorithms"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-colors font-medium text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Interval Gap</label>
                  <select
                    value={formData.intervalDays}
                    onChange={(e) => setFormData({...formData, intervalDays: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium text-sm"
                  >
                    <option value="1">1 day later</option>
                    <option value="3">3 days later</option>
                    <option value="7">1 week later</option>
                    <option value="14">2 weeks later</option>
                    <option value="21">3 weeks later</option>
                    <option value="30">1 month later</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-colors font-bold uppercase tracking-wider text-sm">
                Cancel
              </button>
              <button onClick={saveRevision} className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                <Save size={18} />
                {editingRevision ? 'Save Changes' : 'Confirm'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionPage;
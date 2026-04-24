import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { RefreshCw, Calendar, CheckCircle2, Plus, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { plannerService } from '../services/plannerService';
import { getRevisions, createRevision, updateRevision, deleteRevision, getUserByFirebaseUid } from '../services/api';

const DEFAULT_PROFILE = { exam: 'GATE', stream: 'CSE' };

// ─── Spaced Repetition Helpers ───────────────────────────────────────────────

function calculateNextRevisionDate(currentIntervalDays, rating) {
  const today = new Date();
  let nextDays;
  if (rating === 'hard') {
    nextDays = 1;
  } else if (rating === 'okay') {
    nextDays = Math.max(1, Math.round(currentIntervalDays * 2));
  } else { // easy
    nextDays = Math.max(1, Math.round(currentIntervalDays * 2.5));
  }
  const next = new Date(today);
  next.setDate(today.getDate() + nextDays);
  return { date: next.toISOString().split('T')[0], intervalDays: nextDays };
}

const getStageBadge = (stage) => {
  const stages = {
    0: { label: 'Not revised', color: 'bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20' },
    1: { label: 'R1', color: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' },
    2: { label: 'R2', color: 'bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20' },
    3: { label: 'R3', color: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20' },
    4: { label: 'R4', color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' },
  };
  return stages[stage] || stages[0];
};

const getRelativeDate = (date) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date); targetDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Due today';
  if (diffDays === -1) return '1 day overdue';
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
};

// ─── Main Component ─────────────────────────────────────────────────────────

const RevisionPage = () => {
  const { user, backendUserId } = useAuth();
  const [subjects, setSubjects] = useState(plannerService.getSubjects(DEFAULT_PROFILE));

  // ── Revision Queue state ──
  const [sessions, setSessions] = useState([]);
  const [masteredSessions, setMasteredSessions] = useState([]);
  const [activeRatingId, setActiveRatingId] = useState(null);
  const [showMastered, setShowMastered] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // ── Manual Revision Modal ──
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    sessionTitle: '',
    subject: '',
    revisionDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!user?.uid) return;

    getUserByFirebaseUid(user.uid)
      .then((profile) => {
        setSubjects(plannerService.getSubjects({ exam: profile?.exam, stream: profile?.stream }));
      })
      .catch(console.error);
  }, [user?.uid]);

  // ── Backend Data Load ──

  useEffect(() => {
    if (!backendUserId) return;
    getRevisions(backendUserId).then(data => {
      const mapped = (Array.isArray(data) ? data : []).map(r => ({
        id: r.id,
        sessionTitle: r.topicName || r.title,
        subject: r.subject,
        nextRevisionDate: r.scheduledDate,
        revisionStage: r.completionCount || 0,
        intervalDays: r.intervalDays || 1,
        completed: !!r.completed,
      }));
      const active = mapped.filter(r => !r.completed);
      const mastered = mapped.filter(r => r.completed);
      setSessions(active);
      setMasteredSessions(mastered);
      setLoadingSessions(false);
    }).catch(console.error);
  }, [backendUserId]);

  // ── Derived data ──
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.nextRevisionDate <= today);
  const upcomingSessions = sessions.filter(s => s.nextRevisionDate > today);

  // ── Handlers ──

  const handleRateRevision = async (sessionId, rating, currentIntervalDays) => {
    const today = new Date().toISOString().split('T')[0];
    updateRevision(sessionId, { completed: true, completedDate: today }).then((updated) => {
      const mappedUpdated = {
        id: updated.id,
        sessionTitle: updated.topicName || updated.title,
        subject: updated.subject,
        nextRevisionDate: updated.scheduledDate,
        revisionStage: updated.completionCount || 0,
        intervalDays: updated.intervalDays || 1,
        completed: !!updated.completed,
      };
      setSessions(prev => prev.filter(r=>r.id!==sessionId));
      setMasteredSessions(prev => [...prev, mappedUpdated]);
      setActiveRatingId(null);
    }).catch(console.error);
  };

  const handleSaveManualRevision = async () => {
    if (!manualForm.sessionTitle.trim() || !manualForm.subject.trim()) return;

    createRevision(backendUserId, {
      topicName: manualForm.sessionTitle.trim(),
      subject: manualForm.subject.trim(),
      intervalDays: 1,
      scheduledDate: manualForm.revisionDate || new Date().toISOString().split('T')[0],
      completed: false,
    }).then((saved) => {
      setSessions(prev => [...prev, {
        id: saved.id,
        sessionTitle: saved.topicName || saved.title,
        subject: saved.subject,
        nextRevisionDate: saved.scheduledDate,
        revisionStage: saved.completionCount || 0,
        intervalDays: saved.intervalDays || 1,
        completed: !!saved.completed,
      }]);
    }).catch(console.error);

    setShowManualModal(false);
    setManualForm({ sessionTitle: '', subject: '', revisionDate: new Date().toISOString().split('T')[0] });
  };

  const handleDeleteRevision = (id) => {
    deleteRevision(id).then(() => setSessions(prev => prev.filter(r => r.id !== id))).catch(console.error);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm border-l-4 border-l-red-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg"><AlertCircle className="text-red-500" size={18} /></div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Action Needed</span>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{todaySessions.length}</div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due today or overdue</p>
          </div>
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg"><Calendar className="text-blue-500" size={18} /></div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Upcoming</span>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{upcomingSessions.length}</div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next few days</p>
          </div>
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><CheckCircle2 className="text-emerald-500" size={18} /></div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Mastered</span>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{masteredSessions.length}</div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fully retained</p>
          </div>
        </div>

        {/* Add Manual Revision Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-orange-500/20"
          >
            <Plus size={18} /> Manual Revision
          </button>
        </div>

        {/* ═══════ REVISION QUEUE ═══════ */}
        <div className="space-y-6">

          {/* Loading */}
          {loadingSessions && (
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-12 text-center shadow-sm">
              <RefreshCw className="animate-spin text-blue-500 mx-auto mb-4" size={28} />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Loading revision queue…</p>
            </div>
          )}

          {/* Empty state */}
          {!loadingSessions && sessions.length === 0 && masteredSessions.length === 0 && (
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-16 text-center shadow-sm flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                <RefreshCw className="text-slate-400" size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wider">No Revisions Yet</h3>
              <p className="text-slate-500 text-sm font-medium mb-4 max-w-sm">
                Complete tasks in your Daily Planner and log study sessions, or use "Manual Revision" to schedule topics directly.
              </p>
            </div>
          )}

          {/* Today's Priority */}
          {!loadingSessions && todaySessions.length > 0 && (
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-red-50/50 dark:bg-red-500/[0.02] border-b border-red-100 dark:border-white/5 p-5">
                <h2 className="font-black text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-3 text-sm">
                  <AlertCircle size={20} /> Today's Priority ({todaySessions.length})
                </h2>
              </div>
              <div className="p-5 md:p-6 space-y-4">
                {todaySessions.map((session) => {
                  const isOverdue = session.nextRevisionDate < today;
                  const stage = getStageBadge(session.revisionStage);
                  return (
                    <div key={session.id} className="group">
                      <div className={`p-4 md:p-5 rounded-2xl border transition-all shadow-sm hover:shadow-md bg-white dark:bg-[#060914] border-l-4 ${
                        isOverdue
                          ? 'border-l-red-500 border-red-200 dark:border-red-500/20'
                          : 'border-l-orange-400 border-orange-200 dark:border-orange-500/20'
                      } ${!isOverdue ? 'border-slate-200 dark:border-white/[0.06]' : ''}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-4 flex-1">
                            <div className={`mt-1.5 sm:mt-0 w-3 h-3 rounded-full shrink-0 animate-pulse ${isOverdue ? 'bg-red-500' : 'bg-orange-500'}`} />
                            <div className="flex-1">
                              <h3 className="text-slate-900 dark:text-white font-black text-lg mb-1">{session.sessionTitle}</h3>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <span className="bg-slate-100 dark:bg-white/5 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-white/5">{session.subject}</span>
                                <span className={`px-2 py-1 rounded shadow-sm ${stage.color}`}>{stage.label}</span>
                                <span className={`${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'}`}>
                                  {getRelativeDate(session.nextRevisionDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            {activeRatingId !== session.id && (
                              <button onClick={() => setActiveRatingId(session.id)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/20">
                                Start Revision
                              </button>
                            )}
                          </div>
                        </div>

                        {activeRatingId === session.id && (
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">How well did you recall this?</p>
                              <button onClick={() => setActiveRatingId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={16} /></button>
                            </div>
                            <div className="flex gap-3">
                              <button onClick={() => handleRateRevision(session.id, 'hard', session.intervalDays)} className="flex-1 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-500/30 transition-colors">Hard — repeat tomorrow</button>
                              <button onClick={() => handleRateRevision(session.id, 'okay', session.intervalDays)} className="flex-1 py-2.5 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-bold uppercase tracking-wider border border-orange-200 dark:border-orange-500/30 transition-colors">Okay</button>
                              <button onClick={() => handleRateRevision(session.id, 'easy', session.intervalDays)} className="flex-1 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-500/30 transition-colors">Easy</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {!loadingSessions && upcomingSessions.length > 0 && (
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 p-5">
                <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-3 text-sm">
                  <Calendar className="text-blue-500" size={20} /> Upcoming Revisions ({upcomingSessions.length})
                </h2>
              </div>
              <div className="p-5 md:p-6 space-y-4">
                {upcomingSessions.map((session) => {
                  const stage = getStageBadge(session.revisionStage);
                  return (
                    <div key={session.id} className="p-4 md:p-5 rounded-2xl border transition-all shadow-sm hover:shadow-md bg-white dark:bg-[#060914] border-slate-200 dark:border-white/[0.06] border-l-4 border-l-slate-200 dark:border-l-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4 flex-1">
                        <div className="mt-1.5 sm:mt-0 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                        <div className="flex-1">
                          <h3 className="text-slate-900 dark:text-white font-black text-lg mb-1">{session.sessionTitle}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <span className="bg-slate-100 dark:bg-white/5 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-white/5">{session.subject}</span>
                            <span className={`px-2 py-1 rounded shadow-sm ${stage.color}`}>{stage.label}</span>
                          </div>
                        </div>
                      </div>
                      <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20 whitespace-nowrap">
                        {getRelativeDate(session.nextRevisionDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mastered */}
          {!loadingSessions && masteredSessions.length > 0 && (
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-sm opacity-70">
              <button onClick={() => setShowMastered(!showMastered)} className="w-full bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 p-5 flex items-center justify-between">
                <h2 className="font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-3 text-sm">
                  <CheckCircle2 className="text-emerald-500" size={20} /> Mastered ({masteredSessions.length})
                </h2>
                {showMastered ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              {showMastered && (
                <div className="p-5 md:p-6 space-y-4">
                  {masteredSessions.map((session) => (
                    <div key={session.id} className="p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] opacity-60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4 flex-1">
                        <div className="mt-1.5 sm:mt-0 w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                        <div>
                          <h3 className="text-slate-500 font-bold text-lg mb-1 line-through">{session.sessionTitle}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <span className="line-through">{session.subject}</span>
                            <span>•</span>
                            <span>Mastered</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ═══════ Manual Revision Modal ═══════ */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowManualModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/10">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Manual Revision</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Bypass automatic scheduling — set your own date.</p>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-full p-1"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Topic / Title</label>
                <input type="text" value={manualForm.sessionTitle} onChange={e => setManualForm({ ...manualForm, sessionTitle: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Binary Trees" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Subject</label>
                <select
                  value={manualForm.subject}
                  onChange={e => setManualForm({ ...manualForm, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Select subject</option>
                  {subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Revision Date</label>
                <input type="date" value={manualForm.revisionDate} onChange={e => setManualForm({ ...manualForm, revisionDate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-white/10">
              <button onClick={() => setShowManualModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors">Cancel</button>
              <button onClick={handleSaveManualRevision} className="flex-[2] py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"><RefreshCw size={16} /> Schedule Revision</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionPage;
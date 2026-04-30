import React, { useEffect, useState } from 'react';
import { Target, ChevronLeft, ChevronRight, Plus, Map, Flag, Award, X, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getYearlyPlans, createYearlyPlan, updateYearlyPlan, deleteYearlyPlan, getUserByFirebaseUid } from '../services/api';
import { plannerService } from '../services/plannerService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKS = ['W1', 'W2', 'W3', 'W4'];
const CATEGORIES = ['Revision', 'Test', 'Study Phase', 'Exam'];

const toSubjectId = (name = '') =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const createSubjectOptions = (subjects = []) =>
  subjects
    .filter(Boolean)
    .map((name) => ({
      id: toSubjectId(name),
      name,
      colorObj: plannerService.getSubjectColorObj(name),
    }));

const normalizeLegacySubjectId = (rawSubjectId, subjectOptions) => {
  if (!rawSubjectId) return '';

  if (subjectOptions.some((item) => item.id === rawSubjectId)) {
    return rawSubjectId;
  }

  const aliases = {
    math: 'engineering-mathematics',
    cs: 'programming',
  };

  if (aliases[rawSubjectId] && subjectOptions.some((item) => item.id === aliases[rawSubjectId])) {
    return aliases[rawSubjectId];
  }

  const slug = toSubjectId(rawSubjectId);
  if (subjectOptions.some((item) => item.id === slug)) {
    return slug;
  }

  return rawSubjectId;
};

const getSubjectShortCode = (name = '') => {
  const normalized = String(name).trim().toLowerCase();
  const map = {
    'algorithms': 'ALGO',
    'data structures': 'DS',
    'operating systems': 'OS',
    'dbms': 'DBMS',
    'computer networks': 'CN',
    'theory of computation': 'TOC',
    'discrete mathematics': 'DM',
    'compiler design': 'CD',
    'digital logic': 'DL',
    'computer organization': 'COA',
    'programming': 'PROG',
    'general aptitude': 'GA',
    'engineering mathematics': 'EM',
    'mathematics': 'MATH',
    'physics': 'PHY',
    'chemistry': 'CHEM',
    'biology': 'BIO',
  };

  if (map[normalized]) {
    return map[normalized];
  }

  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 4)
    .toUpperCase() || 'SUB';
};

const getCategoryShortCode = (category = '') => {
  const map = {
    'Study Phase': 'SP',
    Revision: 'REV',
    Test: 'TST',
    Exam: 'EXM',
  };

  return map[category] || String(category).slice(0, 3).toUpperCase();
};

const YearlyPlanner = () => {
  const { user, backendUserId } = useAuth();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null); // null = add mode, id = edit mode
  const [activeFilter, setActiveFilter] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [subjectOptions, setSubjectOptions] = useState(createSubjectOptions(plannerService.getSubjects({ exam: 'GATE', stream: 'CSE' })));

  const [newGoal, setNewGoal] = useState({
    subjectId: toSubjectId(plannerService.getSubjects({ exam: 'GATE', stream: 'CSE' })[0]),
    category: 'Study Phase',
    startMonth: 0,
    startWeek: 'W1',
    endMonth: 1,
    endWeek: 'W2'
  });

  const [timelineMarkers] = useState([]);

  const [planMatrix, setPlanMatrix] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    getUserByFirebaseUid(user.uid)
      .then((profile) => {
        const resolved = plannerService.resolveProfileWithFallback(profile);
        const subjects = plannerService.getSubjects(resolved);
        const options = createSubjectOptions(subjects);
        if (options.length > 0) {
          setSubjectOptions(options);
        }
      })
      .catch(() => {
        const resolved = plannerService.resolveProfileWithFallback(null);
        const subjects = plannerService.getSubjects(resolved);
        const options = createSubjectOptions(subjects);
        if (options.length > 0) {
          setSubjectOptions(options);
        }
      });
  }, [user?.uid]);

  useEffect(() => {
    if (subjectOptions.length === 0) return;
    setNewGoal((prev) => {
      const valid = subjectOptions.some((item) => item.id === prev.subjectId);
      return valid ? prev : { ...prev, subjectId: subjectOptions[0].id };
    });
  }, [subjectOptions]);

  const getDeterministicTimeline = (item) => {
    const key = `${item?.subjectId || ''}:${item?.topic || ''}`;
    const seed = Array.from(key).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const start = (seed % 12) * 0.75;
    return {
      start,
      end: Math.min(12, start + 1),
    };
  };

  useEffect(() => {
    if (!backendUserId) return;

    getYearlyPlans(backendUserId, currentYear)
      .then((data) => {
        const mapped = data.map((item) => {
          const apiStart = Number(item?.startMonth);
          const apiEnd = Number(item?.endMonth);
          const hasApiTimeline = Number.isFinite(apiStart) && Number.isFinite(apiEnd) && apiEnd > apiStart;
          const fallback = getDeterministicTimeline(item);

          return {
            id: item.id,
            subjectId: normalizeLegacySubjectId(item.subjectId, subjectOptions),
            category: item.topic || 'Study Phase',
            startMonth: hasApiTimeline ? apiStart : fallback.start,
            endMonth: hasApiTimeline ? apiEnd : fallback.end,
            progress: Number(item.progress) || 0,
            year: item.year,
            topic: item.topic,
          };
        });
        setPlanMatrix(mapped);
      })
      .catch(console.error);
  }, [backendUserId, currentYear, subjectOptions]);

  // Map category to marker type for filtering
  const categoryToType = (cat) => {
    switch(cat) {
      case 'Revision': return 'phase';
      case 'Test': return 'goal';
      case 'Study Phase': return 'milestone';
      case 'Exam': return 'exam';
      default: return null;
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!backendUserId) {
      setErrorMessage('User not synced yet. Please refresh and try again.');
      return;
    }

    const selectedSubjectId = subjectOptions.some((item) => item.id === newGoal.subjectId)
      ? newGoal.subjectId
      : (subjectOptions[0]?.id || '');

    if (!selectedSubjectId) {
      setErrorMessage('Please select a subject.');
      return;
    }
    
    const sFraction = parseInt(newGoal.startMonth) + (WEEKS.indexOf(newGoal.startWeek) * 0.25);
    const eFraction = parseInt(newGoal.endMonth) + ((WEEKS.indexOf(newGoal.endWeek) + 1) * 0.25);

    if (!Number.isFinite(sFraction) || !Number.isFinite(eFraction)) {
      setErrorMessage('Please select a valid start and end month/week.');
      return;
    }

    if (eFraction < sFraction) {
      setErrorMessage("End time cannot be before start time");
      return;
    }
    setErrorMessage('');

    const goalData = {
      subjectId: selectedSubjectId,
      category: newGoal.category,
      startMonth: sFraction,
      endMonth: eFraction,
      progress: editingGoalId ? planMatrix.find(i=>i.id===editingGoalId)?.progress || 0 : 0
    };

    try {
      if (editingGoalId) {
        const updated = await updateYearlyPlan(editingGoalId, {
          year: currentYear,
          subjectId: goalData.subjectId,
          topic: goalData.category,
          progress: goalData.progress,
          startMonth: goalData.startMonth,
          endMonth: goalData.endMonth,
        });

        setPlanMatrix((prev) =>
          prev.map((item) =>
            item.id === editingGoalId
              ? {
                  ...item,
                  ...goalData,
                  subjectId: updated.subjectId || goalData.subjectId,
                  category: updated.topic || goalData.category,
                  progress: Number(updated.progress) || goalData.progress,
                  topic: updated.topic || goalData.category,
                }
              : item
          )
        );
      } else {
        const saved = await createYearlyPlan(backendUserId, {
          year: currentYear,
          subjectId: goalData.subjectId,
          topic: goalData.category,
          progress: 0,
          startMonth: goalData.startMonth,
          endMonth: goalData.endMonth,
        });

        setPlanMatrix((prev) => [
          ...prev,
          {
            id: saved.id,
            ...goalData,
            progress: Number(saved.progress) || 0,
            category: saved.topic || goalData.category,
            topic: saved.topic || goalData.category,
            year: saved.year || currentYear,
          },
        ]);
      }

      setShowAddModal(false);
      setEditingGoalId(null);
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || error?.response?.data || 'Failed to save goal. Please try again.';
      setErrorMessage(typeof message === 'string' ? message : 'Failed to save goal. Please try again.');
    }
  };

  const handleEditGoal = (item) => {
    // Decompose inclusive fractional endMonth back to month+week
    const sMonth = Math.floor(item.startMonth);
    const sWeekIdx = Math.round((item.startMonth - sMonth) / 0.25);
    const eMonth = Math.floor(item.endMonth - 0.01); // -0.01 to stay within previous month if it's exactly on boundary
    const eWeekIdx = Math.max(0, Math.round(((item.endMonth - eMonth) / 0.25) - 1));

    setNewGoal({
      subjectId: item.subjectId,
      category: item.category,
      startMonth: sMonth.toString(),
      startWeek: WEEKS[sWeekIdx] || 'W1',
      endMonth: eMonth.toString(),
      endWeek: WEEKS[eWeekIdx] || 'W1',
    });
    setEditingGoalId(item.id);
    setErrorMessage('');
    setShowAddModal(true);
  };

  const handleDeleteGoal = (id) => {
    deleteYearlyPlan(id)
      .then(() => setPlanMatrix((prev) => prev.filter((item) => item.id !== id)))
      .catch(console.error);
  };

  const handleUpdateProgress = (id, progress) => {
    updateYearlyPlan(id, { progress })
      .then((updated) => {
        setPlanMatrix((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, progress: Number(updated.progress) || progress }
              : item
          )
        );
      })
      .catch(console.error);
  };

  const increaseYear = () => setCurrentYear(y => y + 1);
  const decreaseYear = () => setCurrentYear(y => y - 1);

  const getTypeColor = (type) => {
    switch(type) {
      case 'milestone': return 'text-violet-500 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20';
      case 'goal': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'phase': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      case 'exam': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
      default: return 'text-slate-500 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10';
    }
  };

  const getSubjectColor = (id) => subjectOptions.find(s=>s.id === id)?.colorObj?.accent || 'bg-slate-500';

  const toggleFilter = (type) => {
    setActiveFilter(prev => prev === type ? null : type);
  };

  const scopedPlanMatrix = planMatrix.filter((item) => subjectOptions.some((subject) => subject.id === item.subjectId));

  // Filter plan matrix items
  const filteredPlanMatrix = activeFilter
    ? scopedPlanMatrix.filter(item => categoryToType(item.category) === activeFilter)
    : scopedPlanMatrix;

  // Keep visual sequence consistent: earlier timeline rows appear above later ones.
  const sortedPlanMatrix = [...filteredPlanMatrix].sort((a, b) => {
    if (a.startMonth !== b.startMonth) return a.startMonth - b.startMonth;
    if (a.endMonth !== b.endMonth) return a.endMonth - b.endMonth;
    const aSubject = subjectOptions.find((s) => s.id === a.subjectId)?.name || a.subjectId || '';
    const bSubject = subjectOptions.find((s) => s.id === b.subjectId)?.name || b.subjectId || '';
    if (aSubject !== bSubject) return aSubject.localeCompare(bSubject);
    return String(a.id).localeCompare(String(b.id));
  });

  const resolvedGoalSubjectId = subjectOptions.some((item) => item.id === newGoal.subjectId)
    ? newGoal.subjectId
    : (subjectOptions[0]?.id || '');

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-2">
          <div className="flex items-center gap-4">
            <button onClick={decreaseYear} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-slate-300 dark:border-transparent text-slate-700 dark:text-white">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
              <Map size={24} className="text-blue-500"/> {currentYear} ROADMAP
            </h2>
            <button onClick={increaseYear} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-slate-300 dark:border-transparent text-slate-700 dark:text-white">
              <ChevronRight size={20} />
            </button>
          </div>
          <button 
            onClick={() => { 
                setNewGoal({ 
                  subjectId: subjectOptions[0]?.id || '', 
                  category: 'Study Phase', 
                  startMonth: '0', 
                  startWeek: 'W1', 
                  endMonth: '1', 
                  endWeek: 'W4' 
                }); 
                setEditingGoalId(null);
                setErrorMessage(''); 
                setShowAddModal(true); 
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} /> New Goal
          </button>
        </div>

        {/* Subjects Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {subjectOptions.map(subject => (
            <div key={subject.id} className="flex items-center gap-2 bg-white dark:bg-[#0a0f1e]/60 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/[0.06] shadow-sm">
              <div className={`w-3 h-3 rounded-full ${subject.colorObj?.accent || 'bg-slate-500'}`}></div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{subject.name}</span>
            </div>
          ))}
        </div>

        {/* Gantt Chart Area - Desktop */}
        <div className="hidden lg:block glass-panel rounded-2xl overflow-hidden shadow-sm relative border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-transparent">
          
          {/* Months Header row - Spans 100% width */}
          <div className="grid grid-cols-12 border-b border-slate-200 dark:border-white/[0.06] bg-slate-100/50 dark:bg-white/[0.04]">
            {MONTHS.map((month, idx) => (
              <div key={idx} className="py-2 text-center border-r last:border-0 border-slate-200 dark:border-white/[0.06] relative">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{month}</span>
                {/* Milestone Marker if present */}
                {timelineMarkers
                  .filter(m => m.monthIdx === idx)
                  .map(marker => {
                    const isFiltered = activeFilter && marker.type !== activeFilter;
                    return (
                      <div key={marker.id} className={`absolute -bottom-8 left-1/2 -translate-x-1/2 border px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider whitespace-nowrap z-10 ${getTypeColor(marker.type)} shadow-sm transition-opacity ${isFiltered ? 'opacity-20' : 'opacity-100'}`}>
                        <div className="flex items-center gap-1">
                          {marker.type === 'milestone' && <Flag size={10}/>}
                          {marker.type === 'exam' && <Target size={10}/>}
                          {marker.type === 'goal' && <Award size={10}/>}
                          {marker.title}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>

          {/* Spacer row for milestones in headers if needed */}
          <div className="h-10 border-b border-slate-200 dark:border-white/[0.06] grid grid-cols-12">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border-r last:border-0 border-slate-200 dark:border-white/[0.06] opacity-30"></div>
            ))}
          </div>

          {/* Plan Blocks - Full width content */}
          <div className="relative py-4 space-y-3">
            {/* Grid background lines - Spans 100% */}
            <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="border-r border-slate-200 border-dashed dark:border-white/[0.04] last:border-0"></div>
              ))}
            </div>

            {/* Blocks */}
            {sortedPlanMatrix.map(item => {
              // Precise positioning: startMonth and endMonth are fractional values
              const startPercent = (item.startMonth / 12) * 100;
              const widthPercent = ((item.endMonth - item.startMonth) / 12) * 100;
              const bgColor = getSubjectColor(item.subjectId);
              const subjectInfo = subjectOptions.find(s=>s.id === item.subjectId) || { name: item.subjectId || 'Unknown', color: 'bg-slate-500' };
              const shortCode = getSubjectShortCode(subjectInfo.name);
              const compactCategory = getCategoryShortCode(item.category);
              const isTiny = widthPercent < 5.5;
              const isSmall = widthPercent < 10;
              const blockWidthPercent = Math.max(widthPercent, isTiny ? 5.5 : 3.5);

              let blockLabel = shortCode;
              if (widthPercent >= 16) {
                blockLabel = `${subjectInfo.name} - ${item.category}`;
              } else if (widthPercent >= 8) {
                blockLabel = `${shortCode} - ${compactCategory}`;
              }

              return (
                <div key={item.id} className="relative h-12 w-full flex items-center group">
                  <div 
                    className={`absolute h-11 ${bgColor} bg-opacity-95 rounded-xl shadow-md border border-white/20 overflow-visible flex items-center ${isTiny ? 'px-1' : isSmall ? 'px-2' : 'px-4'} transition-all hover:scale-[1.01] hover:shadow-lg hover:brightness-110 z-10`}
                    style={{ left: `${startPercent}%`, width: `${blockWidthPercent}%` }}
                    title={`${subjectInfo.name} - ${item.category} (${item.progress}%)`}
                  >
                    {/* Progress Bar Background fill */}
                    <div className="absolute inset-y-0 left-0 bg-black/20" style={{ width: `${item.progress}%` }}></div>
                    
                    {/* Content */}
                    <div className={`relative z-10 flex items-center ${isTiny ? 'justify-center' : 'justify-between'} w-full min-w-0 ${isTiny ? 'gap-0' : 'gap-2'}`}>
                       <span className={`text-white ${isTiny ? 'text-[9px]' : 'text-[11px]'} font-black uppercase tracking-wider truncate drop-shadow-sm`}>
                         {isTiny ? shortCode : blockLabel}
                       </span>
                       {!isSmall && (
                         <span onClick={() => handleUpdateProgress(item.id, Math.min(100, (Number(item.progress) || 0) + 10))} className={`text-white ${isSmall ? 'text-[8px] px-1 py-0' : 'text-[10px] px-2 py-0.5'} font-black opacity-90 shrink-0 bg-white/20 rounded-full border border-white/10 cursor-pointer`} title="Increase progress by 10%">
                           {item.progress}%
                         </span>
                       )}
                    </div>

                    {/* Edit/Delete buttons — visible on hover */}
                    <div className="absolute top-0.5 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditGoal(item); }}
                        className="p-1 rounded bg-white/20 hover:bg-white/40 text-white transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteGoal(item.id); }}
                        className="p-1 rounded bg-white/20 hover:bg-red-500/60 text-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Mobile View - Stacked Cards */}
        <div className="lg:hidden space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white px-1 uppercase tracking-wider flex items-center gap-2">
            <Award size={20} className="text-blue-500" /> Active Goals
          </h3>
          {sortedPlanMatrix.length === 0 ? (
            <div className="glass-panel p-8 text-center text-slate-500 italic">No goals found for this filter.</div>
          ) : (
            sortedPlanMatrix.map(item => {
              const subjectInfo = subjectOptions.find(s => s.id === item.subjectId) || { name: item.subjectId || 'Unknown', colorObj: { accent: 'bg-slate-500' } };
              const sMonth = Math.floor(item.startMonth);
              const eMonth = Math.floor(item.endMonth);
              return (
                <div key={item.id} className="glass-panel p-4 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${subjectInfo.colorObj?.accent || 'bg-slate-500'} text-white`}>
                        {subjectInfo.name}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1">{item.category}</h4>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleEditGoal(item)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-500"><Edit2 size={14}/></button>
                       <button onClick={() => handleDeleteGoal(item.id)} className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-medium">
                    <span>{MONTHS[sMonth]} {WEEKS[Math.round((item.startMonth - sMonth) / 0.25)] || 'W1'}</span>
                    <ArrowRight size={12} />
                    <span>{MONTHS[eMonth]} {WEEKS[Math.round((item.endMonth - eMonth) / 0.25)] || 'W1'}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${item.progress}%` }} />
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-blue-500 text-right">{item.progress}% Complete</div>
                </div>
              );
            })
          )}
        </div>

        {/* Legend for Types — clickable for filtering */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => toggleFilter('phase')}
            className={`rounded-xl p-4 flex items-center justify-between transition-all border ${
              activeFilter === 'phase' 
                ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/50 ring-2 ring-emerald-400/30' 
                : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-300'
            }`}
          >
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Phases</span>
            <div className="w-8 h-1 bg-emerald-500 rounded"></div>
          </button>
          <button 
            onClick={() => toggleFilter('milestone')}
            className={`rounded-xl p-4 flex items-center justify-between transition-all border ${
              activeFilter === 'milestone' 
                ? 'bg-violet-100 dark:bg-violet-500/20 border-violet-400 dark:border-violet-500/50 ring-2 ring-violet-400/30' 
                : 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20 hover:border-violet-300'
            }`}
          >
            <span className="text-xs font-bold text-violet-800 dark:text-violet-400 uppercase tracking-widest">Milestones</span>
            <Flag size={16} className="text-violet-500"/>
          </button>
          <button 
            onClick={() => toggleFilter('goal')}
            className={`rounded-xl p-4 flex items-center justify-between transition-all border ${
              activeFilter === 'goal' 
                ? 'bg-blue-100 dark:bg-blue-500/20 border-blue-400 dark:border-blue-500/50 ring-2 ring-blue-400/30' 
                : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 hover:border-blue-300'
            }`}
          >
            <span className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest">Goals</span>
            <Award size={16} className="text-blue-500"/>
          </button>
          <button 
            onClick={() => toggleFilter('exam')}
            className={`rounded-xl p-4 flex items-center justify-between transition-all border ${
              activeFilter === 'exam' 
                ? 'bg-rose-100 dark:bg-rose-500/20 border-rose-400 dark:border-rose-500/50 ring-2 ring-rose-400/30' 
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 hover:border-rose-300'
            }`}
          >
            <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-widest">Exams</span>
            <Target size={16} className="text-rose-500"/>
          </button>
        </div>

      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Add New Goal</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Subject</label>
                <select
                  value={resolvedGoalSubjectId}
                  onChange={(e) => setNewGoal({...newGoal, subjectId: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                >
                  {subjectOptions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

                 {/* Duration Info Overlay */}
                 <div className="flex items-center justify-between px-1 mb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline Range</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                     {Math.max(0, (parseInt(newGoal.endMonth) + ((WEEKS.indexOf(newGoal.endWeek) + 1) * 0.25)) - (parseInt(newGoal.startMonth) + (WEEKS.indexOf(newGoal.startWeek) * 0.25))).toFixed(2)} Months Duration
                   </span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Start</label>
                  <div className="flex gap-2">
                    <select
                      value={newGoal.startMonth}
                      onChange={(e) => setNewGoal({...newGoal, startMonth: e.target.value})}
                      className="flex-1 px-3 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={newGoal.startWeek}
                      onChange={(e) => setNewGoal({...newGoal, startWeek: e.target.value})}
                      className="w-20 px-3 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                      {WEEKS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">End</label>
                  <div className="flex gap-2">
                    <select
                      value={newGoal.endMonth}
                      onChange={(e) => setNewGoal({...newGoal, endMonth: e.target.value})}
                      className="flex-1 px-3 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={newGoal.endWeek}
                      onChange={(e) => setNewGoal({...newGoal, endWeek: e.target.value})}
                      className="w-20 px-3 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors"
                    >
                      {WEEKS.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <p className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-500/20 animate-in fade-in slide-in-from-top-1">
                  {errorMessage}
                </p>
              )}

              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
                  {editingGoalId ? 'Update Goal' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default YearlyPlanner;
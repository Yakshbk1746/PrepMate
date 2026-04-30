import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, ArrowRight, Clock, X, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { plannerService } from '../services/plannerService';
import { useAuth } from '../context/authContext';
import { getWeeklyTopics, createWeeklyTopic, updateWeeklyTopic, deleteWeeklyTopic, getUserByFirebaseUid, getYearlyPlans } from '../services/api';

const DEFAULT_PROFILE = { exam: 'GATE', stream: 'CSE' };

const toSubjectId = (name = '') =>
  String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const resolveSubjectNameFromYearlyId = (rawSubjectId, subjects) => {
  if (!rawSubjectId) return '';

  if (subjects.includes(rawSubjectId)) {
    return rawSubjectId;
  }

  const idToNameMap = new Map(subjects.map((name) => [toSubjectId(name), name]));
  const aliases = {
    math: 'engineering-mathematics',
    cs: 'programming',
  };

  const alias = aliases[rawSubjectId] || rawSubjectId;
  if (idToNameMap.has(alias)) {
    return idToNameMap.get(alias);
  }

  const normalized = toSubjectId(rawSubjectId);
  if (idToNameMap.has(normalized)) {
    return idToNameMap.get(normalized);
  }

  return '';
};

const WeeklyPlanner = () => {
  const navigate = useNavigate();
  const { user, backendUserId } = useAuth();
  const [subjects, setSubjects] = useState(plannerService.getSubjects(DEFAULT_PROFILE));
  const [yearlySubjects, setYearlySubjects] = useState([]);
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [weekData, setWeekData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [openMenuKey, setOpenMenuKey] = useState(null); // "dayKey-index"
  const menuRef = useRef(null);

  // Edit state
  const [editingItem, setEditingItem] = useState(null); // { dayKey, index, item }

  // Form state for add/edit modal
  const [formSubject, setFormSubject] = useState('');
  const [formTopics, setFormTopics] = useState([]);
  const [formTimeFrom, setFormTimeFrom] = useState('');
  const [formTimeTo, setFormTimeTo] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    getUserByFirebaseUid(user.uid)
      .then((profile) => {
        const resolved = plannerService.resolveProfileWithFallback(profile);
        setSubjects(plannerService.getSubjects(resolved));
      })
      .catch(() => {
        const fallback = plannerService.resolveProfileWithFallback(null);
        setSubjects(plannerService.getSubjects(fallback));
      });
  }, [user?.uid]);

  const getMonthChunkWeekStart = (date) => {
    const d = new Date(date);
    const dayOfMonth = d.getDate();
    const chunkStartDay = dayOfMonth <= 7 ? 1 : dayOfMonth <= 14 ? 8 : dayOfMonth <= 21 ? 15 : 22;
    return new Date(d.getFullYear(), d.getMonth(), chunkStartDay);
  };

  const getLegacyMondayWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekStart = getMonthChunkWeekStart(currentDate);
  const weekStartDate = weekStart.toISOString().split('T')[0];
  const legacyWeekStartDate = getLegacyMondayWeekStart(currentDate).toISOString().split('T')[0];
  const weekYear = weekStart.getFullYear();
  const isFinalMonthChunk = weekStart.getDate() === 22;
  const lastDayOfMonth = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0).getDate();
  const weekDayCount = isFinalMonthChunk ? (lastDayOfMonth - 21) : 7;
  const weekDays = Array.from({ length: weekDayCount }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const normalizeDayKey = (dayOfWeek) => {
    if (!dayOfWeek) return 'Mon';
    const map = {
      mon: 'Mon',
      tue: 'Tue',
      wed: 'Wed',
      thu: 'Thu',
      fri: 'Fri',
      sat: 'Sat',
      sun: 'Sun',
    };
    const key = String(dayOfWeek).slice(0, 3).toLowerCase();
    return map[key] || 'Mon';
  };

  useEffect(() => {
    if (!backendUserId) return;

    const primaryRequest = getWeeklyTopics(backendUserId, weekStartDate);
    const legacyRequest = legacyWeekStartDate !== weekStartDate
      ? getWeeklyTopics(backendUserId, legacyWeekStartDate)
      : Promise.resolve([]);

    Promise.all([primaryRequest, legacyRequest])
      .then(([primaryData, legacyData]) => {
        const merged = [...(Array.isArray(primaryData) ? primaryData : [])];
        (Array.isArray(legacyData) ? legacyData : []).forEach((item) => {
          if (!merged.some((existing) => existing.id === item.id)) {
            merged.push(item);
          }
        });

        const map = {};
        merged.forEach((item) => {
          const dayKey = normalizeDayKey(item.dayOfWeek);
          if (!map[dayKey]) map[dayKey] = [];
          map[dayKey].push(item);
        });
        setWeekData(map);
      })
      .catch(console.error);
  }, [backendUserId, weekStartDate, legacyWeekStartDate]);

  useEffect(() => {
    if (!backendUserId || subjects.length === 0) return;

    getYearlyPlans(backendUserId, weekYear)
      .then((plans) => {
        const unique = new Set();
        (Array.isArray(plans) ? plans : []).forEach((item) => {
          const name = resolveSubjectNameFromYearlyId(item?.subjectId, subjects);
          if (name) unique.add(name);
        });

        setYearlySubjects(Array.from(unique).sort((a, b) => a.localeCompare(b)));
      })
      .catch(console.error);
  }, [backendUserId, weekYear, subjects]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuKey(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const prevWeek = () => {
    const d = new Date(weekStart);
    if (weekStart.getDate() === 1) {
      d.setDate(0);
      d.setDate(22);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    if (isFinalMonthChunk) {
      d.setMonth(d.getMonth() + 1, 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const openAddModal = (day) => {
    setSelectedDay(day);
    setEditingItem(null);
    setFormSubject('');
    setFormTopics([]);
    setFormTimeFrom('');
    setFormTimeTo('');
    setShowAddModal(true);
  };

  const openEditModal = (dayKey, index, item) => {
    setEditingItem({ dayKey, index, item });
    setFormSubject(item.subject || '');
    setFormTopics(item.topics || [item.topic]);
    setFormTimeFrom(item.timeFrom || '');
    setFormTimeTo(item.timeTo || '');
    setSelectedDay(null);
    setOpenMenuKey(null);
    setShowAddModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedSubject = availableSubjects.includes(formSubject)
      ? formSubject
      : (availableSubjects[0] || '');
    if (!selectedSubject || formTopics.length === 0 || !backendUserId) return;

    const topicStr = formTopics.join(', ');

    if (editingItem) {
      const payload = {
        subject: selectedSubject,
        topic: topicStr,
        dayOfWeek: editingItem.dayKey,
        weekStartDate,
        timeFrom: formTimeFrom || null,
        timeTo: formTimeTo || null,
      };

      updateWeeklyTopic(editingItem.item.id, payload)
        .then((updated) => {
          setWeekData((prev) => ({
            ...prev,
            [editingItem.dayKey]: (prev[editingItem.dayKey] || []).map((item, i) =>
              item.id === updated.id || i === editingItem.index
                ? { ...updated, topics: splitTopicList(updated.topic) }
                : item
            ),
          }));
        })
        .catch(console.error);
    } else if (selectedDay) {
      const dayKey = selectedDay.toLocaleDateString('en-US', { weekday: 'short' });
      const payload = {
        subject: selectedSubject,
        topic: topicStr,
        dayOfWeek: dayKey,
        weekStartDate,
        timeFrom: formTimeFrom || null,
        timeTo: formTimeTo || null,
      };

      createWeeklyTopic(backendUserId, payload)
        .then((saved) => {
          setWeekData((prev) => ({
            ...prev,
            [dayKey]: [...(prev[dayKey] || []), { ...saved, topics: splitTopicList(saved.topic) }],
          }));
        })
        .catch(console.error);
    }

    setShowAddModal(false);
    setSelectedDay(null);
    setEditingItem(null);
  };

  const splitTopicList = (topic) =>
    String(topic || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const removeTopic = (dayKey, index) => {
    const item = (weekData[dayKey] || [])[index];
    if (!item?.id) {
      setWeekData((prev) => ({
        ...prev,
        [dayKey]: (prev[dayKey] || []).filter((_, i) => i !== index),
      }));
      setOpenMenuKey(null);
      return;
    }

    deleteWeeklyTopic(item.id)
      .then(() => {
        setWeekData((prev) => ({
          ...prev,
          [dayKey]: (prev[dayKey] || []).filter((t) => t.id !== item.id),
        }));
      })
      .catch(console.error);
    setOpenMenuKey(null);
  };

  const goToDailyPlanner = (date) => {
    navigate(`/daily?date=${date.toISOString().split('T')[0]}`);
  };

  const toggleFormTopic = (topic) => {
    setFormTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const weekRange = `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${weekDays[weekDays.length - 1].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const yearlyOptionSubjects = yearlySubjects;
  const otherOptionSubjects = subjects
    .filter((subject) => !yearlyOptionSubjects.includes(subject))
    .sort((a, b) => a.localeCompare(b));
  const availableSubjects = [...yearlyOptionSubjects, ...otherOptionSubjects];
  const resolvedFormSubject = availableSubjects.includes(formSubject)
    ? formSubject
    : (availableSubjects[0] || '');
  const availableTopics = resolvedFormSubject ? plannerService.getTopics(resolvedFormSubject) : [];
  const weeklySubjectProgress = Object.values(weekData)
    .flat()
    .reduce((acc, item) => {
      const subject = item.subject || 'General';
      if (!acc[subject]) {
        acc[subject] = { total: 0, completed: 0 };
      }
      acc[subject].total += 1;
      if (String(item.status || '').toLowerCase() === 'completed') {
        acc[subject].completed += 1;
      }
      return acc;
    }, {});

  return (
    <div className="space-y-6">

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={goToToday} className="text-xs font-semibold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 border border-blue-500/20 transition-all">Today</button>
          <div className="flex items-center gap-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] px-3 py-1.5 rounded-lg">
            <button onClick={prevWeek} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[140px] text-center">{weekRange}</span>
            <button onClick={nextWeek} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {Object.keys(weeklySubjectProgress).length > 0 && (
        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Weekly Subject Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(weeklySubjectProgress).map(([subject, stat]) => {
              const percent = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
              return (
                <div key={subject}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{subject}</span>
                    <span className="text-slate-500">{percent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
        {weekDays.map((date, i) => {
          const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
          const topics = weekData[dayKey] || [];
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date() && !isToday;

          return (
            <div key={i} className={`bg-white dark:bg-[#0a0f1e]/60 border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${isToday ? 'border-blue-500/50 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.09]'} ${isPast ? 'opacity-60' : ''}`}>
              
              <div className={`px-4 py-3 border-b flex items-center justify-between ${isToday ? 'bg-blue-500/10 border-blue-500/20' : 'border-slate-100 dark:border-white/[0.05]'}`}>
                <div className="min-w-0">
                  <div className={`text-xs font-black uppercase tracking-wider ${isToday ? 'text-blue-400' : 'text-slate-500'}`}>{dayKey}</div>
                  <div className={`text-2xl font-black leading-none mt-1 ${isToday ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{date.getDate()}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-600 font-medium mt-0.5">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                </div>
                {isToday && <div className="flex flex-col items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Now</span></div>}
              </div>

              <div className="flex-1 p-3 space-y-2 min-h-[250px] max-h-[400px] overflow-y-auto min-w-0">
                {topics.map((item, idx) => {
                  const colors = plannerService.getSubjectColorObj(item.subject);
                  const hasTime = item.timeFrom && item.timeTo;
                  const menuKey = `${dayKey}-${idx}`;
                  const isMenuOpen = openMenuKey === menuKey;

                  return (
                    <div key={idx} className={`group p-3 rounded-xl border ${colors.bg} ${colors.border} hover:scale-[1.02] transition-all duration-200 cursor-pointer relative min-w-0`}>
                      {hasTime && <div className="flex items-center gap-1.5 mb-2"><Clock size={10} className={colors.text} /><span className={`text-[10px] font-bold ${colors.text} truncate`}>{item.timeFrom} - {item.timeTo}</span></div>}
                      <div className="flex items-center gap-2 mb-1.5 min-w-0"><div className={`w-1 h-4 rounded-full shrink-0 ${colors.accent}`} /><span className={`text-xs font-bold ${colors.text} truncate`}>{item.subject}</span></div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-3 line-clamp-2 break-words">{item.topic}</p>

                      {/* Three-dot menu */}
                      <div className="absolute top-2 right-2" ref={isMenuOpen ? menuRef : null}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuKey(isMenuOpen ? null : menuKey); }}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all duration-200"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {isMenuOpen && (
                          <div className="absolute right-0 top-7 bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl z-20 overflow-hidden min-w-[100px]">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditModal(dayKey, idx, item); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeTopic(dayKey, idx); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {topics.length === 0 && <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-700"><div className="text-center"><CalendarIcon size={24} className="mx-auto mb-2 opacity-30" /><p className="text-xs italic">No topics</p></div></div>}
              </div>

              <div className="px-3 pb-3 flex gap-2 border-t border-slate-100 dark:border-white/[0.05] pt-3">
                <button onClick={() => openAddModal(date)} className="flex-1 py-2 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-200 flex items-center justify-center gap-1.5"><Plus size={14} /> Add</button>
                <button onClick={() => goToDailyPlanner(date)} className="py-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-all duration-200 flex items-center gap-1"><ArrowRight size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Topic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#0f1629] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingItem ? 'Edit Topic' : 'Add Topic'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {editingItem
                ? `Editing in ${editingItem.dayKey}`
                : selectedDay?.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
              }
            </p>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                {/* Grouped subject dropdown */}
                <select
                  value={resolvedFormSubject}
                  onChange={(e) => { setFormSubject(e.target.value); setFormTopics([]); }}
                  required
                  disabled={availableSubjects.length === 0}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50"
                >
                  <option value="">{availableSubjects.length === 0 ? 'No yearly subjects found' : 'Select subject'}</option>
                  {yearlyOptionSubjects.length > 0 && (
                    <optgroup label="📌 In Yearly Plan">
                      {yearlyOptionSubjects.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </optgroup>
                  )}
                  {otherOptionSubjects.length > 0 && (
                    <optgroup label="Other Subjects">
                      {otherOptionSubjects.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {yearlyOptionSubjects.length === 0 && otherOptionSubjects.length > 0 && (
                  <p className="text-[10px] text-amber-500 font-bold mt-1">No Yearly subjects yet. Showing profile subjects.</p>
                )}
                {availableSubjects.length === 0 && (
                  <p className="text-[10px] text-amber-500 font-bold mt-1">No subjects available. Check your exam/stream in Settings.</p>
                )}

                {/* Topic checkboxes */}
                {resolvedFormSubject && availableTopics.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Select Topics</label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                      {availableTopics.map(topic => (
                        <label key={topic} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={formTopics.includes(topic)}
                            onChange={() => toggleFormTopic(topic)}
                            className="w-4 h-4 rounded accent-blue-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{topic}</span>
                        </label>
                      ))}
                    </div>
                    {formTopics.length > 0 && (
                      <p className="text-[10px] text-blue-500 font-bold mt-2">{formTopics.length} topic(s) selected</p>
                    )}
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-white/[0.05] pt-3 mt-3">
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-2"><Clock size={12} />Time slot (optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={formTimeFrom} onChange={e => setFormTimeFrom(e.target.value)} type="time" className="px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50" />
                    <input value={formTimeTo} onChange={e => setFormTimeTo(e.target.value)} type="time" className="px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 px-4 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.1] hover:bg-slate-200 dark:hover:bg-white/[0.08] font-medium transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all">{editingItem ? 'Update' : 'Add Topic'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanner;

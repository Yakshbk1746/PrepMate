import React, { useEffect, useState } from 'react';
import { Plus, TrendingUp, AlertCircle, Award, Target, X, Edit2, Trash2, ChevronDown, ChevronRight, Lightbulb, BookOpen, CheckCircle2, FileSpreadsheet, FileText } from 'lucide-react';
import { plannerService } from '../services/plannerService';
import { useAuth } from '../context/authContext';
import { getTests, createTest, updateTest as updateTestApi, deleteTest as deleteTestApi, getUserByFirebaseUid } from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const DEFAULT_PROFILE = { exam: 'GATE', stream: 'CSE' };

const FAILURE_MODES = [
  'Conceptual Gap',
  'Silly/Calculation',
  'Read-Error',
  'Time Pressure'
];

const buildExportRows = (tests = []) => {
  const rows = [];

  tests.forEach((test) => {
    const percentage = test.total > 0 ? ((test.score / test.total) * 100).toFixed(1) : '0.0';
    const testSubjects = Array.isArray(test.subjects) && test.subjects.length > 0 ? test.subjects.join(', ') : 'N/A';
    const topicSummary = Object.entries(test.topics || {})
      .map(([subject, topics]) => `${subject}: ${(topics || []).join(' | ')}`)
      .join('; ');

    if (Array.isArray(test.errors) && test.errors.length > 0) {
      test.errors.forEach((error) => {
        rows.push({
          'Mock/Test': test.name,
          'Test Type': test.type,
          Date: test.date,
          Subject: error.subject || testSubjects,
          Topic: error.topic || 'General',
          'Score %': percentage,
          'Score (Raw)': `${test.score}/${test.total}`,
          'Duration (min)': test.duration,
          'Error Status': error.status || 'unsolved',
          'Conceptual Errors': error.counts?.conceptual || 0,
          'Silly Errors': error.counts?.silly || 0,
          'Read Errors': error.counts?.readError || 0,
          'Time Errors': error.counts?.time || 0,
          Notes: error.extraInfo || '',
        });
      });
      return;
    }

    rows.push({
      'Mock/Test': test.name,
      'Test Type': test.type,
      Date: test.date,
      Subject: testSubjects,
      Topic: topicSummary || 'N/A',
      'Score %': percentage,
      'Score (Raw)': `${test.score}/${test.total}`,
      'Duration (min)': test.duration,
      'Error Status': 'No errors logged',
      'Conceptual Errors': 0,
      'Silly Errors': 0,
      'Read Errors': 0,
      'Time Errors': 0,
      Notes: '',
    });
  });

  return rows;
};

const TestsPage = () => {
  const { user, backendUserId } = useAuth();
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState(plannerService.getSubjects(DEFAULT_PROFILE));
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [exportType, setExportType] = useState('topic');
  
  // Add test form state
  const [testType, setTestType] = useState('topic');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState({});

  useEffect(() => {
    if (!user?.uid) return;

    getUserByFirebaseUid(user.uid)
      .then((profile) => {
        setSubjects(plannerService.getSubjects({ exam: profile?.exam, stream: profile?.stream }));
      })
      .catch(console.error);
  }, [user?.uid]);

  useEffect(() => {
    let isMounted = true;

    const loadTests = async () => {
      try {
        if (!backendUserId) return;
        const data = await getTests(backendUserId);
        console.log('Tests API response:', data);
        if (isMounted) {
          setTests(data);
        }
      } catch (error) {
        console.error('Failed to fetch tests:', error);
        if (isMounted) {
          setTests([]);
        }
      }
    };

    loadTests();

    return () => {
      isMounted = false;
    };
  }, [backendUserId]);

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const toggleTopic = (subject, topic) => {
    setSelectedTopics(prev => ({
      ...prev,
      [subject]: prev[subject]?.includes(topic) 
        ? prev[subject].filter(t => t !== topic)
        : [...(prev[subject] || []), topic]
    }));
  };

  const addTest = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const testPayload = {
      name: formData.get('name'),
      type: testType,
      subjects: testType === 'mock' ? ['Full Syllabus'] : selectedSubjects,
      topics: testType === 'topic' ? selectedTopics : {},
      score: parseFloat(formData.get('score')),
      total: parseFloat(formData.get('total')),
      duration: parseInt(formData.get('duration')),
      date: new Date().toISOString().split('T')[0],
      errors: [],
    };

    createTest(backendUserId, testPayload)
      .then((saved) => {
        setTests((prev) => [saved, ...prev]);
        setShowAddModal(false);
        resetAddForm();
      })
      .catch(console.error);
  };

  const resetAddForm = () => {
    setTestType('topic');
    setSelectedSubjects([]);
    setSelectedTopics({});
  };

  const openEditModal = (test) => {
    setSelectedTest(test);
    setShowEditModal(true);
  };

  const handleUpdateTest = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    updateTestApi(selectedTest.id, {
      ...selectedTest,
      score: parseFloat(formData.get('score')),
      total: parseFloat(formData.get('total')),
    })
      .then((updated) => {
        setTests((prev) => prev.map((t) => (t.id === selectedTest.id ? updated : t)));
        setShowEditModal(false);
        setSelectedTest(null);
      })
      .catch(console.error);
  };

  const deleteTest = (id) => {
    deleteTestApi(id)
      .then(() => setTests((prev) => prev.filter((t) => t.id !== id)))
      .catch(console.error);
  };

  const openErrorModal = (test) => {
    setSelectedTest(test);
    setShowErrorModal(true);
  };

  // Organize tests by type
  const topicTests = tests.filter(t => t.type === 'topic');
  const subjectTests = tests.filter(t => t.type === 'subject');
  const mockTests = tests.filter(t => t.type === 'mock');
  const exportableTests = tests.filter((t) => t.type === exportType);

  // Stats
  const totalTests = tests.length;
  const avgScore = tests.length > 0 ? (tests.reduce((sum, t) => sum + (t.score / t.total * 100), 0) / tests.length).toFixed(1) : 0;
  const scoreTrend = [...tests]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-10)
    .map((test, index) => ({
      name: `T${index + 1}`,
      score: Number((((test.score || 0) / Math.max(test.total || 100, 1)) * 100).toFixed(1)),
    }));

  // Error Add Logic
  const handleAddError = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // For full mock, lock subject/topic automatically to keep logging fast.
    const isFullMock = selectedTest.subjects.includes('Full Syllabus');
    let finalSub = isFullMock ? 'Full Syllabus' : selectedTest.subjects[0];
    let finalTopic = isFullMock ? 'General' : (selectedTest.topics[finalSub] ? selectedTest.topics[finalSub][0] : 'General');
    
    const conceptual = parseInt(formData.get('conceptual') || 0);
    const silly = parseInt(formData.get('silly') || 0);
    const readError = parseInt(formData.get('readError') || 0);
    const time = parseInt(formData.get('time') || 0);

    const newError = {
      id: Date.now(),
      subject: finalSub,
      topic: finalTopic,
      counts: { conceptual, silly, readError, time },
      extraInfo: formData.get('extraInfo') || '',
      status: 'unsolved',
      testName: selectedTest.name // for easy reference in UI
    };

    const nextErrors = [newError, ...(selectedTest.errors || [])];

    updateTestApi(selectedTest.id, {
      ...selectedTest,
      errors: nextErrors,
    })
      .then((updated) => {
        setTests((prev) => prev.map((t) => (t.id === selectedTest.id ? updated : t)));
        setShowErrorModal(false);
        setSelectedTest(null);
      })
      .catch(console.error);
  };

  // Toggle Redo Status
  const toggleErrorStatus = (testId, errorId) => {
    const target = tests.find((t) => t.id === testId);
    if (!target) return;

    const nextErrors = (target.errors || []).map((err) =>
      err.id === errorId ? { ...err, status: err.status === 'unsolved' ? 'cleared' : 'unsolved' } : err
    );

    updateTestApi(testId, {
      ...target,
      errors: nextErrors,
    })
      .then((updated) => {
        setTests((prev) => prev.map((t) => (t.id === testId ? updated : t)));
      })
      .catch(console.error);
  };

  const handleDownloadExcel = () => {
    const scopedTests = tests.filter((test) => test.type === exportType);
    const rows = buildExportRows(scopedTests);
    if (rows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
      { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
      { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 28 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${exportType}-wise`);
    XLSX.writeFile(workbook, `tests-errors-${exportType}-wise-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadPdf = () => {
    const scopedTests = tests.filter((test) => test.type === exportType);
    const rows = buildExportRows(scopedTests);
    if (rows.length === 0) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(13);
    doc.text(`PrepMate ${exportType.charAt(0).toUpperCase() + exportType.slice(1)}-wise Tests & Errors Report`, 40, 34);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 50);

    const columns = [
      'Mock/Test', 'Test Type', 'Date', 'Subject', 'Topic', 'Score %', 'Score (Raw)',
      'Duration (min)', 'Error Status', 'Conceptual Errors', 'Silly Errors', 'Read Errors', 'Time Errors', 'Notes',
    ];

    autoTable(doc, {
      startY: 60,
      head: [columns],
      body: rows.map((row) => columns.map((col) => String(row[col] ?? ''))),
      styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: {
        0: { cellWidth: 90 },
        3: { cellWidth: 80 },
        4: { cellWidth: 120 },
        13: { cellWidth: 110 },
      },
      margin: { left: 20, right: 20 },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      },
    });

    doc.save(`tests-errors-${exportType}-wise-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Weak areas by subject
  const weakAreasBySubject = tests.reduce((acc, test) => {
    test.errors?.forEach(err => {
      if (!acc[err.subject]) acc[err.subject] = {};
      if (!acc[err.subject][err.topic]) acc[err.subject][err.topic] = { total: 0, silly: 0, conceptual: 0, readError: 0, time: 0 };
      
      const counts = err.counts || { conceptual: 0, silly: 0, readError: 0, time: 0 };
      const errTotal = counts.conceptual + counts.silly + counts.readError + counts.time;
      
      acc[err.subject][err.topic].total += errTotal;
      acc[err.subject][err.topic].silly += counts.silly;
      acc[err.subject][err.topic].conceptual += counts.conceptual;
      acc[err.subject][err.topic].readError += counts.readError;
      acc[err.subject][err.topic].time += counts.time;
    });
    return acc;
  }, {});

  // Suggestion Engine for Heatmap
  const getSuggestion = (topicStats) => {
    const { silly, conceptual, readError, time } = topicStats;
    const max = Math.max(silly, conceptual, readError, time);
    if (max === 0) return 'No issues logged';
    if (max === conceptual) return 'Concept Revision';
    if (max === silly) return 'Accuracy Practice';
    if (max === readError) return 'Careful Reading';
    if (max === time) return 'Speed Practice';
    return 'Needs Review';
  };

  // Master Error Feed
  const allErrors = tests.flatMap(t => t.errors.map(e => ({ ...e, testId: t.id, testDate: t.date, testName: t.name })));
  const sortedErrors = allErrors.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'unsolved' ? -1 : 1;
    return new Date(b.testDate) - new Date(a.testDate);
  });

  // Calculate heatmap bg color intensity
  const getHeatmapColor = (count) => {
    if (count >= 5) return 'bg-red-500/30 text-red-500';
    if (count >= 3) return 'bg-orange-500/20 text-orange-500';
    if (count >= 2) return 'bg-yellow-500/20 text-yellow-500';
    return 'bg-blue-500/10 text-blue-400';
  };

  return (
    <div className="space-y-6">

      {/* Header with Log Test button */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          value={exportType}
          onChange={(e) => setExportType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0a0f1e]/60 text-slate-800 dark:text-white text-sm font-semibold outline-none"
        >
          <option value="topic">Topic-wise</option>
          <option value="subject">Subject-wise</option>
          <option value="mock">Mock-wise</option>
        </select>
        <button onClick={handleDownloadExcel} disabled={exportableTests.length === 0} className="px-3 py-2 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/20">
          <FileSpreadsheet size={16} /> Excel
        </button>
        <button onClick={handleDownloadPdf} disabled={exportableTests.length === 0} className="px-3 py-2 rounded-lg bg-violet-500 text-white font-bold hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg shadow-violet-500/20">
          <FileText size={16} /> PDF
        </button>
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/30">
          <Plus size={16} />Log Test
        </button>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Lightbulb size={20} className="text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-blue-400 mb-2">📚 Study Tips for Test Performance</h3>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <li>• Log tests immediately after completion for accurate error analysis</li>
            <li>• Categorize errors: Silly mistakes can be avoided, Conceptual need revision</li>
            <li>• Focus on weak areas shown below - these topics need targeted revision</li>
            <li>• Track your trend - consistent improvement matters more than single scores</li>
          </ul>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Award size={20} className="text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{totalTests}</div>
              <div className="text-xs text-slate-500 font-medium">Tests Taken</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{avgScore}%</div>
              <div className="text-xs text-slate-500 font-medium">Average Score</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <AlertCircle size={20} className="text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">{sortedErrors.filter(e => e.status === 'unsolved').length}</div>
              <div className="text-xs text-slate-500 font-medium">Unsolved Errors</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 shadow-sm dark:shadow-none">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">Score Trend</h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Test History */}
        <div className="lg:col-span-2 space-y-6">
          
          {topicTests.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">📝 Topic-wise Tests</h2>
              {topicTests.map((test, i) => (
                <TestCard key={test.id} test={test} onEdit={openEditModal} onDelete={deleteTest} onError={openErrorModal} delay={i * 50} />
              ))}
            </div>
          )}

          {subjectTests.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">📚 Subject-wise Tests</h2>
              {subjectTests.map((test, i) => (
                <TestCard key={test.id} test={test} onEdit={openEditModal} onDelete={deleteTest} onError={openErrorModal} delay={i * 50} />
              ))}
            </div>
          )}

          {mockTests.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">🎯 Full Mock Tests</h2>
              {mockTests.map((test, i) => (
                <TestCard key={test.id} test={test} onEdit={openEditModal} onDelete={deleteTest} onError={openErrorModal} delay={i * 50} />
              ))}
            </div>
          )}

          {tests.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.05] rounded-xl">
              <Target size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-medium text-slate-500">No tests logged yet</p>
            </div>
          )}
        </div>

        {/* Weak Areas by Subject */}
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">⚠️ Weak Areas Heatmap</h2>
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-3 shadow-sm dark:shadow-none">
            {Object.keys(weakAreasBySubject).length > 0 ? (
              Object.entries(weakAreasBySubject)
                // Sort subjects by total errors
                .sort((a, b) => Object.values(b[1]).reduce((sum, item) => sum + item.total, 0) - Object.values(a[1]).reduce((sum, item) => sum + item.total, 0))
                .map(([subject, topics]) => {
                  const totalErrs = Object.values(topics).reduce((sum, item) => sum + item.total, 0);
                  return (
                    <div key={subject}>
                      <button onClick={() => setExpandedSubject(expandedSubject === subject ? null : subject)} className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{subject}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${getHeatmapColor(totalErrs)}`}>{totalErrs} Errs</span>
                          {expandedSubject === subject ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                        </div>
                      </button>
                      {expandedSubject === subject && (
                        <div className="ml-2 mt-2 space-y-2 border-l-2 border-slate-100 dark:border-white/5 pl-2">
                          {Object.entries(topics).sort((a, b) => b[1].total - a[1].total).map(([topic, stats]) => (
                            <div key={topic} className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02]">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{topic}</span>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getHeatmapColor(stats.total)}`}>{stats.total} Errs</span>
                              </div>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Suggestion: {getSuggestion(stats)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No error data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MASTER ERROR BOOK FEED */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
        <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
          <BookOpen className="text-blue-500" /> Master Error Book
        </h2>
        
        {sortedErrors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedErrors.map(error => (
              <div key={`${error.testId}-${error.id}`} className={`relative p-5 rounded-2xl border transition-all ${error.status === 'cleared' ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] opacity-70' : 'bg-white dark:bg-[#0a0f1e]/60 border-slate-200 dark:border-white/[0.1] shadow-sm'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                       {error.counts?.conceptual > 0 && <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Concept: {error.counts.conceptual}</span>}
                       {error.counts?.silly > 0 && <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">Silly: {error.counts.silly}</span>}
                       {error.counts?.readError > 0 && <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">Read: {error.counts.readError}</span>}
                       {error.counts?.time > 0 && <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">Time: {error.counts.time}</span>}
                    </div>
                    <h4 className={`font-bold ${error.status === 'cleared' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{error.topic}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{error.subject}</p>
                    {error.extraInfo && <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 p-2 bg-slate-50 dark:bg-white/5 rounded border border-slate-200 dark:border-white/10 italic">"{error.extraInfo}"</p>}
                  </div>
                  <button onClick={() => toggleErrorStatus(error.testId, error.id)} className={`p-1.5 rounded-full border transition-colors ${error.status === 'cleared' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 hover:text-emerald-500 hover:border-emerald-500'}`}>
                    <CheckCircle2 size={16} />
                  </button>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{error.testName}</span>
                  <span>{error.testDate}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.05] rounded-xl">
            <BookOpen size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-medium text-slate-500">Your error book is empty. Log test mistakes to build your revision feed.</p>
          </div>
        )}
      </div>

      {/* Add Test Modal */}
      {showAddModal && (
        <AddTestModal 
          subjects={subjects}
          testType={testType}
          setTestType={setTestType}
          selectedSubjects={selectedSubjects}
          toggleSubject={toggleSubject}
          selectedTopics={selectedTopics}
          toggleTopic={toggleTopic}
          onSubmit={addTest}
          onClose={() => { setShowAddModal(false); resetAddForm(); }}
        />
      )}

      {/* Edit Test Modal */}
      {showEditModal && selectedTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-[#0f1629] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Test Marks</h3>
            <form onSubmit={handleUpdateTest}>
              <div className="space-y-3">
                <input name="score" type="number" step="0.01" defaultValue={selectedTest.score} placeholder="Score" required className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50" />
                <input name="total" type="number" step="0.01" defaultValue={selectedTest.total} placeholder="Total" required className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500/50" />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 px-4 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.1] hover:bg-slate-200 dark:hover:bg-white/[0.08] font-medium transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Logging Modal (Input System) */}
      {showErrorModal && selectedTest && (
        <ErrorLogModal 
          subjects={subjects}
          test={selectedTest}
          onClose={() => { setShowErrorModal(false); setSelectedTest(null); }}
          onSubmit={handleAddError}
        />
      )}
    </div>
  );
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

const ErrorLogModal = ({ test, subjects, onClose, onSubmit }) => {
  // Use either the selected specific subjects, or all if it's a full mock
  const applicableSubjects = test.subjects.includes('Full Syllabus') ? subjects : test.subjects;
  const [selectedSub, setSelectedSub] = useState(applicableSubjects[0] || '');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#0f1629] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 pb-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} /> Log Mistake
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">For test: <span className="text-blue-500">{test.name}</span></p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          {test.subjects.includes('Full Syllabus') ? (
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] p-3 rounded-xl mb-4 text-sm flex gap-2 items-center text-slate-700 dark:text-slate-300">
              <span className="font-bold">Mock Log:</span> Subject is set to Full Syllabus and Topic is set to General.
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] p-3 rounded-xl mb-4 text-sm flex gap-2 items-center text-slate-700 dark:text-slate-300">
              <span className="font-bold">Inherited Subject & Topic:</span> {test.subjects[0]} &mdash; {test.topics[test.subjects[0]] ? test.topics[test.subjects[0]][0] : 'General'}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Mistakes Count By Type</label>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg">
                <span className="text-xs font-bold text-red-500">Conceptual</span>
                <input type="number" name="conceptual" defaultValue={0} min={0} className="w-16 px-2 py-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded text-center outline-none focus:border-red-500 text-sm font-bold text-slate-900 dark:text-white" />
              </div>
              <div className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg">
                <span className="text-xs font-bold text-orange-500">Silly</span>
                <input type="number" name="silly" defaultValue={0} min={0} className="w-16 px-2 py-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded text-center outline-none focus:border-orange-500 text-sm font-bold text-slate-900 dark:text-white" />
              </div>
              <div className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg">
                <span className="text-xs font-bold text-yellow-500">Read-Error</span>
                <input type="number" name="readError" defaultValue={0} min={0} className="w-16 px-2 py-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded text-center outline-none focus:border-yellow-500 text-sm font-bold text-slate-900 dark:text-white" />
              </div>
              <div className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg">
                <span className="text-xs font-bold text-blue-500">Time</span>
                <input type="number" name="time" defaultValue={0} min={0} className="w-16 px-2 py-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded text-center outline-none focus:border-blue-500 text-sm font-bold text-slate-900 dark:text-white" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              <span className="font-bold text-red-400">Conceptual:</span> Didn't know it. <span className="font-bold text-orange-400">Silly:</span> Knew it, messed up. <span className="font-bold text-yellow-500">Read-Error:</span> Misread. <span className="font-bold text-blue-400">Time:</span> Panicked/Rushed.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Extra Notes / Observations</label>
            <textarea name="extraInfo" rows="2" placeholder="Was it a tricky wording? Fatigue?" className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition-colors custom-scrollbar resize-none"></textarea>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] text-sm font-bold uppercase transition-all">Cancel</button>
            <button type="submit" className="flex-[2] py-3 px-4 rounded-xl bg-red-500 text-white text-sm font-bold uppercase tracking-wider hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all">Add to Error Book</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TestCard = ({ test, onEdit, onDelete, onError, delay }) => {
  const percentage = Math.round((test.score / test.total) * 100);
  const errorCount = test.errors?.length || 0;
  
  return (
    <div className="group bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 hover:border-slate-300 dark:hover:border-white/[0.09] transition-all duration-200 mb-3 shadow-sm dark:shadow-none animate-fade-in-up" style={{ animationFillMode: 'both', animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{test.name}</h3>
            {errorCount > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold">{errorCount} Errors</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>{test.date}</span>
            <span>•</span>
            <span>{test.duration} min</span>
            <span>•</span>
            <span className="text-blue-500">{test.subjects.join(', ')}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onError(test)} className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold" title="Log Mistake">
            <AlertCircle size={14} /> Log Error
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
          <button onClick={() => onEdit(test)} className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 p-1.5 rounded-lg transition-colors" title="Edit Score"><Edit2 size={14} /></button>
          <button onClick={() => onDelete(test.id)} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors" title="Delete Test"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Score</span>
            <span className={`font-black ${percentage >= 70 ? 'text-emerald-500' : percentage >= 50 ? 'text-orange-400' : 'text-red-500'}`}>
              {test.score}/{test.total} ({percentage}%)
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${percentage >= 70 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Test Modal Component
const AddTestModal = ({ subjects, testType, setTestType, selectedSubjects, toggleSubject, selectedTopics, toggleTopic, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#0f1629] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 pb-4 border-b border-slate-100 dark:border-white/10">Log Test</h3>
        <form onSubmit={onSubmit}>
          {/* Test Type Selection */}
          <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Test Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['topic', 'subject', 'mock'].map(type => (
                <button key={type} type="button" onClick={() => setTestType(type)} className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${testType === type ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 hover:bg-slate-200 dark:hover:bg-white/[0.08]'}`}>
                  {type === 'topic' ? 'Topic-wise' : type === 'subject' ? 'Subject-wise' : 'Full Mock'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Test Name</label>
            <input name="name" type="text" placeholder="e.g., MadeEasy Mock 1..." required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" />
          </div>

          {/* Subject Selection */}
          {testType !== 'mock' && (
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Select Subjects</label>
              <div className="grid grid-cols-2 gap-2">
                {subjects.map(subject => (
                  <label key={subject} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] hover:border-blue-500/30 cursor-pointer transition-colors">
                    <input type="checkbox" checked={selectedSubjects.includes(subject)} onChange={() => toggleSubject(subject)} className="w-4 h-4 accent-blue-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{subject}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Topic Selection */}
          {testType === 'topic' && selectedSubjects.map(subject => (
            <div key={subject} className="mb-6 border border-slate-200 dark:border-white/[0.05] rounded-xl p-4 bg-slate-50/50 dark:bg-white/[0.01]">
              <label className="text-xs font-black text-blue-500 uppercase tracking-wider mb-3 block">{subject} Topics</label>
              <div className="grid grid-cols-2 gap-2">
                {(plannerService.getTopics(subject) || []).map(topic => (
                  <label key={topic} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] cursor-pointer">
                    <input type="checkbox" checked={selectedTopics[subject]?.includes(topic)} onChange={() => toggleTopic(subject, topic)} className="w-4 h-4 accent-blue-500" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{topic}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Score & Duration */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">My Score</label>
              <input name="score" type="number" step="0.01" placeholder="e.g. 45" required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Total</label>
              <input name="total" type="number" step="0.01" placeholder="e.g. 100" required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Duration (m)</label>
              <input name="duration" type="number" placeholder="e.g. 180" required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-white/10">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all">Cancel</button>
            <button type="submit" className="flex-[2] py-3 px-4 rounded-xl bg-blue-500 text-white font-bold uppercase tracking-wider hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all">Save Test</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestsPage;
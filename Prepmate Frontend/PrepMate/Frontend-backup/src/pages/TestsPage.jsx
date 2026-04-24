import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, AlertCircle, Award, Target, X, Edit2, Trash2, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getTests, createTest as createTestApi, updateTest as updateTestApi, deleteTest as deleteTestApi, getSubjectsByExamNameAndStreamName, getSubjectsByStreamName, getTopics } from '../services/api';

const TestsPage = () => {
  const { dbUser } = useAuth();
  const [SUBJECTS, setSUBJECTS] = useState([]);
  const [TOPICS_BY_SUBJECT, setTOPICS_BY_SUBJECT] = useState({});

  const [tests, setTests] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  
  // Add test form state
  const [testType, setTestType] = useState('topic');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState({});

  // Fetch subjects and topics from backend
  useEffect(() => {
    const fetchStaticData = async () => {
      if (!dbUser?.stream) return;
      try {
        let subjectsRes;
        // Try fetching with exam+stream first
        if (dbUser.exam && dbUser.stream) {
          try {
            subjectsRes = await getSubjectsByExamNameAndStreamName(dbUser.exam, dbUser.stream);
          } catch (error) {
            console.warn('Error fetching subjects by exam+stream, falling back to stream only:', error);
            subjectsRes = await getSubjectsByStreamName(dbUser.stream);
          }
        } else {
          subjectsRes = await getSubjectsByStreamName(dbUser.stream);
        }
        
        const subjectsList = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];
        const subjectNames = subjectsList.map(s => s.name || s);
        setSUBJECTS(subjectNames);

        // Fetch topics for each subject
        const topicsMap = {};
        for (const subj of subjectsList) {
          const subjId = subj.id || subj;
          try {
            const topicsRes = await getTopics(subjId);
            topicsMap[subj.name || subj] = Array.isArray(topicsRes.data) ? topicsRes.data.map(t => t.name || t) : [];
          } catch (e) {
            topicsMap[subj.name || subj] = [];
          }
        }
        setTOPICS_BY_SUBJECT(topicsMap);
      } catch (error) {
        console.error('Error fetching subjects/topics:', error);
      }
    };
    fetchStaticData();
  }, [dbUser?.exam, dbUser?.stream]);

  // Load tests from backend
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchTests = async () => {
      try {
        const res = await getTests(dbUser.id);
        setTests(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error fetching tests:', error);
      }
    };
    fetchTests();
  }, [dbUser?.id]);

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

  const addTest = async (e) => {
    e.preventDefault();
    if (!dbUser?.id) return;
    const formData = new FormData(e.target);
    
    const newTest = {
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
    
    try {
      const res = await createTestApi(dbUser.id, newTest);
      setTests(prev => [res.data, ...prev]);
    } catch (error) {
      console.error('Error creating test:', error);
    }
    setShowAddModal(false);
    resetAddForm();
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

  const updateTest = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedData = {
      ...selectedTest,
      score: parseFloat(formData.get('score')),
      total: parseFloat(formData.get('total')),
    };
    try {
      const res = await updateTestApi(selectedTest.id, updatedData);
      setTests(prev => prev.map(t => t.id === selectedTest.id ? res.data : t));
    } catch (error) {
      console.error('Error updating test:', error);
    }
    setShowEditModal(false);
    setSelectedTest(null);
  };

  const deleteTest = async (id) => {
    try {
      await deleteTestApi(id);
      setTests(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const openErrorModal = (test) => {
    setSelectedTest(test);
    setShowErrorModal(true);
  };

  // Organize tests by type
  const topicTests = tests.filter(t => t.type === 'topic');
  const subjectTests = tests.filter(t => t.type === 'subject');
  const mockTests = tests.filter(t => t.type === 'mock');

  // Stats
  const totalTests = tests.length;
  const avgScore = tests.length > 0 ? (tests.reduce((sum, t) => sum + (t.score / t.total * 100), 0) / tests.length).toFixed(1) : 0;

  // Weak areas by subject
  const weakAreasBySubject = tests.reduce((acc, test) => {
    test.errors?.forEach(err => {
      if (!acc[err.subject]) acc[err.subject] = {};
      if (!acc[err.subject][err.topic]) acc[err.subject][err.topic] = 0;
      acc[err.subject][err.topic] += err.questions;
    });
    return acc;
  }, {});

  return (
    <div className="space-y-6">

      {/* Header with Log Test button */}
      <div className="flex items-center justify-end">
        <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/30">
          <Plus size={16} />Log Test
        </button>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
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
              <div className="text-2xl font-black text-slate-900 dark:text-white">{Object.keys(weakAreasBySubject).length}</div>
              <div className="text-xs text-slate-500 font-medium">Subjects Need Focus</div>
            </div>
          </div>
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
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">🎯 Mock & Multisubject Tests</h2>
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
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">⚠️ Weak Areas</h2>
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 space-y-3 shadow-sm dark:shadow-none">
            {Object.keys(weakAreasBySubject).length > 0 ? (
              Object.entries(weakAreasBySubject).map(([subject, topics]) => (
                <div key={subject}>
                  <button onClick={() => setExpandedSubject(expandedSubject === subject ? null : subject)} className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                    <span className="text-sm font-bold text-red-400">{subject}</span>
                    {expandedSubject === subject ? <ChevronDown size={16} className="text-red-400" /> : <ChevronRight size={16} className="text-red-400" />}
                  </button>
                  {expandedSubject === subject && (
                    <div className="ml-4 mt-2 space-y-1">
                      {Object.entries(topics).sort((a, b) => b[1] - a[1]).map(([topic, count]) => (
                        <div key={topic} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02]">
                          <span className="text-xs text-slate-600 dark:text-slate-300">{topic}</span>
                          <span className="text-xs font-bold text-red-400">{count} errors</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No error data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Test Modal */}
      {showAddModal && (
        <AddTestModal 
          subjects={SUBJECTS}
          topicsBySubject={TOPICS_BY_SUBJECT}
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
            <form onSubmit={updateTest}>
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
    </div>
  );
};

// TestCard Component
const TestCard = ({ test, onEdit, onDelete, onError, delay }) => {
  const percentage = Math.round((test.score / test.total) * 100);
  
  return (
    <div className="group bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 hover:border-slate-300 dark:hover:border-white/[0.09] transition-all duration-200 mb-3 shadow-sm dark:shadow-none" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{test.name}</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{test.date}</span>
            <span>•</span>
            <span>{test.duration} min</span>
            <span>•</span>
            <span className="text-blue-400">{test.subjects.join(', ')}</span>
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(test)} className="text-blue-400 hover:text-blue-300 p-1"><Edit2 size={14} /></button>
          <button onClick={() => onError(test)} className="text-orange-400 hover:text-orange-300 p-1"><AlertCircle size={14} /></button>
          <button onClick={() => onDelete(test.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">Score</span>
            <span className={`font-bold ${percentage >= 70 ? 'text-emerald-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {test.score}/{test.total} ({percentage}%)
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${percentage >= 70 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Test Modal Component
const AddTestModal = ({ subjects, topicsBySubject, testType, setTestType, selectedSubjects, toggleSubject, selectedTopics, toggleTopic, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#0f1629] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Log Test</h3>
        <form onSubmit={onSubmit}>
          {/* Test Type Selection */}
          <div className="mb-4">
            <label className="text-xs text-slate-500 font-medium mb-2 block">Test Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['topic', 'subject', 'mock'].map(type => (
                <button key={type} type="button" onClick={() => setTestType(type)} className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all ${testType === type ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08]'}`}>
                  {type === 'topic' ? 'Topic-wise' : type === 'subject' ? 'Subject-wise' : 'Mock/Multi'}
                </button>
              ))}
            </div>
          </div>

          {/* Test Name */}
          <input name="name" type="text" placeholder="Test name..." required className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none mb-3" />

          {/* Subject Selection */}
          {testType !== 'mock' && (
            <div className="mb-4">
              <label className="text-xs text-slate-500 font-medium mb-2 block">Select Subjects</label>
              <div className="grid grid-cols-2 gap-2">
                {subjects && subjects.map(subject => (
                  <label key={subject} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] cursor-pointer">
                    <input type="checkbox" checked={selectedSubjects.includes(subject)} onChange={() => toggleSubject(subject)} className="w-4 h-4" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{subject}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Topic Selection */}
          {testType === 'topic' && selectedSubjects.map(subject => (
            <div key={subject} className="mb-4 border border-slate-200 dark:border-white/[0.05] rounded-lg p-3">
              <label className="text-xs font-bold text-blue-400 mb-2 block">{subject} Topics</label>
              <div className="grid grid-cols-2 gap-2">
                {(topicsBySubject && topicsBySubject[subject] || []).map(topic => {
                  const topicName = typeof topic === 'string' ? topic : topic.name;
                  const topicKey = typeof topic === 'string' ? topic : topic.id || topic.name;
                  return (
                    <label key={topicKey} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] cursor-pointer">
                      <input type="checkbox" checked={selectedTopics[subject]?.includes(topicName)} onChange={() => toggleTopic(subject, topicName)} className="w-4 h-4" />
                      <span className="text-xs text-slate-600 dark:text-slate-300">{topicName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Score & Duration */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input name="score" type="number" step="0.01" placeholder="Score" required className="px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none" />
            <input name="total" type="number" step="0.01" placeholder="Total" required className="px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none" />
            <input name="duration" type="number" placeholder="Minutes" required className="px-4 py-3 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 outline-none" />
          </div>

          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-4 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.1] hover:bg-slate-200 dark:hover:bg-white/[0.08] font-medium">Cancel</button>
            <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600">Log Test</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestsPage;
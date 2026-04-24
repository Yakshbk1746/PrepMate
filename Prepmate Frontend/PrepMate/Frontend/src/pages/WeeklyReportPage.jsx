import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/authContext';
import { getTimerSessions, getTests, getReflections } from '../services/api';

const WeeklyReportPage = () => {
  const { backendUserId } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [tests, setTests] = useState([]);
  const [reflections, setReflections] = useState([]);

  useEffect(() => {
    if (!backendUserId) return;

    Promise.all([
      getTimerSessions(backendUserId),
      getTests(backendUserId),
      getReflections(backendUserId),
    ])
      .then(([sessionData, testData, reflectionData]) => {
        setSessions(Array.isArray(sessionData) ? sessionData : []);
        setTests(Array.isArray(testData) ? testData : []);
        setReflections(Array.isArray(reflectionData) ? reflectionData : []);
      })
      .catch(console.error);
  }, [backendUserId]);

  const weekSummary = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(today.getDate() - 6);

    const weeklySessions = sessions.filter((item) => {
      const date = new Date(item.date || item.createdAt || 0);
      return date >= weekStart;
    });

    const totalMinutes = weeklySessions.reduce((sum, item) => sum + Math.round((Number(item.duration) || 0) / 60), 0);
    const bySubject = weeklySessions.reduce((acc, item) => {
      const subject = item.subject || 'General';
      acc[subject] = (acc[subject] || 0) + Math.round((Number(item.duration) || 0) / 60);
      return acc;
    }, {});

    const topSubject = Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const weeklyTests = tests.filter((item) => {
      const date = new Date(item.date || 0);
      return date >= weekStart;
    });

    const avgScore = weeklyTests.length
      ? (
          weeklyTests.reduce((sum, item) => {
            const total = Number(item.total) || 100;
            return sum + ((Number(item.score) || 0) / Math.max(total, 1)) * 100;
          }, 0) / weeklyTests.length
        ).toFixed(1)
      : '0.0';

    const weeklyReflections = reflections.filter((item) => {
      const date = new Date(item.date || 0);
      return date >= weekStart;
    });

    const avgEnergy = weeklyReflections.length
      ? (
          weeklyReflections.reduce((sum, item) => sum + (Number(item.energyLevel) || 0), 0) / weeklyReflections.length
        ).toFixed(1)
      : '0.0';

    return {
      totalMinutes,
      topSubject,
      testsTaken: weeklyTests.length,
      avgScore,
      reflectionsLogged: weeklyReflections.length,
      avgEnergy,
    };
  }, [sessions, tests, reflections]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6">
        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Weekly Report</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">A quick snapshot of your last 7 days.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Study Time</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{Math.floor(weekSummary.totalMinutes / 60)}h {weekSummary.totalMinutes % 60}m</p>
          <p className="text-xs text-slate-500 mt-1">Top subject: {weekSummary.topSubject}</p>
        </div>

        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Tests</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{weekSummary.testsTaken}</p>
          <p className="text-xs text-slate-500 mt-1">Average score: {weekSummary.avgScore}%</p>
        </div>

        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Reflection</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{weekSummary.reflectionsLogged}</p>
          <p className="text-xs text-slate-500 mt-1">Average energy: {weekSummary.avgEnergy}/5</p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReportPage;

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Clock, BookOpen, Target, Calendar, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/authContext';
import { getDashboardStats, getTimerSessions, getTests } from '../services/api';

// ── Weekly Data ────────────────────────────────────────────────────────────
const weeklyTestScores = [
  { name: 'Mon', score: 45 },
  { name: 'Tue', score: 52 },
  { name: 'Wed', score: 48 },
  { name: 'Thu', score: 61 },
  { name: 'Fri', score: 58 },
  { name: 'Sat', score: 72 },
  { name: 'Sun', score: 68 },
];

const weeklyStudyHours = [
  { subject: 'Algorithms', hours: 8, target: 10, color: '#3b82f6' },
  { subject: 'OS', hours: 5, target: 6, color: '#10b981' },
  { subject: 'DBMS', hours: 7, target: 6, color: '#8b5cf6' },
  { subject: 'Networks', hours: 3, target: 5, color: '#f59e0b' },
];

const weeklyFocusData = [
  { day: 'Mon', focus: 75, breaks: 25 },
  { day: 'Tue', focus: 80, breaks: 20 },
  { day: 'Wed', focus: 65, breaks: 35 },
  { day: 'Thu', focus: 90, breaks: 10 },
  { day: 'Fri', focus: 85, breaks: 15 },
  { day: 'Sat', focus: 60, breaks: 40 },
  { day: 'Sun', focus: 70, breaks: 30 },
];

// ── Monthly Data ──────────────────────────────────────────────────────────
const monthlyTestScores = [
  { name: 'Week 1', score: 48 },
  { name: 'Week 2', score: 55 },
  { name: 'Week 3', score: 62 },
  { name: 'Week 4', score: 70 },
];

const monthlyStudyHours = [
  { subject: 'Algorithms', hours: 32, target: 40, color: '#3b82f6' },
  { subject: 'OS', hours: 18, target: 24, color: '#10b981' },
  { subject: 'DBMS', hours: 28, target: 24, color: '#8b5cf6' },
  { subject: 'Networks', hours: 12, target: 20, color: '#f59e0b' },
  { subject: 'Aptitude', hours: 10, target: 16, color: '#ef4444' },
];

// ── Overall Data ──────────────────────────────────────────────────────────
const overallTestScores = [
  { name: 'Test 1', score: 45 },
  { name: 'Test 2', score: 52 },
  { name: 'Test 3', score: 48 },
  { name: 'Test 4', score: 61 },
  { name: 'Test 5', score: 58 },
  { name: 'Test 6', score: 72 },
];

const overallStudyHours = [
  { subject: 'Algorithms', hours: 120, color: '#3b82f6' },
  { subject: 'OS', hours: 65, color: '#10b981' },
  { subject: 'DBMS', hours: 90, color: '#8b5cf6' },
  { subject: 'Networks', hours: 50, color: '#f59e0b' },
  { subject: 'Aptitude', hours: 35, color: '#ef4444' },
];

const timeDistribution = [
  { name: 'Video Lectures', value: 40, color: '#3b82f6' },
  { name: 'Self Study', value: 35, color: '#8b5cf6' },
  { name: 'Mock Tests', value: 15, color: '#10b981' },
  { name: 'Revision', value: 10, color: '#f59e0b' },
];

// ── Heatmap Data ──────────────────────────────────────────────────────────
const generateHeatmapData = () => {
  const data = [];
  const today = new Date();
  for (let i = 90; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const level = Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0; 
    data.push({ date: date.toISOString().split('T')[0], level });
  }
  return data;
};

const heatmapData = generateHeatmapData();

// ── Tab-specific summary cards ────────────────────────────────────────────
const TAB_METRICS = {
  weekly: [
    { title: 'Study Time', value: '28h 15m', sub: 'Target: 30h', icon: Clock, trend: '+3.2%' },
    { title: 'Tasks Done', value: '32/38', sub: '84% completion', icon: CheckCircle2, trend: '+5%' },
    { title: 'Avg Score', value: '57.1%', sub: '7 tests this week', icon: Target, trend: '+2.4%' },
    { title: 'Focus Rate', value: '75%', sub: 'vs 70% last week', icon: Zap, trend: '+5%' },
  ],
  monthly: [
    { title: 'Study Time', value: '112h', sub: 'Target: 120h', icon: Clock, trend: '+8%' },
    { title: 'Tasks Done', value: '145/160', sub: '91% completion', icon: CheckCircle2, trend: '+12%' },
    { title: 'Avg Score', value: '58.8%', sub: '12 tests this month', icon: Target, trend: '+3.5%' },
    { title: 'Distraction', value: '18h', sub: '↓ from 24h', icon: AlertCircle, trend: '-25%' },
  ],
  overall: [
    { title: 'Total Study', value: '248h', sub: 'Since Jan 2026', icon: Clock, trend: '+12%' },
    { title: 'Tests Taken', value: '42', sub: 'Avg: 64.5%', icon: Target, trend: '+5%' },
    { title: 'Strongest', value: 'Algorithms', sub: 'Top 10% among peers', icon: BookOpen, trend: '' },
    { title: 'Streak', value: '14 Days', sub: 'Longest: 45 days', icon: Zap, trend: '' },
  ],
};

const AnalyticsPage = () => {
  const { theme } = useTheme();
  const { backendUserId } = useAuth();
  const [activeTab, setActiveTab] = useState('weekly');
  const [weeklyScoresData, setWeeklyScoresData] = useState(weeklyTestScores);
  const [monthlyScoresData, setMonthlyScoresData] = useState(monthlyTestScores);
  const [overallScoresData, setOverallScoresData] = useState(overallTestScores);
  const [weeklyHoursData, setWeeklyHoursData] = useState(weeklyStudyHours);
  const [monthlyHoursData, setMonthlyHoursData] = useState(monthlyStudyHours);
  const [overallHoursData, setOverallHoursData] = useState(overallStudyHours);
  const [metricsByTab, setMetricsByTab] = useState(TAB_METRICS);
  const [currentStreak, setCurrentStreak] = useState(12);
  const [longestStreak, setLongestStreak] = useState(45);
  const [focusDataState, setFocusDataState] = useState(weeklyFocusData);
  const [timeDistributionData, setTimeDistributionData] = useState(timeDistribution);
  const [heatmapDataState, setHeatmapDataState] = useState(heatmapData);

  useEffect(() => {
    if (!backendUserId) return;

    const toDate = (value) => {
      const date = value ? new Date(value) : new Date();
      return Number.isNaN(date.getTime()) ? new Date() : date;
    };

    const formatDay = (date) =>
      date.toLocaleDateString('en-US', { weekday: 'short' });

    const daysAgo = (n) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - n);
      return date;
    };

    const weekStartDate = daysAgo(6);
    const monthStartDate = new Date();
    monthStartDate.setHours(0, 0, 0, 0);
    monthStartDate.setDate(1);

    Promise.all([
      getDashboardStats(backendUserId),
      getTimerSessions(backendUserId),
      getTests(backendUserId),
    ])
      .then(([stats, sessions, tests]) => {
        const safeSessions = Array.isArray(sessions) ? sessions : [];
        const safeTests = Array.isArray(tests) ? tests : [];

        const rollupSubjectHours = (fromDate) => {
          const grouped = {};
          safeSessions.forEach((session) => {
            const subject = session.subject || 'General';
            const sessionDate = toDate(session.date);
            if (fromDate && sessionDate < fromDate) return;
            grouped[subject] = (grouped[subject] || 0) + (Number(session.duration) || 0) / 3600;
          });

          return Object.entries(grouped).map(([subject, hours], index) => ({
            subject,
            hours: Number(hours.toFixed(1)),
            target: Math.max(1, Math.ceil(hours)),
            color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'][index % 6],
          }));
        };

        const weeklyHours = rollupSubjectHours(weekStartDate);
        const monthlyHours = rollupSubjectHours(monthStartDate);
        const overallHours = rollupSubjectHours(null);

        if (weeklyHours.length > 0) setWeeklyHoursData(weeklyHours);
        if (monthlyHours.length > 0) setMonthlyHoursData(monthlyHours);
        if (overallHours.length > 0) setOverallHoursData(overallHours);

        const mappedTests = safeTests.map((test, index) => ({
          name: test.name || `Test ${index + 1}`,
          score: Number(test.score) || 0,
          total: Number(test.total) || 100,
          date: test.date,
        }));

        if (mappedTests.length > 0) {
          const weeklyTests = mappedTests
            .filter((test) => toDate(test.date) >= weekStartDate)
            .map((test) => ({
              name: formatDay(toDate(test.date)),
              score: test.total > 0 ? Number(((test.score / test.total) * 100).toFixed(1)) : 0,
              total: test.total,
            }));

          const monthlyTests = mappedTests
            .filter((test) => toDate(test.date) >= monthStartDate)
            .map((test, index) => ({
              name: `Week ${Math.min(4, Math.floor(index / 3) + 1)}`,
              score: test.total > 0 ? Number(((test.score / test.total) * 100).toFixed(1)) : 0,
              total: test.total,
            }));

          const overallTests = mappedTests.map((test) => ({
            name: test.name,
            score: test.total > 0 ? Number(((test.score / test.total) * 100).toFixed(1)) : 0,
            total: test.total,
          }));

          if (weeklyTests.length > 0) setWeeklyScoresData(weeklyTests);
          if (monthlyTests.length > 0) setMonthlyScoresData(monthlyTests);
          if (overallTests.length > 0) setOverallScoresData(overallTests);
        }

        const sessionsByDate = safeSessions.reduce((acc, session) => {
          const dateKey = toDate(session.date).toISOString().split('T')[0];
          const minutes = Math.max(0, Math.round((Number(session.duration) || 0) / 60));
          const type = String(session.type || session.label || '').toLowerCase();

          if (!acc[dateKey]) {
            acc[dateKey] = { focus: 0, breaks: 0, total: 0, byType: {} };
          }

          const isFocus = type.includes('pomodoro') || type.includes('focus') || type.includes('study');
          if (isFocus) {
            acc[dateKey].focus += minutes;
          } else {
            acc[dateKey].breaks += minutes;
          }
          acc[dateKey].total += minutes;

          const bucketName = session.label || session.type || 'Other';
          acc[dateKey].byType[bucketName] = (acc[dateKey].byType[bucketName] || 0) + minutes;
          return acc;
        }, {});

        const weeklyFocus = Array.from({ length: 7 }, (_, i) => {
          const dayDate = daysAgo(6 - i);
          const key = dayDate.toISOString().split('T')[0];
          const dayEntry = sessionsByDate[key] || { focus: 0, breaks: 0, total: 0 };
          const total = Math.max(1, dayEntry.focus + dayEntry.breaks);
          return {
            day: formatDay(dayDate),
            focus: Math.round((dayEntry.focus / total) * 100),
            breaks: Math.round((dayEntry.breaks / total) * 100),
          };
        });
        setFocusDataState(weeklyFocus);

        const typeAgg = {};
        safeSessions.forEach((session) => {
          const label = session.label || session.type || 'Other';
          const minutes = Math.max(0, Math.round((Number(session.duration) || 0) / 60));
          typeAgg[label] = (typeAgg[label] || 0) + minutes;
        });

        const totalTypeMinutes = Object.values(typeAgg).reduce((sum, n) => sum + n, 0);
        if (totalTypeMinutes > 0) {
          const palette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
          const pieData = Object.entries(typeAgg)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, minutes], index) => ({
              name,
              value: Math.round((minutes / totalTypeMinutes) * 100),
              color: palette[index % palette.length],
            }));
          setTimeDistributionData(pieData);
        }

        const today = new Date();
        const nextHeatmap = [];
        for (let i = 90; i >= 0; i -= 1) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const key = date.toISOString().split('T')[0];
          const minutes = sessionsByDate[key]?.focus || 0;
          nextHeatmap.push({ date: key, minutes });
        }

        const maxMinutes = Math.max(1, ...nextHeatmap.map((item) => item.minutes));
        setHeatmapDataState(
          nextHeatmap.map((item) => {
            const ratio = item.minutes / maxMinutes;
            const level = ratio === 0 ? 0 : ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;
            return { date: item.date, level };
          })
        );

        const current = Number(stats?.currentMaxStreak) || 0;
        const longest = Number(stats?.longestMaxStreak) || current;
        setCurrentStreak(current);
        setLongestStreak(longest);

        setMetricsByTab((prev) => ({
          ...prev,
          weekly: [
            {
              ...prev.weekly[0],
              value: `${Math.floor((Number(stats?.todayStudyMinutes) || 0) / 60)}h ${(Number(stats?.todayStudyMinutes) || 0) % 60}m`,
            },
            {
              ...prev.weekly[1],
              value: `${Number(stats?.todayCompletedTasks) || 0}/${Number(stats?.todayTotalTasks) || 0}`,
              sub: `${Number(stats?.todayTotalTasks) > 0 ? Math.round(((Number(stats?.todayCompletedTasks) || 0) / Number(stats?.todayTotalTasks)) * 100) : 0}% completion`,
            },
            {
              ...prev.weekly[2],
              value: `${Number(stats?.testStats?.averageScore || 0).toFixed(1)}%`,
              sub: `${Number(stats?.testStats?.testsCount || mappedTests.length || 0)} tests this week`,
            },
            {
              ...prev.weekly[3],
              value: `${100 - (Number(stats?.distractionStats?.todayDistractionPercent) || 0)}%`,
              sub: `Distraction ${(Number(stats?.distractionStats?.todayDistractionPercent) || 0).toFixed(0)}%`,
            },
          ],
          monthly: [
            {
              ...prev.monthly[0],
              value: `${Number(stats?.todayStudyMinutes) || 0}m`,
            },
            {
              ...prev.monthly[1],
              value: `${Number(stats?.todayCompletedTasks) || 0}/${Number(stats?.todayTotalTasks) || 0}`,
            },
            {
              ...prev.monthly[2],
              value: `${Number(stats?.testStats?.averageScore || 0).toFixed(1)}%`,
              sub: `${Number(stats?.testStats?.testsCount || mappedTests.length || 0)} tests this month`,
            },
            {
              ...prev.monthly[3],
              value: `${Number(stats?.distractionStats?.todayDistractionMinutes || 0)}m`,
              sub: 'Distraction today',
            },
          ],
          overall: [
            {
              ...prev.overall[0],
              value: `${Math.round(overallHours.reduce((sum, item) => sum + item.hours, 0))}h`,
            },
            {
              ...prev.overall[1],
              value: `${mappedTests.length}`,
              sub: `Avg: ${Number(stats?.testStats?.averageScore || 0).toFixed(1)}%`,
            },
            {
              ...prev.overall[2],
              value: [...overallHours].sort((a, b) => b.hours - a.hours)[0]?.subject || 'N/A',
              sub: 'Most studied subject',
            },
            {
              ...prev.overall[3],
              value: `${Number(stats?.currentMaxStreak) || 0} Days`,
              sub: `Active revisions: ${Number(stats?.activeRevisions) || 0}`,
            },
          ],
        }));
      })
      .catch(console.error);
  }, [backendUserId]);

  const getLevelColor = (level) => {
    switch(level) {
      case 1: return 'bg-emerald-200 dark:bg-emerald-900/40';
      case 2: return 'bg-emerald-300 dark:bg-emerald-700/60';
      case 3: return 'bg-emerald-400 dark:bg-emerald-500/80';
      case 4: return 'bg-emerald-500 dark:bg-emerald-400';
      default: return 'bg-slate-100 dark:bg-white/5';
    }
  };

  const chartAxisColor = theme === 'dark' ? '#ffffff50' : '#64748b';
  const chartGridColor = theme === 'dark' ? '#ffffff10' : '#e2e8f0';
  const chartTooltipBg = theme === 'dark' ? '#0a0f1e' : '#ffffff';
  const chartTooltipBorder = theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0';

  // Select data based on active tab
  const scores = activeTab === 'weekly' ? weeklyScoresData : activeTab === 'monthly' ? monthlyScoresData : overallScoresData;
  const studyHours = activeTab === 'weekly' ? weeklyHoursData : activeTab === 'monthly' ? monthlyHoursData : overallHoursData;
  const focusData = focusDataState;
  const metrics = metricsByTab[activeTab];

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">

        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-1 mb-6 w-fit shadow-sm">
          {[
            { key: 'weekly', label: 'Weekly' },
            { key: 'monthly', label: 'Monthly' },
            { key: 'overall', label: 'Overall' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <Icon size={14} /> {m.title}
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">{m.value}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500 font-medium">{m.sub}</span>
                  {m.trend && (
                    <span className={`text-xs font-bold ${m.trend.startsWith('-') ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {m.trend.startsWith('-') ? '↓' : '↑'} {m.trend}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Test Scores Trend */}
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 h-80 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6">Test Score Progression</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={scores}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="name" stroke={chartAxisColor} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis stroke={chartAxisColor} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartTooltipBorder, borderRadius: '8px' }} />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Distribution */}
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 h-80 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6">Hours per Subject</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={studyHours} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
                <XAxis type="number" stroke={chartAxisColor} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="subject" type="category" stroke={chartAxisColor} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartTooltipBorder, borderRadius: '8px' }} />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={24}>
                  {studyHours.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Focus vs Break (weekly only) / Time Distribution */}
          {activeTab === 'weekly' ? (
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 h-72 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Zap size={16} className="text-emerald-500" /> Daily Focus vs Break
              </h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={focusData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                  <XAxis dataKey="day" stroke={chartAxisColor} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis stroke={chartAxisColor} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartTooltipBorder, borderRadius: '8px' }} />
                  <Bar dataKey="focus" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={28} />
                  <Bar dataKey="breaks" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 text-xs font-bold text-slate-500 uppercase tracking-wider -mt-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500"></div>Focus</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-amber-500"></div>Breaks</div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 h-72 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">Study Method Mix</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeDistributionData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {timeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartTooltipBorder, borderRadius: '8px', border: 'none' }} itemStyle={{ color: theme === 'dark' ? '#fff' : '#0f172a' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: chartAxisColor }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Consistency Heatmap */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2"><Calendar size={18} className="text-emerald-500 dark:text-emerald-400"/> Study Consistency</h3>
              <div className="flex flex-col text-right">
                 <span className="text-lg font-black text-slate-800 dark:text-white">Current Streak: {currentStreak} Days</span>
                 <span className="text-xs text-slate-500 font-medium">Longest: {longestStreak} Days</span>
              </div>
            </div>
            
            <div className="overflow-x-auto pb-2 custom-scrollbar">
              <div className="w-full grid grid-flow-col auto-cols-fr gap-[4px] items-start">
                {Array.from({ length: Math.ceil(heatmapDataState.length / 7) }).map((_, colIndex) => {
                  const weekData = heatmapDataState.slice(colIndex * 7, (colIndex + 1) * 7);
                  return (
                    <div key={colIndex} className="grid grid-rows-7 gap-[4px] justify-items-center">
                      {weekData.map((day, dayIndex) => (
                        <div 
                          key={dayIndex}
                          title={`${day.date}: Level ${day.level}`}
                          className={`w-3 h-3 rounded-sm ${getLevelColor(day.level)} hover:ring-1 hover:ring-slate-400 dark:hover:ring-white/50 transition-all cursor-crosshair`}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-slate-500 font-medium">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className={`w-3 h-3 rounded-sm ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`} />
                  <div className={`w-3 h-3 rounded-sm ${theme === 'dark' ? 'bg-emerald-900/40' : 'bg-emerald-200'}`} />
                  <div className={`w-3 h-3 rounded-sm ${theme === 'dark' ? 'bg-emerald-700/60' : 'bg-emerald-300'}`} />
                  <div className={`w-3 h-3 rounded-sm ${theme === 'dark' ? 'bg-emerald-500/80' : 'bg-emerald-400'}`} />
                  <div className={`w-3 h-3 rounded-sm ${theme === 'dark' ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                </div>
                <span>More</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Clock, BookOpen, Target, Calendar } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/authContext';
import { getDashboardStats } from '../services/api';

// Removed fallback mock data generator

const AnalyticsPage = () => {
  const { theme } = useTheme();
  const { dbUser } = useAuth();
  
  const [stats, setStats] = useState({
    totalStudyHours: 0,
    averageTestScore: 0,
    strongestSubject: 'N/A',
    testScoresTrend: [],
    studyHoursBySubject: [],
    studyMethodMix: [],
    heatmapData: [],
    currentStreak: 0,
    longestStreak: 0
  });

  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats(dbUser.id);
        const data = res.data;
        
        // Transform backend data to fit charts if needed. 
        // For now, assuming backend sends testScoresTrend, studyHoursBySubject, etc. or we mock the chart parts if backend doesn't have them yet.
        // Dashboard stats API currently returns: { totalStudyHours, tasksCompleted, distractionFreeHours, etc. }
        // We will map what we can and fallback the rest to zeros/empty arrays.
        
        setStats({
          totalStudyHours: data.totalStudyHours || 0,
          averageTestScore: data.averageTestScore || 0, // Need this from tests API or aggregate
          strongestSubject: data.strongestSubject || 'N/A', // Need logic in backend
          testScoresTrend: data.testScoresTrend || [],
          studyHoursBySubject: data.studyHoursBySubject || [],
          studyMethodMix: data.studyMethodMix || [],
          heatmapData: data.heatmapData || [],
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0
        });
      } catch (error) {
        console.error('Error fetching analytics stats:', error);
      }
    };
    fetchStats();
  }, [dbUser?.id]);
  
  // Helpers for Heatmap
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

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"><Clock size={14}/> Total Study Time</div>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalStudyHours}<span className="text-sm text-slate-500 ml-1">hrs</span></div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">↑ 12% from last month</div>
          </div>
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"><Target size={14}/> Avg Test Score</div>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{stats.averageTestScore}<span className="text-sm text-slate-500 ml-1">%</span></div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">↑ 5% from last month</div>
          </div>
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"><BookOpen size={14}/> Strongest Subject</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.strongestSubject}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Top 10% among peers</div>
          </div>
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 flex flex-col justify-center shadow-sm">
             <div className="text-sm text-slate-600 dark:text-slate-300 italic">"Consistency is the key to mastering complex subjects. Keep pushing your limits!"</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Test Scores Trend */}
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 h-80 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6">Test Score Progression</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={stats.testScoresTrend.length > 0 ? stats.testScoresTrend : [{name: 'No Data', score: 0}]}>
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
              <BarChart data={stats.studyHoursBySubject.length > 0 ? stats.studyHoursBySubject : [{subject: 'No Data', hours: 0}]} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
                <XAxis type="number" stroke={chartAxisColor} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="subject" type="category" stroke={chartAxisColor} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartTooltipBorder, borderRadius: '8px' }} />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Time Distribution Pie */}
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 h-80 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">Study Method Mix</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.studyMethodMix}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.studyMethodMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: chartTooltipBg, borderColor: chartTooltipBorder, borderRadius: '8px', border: 'none' }} itemStyle={{ color: theme === 'dark' ? '#fff' : '#0f172a' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: chartAxisColor }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Consistency Heatmap */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2"><Calendar size={18} className="text-emerald-500 dark:text-emerald-400"/> Study Consistency</h3>
              <div className="flex flex-col text-right">
                 <span className="text-xl font-black text-slate-800 dark:text-white">Current Streak: {stats.currentStreak} Days</span>
                 <span className="text-xs text-slate-500 font-medium">Longest: {stats.longestStreak} Days</span>
              </div>
            </div>
            
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[600px] flex gap-[3px]">
                {/* Organize into columns (weeks) */}
                {Array.from({ length: Math.ceil(stats.heatmapData.length / 7) }).map((_, colIndex) => {
                  const weekData = stats.heatmapData.slice(colIndex * 7, (colIndex + 1) * 7);
                  return (
                    <div key={colIndex} className="flex flex-col gap-[3px]">
                      {weekData.map((day, dayIndex) => (
                        <div 
                          key={dayIndex}
                          title={`${day.date}: Level ${day.level}`}
                          className={`w-3.5 h-3.5 rounded-sm ${getLevelColor(day.level)} hover:ring-1 hover:ring-slate-400 dark:hover:ring-white/50 transition-all cursor-crosshair`}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-slate-500 font-medium">
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

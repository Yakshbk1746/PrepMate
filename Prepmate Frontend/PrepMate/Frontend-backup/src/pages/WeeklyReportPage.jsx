import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, TrendingUp, Clock, Target, CheckCircle2, Zap, AlertCircle, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getDashboardStats } from '../services/api';

const WeeklyReportPage = () => {
  const { dbUser } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState('Current Week');
  
  const [reportData, setReportData] = useState({
    totalStudyHours: 0,
    tasksCompleted: 0,
    tasksTotal: 1,
    averageTestScore: 0,
    totalDistractionHours: 0,
    subjectsData: [
      { name: 'Self Study', hours: 0, target: 10, color: '#3b82f6' }
    ],
    dailyActivityData: [
      { day: 'Mon', focus: 0, breaks: 0 },
      { day: 'Tue', focus: 0, breaks: 0 },
      { day: 'Wed', focus: 0, breaks: 0 },
      { day: 'Thu', focus: 0, breaks: 0 },
      { day: 'Fri', focus: 0, breaks: 0 },
      { day: 'Sat', focus: 0, breaks: 0 },
      { day: 'Sun', focus: 0, breaks: 0 },
    ]
  });

  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats(dbUser.id);
        const data = res.data;
        
        let subData = data.studyHoursBySubject || [];
        const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
        subData = subData.map((s, i) => ({
             name: s.subject,
             hours: s.hours,
             target: s.hours + 2,
             color: colors[i % colors.length]
        }));

        let dailyData = data.dailyActivityData || [];

        setReportData({
          totalStudyHours: data.totalStudyHours || 0,
          tasksCompleted: data.tasksCompleted || 0,
          tasksTotal: data.tasksTotal || 1,
          averageTestScore: data.averageTestScore || 0,
          totalDistractionHours: data.totalDistractionHours || 0,
          subjectsData: subData,
          dailyActivityData: dailyData
        });

      } catch (error) {
        console.error('Error fetching weekly report stats:', error);
      }
    };
    fetchStats();
  }, [dbUser?.id]);

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <Calendar size={24} className="text-blue-600 dark:text-blue-500" /> Weekly Insights
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Oct 23 - Oct 29, 2023</p>
          </div>
          <select 
            value={selectedWeek} 
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] text-sm text-slate-800 dark:text-white rounded-lg px-4 py-2 outline-none focus:border-blue-300 dark:focus:border-blue-500/50 shadow-sm transition-colors"
          >
            <option>Current Week</option>
            <option>Last Week</option>
            <option>Oct 9 - Oct 15</option>
          </select>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard 
            title="Total Study Time" 
            value={`${reportData.totalStudyHours}h`} 
            subValue="Target: 40h"
            trend="+5.2%"
            trendUp={true}
            icon={<Clock size={20} className="text-blue-500" />}
            colorClass="border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <MetricCard 
            title="Tasks Completed" 
            value={`${reportData.tasksCompleted}/${reportData.tasksTotal}`} 
            subValue={`${Math.round((reportData.tasksCompleted / Math.max(reportData.tasksTotal, 1)) * 100)}% Completion Rate`}
            trend="+2.1%"
            trendUp={true}
            icon={<CheckCircle2 size={20} className="text-emerald-500" />}
            colorClass="border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <MetricCard 
            title="Avg Test Score" 
            value={`${reportData.averageTestScore}%`} 
            subValue="Based on latest Mock Tests"
            trend="-1.5%"
            trendUp={false}
            icon={<Target size={20} className="text-purple-500" />}
            colorClass="border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
          />
          <MetricCard 
            title="Distraction Time" 
            value={`${reportData.totalDistractionHours}h`} 
            subValue="Social Media: 70%"
            trend="-12%"
            trendUp={true} // Less distraction is good
            icon={<AlertCircle size={20} className="text-orange-500" />}
            colorClass="border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Subject Breakdown Chart */}
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500"/> Subject Time Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.subjectsData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark:stroke="#ffffff10" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" dark:stroke="#ffffff50" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" dark:stroke="#ffffff50" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} dark:cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--tw-colors-white)', darkBackgroundColor: '#0a0f1e', borderRadius: '8px' }} />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={20}>
                    {reportData.subjectsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Focus/Break Ratio */}
          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <Zap size={18} className="text-emerald-500"/> Daily Focus vs Break (%)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.dailyActivityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark:stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" dark:stroke="#ffffff50" axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" dark:stroke="#ffffff50" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} dark:cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'var(--tw-colors-white)', darkBackgroundColor: '#0a0f1e', borderRadius: '8px' }} />
                  <Bar dataKey="focus" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={32} />
                  <Bar dataKey="breaks" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500"></div>Focus</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-amber-500"></div>Breaks</div>
            </div>
          </div>

        </div>

        {/* AI Insights & Accomplishments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-indigo-800 dark:text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={18} /> AI Performance Insights
            </h3>
            <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                Based on your data, you are consistently studying well on Thursdays and Fridays, but Saturdays show a sharp drop in focus time. 
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 shrink-0 mt-0.5">•</span>
                  <span>You exceeded your DBMS study target by 2 hours. Excellent work.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 shrink-0 mt-0.5">•</span>
                  <span>Distractions decreased by 12% compared to last week. Keep putting your phone in another room.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                  <span className="text-amber-700 dark:text-amber-400/90 font-semibold">Action Items: Increase network questions practice. Test scores in this subject dipped slightly.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
             <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award size={18} className="text-yellow-500" /> Weekly Trophies
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] p-3 rounded-xl flex items-center gap-3">
                <div className="text-2xl">🔥</div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">7-Day Streak</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Consistency is key</p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] p-3 rounded-xl flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">DBMS Master</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">14 hrs logged</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subValue, trend, trendUp, icon, colorClass }) => (
  <div className={`border rounded-2xl p-5 shadow-sm transition-transform hover:-translate-y-1 bg-white dark:bg-[#0a0f1e]/60 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-xl ${colorClass.split(' ').slice(2).join(' ')}`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-white/5 ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </div>
    </div>
    <div>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</h3>
      <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{value}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{subValue}</div>
    </div>
  </div>
);

export default WeeklyReportPage;
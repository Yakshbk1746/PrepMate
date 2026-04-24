import React, { useState, useEffect } from 'react';
import { Heart, Moon, Droplets, Activity, Flame, ShieldAlert, ArrowUpRight, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/authContext';
import { getWellbeingToday, getWellbeingWeekly, logWellbeing as logWellbeingApi } from '../services/api';

// Removed hardcoded moodData
const WellbeingPage = () => {
  const { dbUser } = useAuth();
  const [metrics, setMetrics] = useState({
    sleepHours: 0,
    waterLevel: 0,
    physicalActivity: 0
  });

  const [burnoutRisk, setBurnoutRisk] = useState('Low');
  const [moodData, setMoodData] = useState([]);

  // Fetch wellbeing data for today
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchWellbeing = async () => {
      try {
        const res = await getWellbeingToday(dbUser.id);
        if (res.data) {
           setMetrics({
             sleepHours: res.data.sleepHours || 0,
             waterLevel: res.data.waterLevel || 0,
             physicalActivity: res.data.physicalActivity || 0
           });
        }
        
        try {
          const weeklyRes = await getWellbeingWeekly(dbUser.id);
          if (weeklyRes.data && Array.isArray(weeklyRes.data)) {
            setMoodData(weeklyRes.data);
          }
        } catch (e) {
          console.error('Error fetching weekly wellbeing:', e);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error('Error fetching today wellbeing:', error);
        }
      }
    };
    fetchWellbeing();
  }, [dbUser?.id]);

  const updateMetric = async (key, value) => {
    const updatedMetrics = { ...metrics, [key]: Number(value) };
    setMetrics(updatedMetrics);
    
    // Debounce this in a real app, but for now just send it
    if (!dbUser?.id) return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await logWellbeingApi(dbUser.id, {
        date: todayStr,
        ...updatedMetrics
      });
    } catch (error) {
      console.error('Error updating wellbeing:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Burnout Risk Alert */}
        <div className={`mb-6 p-4 rounded-xl border ${
          burnoutRisk === 'High' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400' :
          burnoutRisk === 'Moderate' ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400' :
          'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
        }`}>
          <div className="flex items-start gap-3">
            <ShieldAlert size={24} className="shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-1 uppercase tracking-wider text-sm flex items-center gap-2">
                Burnout Risk: {burnoutRisk}
              </h3>
              <p className="text-xs opacity-90 font-medium leading-relaxed">
                {burnoutRisk === 'High' ? "Your recent study hours heavily outweigh your sleep and recovery time. Please take an immediate break." :
                 burnoutRisk === 'Moderate' ? "You are maintaining a decent balance, but consider increasing your sleep tonight to avoid impending fatigue." :
                 "Great job! Your study-recovery balance is perfectly optimized."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Health Trackers */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <Activity size={18} className="text-blue-500"/> Daily Health Trackers
            </h2>

            {/* Sleep */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Moon size={20} />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">Sleep</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{metrics.sleepHours}</span>
                  <span className="text-xs font-bold text-slate-500">hrs</span>
                </div>
              </div>
              <input 
                type="range" 
                min="0" max="12" step="0.5" 
                value={metrics.sleepHours} 
                onChange={(e) => updateMetric('sleepHours', e.target.value)}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                <span>0h</span>
                <span>Target: 8h</span>
                <span>12h</span>
              </div>
            </div>

            {/* Water */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <Droplets size={20} />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">Water</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{metrics.waterLevel}</span>
                  <span className="text-xs font-bold text-slate-500">ml</span>
                </div>
              </div>
              <input 
                type="range" 
                min="0" max="4000" step="100" 
                value={metrics.waterLevel} 
                onChange={(e) => updateMetric('waterLevel', e.target.value)}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                <span>0ml</span>
                <span>Target: 3000ml</span>
                <span>4000ml</span>
              </div>
            </div>

            {/* Exercise */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <Flame size={20} />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">Exercise</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.physicalActivity}</span>
                  <span className="text-xs font-bold text-slate-500">min</span>
                </div>
              </div>
              <input 
                type="range" 
                min="0" max="120" step="5" 
                value={metrics.physicalActivity} 
                onChange={(e) => updateMetric('physicalActivity', e.target.value)}
                className="w-full accent-rose-500"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                <span>0m</span>
                <span>Target: 45m</span>
                <span>120m</span>
              </div>
            </div>
            
          </div>

          <div className="lg:col-span-2 space-y-6">
            
            {/* Mood Chart */}
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm h-80">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <Heart size={18} className="text-pink-500"/> Weekly Mood vs Sleep
              </h3>
              <ResponsiveContainer width="100%" height="80%">
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis yAxisId="left" stroke="#ec4899" axisLine={false} tickLine={false} tick={{fontSize: 12}} domain={[0, 5]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" axisLine={false} tickLine={false} tick={{fontSize: 12}} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="mood" stroke="#ec4899" strokeWidth={3} dot={{r:4, fill:'#ec4899', strokeWidth:0}} activeDot={{r:6}} name="Mood (1-5)" />
                  <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="#8b5cf6" strokeWidth={3} dot={{r:4, fill:'#8b5cf6', strokeWidth:0}} activeDot={{r:6}} name="Sleep (hrs)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recommended Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 border border-blue-100 dark:border-blue-500/20 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4">Recommended Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-4 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Lower Screen Brightness</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your eyes are strained based on your last 3 Pomodoro sessions.</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-4 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Take a 20m Walk</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">You haven't logged any physical activity today. A quick walk boosts retention.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default WellbeingPage;

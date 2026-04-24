import React, { useEffect, useState } from 'react';
import { Heart, Save } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getTodayWellbeing, getWeeklyWellbeing, upsertWellbeing } from '../services/api';

const WellbeingPage = () => {
  const { backendUserId } = useAuth();
  const [sleep, setSleep] = useState('7 hours');
  const [water, setWater] = useState('2.5L');
  const [exercise, setExercise] = useState('30 min walk');
  const [weeklyLogs, setWeeklyLogs] = useState([]);

  useEffect(() => {
    if (!backendUserId) return;

    Promise.all([getTodayWellbeing(backendUserId), getWeeklyWellbeing(backendUserId)])
      .then(([today, weekly]) => {
        if (today) {
          setSleep(today.sleep || '7 hours');
          setWater(today.water || '2.5L');
          setExercise(today.exercise || '30 min walk');
        }
        setWeeklyLogs(weekly);
      })
      .catch(console.error);
  }, [backendUserId]);

  const saveToday = async () => {
    if (!backendUserId) return;

    try {
      const saved = await upsertWellbeing(backendUserId, {
        sleep,
        water,
        exercise,
      });

      setWeeklyLogs((prev) => {
        const filtered = prev.filter((item) => item.id !== saved.id);
        return [saved, ...filtered];
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
            <Heart size={16} className="text-rose-500" /> Wellbeing Check-In
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-2">Sleep</label>
              <input type="text" value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="e.g. 7 hours" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-2">Water</label>
              <input type="text" value={water} onChange={(e) => setWater(e.target.value)} placeholder="e.g. 2.5L" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold block mb-2">Exercise</label>
              <input type="text" value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="e.g. 30 min walk" className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white text-sm" />
            </div>
          </div>

          <button onClick={saveToday} className="mt-4 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Save size={14} /> Save Today
          </button>
        </div>

        <div className="mt-6 bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">Weekly Logs</h3>
          <div className="space-y-2">
            {weeklyLogs.length === 0 && <p className="text-xs text-slate-500">No logs yet.</p>}
            {weeklyLogs.map((item) => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{item.date || 'Today'}</span> - Sleep: {item.sleep || 'N/A'}, Water: {item.water || 'N/A'}, Exercise: {item.exercise || 'N/A'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellbeingPage;

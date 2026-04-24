import React, { useState, useEffect } from 'react';
import { Smartphone, MonitorPlay, Users, Gamepad2, ArrowDown, Plus, Trash2, X, AlertTriangle, Crosshair } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/authContext';
import { getDistractions, createDistraction, deleteDistraction } from '../services/api';

const resolveBackendUserId = (user, contextUserId) => {
  if (contextUserId && Number.isInteger(Number(contextUserId))) return Number(contextUserId);

  const candidateIds = [
    user?.backendUserId,
    user?.id,
    localStorage.getItem('prepmateUserId'),
    localStorage.getItem('backendUserId'),
  ];

  for (const candidate of candidateIds) {
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }

  return null;
};

const toDateString = (value) => {
  if (!value) return new Date().toISOString().split('T')[0];
  const asString = String(value);
  return asString.includes('T') ? asString.split('T')[0] : asString;
};

const normalizeDistraction = (item) => ({
  id: item?.id,
  type: item?.type || 'Other',
  source: item?.source || item?.type || 'Unknown Source',
  duration: Number.isFinite(Number(item?.duration)) ? Number(item.duration) : 0,
  impact: item?.impact || 'Medium',
  date: toDateString(item?.date),
  time: item?.time || '--:--',
});

const DistractionPage = () => {
  const { user, backendUserId: contextUserId } = useAuth();
  const [distractions, setDistractions] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newLog, setNewLog] = useState({ type: 'Social Media', source: '', duration: '', impact: 'Medium' });

  useEffect(() => {
    const userId = resolveBackendUserId(user, contextUserId);
    if (!userId) return;
    getDistractions(userId)
      .then((data) => setDistractions((Array.isArray(data) ? data : []).map(normalizeDistraction)))
      .catch(console.error);
  }, [user, contextUserId]);

  // Stats calculations
  const totalDuration = distractions.reduce((acc, curr) => acc + curr.duration, 0);
  const today = new Date().toISOString().split('T')[0];
  const todayDistractions = distractions.filter(d => d.date === today);
  const todayDuration = todayDistractions.reduce((acc, curr) => acc + curr.duration, 0);

  // Group by type for progress bars
  const typeMap = distractions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.duration;
    return acc;
  }, {});
  
  const topType = Object.entries(typeMap).sort((a,b) => b[1] - a[1])[0] || ['None', 0];
  const distractionChartData = Object.entries(typeMap)
    .map(([type, duration]) => ({ type, duration }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 6);

  const handleAddLog = (e) => {
    e.preventDefault();
    if(!newLog.source || !newLog.duration) return;

    const userId = resolveBackendUserId(user, contextUserId);
    if (!userId) return;

    createDistraction(userId, {
      type: newLog.type,
      source: newLog.source,
      duration: Number(newLog.duration),
      impact: newLog.impact,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})
    }).then(saved => setDistractions(prev => [normalizeDistraction(saved), ...prev]))
      .catch(console.error);
    setShowAddModal(false);
    setNewLog({ type: 'Social Media', source: '', duration: '', impact: 'Medium' });
  };

  const deleteLog = (id) => {
    if(confirm('Delete this log?')) {
      deleteDistraction(id).then(() => setDistractions(prev => prev.filter(d => d.id !== id))).catch(console.error);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'Social Media': return <Smartphone className="text-pink-500" size={20} />;
      case 'Entertainment': return <MonitorPlay className="text-red-500" size={20} />;
      case 'Social': return <Users className="text-blue-500" size={20} />;
      case 'Gaming': return <Gamepad2 className="text-purple-500" size={20} />;
      default: return <AlertTriangle className="text-orange-500" size={20} />;
    }
  };

  const getImpactColor = (impact) => {
    if(impact === 'High') return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20';
    if(impact === 'Medium') return 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20';
    return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-3">
              <Crosshair size={28} className="text-orange-500" /> Focus Intruders
            </h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Identify & eliminate time sinks</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-orange-500/20"
          >
            <Plus size={18} /> Log Incident
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Stats Column */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-900/20 dark:to-rose-900/20 border border-orange-100 dark:border-orange-500/20 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-orange-800 dark:text-orange-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                 <AlertTriangle size={18} /> Time Lost Today
              </h3>
              <div className="flex items-end justify-between mb-4">
                <span className="text-5xl font-black text-slate-900 dark:text-white">{todayDuration}</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-1">mins</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 pt-4 border-t border-orange-200 dark:border-orange-500/20">
                <span>Total Historical</span>
                <span className="text-slate-800 dark:text-slate-300">{Math.floor(totalDuration/60)}h {totalDuration%60}m</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                 <ArrowDown size={18} className="text-red-500" /> Top Distraction Area
              </h3>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center border border-red-100 dark:border-red-500/20">
                  {getTypeIcon(topType[0])}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">{topType[0]}</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{topType[1]} mins total</p>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(typeMap).sort((a,b)=>b[1]-a[1]).map(([type, duration]) => (
                  <div key={type}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-600 dark:text-slate-300">{type}</span>
                      <span className="text-slate-500">{Math.round((duration/totalDuration)*100)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-transparent">
                      <div className="h-full bg-slate-800 dark:bg-slate-400" style={{width: `${(duration/totalDuration)*100}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4">Pattern Chart</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distractionChartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="type" type="category" stroke="#94a3b8" width={90} />
                    <Tooltip />
                    <Bar dataKey="duration" fill="#f97316" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Log List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm min-h-[500px]">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6">Recent Incidents</h3>
              
              {distractions.length === 0 ? (
                <div className="py-20 text-center text-slate-500 font-medium">No distractions logged. Stay intensely focused!</div>
              ) : (
                <div className="space-y-4">
                  {distractions.map(log => (
                    <div key={log.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-xl hover:bg-white dark:hover:bg-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.1] transition-all shadow-sm">
                      
                      <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-black/20 flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-sm">
                          {getTypeIcon(log.type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight mb-1">{log.source}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>{log.type}</span>
                            <span>•</span>
                            <span>{log.date} at {log.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-200 dark:border-transparent sm:border-t-0">
                        <div className="text-center sm:text-right">
                          <span className="block text-xl font-black text-slate-900 dark:text-white">{log.duration}<span className="text-xs font-bold text-slate-500 uppercase ml-1">min</span></span>
                        </div>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${getImpactColor(log.impact)}`}>
                          {log.impact} Impact
                        </span>
                        <button 
                          onClick={() => deleteLog(log.id)}
                          className="opacity-100 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Log Distraction</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Category</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-orange-500 text-slate-800 dark:text-white text-sm font-medium transition-colors"
                  value={newLog.type}
                  onChange={(e) => setNewLog({...newLog, type: e.target.value})}
                >
                  <option>Social Media</option>
                  <option>Entertainment</option>
                  <option>Gaming</option>
                  <option>Social</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Specific App / Source</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Instagram Reels"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-orange-500 text-slate-800 dark:text-white text-sm font-medium transition-colors placeholder:text-slate-400"
                  value={newLog.source}
                  onChange={(e) => setNewLog({...newLog, source: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Duration (Min)</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    placeholder="30"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-orange-500 text-slate-800 dark:text-white text-sm font-medium transition-colors placeholder:text-slate-400"
                    value={newLog.duration}
                    onChange={(e) => setNewLog({...newLog, duration: e.target.value})}
                  />
                </div>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Impact</label>
                   <select 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-orange-500 text-slate-800 dark:text-white text-sm font-medium transition-colors"
                    value={newLog.impact}
                    onChange={(e) => setNewLog({...newLog, impact: e.target.value})}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl transition-colors font-bold uppercase tracking-wider text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors font-bold uppercase tracking-wider text-sm shadow-lg shadow-orange-500/20">
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DistractionPage;
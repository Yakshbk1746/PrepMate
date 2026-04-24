// import React, { useState, useEffect, useRef } from 'react';
// import { Play, Pause, Square, RotateCcw, Settings2, Volume2, VolumeX, Coffee, Bell, Brain, Watch, Droplets, Wind, Eye } from 'lucide-react';

// const POMODORO_STATES = {
//   POMODORO: 'pomodoro',
//   SHORT_BREAK: 'short_break',
//   LONG_BREAK: 'long_break'
// };

// const POMODORO_MINUTES = {
//   [POMODORO_STATES.POMODORO]: 25,
//   [POMODORO_STATES.SHORT_BREAK]: 5,
//   [POMODORO_STATES.LONG_BREAK]: 15
// };

// const TimersPage = () => {
//   // Common State
//   const [activeTab, setActiveTab] = useState('pomodoro');
//   const [soundEnabled, setSoundEnabled] = useState(true);
  
//   // Pomodoro State
//   const [pomodoroState, setPomodoroState] = useState(POMODORO_STATES.POMODORO);
//   const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(POMODORO_MINUTES[POMODORO_STATES.POMODORO] * 60);
//   const [pomodoroIsRunning, setPomodoroIsRunning] = useState(false);
//   const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  
//   // Question Timer State
//   const [qTimerTimePassed, setQTimerTimePassed] = useState(0);
//   const [qTimerIsRunning, setQTimerIsRunning] = useState(false);
//   const [qTimerLaps, setQTimerLaps] = useState([]);
//   const [currentQuestionAvg, setCurrentQuestionAvg] = useState(120); // 2 mins expected avg

//   // Audio refs
//   const alarmAudio = useRef(null);
//   const tickAudio = useRef(null);

//   useEffect(() => {
//     // We would normally load real audio files here
//     // alertAudio.current = new Audio('/sounds/alarm.mp3');
//   }, []);

//   // --- Pomodoro Logic ---
//   useEffect(() => {
//     let interval = null;
//     if (pomodoroIsRunning && pomodoroTimeLeft > 0) {
//       interval = setInterval(() => {
//         setPomodoroTimeLeft((time) => time - 1);
//       }, 1000);
//     } else if (pomodoroTimeLeft === 0) {
//       handlePomodoroComplete();
//     }
//     return () => clearInterval(interval);
//   }, [pomodoroIsRunning, pomodoroTimeLeft]);

//   const handlePomodoroComplete = () => {
//     setPomodoroIsRunning(false);
//     if (soundEnabled) {
//       // play alarm
//       console.log('Ring! Ring!');
//     }

//     if (pomodoroState === POMODORO_STATES.POMODORO) {
//       const newCount = pomodorosCompleted + 1;
//       setPomodorosCompleted(newCount);
      
//       if (newCount % 4 === 0) {
//         switchPomodoroState(POMODORO_STATES.LONG_BREAK);
//       } else {
//         switchPomodoroState(POMODORO_STATES.SHORT_BREAK);
//       }
//     } else {
//       switchPomodoroState(POMODORO_STATES.POMODORO);
//     }
//   };

//   const switchPomodoroState = (newState) => {
//     setPomodoroState(newState);
//     setPomodoroTimeLeft(POMODORO_MINUTES[newState] * 60);
//     setPomodoroIsRunning(false);
//   };

//   const togglePomodoro = () => setPomodoroIsRunning(!pomodoroIsRunning);
  
//   const resetPomodoro = () => {
//     setPomodoroIsRunning(false);
//     setPomodoroTimeLeft(POMODORO_MINUTES[pomodoroState] * 60);
//   };

//   // --- Question Timer Logic ---
//   useEffect(() => {
//     let interval = null;
//     if (qTimerIsRunning) {
//       interval = setInterval(() => {
//         setQTimerTimePassed((time) => time + 1);
//       }, 1000);
//     }
//     return () => clearInterval(interval);
//   }, [qTimerIsRunning]);

//   const toggleQTimer = () => setQTimerIsRunning(!qTimerIsRunning);
  
//   const lapQTimer = () => {
//     if (qTimerTimePassed > 0) {
//       const newLap = {
//         id: Date.now(),
//         questionNum: qTimerLaps.length + 1,
//         time: qTimerTimePassed,
//         isOvertime: qTimerTimePassed > currentQuestionAvg
//       };
//       setQTimerLaps([newLap, ...qTimerLaps]);
//       setQTimerTimePassed(0);
//     }
//   };

//   const resetQTimer = () => {
//     setQTimerIsRunning(false);
//     setQTimerTimePassed(0);
//     setQTimerLaps([]);
//   };

//   // --- Helpers ---
//   const formatTime = (seconds) => {
//     const m = Math.floor(seconds / 60);
//     const s = seconds % 60;
//     return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
//   };

//   const getPomodoroThemeClass = () => {
//     if (pomodoroState === POMODORO_STATES.POMODORO) return 'text-rose-500 border-rose-500 bg-rose-500/10';
//     if (pomodoroState === POMODORO_STATES.SHORT_BREAK) return 'text-emerald-500 border-emerald-500 bg-emerald-500/10';
//     return 'text-blue-500 border-blue-500 bg-blue-500/10';
//   };

//   const getPomodoroBgClass = () => {
//     if (pomodoroState === POMODORO_STATES.POMODORO) return 'from-rose-500/10 to-transparent border-rose-500/20';
//     if (pomodoroState === POMODORO_STATES.SHORT_BREAK) return 'from-emerald-500/10 to-transparent border-emerald-500/20';
//     return 'from-blue-500/10 to-transparent border-blue-500/20';
//   };

//   // Calculate stats for Question Timer
//   const totalQTime = qTimerLaps.reduce((acc, lap) => acc + lap.time, 0);
//   const avgQTime = qTimerLaps.length > 0 ? Math.floor(totalQTime / qTimerLaps.length) : 0;
//   const questionsCompleted = qTimerLaps.length;

//   return (
//     <div className="space-y-6">
//       <div className="max-w-[1400px] mx-auto">
//         <div className="flex justify-center mb-8">
//           <div className="bg-slate-200/50 dark:bg-white/5 p-1 rounded-xl inline-flex gap-1 border border-slate-300 dark:border-white/10">
//             <button
//               onClick={() => setActiveTab('pomodoro')}
//               className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
//                 activeTab === 'pomodoro' 
//                   ? 'bg-white dark:bg-[#060914] text-slate-800 dark:text-white shadow shadow-slate-300/50 dark:shadow-black/50 border border-slate-200 dark:border-white/10' 
//                   : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
//               }`}
//             >
//               <Brain size={16} /> Pomodoro
//             </button>
//             <button
//               onClick={() => setActiveTab('question')}
//               className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
//                 activeTab === 'question' 
//                   ? 'bg-white dark:bg-[#060914] text-slate-800 dark:text-white shadow shadow-slate-300/50 dark:shadow-black/50 border border-slate-200 dark:border-white/10' 
//                   : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
//               }`}
//             >
//               <Watch size={16} /> Question Timer
//             </button>
//           </div>
//         </div>

//         <div className="flex justify-end mb-4 pr-4">
//           <button 
//             onClick={() => setSoundEnabled(!soundEnabled)}
//             className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors border border-slate-200 dark:border-white/10"
//             title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
//           >
//             {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
//           </button>
//         </div>

//         {activeTab === 'pomodoro' ? (
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
//             {/* Break Activities Panel (Shows only during breaks) */}
//             {(pomodoroState === POMODORO_STATES.SHORT_BREAK || pomodoroState === POMODORO_STATES.LONG_BREAK) && (
//               <div className="lg:col-span-1 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-[#0a0f1e]/60 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 shadow-sm">
//                 <h3 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-6 flex items-center gap-2">
//                   <Coffee size={18} /> Break Activities
//                 </h3>
                
//                 <div className="space-y-4">
//                   <div className="p-4 bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-colors group cursor-pointer">
//                     <div className="flex items-start gap-4">
//                       <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
//                         <Wind className="text-emerald-600 dark:text-emerald-400" size={20} />
//                       </div>
//                       <div>
//                         <h4 className="font-bold text-slate-800 dark:text-white mb-1">Guided Breathing</h4>
//                         <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">4-7-8 breathing technique to lower heart rate.</p>
//                         <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
//                           <Play size={12}/> Start 2 min session
//                         </button>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="p-4 bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-xl">
//                     <div className="flex items-start gap-4">
//                       <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
//                         <Droplets className="text-blue-600 dark:text-blue-400" size={20} />
//                       </div>
//                       <div>
//                         <h4 className="font-bold text-slate-800 dark:text-white mb-1">Hydration Reminder</h4>
//                         <p className="text-xs text-slate-500 dark:text-slate-400">Drink a glass of water. Brains need hydration to function.</p>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="p-4 bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-xl">
//                     <div className="flex items-start gap-4">
//                       <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0">
//                         <Eye className="text-purple-600 dark:text-purple-400" size={20} />
//                       </div>
//                       <div>
//                         <h4 className="font-bold text-slate-800 dark:text-white mb-1">20-20-20 Rule</h4>
//                         <p className="text-xs text-slate-500 dark:text-slate-400">Look at something 20 feet away for 20 seconds.</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Main Timer Area */}
//             <div className={`${(pomodoroState === POMODORO_STATES.SHORT_BREAK || pomodoroState === POMODORO_STATES.LONG_BREAK) ? 'lg:col-span-2' : 'lg:col-span-3 lg:col-start-2 lg:max-w-xl lg:mx-auto w-full'}`}>
//               <div className={`bg-gradient-to-br ${getPomodoroBgClass()} bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center min-h-[500px] shadow-sm relative overflow-hidden transition-all duration-500`}>
                
//                 {/* Mode Selector */}
//                 <div className="flex gap-2 mb-10 relative z-10 bg-slate-100/50 dark:bg-black/20 p-1.5 rounded-full border border-slate-200 dark:border-white/10">
//                   <button onClick={() => switchPomodoroState(POMODORO_STATES.POMODORO)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${pomodoroState === POMODORO_STATES.POMODORO ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Focus</button>
//                   <button onClick={() => switchPomodoroState(POMODORO_STATES.SHORT_BREAK)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${pomodoroState === POMODORO_STATES.SHORT_BREAK ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Short Break</button>
//                   <button onClick={() => switchPomodoroState(POMODORO_STATES.LONG_BREAK)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${pomodoroState === POMODORO_STATES.LONG_BREAK ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Long Break</button>
//                 </div>

//                 {/* Clock */}
//                 <div className="relative flex items-center justify-center mb-12">
//                   <div className={`font-mono text-8xl md:text-9xl font-black tracking-tighter transition-colors duration-500 ${pomodoroState === POMODORO_STATES.POMODORO ? 'text-slate-900 dark:text-white' : pomodoroState === POMODORO_STATES.SHORT_BREAK ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
//                     {formatTime(pomodoroTimeLeft)}
//                   </div>
//                 </div>

//                 {/* Controls */}
//                 <div className="flex items-center gap-6 relative z-10">
//                   <button onClick={togglePomodoro} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-xl ${
//                     pomodoroState === POMODORO_STATES.POMODORO ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 text-white' :
//                     pomodoroState === POMODORO_STATES.SHORT_BREAK ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30 text-white' :
//                     'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30 text-white'
//                   }`}>
//                     {pomodoroIsRunning ? <Pause size={32} className="fill-current" /> : <Play size={32} className="fill-current ml-2" />}
//                   </button>
//                   <button onClick={resetPomodoro} className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-500 dark:text-slate-300 transition-colors">
//                     <RotateCcw size={20} />
//                   </button>
//                 </div>

//                 {/* Status indicator */}
//                 <div className="mt-8 text-xs font-medium text-slate-500 flex items-center gap-2">
//                   <span className="opacity-70">Session:</span>
//                   <div className="flex gap-1">
//                     {[1,2,3,4].map(i => (
//                       <div key={i} className={`w-2 h-2 rounded-full ${pomodorosCompleted % 4 >= i || (pomodorosCompleted % 4 === 0 && pomodorosCompleted > 0) ? 'bg-rose-500' : 'bg-slate-300 dark:bg-white/20'}`} />
//                     ))}
//                   </div>
//                   <span className="opacity-70 ml-2">({pomodorosCompleted} total)</span>
//                 </div>
//               </div>
//             </div>

//           </div>
//         ) : (
//           /* Question Timer Layout */
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
//             <div className="lg:col-span-2">
//               <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[500px] shadow-sm relative overflow-hidden">
                 
//                  <div className="absolute top-6 right-6 flex items-center gap-2 text-xs text-slate-500 font-medium">
//                    <span>Target Avg:</span>
//                    <select 
//                      value={currentQuestionAvg} 
//                      onChange={(e) => setCurrentQuestionAvg(Number(e.target.value))}
//                      className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded px-2 py-1 outline-none text-slate-800 dark:text-white"
//                    >
//                      <option value={60}>1 min</option>
//                      <option value={90}>1.5 mins</option>
//                      <option value={120}>2 mins</option>
//                      <option value={180}>3 mins</option>
//                    </select>
//                  </div>

//                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-8 flex items-center gap-2">
//                    <Target size={16}/> Current Question Time
//                  </p>

//                  <div className={`font-mono text-8xl md:text-9xl font-black tracking-tighter mb-12 transition-colors ${qTimerTimePassed > currentQuestionAvg ? 'text-red-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
//                    {formatTime(qTimerTimePassed)}
//                  </div>

//                  <div className="flex items-center gap-4">
//                    <button onClick={toggleQTimer} className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white transition-transform hover:scale-105">
//                      {qTimerIsRunning ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
//                    </button>
//                    <button onClick={lapQTimer} disabled={!qTimerIsRunning && qTimerTimePassed === 0} className="px-8 h-16 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold tracking-wide transition-colors disabled:opacity-50 border border-slate-300 dark:border-white/5">
//                      NEXT QUESTION
//                    </button>
//                    <button onClick={resetQTimer} className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors border border-slate-300 dark:border-white/5">
//                      <Square size={20} className="fill-current" />
//                    </button>
//                  </div>
                 
//                  {qTimerTimePassed > currentQuestionAvg && (
//                    <div className="mt-8 text-red-500 text-sm font-bold bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/20 flex items-center gap-2">
//                      <Bell size={16} /> Over expected time!
//                    </div>
//                  )}
//               </div>
//             </div>

//             <div className="lg:col-span-1 border-l border-slate-200 dark:border-white/[0.05] pl-0 lg:pl-6 space-y-6">
              
//               <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 shadow-sm">
//                 <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4">Session Stats</h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="bg-slate-50 dark:bg-[#060914] p-3 rounded-lg border border-slate-200 dark:border-white/5">
//                     <p className="text-xs text-slate-500 font-medium mb-1">Solved</p>
//                     <p className="text-2xl font-black text-slate-900 dark:text-white">{questionsCompleted}</p>
//                   </div>
//                   <div className="bg-slate-50 dark:bg-[#060914] p-3 rounded-lg border border-slate-200 dark:border-white/5">
//                     <p className="text-xs text-slate-500 font-medium mb-1">Avg Time</p>
//                     <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatTime(avgQTime)}</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-white dark:bg-[#0a0f1e]/60 border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 flex flex-col h-[350px] shadow-sm">
//                 <div className="flex justify-between items-end mb-4 shrink-0">
//                   <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Time Log</h3>
//                   <span className="text-xs text-slate-500">{qTimerLaps.filter(l => l.isOvertime).length} Overtime</span>
//                 </div>
                
//                 <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
//                   {qTimerLaps.length === 0 ? (
//                     <div className="text-center text-sm text-slate-500 py-10">No questions completed yet.</div>
//                   ) : (
//                     qTimerLaps.map((lap, idx) => (
//                       <div key={lap.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors group">
//                         <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Q{lap.questionNum}</span>
//                         <div className="flex items-center gap-3">
//                           {lap.isOvertime && <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-500/20">SLOW</span>}
//                           <span className={`text-sm font-mono font-bold ${lap.isOvertime ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{formatTime(lap.time)}</span>
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </div>
//               </div>

//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TimersPage;

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, X, Clock, Zap, TrendingUp, Lightbulb, Edit2 } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getTimerSessions, logTimerSession as createTimerSessionApi } from '../services/api';

const TimersPage = () => {
  const { dbUser } = useAuth();
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);
  const [trackerRunning, setTrackerRunning] = useState(false);
  const [questionsSolved, setQuestionsSolved] = useState(0);
  const [questionLaps, setQuestionLaps] = useState([]);
  const [sessionName, setSessionName] = useState("Question Solving Session");
  const [isEditingSessionName, setIsEditingSessionName] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editSessionValue, setEditSessionValue] = useState("");
  const [sessions, setSessions] = useState([]);
  const [currentSubject, setCurrentSubject] = useState('');
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Fetch timer sessions from backend
  useEffect(() => {
    if (!dbUser?.id) return;
    const fetchSessions = async () => {
      try {
        const res = await getTimerSessions(dbUser.id);
        const fetchedSessions = Array.isArray(res.data) ? res.data : [];
        // Map backend Date to local time formats if necessary or use as-is
        const processedSessions = fetchedSessions.map(s => ({
          ...s,
          time: s.time || new Date(s.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setSessions(processedSessions);
      } catch (error) {
        console.error('Error fetching timer sessions:', error);
      }
    };
    fetchSessions();
  }, [dbUser?.id]);

  useEffect(() => {
    let interval;
    if (pomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(t => {
          if (t <= 1) {
            setPomodoroRunning(false);
            logSession('Pomodoro', Math.floor((25 * 60 - t) / 60));
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroTime]);

  useEffect(() => {
    let interval;
    if (trackerRunning) {
      interval = setInterval(() => {
        setSessionTime(t => t + 1);
        setQuestionTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [trackerRunning]);

  const handleNextQuestion = () => {
    if (questionTime === 0 && sessionTime === 0) return;
    setQuestionLaps(prev => [...prev, questionTime]);
    setQuestionsSolved(s => s + 1);
    setQuestionTime(0);
  };

  const handleEndSession = () => {
    if (sessionTime === 0) return;
    const avgSeconds = questionsSolved > 0 ? Math.floor(sessionTime / questionsSolved) : 0;
    const avgFormatted = formatTime(avgSeconds);
    logSession(`${sessionName} (${questionsSolved} Qs, Avg: ${avgFormatted})`, Math.floor(sessionTime / 60));
    setTrackerRunning(false);
    setSessionTime(0);
    setQuestionTime(0);
    setQuestionsSolved(0);
    setQuestionLaps([]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startEditingSessionLog = (session) => {
    setEditingSessionId(session.id);
    setEditSessionValue(session.type);
  };

  const saveSessionLogName = (id) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, type: editSessionValue } : s));
    setEditingSessionId(null);
  };

  const logSession = async (type, duration) => {
    if (!dbUser?.id) return;
    const now = new Date();
    
    const newSession = {
      type,
      duration,
      completed: true,
      subject: currentSubject || null,
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      const res = await createTimerSessionApi(dbUser.id, newSession);
      setSessions(prev => [{
        ...res.data,
        time: res.data.time || newSession.time
      }, ...prev]);
    } catch (error) {
      console.error('Error creating timer session:', error);
    }
  };

  const resetPomodoro = (minutes = 25) => {
    setPomodoroTime(minutes * 60);
    setPomodoroRunning(false);
  };

  const totalStudyTime = sessions
    .filter(s => s.type === 'Pomodoro')
    .reduce((sum, s) => sum + s.duration, 0);

  const todaySessions = sessions.filter(s => s.type === 'Pomodoro').length;

  return (
    <div className="space-y-6">
      
      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <Lightbulb size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-2">⏱️ Pomodoro Technique Tips</h3>
            <ul className="text-xs text-slate-300 space-y-1">
              <li>• Work in focused 25-minute blocks followed by 5-minute breaks</li>
              <li>• After 4 pomodoros, take a longer 15-30 minute break</li>
              <li>• Remove all distractions during pomodoro sessions</li>
              <li>• Use stopwatch for tasks that need continuous focus without breaks</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0a0f1e]/60 border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Clock size={20} className="text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{totalStudyTime}m</div>
              <div className="text-xs text-slate-500 font-medium">Today's Study Time</div>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0f1e]/60 border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Zap size={20} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{todaySessions}</div>
              <div className="text-xs text-slate-500 font-medium">Pomodoros Done</div>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0f1e]/60 border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
              <TrendingUp size={20} className="text-violet-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{sessions.length}</div>
              <div className="text-xs text-slate-500 font-medium">Total Sessions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pomodoro Timer */}
        <div className="bg-[#0a0f1e]/60 border border-white/[0.06] rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Clock size={20} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Pomodoro Timer</h2>
          </div>
          
          <div className="text-7xl font-black text-white mb-8 font-mono tracking-tight">
            {formatTime(pomodoroTime)}
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setPomodoroRunning(!pomodoroRunning)}
              disabled={pomodoroTime === 0}
              className="p-5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-full transition-all shadow-lg shadow-blue-500/30"
            >
              {pomodoroRunning ? 
                <Pause size={28} className="text-white" /> : 
                <Play size={28} className="text-white" />
              }
            </button>
            <button
              onClick={() => resetPomodoro()}
              className="p-5 bg-white/5 hover:bg-white/10 rounded-full transition-all"
            >
              <RotateCcw size={28} className="text-slate-400" />
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            {[25, 15, 5].map(mins => (
              <button
                key={mins}
                onClick={() => resetPomodoro(mins)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold rounded-lg transition-all"
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Question Tracker */}
        <div className="bg-[#0a0f1e]/60 border border-white/[0.06] rounded-2xl p-8 text-center flex flex-col items-center">
          <div className="flex flex-col items-center justify-center gap-2 mb-6 w-full">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Question Tracker</h2>
            </div>
            
            {isEditingSessionName ? (
              <input 
                type="text" 
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onBlur={() => setIsEditingSessionName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingSessionName(false)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-center text-sm outline-none focus:border-emerald-500 transition-colors w-full max-w-xs mt-2"
                autoFocus
              />
            ) : (
              <div 
                className="flex items-center gap-2 cursor-pointer group hover:text-emerald-400 transition-colors mt-2"
                onClick={() => setIsEditingSessionName(true)}
              >
                <span className="text-white font-bold text-lg">{sessionName}</span>
                <Edit2 size={14} className="text-slate-500 group-hover:text-emerald-400" />
              </div>
            )}
          </div>
          
          <div className="w-full flex justify-between items-center mb-6 px-4">
             <div className="text-left w-[80px]">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Time</div>
               <div className="text-xl md:text-2xl font-mono font-bold text-white">{formatTime(sessionTime)}</div>
             </div>
             <div className="text-center w-[80px]">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Avg/Q</div>
               <div className="text-xl md:text-2xl font-mono font-bold text-blue-400">
                 {questionsSolved > 0 ? formatTime(Math.floor(sessionTime / questionsSolved)) : '00:00'}
               </div>
             </div>
             <div className="text-right w-[80px]">
               <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Solved</div>
               <div className="text-xl md:text-2xl font-black text-emerald-400">{questionsSolved}</div>
             </div>
          </div>

          <div className="text-7xl font-black text-emerald-400 mb-8 font-mono tracking-tight transition-all">
            {formatTime(questionTime)}
          </div>
          
          <div className="flex w-full items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setTrackerRunning(!trackerRunning)}
              className="w-16 h-16 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 rounded-full transition-all shadow-lg shadow-emerald-500/30"
            >
              {trackerRunning ? 
                <Pause size={28} className="text-white" /> : 
                <Play size={28} className="text-white ml-1" />
              }
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={!trackerRunning}
              className="flex-1 max-w-[140px] h-16 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center transition-all uppercase tracking-wider text-sm border border-white/5"
            >
              Next Q
            </button>
          </div>
          
          {(sessionTime > 0) && (
            <button
              onClick={handleEndSession}
              className="w-full mt-auto px-6 py-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-rose-500/20 transition-all shadow-sm"
            >
              End Session & Log
            </button>
          )}
        </div>
      </div>

      {/* Sessions Log */}
      <div className="bg-[#0a0f1e]/60 border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Today's Sessions</h3>
        
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={48} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">No sessions yet today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div 
                key={session.id} 
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  session.type === 'Pomodoro' 
                    ? 'bg-blue-500/5 border-blue-500/20' 
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    session.type === 'Pomodoro' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`} />
                  <div className="flex-1">
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editSessionValue}
                        onChange={(e) => setEditSessionValue(e.target.value)}
                        onBlur={() => saveSessionLogName(session.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveSessionLogName(session.id); }}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors w-full"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="flex items-center gap-2 cursor-pointer group hover:text-emerald-400 transition-colors"
                        onClick={() => startEditingSessionLog(session)}
                      >
                        <span className={`text-sm font-semibold ${session.type.startsWith('Pomodoro') ? 'text-blue-400' : 'text-emerald-400'}`}>
                          {session.type}
                        </span>
                        <Edit2 size={12} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    {session.subject && (
                      <span className="text-xs text-slate-500 mt-1 block">{session.subject}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{session.duration} min</span>
                  <span>{session.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimersPage;
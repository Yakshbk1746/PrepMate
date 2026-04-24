import React from 'react';

const TaskSection = ({ tasks, toggleTask, completedCount, progressPercent }) => (
  <section className="bg-[#111327]/60 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl transition-all hover:border-white/10">
    <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] mb-10">Today's Tasks</h2>
    <div className="space-y-10">
      {tasks.map((task, i) => (
        <div key={task.id} className="flex flex-col space-y-4 animate-in fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex justify-between items-center cursor-pointer group" onClick={() => toggleTask(task.id)}>
            <div className="flex items-center space-x-5">
              <div className={`w-6 h-6 border rounded-lg flex items-center justify-center transition-all duration-300 ${task.completed ? 'border-emerald-500 bg-emerald-500/20 scale-110' : 'border-white/10 bg-white/5 group-hover:border-blue-500'}`}>
                {task.completed && <div className="w-2.5 h-2.5 bg-emerald-400 rounded-sm shadow-[0_0_12px_#10b981]" />}
              </div>
              <span className={`text-base font-semibold transition-all duration-300 ${task.completed ? 'text-slate-400 line-through opacity-50' : 'text-slate-200 group-hover:text-blue-400'}`}>{task.title}</span>
            </div>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.3)] ${task.completed ? 'bg-blue-500 w-full' : 'bg-blue-500/10 w-[20%]'}`} />
          </div>
        </div>
      ))}
    </div>
    <div className="mt-14 pt-8 border-t border-white/5">
      <p className="mb-4 text-[10px] uppercase tracking-[0.4em] font-black text-slate-600">Overall Progress: {completedCount} / {tasks.length}</p>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(37,99,235,0.5)]" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  </section>
);

export default TaskSection;
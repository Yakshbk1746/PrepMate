import React from 'react';

const RevisionSection = ({ revisions, toggleRevision }) => (
  <section className="bg-[#111327]/60 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-xl transition-all hover:border-white/10">
    <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] mb-10">Due Revisions</h2>
    <div className="space-y-8">
      {revisions.map((rev) => (
        <div key={rev.id} className="flex justify-between items-center cursor-pointer group" onClick={() => toggleRevision(rev.id)}>
          <div className="flex items-center space-x-5 transition-transform group-hover:translate-x-2">
            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${rev.completed ? 'bg-slate-700' : 'bg-yellow-500 shadow-[0_0_15px_#eab308] animate-pulse'}`} />
            <span className={`text-sm transition-all duration-300 ${rev.completed ? 'text-slate-700 line-through italic opacity-50' : 'text-slate-200 group-hover:text-white'}`}>{rev.title}</span>
          </div>
          <span className="text-[11px] text-slate-600 font-mono">({rev.time})</span>
        </div>
      ))}
    </div>
  </section>
);

export default RevisionSection;
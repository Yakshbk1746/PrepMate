import React from 'react';
import RevisionCard from '../cards/RevisionCard';

/**
 * RevisionQueue Component
 * Groups revision chunks by Subject and manages the display logic.
 */
const RevisionQueue = ({ revisions, onTaskComplete }) => {
  // Logic to group revisions by Topic Name
  const groupedRevisions = revisions.reduce((groups, task) => {
    const group = groups[task.topic_name] || [];
    group.push(task);
    groups[task.topic_name] = group;
    return groups;
  }, {});

  return (
    <div className="space-y-8">
      {Object.keys(groupedRevisions).length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-3xl">
          <i className="fa-solid fa-circle-check text-slate-700 text-4xl mb-3"></i>
          <p className="text-slate-500 font-medium">All caught up! No revisions due today.</p>
        </div>
      ) : (
        Object.entries(groupedRevisions).map(([topicName, tasks]) => (
          <div key={topicName} className="bg-[#1e2235]/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            {/* Subject Header */}
            <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                  <i className="fa-solid fa-book-bookmark"></i>
                </div>
                <div>
                  <h3 className="text-slate-100 font-bold">{topicName}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                    {tasks.length} {tasks.length === 1 ? 'Chunk' : 'Chunks'} Due
                  </p>
                </div>
              </div>
              <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition uppercase tracking-widest">
                Start Session
              </button>
            </div>

            {/* Sub-topic List */}
            <div className="p-4 custom-scroll max-h-[350px] overflow-y-auto">
              {tasks.map((task) => (
                <RevisionCard 
                  key={task.id} 
                  task={task} 
                  onComplete={onTaskComplete} 
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RevisionQueue;
import React from 'react';

const Confetti = ({ pieces }) => (
  <>
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
      .animate-fall { animation: fall linear forwards; will-change: transform, opacity; }
    `}} />
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute top-[-20px] w-2 h-4 animate-fall shadow-sm"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  </>
);

export default Confetti;
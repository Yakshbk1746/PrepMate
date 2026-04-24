import GlassCard from "./GlassCard";

const DAYS = ["M","T","W","T","F","S","S"];
const DATES = Array.from({ length: 30 }, (_, i) => i + 1);

export default function CalenderCard() {
  return (
    <GlassCard title="Calendar">
      <p className="text-sm text-white/60 mb-4">April 2024</p>

      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {DAYS.map(d => (
          <span key={d} className="text-white/50">{d}</span>
        ))}

        {DATES.map(day => (
          <span
            key={day}
            className={`py-1 rounded-md
              ${day === 12
                ? "bg-blue-500/30 text-white"
                : "text-white/70"
              }`}
          >
            {day}
          </span>
        ))}
      </div>

      <p className="mt-4 text-sm text-white/60">
        GATE Exam • <span className="text-white">52 days remaining</span>
      </p>
    </GlassCard>
  );
}

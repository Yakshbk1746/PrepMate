export default function ProgressBar({ value }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="
          h-full rounded-full
          bg-[linear-gradient(90deg,#3A7AFE,#5B8CFF)]
        "
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

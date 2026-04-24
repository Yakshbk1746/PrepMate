export default function GlassCard({ title, children }) {
  return (
    <section
      className="
        relative
        rounded-2xl
        shadow-[0_10px_30px_rgba(0,0,0,0.4)]
        bg-[rgba(20,26,46,0.85)]
        border border-white/10
        backdrop-blur-xl
        p-6
        text-white
      "
    >
      {title && (
        <h2 className="text-lg font-semibold text-white mb-4">
          {title}
        </h2>
      )}

      <div className="text-white/80">
        {children}
      </div>
    </section>
  );
}

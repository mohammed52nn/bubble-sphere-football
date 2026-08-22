import { useEffect, useState } from "react";

const STAGES = [
  "جارٍ البحث...",
  "جارٍ جمع المعلومات...",
  "جارٍ التحقق من المصادر...",
  "جارٍ ترتيب النتائج...",
];

export function LoadingOrb({ compact = false }: { compact?: boolean }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStage((current) => Math.min(current + 1, STAGES.length - 1));
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-8"
      role="status"
      aria-live="polite"
    >
      <div className={compact ? "relative h-12 w-12" : "relative h-20 w-20"}>
        <span className="bubble-shell absolute inset-0 rounded-full" />
        <span className="animate-sonar absolute inset-0 rounded-full border border-primary/50" />
        <span
          className="animate-sonar absolute inset-0 rounded-full border border-primary/30"
          style={{ animationDelay: "0.8s" }}
        />
        <span className="absolute inset-[30%] rounded-full bg-primary/50 blur-[6px]" />
      </div>
      <p className="text-sm text-muted-foreground text-glow">{STAGES[stage]}</p>
    </div>
  );
}

import { WifiOff } from "lucide-react";

import { useSmartProgress, useStageLabel } from "@/hooks/useSmartProgress";
import { cn } from "@/lib/utils";

const STAGES = [
  "جارٍ تهيئة الملعب...",
  "جارٍ البحث عن اللاعبين...",
  "جارٍ التحقق من المصادر...",
  "جارٍ ترتيب النتائج...",
  "لحظة واحدة، البيانات في الطريق...",
];

interface BootProps {
  active: boolean;
  done: boolean;
  offline: boolean;
  failed: boolean;
  onRetry: () => void;
}

/** First-visit cinematic overlay over the stadium background. */
export function SmartLoaderScreen({ active, done, offline, failed, onRetry }: BootProps) {
  const progress = useSmartProgress(active, done);
  const stage = useStageLabel(active && !offline && !failed, STAGES);
  const problem = offline || failed;

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 flex items-center justify-center px-6 transition-opacity duration-500",
        done ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      role="status"
      aria-live="polite"
      aria-hidden={done}
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />

      <div className="glass-card animate-rise-in relative w-full max-w-xs px-6 py-8 text-center">
        <div className="relative mx-auto h-16 w-16">
          <span className="bubble-shell absolute inset-0 rounded-full" />
          <span className="animate-sonar absolute inset-0 rounded-full border border-primary/50" />
          <span
            className="animate-sonar absolute inset-0 rounded-full border border-primary/30"
            style={{ animationDelay: "0.9s" }}
          />
          <span className="animate-soft-pulse absolute inset-[32%] rounded-full bg-primary/50 blur-[6px]" />
        </div>

        <p className="font-display mt-5 text-base font-bold text-foreground text-glow">
          فقاعات كرة القدم
        </p>

        {problem ? (
          <>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              {offline && <WifiOff className="h-4 w-4 shrink-0" aria-hidden />}
              <span>
                {offline ? "لا يوجد اتصال بالإنترنت الآن." : "تعذّر جمع البيانات من المصدر."}
              </span>
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="glass-panel mt-5 rounded-full px-5 py-2 text-sm font-medium text-foreground transition-transform hover:scale-[1.03] active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              حاول مرة أخرى
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 min-h-[2.5rem] text-sm leading-relaxed text-muted-foreground">
              {stage}
            </p>
            <div
              className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">{progress}%</p>
          </>
        )}
      </div>
    </div>
  );
}

/** Slim inline indicator for searches after the first load. */
export function SmartLoaderInline({ active, done }: { active: boolean; done: boolean }) {
  const progress = useSmartProgress(active, done);
  const stage = useStageLabel(active, STAGES);

  if (!active) return null;

  return (
    <div className="animate-rise-in mx-auto mt-2 w-full max-w-xl px-2" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{stage}</span>
        <span className="tabular-nums">{progress}%</span>
      </div>
      <div className="mt-1 h-[2px] w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

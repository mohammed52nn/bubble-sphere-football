import { CloudOff } from "lucide-react";
import { LoadingOrb } from "./LoadingOrb";
import { PlayerBubble } from "./PlayerBubble";
import type { Bubble } from "@/hooks/useBubbleField";
import type { BubbleLayout } from "./PlayerBubble";
import type { PlayerSeed } from "@/lib/football/types";

interface Props {
  bubbles: Bubble[];
  layouts: Map<string, BubbleLayout>;
  loading: boolean;
  failed: boolean;
  onOpen: (seed: PlayerSeed) => void;
  onRetry: () => void;
}

export function BubbleField({ bubbles, layouts, loading, failed, onOpen, onRetry }: Props) {
  if (loading && bubbles.length === 0) {
    return (
      <div className="flex min-h-[62vh] items-center justify-center">
        <LoadingOrb />
      </div>
    );
  }

  if (bubbles.length === 0) {
    return (
      <div className="flex min-h-[62vh] items-center justify-center px-6">
        <div className="glass-card animate-rise-in max-w-sm px-6 py-8 text-center">
          <CloudOff className="mx-auto h-7 w-7 text-primary/80" aria-hidden />
          <h2 className="mt-3 text-base font-semibold text-foreground">
            {failed ? "تعذّر جلب اللاعبين الآن" : "لا نتائج لهذا البحث"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {failed
              ? "المصدر غير متاح مؤقتًا. لن نعرض معلومات غير مؤكدة."
              : "جرّب اسم لاعب أو نادٍ أو دوري، أو اطلب اكتشافًا جديدًا."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="glass-panel mt-5 rounded-full px-5 py-2 text-sm font-medium text-foreground transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            حاول مرة أخرى
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[74vh] w-full" aria-label="حقل فقاعات اللاعبين">
      {bubbles.map((bubble) => {
        const layout = layouts.get(bubble.key);
        if (!layout) return null;
        return (
          <PlayerBubble
            key={bubble.key}
            seed={bubble.seed}
            layout={layout}
            phase={bubble.phase}
            onOpen={onOpen}
          />
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { Users } from "lucide-react";
import type { PlayerSeed } from "@/lib/football/types";
import { initialsOf, seededRandom } from "@/lib/football/format";
import { cn } from "@/lib/utils";

export interface BubbleLayout {
  left: number;
  top: number;
  size: number;
  depth: number;
}

interface Props {
  seed: PlayerSeed;
  layout: BubbleLayout;
  phase: "entering" | "live" | "exiting";
  onOpen: (seed: PlayerSeed) => void;
}

export function PlayerBubble({ seed, layout, phase, onOpen }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [sheen, setSheen] = useState(0);

  const driftX = 8 + seededRandom(seed.id, 1) * 12;
  const driftY = 10 + seededRandom(seed.id, 2) * 16;
  const duration = 22 + seededRandom(seed.id, 3) * 16;
  const delay = seededRandom(seed.id, 4) * 8;
  const showImage = Boolean(seed.image) && !imageFailed;

  return (
    <div
      className="absolute"
      style={{
        insetInlineStart: `${layout.left}%`,
        top: `${layout.top}%`,
        width: `${layout.size}%`,
        opacity: layout.depth,
        zIndex: Math.round(layout.depth * 10),
      }}
    >
      <div
        className={cn(
          "animate-bubble-float",
          phase === "entering" && "animate-bubble-enter",
          phase === "exiting" && "animate-bubble-exit",
        )}
        style={
          {
            "--drift-x": driftX,
            "--drift-y": driftY,
            "--float-duration": `${duration}s`,
            "--float-delay": `-${delay}s`,
          } as React.CSSProperties
        }
      >
        <button
          type="button"
          onPointerDown={() => {
            setPressed(true);
            setSheen((value) => value + 1);
          }}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          onClick={() => onOpen(seed)}
          aria-label={`عرض ملف اللاعب ${seed.displayName}`}
          className={cn(
            "bubble-shell group relative block aspect-square w-full overflow-hidden rounded-full transition-transform duration-300 ease-out",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            pressed ? "scale-[0.94]" : "hover:scale-[1.04]",
          )}
        >
          {showImage ? (
            <img
              src={seed.image ?? ""}
              alt={`صورة اللاعب ${seed.displayName}`}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="absolute inset-0 h-full w-full scale-105 object-cover object-top"
              style={{ direction: "ltr" }}
            />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-secondary/50">
              <Users className="h-5 w-5 text-primary/80" aria-hidden />
              <span className="font-display text-lg font-semibold text-silver/90">
                {initialsOf(seed.latinName)}
              </span>
            </span>
          )}

          {/* glass reflection + rim */}
          <span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(160deg, oklch(1 0 0 / 30%) 0%, transparent 38%, transparent 70%, oklch(0.8 0.1 224 / 18%) 100%)",
            }}
          />
          <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-silver/25" />
          {sheen > 0 && (
            <span
              key={sheen}
              className="animate-sheen pointer-events-none absolute -inset-y-4 start-0 w-1/3 bg-silver/25 blur-md"
            />
          )}

          {/* readability scrim behind the name */}
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-full"
            style={{
              background:
                "linear-gradient(to top, oklch(0.14 0.04 258 / 88%) 0%, oklch(0.14 0.04 258 / 45%) 55%, transparent 100%)",
            }}
          />

          {/* name plate */}
          <span className="absolute inset-x-1.5 bottom-[6%] rounded-full border border-silver/20 bg-background/55 px-1.5 py-[3px] text-center backdrop-blur-sm">
            <span className="block truncate text-[11px] leading-tight font-medium text-foreground text-glow">
              {seed.displayName}
            </span>
          </span>

          {seed.hasNews && (
            <span className="animate-soft-pulse absolute top-1.5 end-1.5 rounded-full bg-accent/90 px-1.5 py-[1px] text-[9px] font-semibold text-accent-foreground">
              جديد
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

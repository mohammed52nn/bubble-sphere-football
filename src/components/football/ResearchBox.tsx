import { useState } from "react";
import { RefreshCw, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  busy: boolean;
  interpretation: string | null;
  onSubmit: (query: string) => void;
  onClear: () => void;
  onShuffle: () => void;
  onFocusChange: (focused: boolean) => void;
}

export function ResearchBox({
  value,
  busy,
  interpretation,
  onSubmit,
  onClear,
  onShuffle,
  onFocusChange,
}: Props) {
  const [draft, setDraft] = useState(value);

  return (
    <div className="animate-rise-in px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center justify-between gap-3 px-1 pb-2">
          <h1 className="font-display text-lg leading-none font-bold tracking-tight text-foreground text-glow">
            فقاعات كرة القدم
          </h1>
          <button
            type="button"
            onClick={onShuffle}
            aria-label="اكتشاف مجموعة جديدة"
            className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-silver/90 transition-transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} aria-hidden />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(draft.trim());
            (event.currentTarget.querySelector("input") as HTMLInputElement | null)?.blur();
          }}
          className="glass-panel flex items-center gap-2 rounded-full px-3 py-2"
        >
          <Search className="h-4 w-4 shrink-0 text-primary/90" aria-hidden />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            enterKeyHint="search"
            placeholder="اسم لاعب، نادٍ، دوري، أو سؤال..."
            aria-label="ابحث عن لاعبين"
            className="min-w-0 flex-1 bg-transparent py-1 text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
          />
          {draft.length > 0 && (
            <button
              type="button"
              aria-label="مسح البحث"
              onClick={() => {
                setDraft("");
                onClear();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            بحث
          </button>
        </form>

        {interpretation && (
          <p className="animate-rise-in mt-2 flex items-start gap-1.5 px-2 text-[12px] leading-relaxed text-muted-foreground">
            <Sparkles className="mt-[2px] h-3.5 w-3.5 shrink-0 text-accent/90" aria-hidden />
            <span>{interpretation}</span>
          </p>
        )}
      </div>
    </div>
  );
}

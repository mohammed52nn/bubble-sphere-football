import { useCallback, useEffect } from "react";
import { ExternalLink, Globe, RotateCw, Share2, ShieldCheck, Users, X } from "lucide-react";
import { toast } from "sonner";

import { LoadingOrb } from "./LoadingOrb";
import { formatDate, initialsOf, relativeTime } from "@/lib/football/format";
import { UNAVAILABLE, type PlayerProfile, type PlayerSeed } from "@/lib/football/types";

interface Props {
  seed: PlayerSeed;
  profile: PlayerProfile | null;
  loading: boolean;
  failed: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="glass-panel rounded-lg px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">
        {value ?? <span className="text-xs font-normal text-muted-foreground">غير متوفر</span>}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="font-display mb-2 text-sm font-semibold text-silver">{title}</h3>
      {children}
    </section>
  );
}

export function PlayerProfileOverlay({
  seed,
  profile,
  loading,
  failed,
  refreshing,
  onRefresh,
  onClose,
}: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const image = profile?.image ?? seed.image;
  const name = profile?.displayName ?? seed.displayName;

  const handleShare = useCallback(async () => {
    if (typeof navigator === "undefined") return;
    const nav: Navigator = navigator;
    const text = `${name} — فقاعات كرة القدم`;
    const url = typeof window === "undefined" ? "" : window.location.href;
    try {
      if (typeof nav.share === "function") {
        await nav.share({ title: text, text, url });
        return;
      }
      if (nav.clipboard) {
        await nav.clipboard.writeText(`${text}\n${url}`);
        toast.success("تم نسخ الرابط.");
        return;
      }
      toast.error("المشاركة غير مدعومة على هذا الجهاز.");
    } catch {
      /* المستخدم ألغى المشاركة — لا شيء لفعله */
    }
  }, [name]);




  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`ملف اللاعب ${name}`}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-background/70 backdrop-blur-xl"
    >
      <div className="mx-auto min-h-full w-full max-w-xl pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-background/40 px-4 py-3 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق ملف اللاعب"
            className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleShare();
              }}
              aria-label={`مشاركة ملف ${name}`}
              className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Share2 className="h-4 w-4" aria-hidden />
            </button>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(seed.latinName)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              aria-label={`ابحث عن ${name} في Google`}
              className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Globe className="h-4 w-4" aria-hidden />
            </a>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRefresh();
              }}
              disabled={refreshing || loading}
              className="glass-panel flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-foreground disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <RotateCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
              تحديث
            </button>
          </div>
        </div>




        <div className="animate-rise-in px-4">
          <div className="flex items-end gap-4">
            <div className="bubble-shell relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
              {image ? (
                <img
                  src={image}
                  alt={`صورة اللاعب ${name}`}
                  className="h-full w-full scale-105 object-cover object-top"
                  style={{ direction: "ltr" }}
                />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1">
                  <Users className="h-5 w-5 text-primary/80" aria-hidden />
                  <span className="font-display text-lg font-semibold text-silver/90">
                    {initialsOf(profile?.latinName ?? seed.latinName)}
                  </span>
                </span>
              )}
            </div>
            <div className="min-w-0 pb-1">
              <h2 className="font-display truncate text-xl font-bold text-foreground text-glow">
                {name}
              </h2>
              <p className="truncate text-xs text-muted-foreground" style={{ direction: "ltr" }}>
                {profile?.latinName ?? seed.latinName}
              </p>
              <p className="mt-1 truncate text-xs text-silver/90">
                {[profile?.club ?? seed.club, profile?.position ?? seed.position]
                  .filter(Boolean)
                  .join(" · ") || "غير متوفر"}
              </p>
            </div>
          </div>

          {loading && !profile && <LoadingOrb />}

          {failed && !profile && (
            <p className="glass-card mt-6 px-4 py-6 text-center text-sm text-muted-foreground">
              {UNAVAILABLE}
            </p>
          )}

          {profile && (
            <>
              <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Field label="النادي" value={profile.club} />
                <Field label="المركز" value={profile.position} />
                <Field label="الجنسية" value={profile.nationality} />
                <Field
                  label="العمر"
                  value={profile.age ? `${profile.age} سنة` : null}
                />
                <Field label="القدم المفضلة" value={profile.preferredFoot} />
                <Field label="الرقم" value={profile.shirtNumber} />
                <Field label="الطول" value={profile.height} />
                <Field label="القيمة السوقية" value={profile.marketValue} />
                <Field label="التقييم" value={profile.rating} />
              </dl>

              {profile.bio && (
                <Section title="نبذة">
                  <p className="glass-card px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                    {profile.bio}
                  </p>
                </Section>
              )}

              {profile.stats.length > 0 && (
                <Section title="أرقام">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {profile.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="glass-panel rounded-lg px-3 py-2 text-center"
                      >
                        <p className="font-display text-lg font-bold text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {profile.career.length > 0 && (
                <Section title="المسيرة">
                  <ol className="glass-card divide-y divide-border/60 px-4">
                    {profile.career.map((step, index) => (
                      <li key={`${step.club}-${index}`} className="py-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">{step.club}</p>
                          <p
                            className="shrink-0 text-[11px] text-muted-foreground"
                            style={{ direction: "ltr" }}
                          >
                            {step.period}
                          </p>
                        </div>
                        {step.note && (
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {step.note}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {profile.achievements.length > 0 && (
                <Section title="الإنجازات">
                  <ul className="flex flex-wrap gap-2">
                    {profile.achievements.map((item) => (
                      <li
                        key={item}
                        className="glass-panel rounded-full px-3 py-1.5 text-xs text-silver"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title="أخبار حديثة">
                {profile.news.length === 0 ? (
                  <p className="glass-card px-4 py-5 text-center text-xs text-muted-foreground">
                    لا أخبار حديثة موثوقة عن هذا اللاعب الآن.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {profile.news.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-card block px-4 py-3 transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <p className="text-sm leading-snug font-medium text-foreground">
                            {item.title}
                          </p>
                          {item.summary && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {item.summary}
                            </p>
                          )}
                          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-silver/80">
                            <ExternalLink className="h-3 w-3" aria-hidden />
                            <span className="truncate">{item.source}</span>
                            {item.publishedAt && (
                              <>
                                <span aria-hidden>·</span>
                                <span>{relativeTime(item.publishedAt)}</span>
                              </>
                            )}
                          </p>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {profile.sources.length > 0 && (
                <Section title="المصادر">
                  <ul className="flex flex-wrap gap-2">
                    {profile.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="glass-panel inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-silver"
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden />
                          {source.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <p className="mt-6 flex flex-wrap items-center gap-2 px-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-accent/90" aria-hidden />
                <span>مستوى الثقة: {Math.round(profile.confidence * 100)}%</span>
                <span aria-hidden>·</span>
                <span>آخر تحديث: {formatDate(profile.lastUpdated)}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

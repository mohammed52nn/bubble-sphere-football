import stadium from "@/assets/stadium.jpg";

/**
 * Stadium stays readable: moderate blur + blue grading + haze + vignette,
 * with a very slow camera drift. No heavy canvas work.
 */
export function StadiumBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={stadium}
        alt="ملعب كرة قدم مضاء بالكشافات"
        width={1280}
        height={1920}
        className="animate-drift-bg h-full w-full object-cover [filter:blur(2.5px)_saturate(0.85)_brightness(0.78)]"
      />
      <div className="veil absolute inset-0" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 20%, oklch(0.8 0.1 220 / 14%) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 100% at 50% 50%, transparent 45%, oklch(0.1 0.04 258 / 65%) 100%)",
        }}
      />
    </div>
  );
}

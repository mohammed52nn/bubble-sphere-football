import { createFileRoute, Link } from "@tanstack/react-router";
import { StadiumBackground } from "@/components/football/StadiumBackground";

const URL = "https://bubble-sphere-football.lovable.app/players";
const TITLE = "لاعبين كرة القدم — اكتشف ملفاتهم | فقاعات كرة القدم";
const DESCRIPTION =
  "اكتشف لاعبي كرة القدم من خلال ملفات عربية: النبذة، المسيرة، الإنجازات، النادي الحالي المُتحقَّق منه، وأحدث الأخبار بمصادرها.";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden px-5 py-12">
      <StadiumBackground />
      <article className="glass-card relative mx-auto max-w-2xl space-y-5 px-6 py-8 leading-relaxed text-foreground">
        <h1 className="font-display text-2xl font-semibold">لاعبين كرة القدم — اكتشف ملفاتهم</h1>
        <p className="text-muted-foreground">
          فقاعات كرة القدم طريقة عربية ممتعة للتعرّف على لاعبي كرة القدم حول العالم، من النجوم المعروفين إلى المواهب الصاعدة.
        </p>
        <h2 className="text-lg font-semibold">ماذا تجد في ملف كل لاعب؟</h2>
        <ul className="list-disc space-y-1 ps-5 text-muted-foreground">
          <li>نبذة عربية مختصرة عن اللاعب ومركزه وجنسيته.</li>
          <li>مسيرته مع الأندية وأبرز إنجازاته وأرقامه المتاحة.</li>
          <li>النادي الحالي، ويُتحقَّق منه تلقائيًا من مصادر وأخبار حديثة.</li>
          <li>أحدث الأخبار عن اللاعب مع ذكر مصدر كل خبر.</li>
        </ul>
        <h2 className="text-lg font-semibold">كيف تبحث عن لاعب؟</h2>
        <p className="text-muted-foreground">
          اكتب اسم لاعب أو نادٍ أو دوري في شريط البحث، أو اطلب اكتشافًا جديدًا، ثم اضغط على أي فقاعة لفتح ملف اللاعب.
          لا نعرض معلومة إلا إذا وُجد لها مصدر موثوق.
        </p>
        <Link
          to="/"
          className="glass-panel inline-block rounded-full px-5 py-2 text-sm font-medium text-foreground"
        >
          ابدأ الاكتشاف
        </Link>
      </article>
    </main>
  );
}

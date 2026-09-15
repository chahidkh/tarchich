import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SUPPORT_EMAIL } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | مكتبة ترشيش" },
      {
        name: "description",
        content: "قصة مكتبة ترشيش: منصة عربية متخصصة في التراث والكتب التاريخية، رسالتها وقيمها في صون المعرفة ونشرها.",
      },
      { property: "og:title", content: "من نحن | مكتبة ترشيش" },
      { property: "og:description", content: "منصة عربية متخصصة في التراث والكتب التاريخية — رسالتنا وقيمنا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

const STORY: string[] = [
  "وُلدت مكتبة ترشيش من سؤال بسيط: أين يذهب القارئ العربي حين يبحث عن كتاب تراثي موثوق، بنسخة نظيفة ومصدر معروف؟",
  "جمعنا في مكان واحد نفائس التاريخ والأدب والفلسفة والتصوّف والفقه، من أمّهات الكتب إلى المخطوطات المطبوعة، مع وصف واضح لكل عنوان ومصدره وحقوق نشره.",
  "إلى جانب المتجر، بنينا جريدة ثقافية ومجلساً للحوار، ليكون الكتاب بداية نقاش لا نهايته.",
];

const VALUES: { title: string; body: string }[] = [
  {
    title: "الموثوقية قبل الوفرة",
    body: "كل عنوان في المكتبة له مصدر معروف وغلاف حقيقي ونسخة قابلة للتحقق؛ لا نضيف كتاباً لا نستطيع توثيقه.",
  },
  {
    title: "احترام حقوق النشر",
    body: "نعتمد الكتب في الملك العام والمصادر المتاحة قانونياً، ونُرفق إشعار الحقوق والمصدر مع كل عنوان.",
  },
  {
    title: "جمال العرض",
    body: "التراث يستحق واجهة تليق به: خط عربي أنيق، ألوان دافئة، وتجربة قراءة مريحة على الهاتف والحاسوب.",
  },
  {
    title: "مجتمع لا جمهور",
    body: "القارئ عندنا مشارك: يعلّق، يقيّم الكتب، ويفتح النقاش في المجلس الثقافي.",
  },
];

const ERAS = ["التراث الإسلامي", "التاريخ", "الأدب", "الفلسفة والعلوم", "التصوف", "اللغة والمعاجم", "الرحلات والجغرافيا"];

function About() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-4 py-14">
        <header className="mb-8 text-center">
          <h1 className="text-4xl text-gold">من نحن</h1>
          <div className="gold-rule mx-auto mt-5 w-32" />
          <p className="mt-4 text-sm leading-8 text-muted-foreground">
            مكتبة ترشيش منصة عربية متخصصة في التراث والكتب التاريخية — حيث تُصان المعرفة وتُروى.
          </p>
        </header>

        <article className="glass rounded-xl p-5">
          <h2 className="font-display text-xl text-gold">قصتنا</h2>
          <div className="mt-3 grid gap-2 text-sm leading-8 text-muted-foreground">
            {STORY.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </article>

        <article className="glass mt-4 rounded-xl p-5">
          <h2 className="font-display text-xl text-gold">رسالتنا</h2>
          <p className="mt-3 text-sm leading-8 text-muted-foreground">
            أن نجعل الوصول إلى الكتاب التراثي الموثوق سهلاً وجميلاً لكل قارئ عربي، وأن نُبقي هذا الإرث حيّاً في نقاش
            اليوم لا في رفوف الأمس.
          </p>
        </article>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <article key={v.title} className="glass rounded-xl p-5">
              <h3 className="font-display text-lg text-gold">{v.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{v.body}</p>
            </article>
          ))}
        </div>

        <section className="mt-10 border-y border-border py-8 text-center">
          <h2 className="text-2xl text-gold">تصفّح بحسب العصور والفنون</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {ERAS.map((era) => (
              <Link key={era} to="/store" search={{ q: era }} className="glass rounded-full border-gold/30 px-4 py-2 text-xs text-muted-foreground transition hover:border-gold/60 hover:text-gold">
                {era}
              </Link>
            ))}
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          للتواصل معنا أو اقتراح كتاب:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gold hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}

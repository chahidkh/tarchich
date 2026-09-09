import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SUPPORT_EMAIL } from "@/components/site-footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام | مكتبة ترشيش" },
      {
        name: "description",
        content:
          "الشروط والأحكام لاستخدام مكتبة ترشيش: طبيعة المنتجات الرقمية، سياسة عدم الاسترجاع بعد التحميل، حقوق النشر، والمسؤوليات.",
      },
      { property: "og:title", content: "الشروط والأحكام | مكتبة ترشيش" },
      {
        property: "og:description",
        content: "شروط استخدام متجر مكتبة ترشيش ومنتجاته الرقمية وحقوق النشر.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terms,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "أولاً: طبيعة المنتجات",
    body: [
      "تقدّم مكتبة ترشيش كتباً رقمية بصيغة PDF، كثير منها من التراث والملكية العامة، تُسلَّم إلكترونياً فور إتمام الدفع عبر رابط تحميل.",
      "بعض المنتجات قد تكون روابط توصية لمتاجر خارجية؛ في هذه الحالة تتم عملية الشراء والتسليم لدى المتجر الخارجي وتسري شروطه.",
    ],
  },
  {
    title: "ثانياً: سياسة عدم الاسترجاع",
    body: [
      "نظراً للطبيعة الرقمية للمنتجات، لا يمكن استرجاع أو استبدال أي كتاب بعد إتمام الدفع وإتاحة رابط التحميل.",
      "إذا واجهت مشكلة تقنية تمنع تحميل الملف الذي دفعت ثمنه، راسلنا خلال 7 أيام وسنعالج الأمر بإصلاح الرابط أو التعويض المناسب.",
    ],
  },
  {
    title: "ثالثاً: حقوق النشر والملكية الفكرية",
    body: [
      "الكتب المعروضة من التراث والملكية العامة ولا تخضع لحقوق نشر؛ مع ذلك يبقى تصميم الموقع ومحتواه التحريري وشعاره ملكاً لمكتبة ترشيش.",
      "شراؤك يمنحك ترخيص استخدام شخصي غير حصري؛ لا يجوز إعادة بيع الملفات أو نشرها تجارياً.",
      "إذا كنت صاحب حقوق وتعتقد أن محتوى ما ينتهك حقوقك، راسلنا فوراً وسنراجع ونزيل المحتوى المخالف عند ثبوت ذلك.",
    ],
  },
  {
    title: "رابعاً: مسؤوليات المستخدم",
    body: [
      "أنت مسؤول عن سرية حسابك وعن كل نشاط يتم من خلاله.",
      "يُمنع إساءة استخدام المجلس الثقافي بنشر محتوى مسيء أو مخالف للقوانين، ويحق لنا إزالة أي محتوى أو تقييد أي حساب يخالف ذلك.",
    ],
  },
  {
    title: "خامساً: حدود المسؤولية والتعديلات",
    body: [
      "نبذل جهداً معقولاً لضمان عمل الموقع ودقة المحتوى، ولا نضمن خلو الخدمة من الانقطاعات.",
      "قد نعدّل هذه الشروط من وقت لآخر، واستمرارك في استخدام الموقع يعني موافقتك على النسخة المحدّثة.",
      `للاستفسار حول هذه الشروط: ${SUPPORT_EMAIL}`,
    ],
  },
];

function Terms() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-4 py-14">
        <header className="mb-8 text-center">
          <h1 className="text-4xl text-gold">الشروط والأحكام</h1>
          <div className="gold-rule mx-auto mt-5 w-32" />
          <p className="mt-4 text-sm text-muted-foreground">
            باستخدامك مكتبة ترشيش فأنت توافق على الشروط التالية؛ نرجو قراءتها بعناية.
          </p>
        </header>

        <div className="grid gap-4">
          {SECTIONS.map((s) => (
            <article key={s.title} className="glass rounded-xl p-5">
              <h2 className="font-display text-xl text-gold">{s.title}</h2>
              <div className="mt-3 grid gap-2 text-sm leading-7 text-muted-foreground">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          آخر تحديث: سبتمبر 2026
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}

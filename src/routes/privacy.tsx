import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SUPPORT_EMAIL } from "@/components/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | مكتبة ترشيش" },
      {
        name: "description",
        content:
          "سياسة الخصوصية في مكتبة ترشيش: كيف نجمع بياناتك ونستخدمها، ملفات تعريف الارتباط، وحقوقك كمستخدم.",
      },
      { property: "og:title", content: "سياسة الخصوصية | مكتبة ترشيش" },
      {
        property: "og:description",
        content: "كيف تعامل مكتبة ترشيش بيانات مستخدميها وما هي حقوقهم.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacy,
});

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "أولاً: البيانات التي نجمعها",
    body: [
      "عند إنشاء حساب في مكتبة ترشيش نجمع: الاسم المعروض، والبريد الإلكتروني، والصورة الرمزية وصورة الغلاف إن اخترت رفعها.",
      "عند الشراء نسجّل تفاصيل الطلب (الكتاب، المبلغ، وقت العملية). تُعالج مدفوعات البطاقات عبر مزوّد الدفع ولا نخزّن أرقام البطاقات على خوادمنا إطلاقاً.",
      "عند مراسلتنا عبر نموذج التواصل نحتفظ باسمك وبريدك ونص الرسالة للرد عليك.",
      "نجمع بيانات تقنية أساسية (نوع المتصفح، الصفحات المزارة) لتحسين الخدمة.",
    ],
  },
  {
    title: "ثانياً: كيف نستخدم بياناتك",
    body: [
      "تشغيل حسابك وإتاحة مشترياتك الرقمية وتحميلها.",
      "عرض اسمك وصورتك في المجلس الثقافي والتعليقات كما خصّصتها بنفسك.",
      "الرد على رسائلك واستفساراتك عبر البريد.",
      "تحسين المحتوى والخدمة؛ ولا نبيع بياناتك ولا نشاركها مع أي طرف ثالث لأغراض تسويقية.",
    ],
  },
  {
    title: "ثالثاً: ملفات تعريف الارتباط والتخزين المحلي",
    body: [
      "نستخدم التخزين المحلي في متصفحك لحفظ تفضيلاتك (اللغة، نمط القراءة، العملة) وسلة المشتريات وجلسة تسجيل الدخول.",
      "هذه الملفات ضرورية لعمل الموقع ولا تُستخدم لتتبّعك عبر مواقع أخرى.",
    ],
  },
  {
    title: "رابعاً: حقوقك",
    body: [
      "يحق لك في أي وقت: تعديل اسمك وصورتك من لوحة حسابك، أو طلب الاطلاع على بياناتك، أو تصحيحها، أو حذف حسابك نهائياً.",
      "لممارسة أي من هذه الحقوق راسلنا عبر البريد أدناه وسنستجيب خلال مدة معقولة.",
    ],
  },
  {
    title: "خامساً: التواصل",
    body: [`لأي سؤال حول هذه السياسة أو خصوصيتك: ${SUPPORT_EMAIL}`],
  },
];

function Privacy() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-4 py-14">
        <header className="mb-8 text-center">
          <h1 className="text-4xl text-gold">سياسة الخصوصية</h1>
          <div className="gold-rule mx-auto mt-5 w-32" />
          <p className="mt-4 text-sm text-muted-foreground">
            خصوصيتك أمانة؛ هذه الصفحة تشرح بشفافية كيف نتعامل مع بياناتك في مكتبة ترشيش.
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
          آخر تحديث: سبتمبر 2026 — قد نحدّث هذه السياسة من وقت لآخر ويُشار إلى ذلك هنا.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}

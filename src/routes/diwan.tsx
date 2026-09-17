import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Feather, Mail, MessagesSquare, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/book-cover";
import { SiteFooter, SUPPORT_EMAIL } from "@/components/site-footer";
import { useCart } from "@/lib/cart";
import { useSiteSettings } from "@/lib/site-settings";
import faridKhadoumaPhoto from "@/assets/farid-khadouma.jpg.asset.json";

export const Route = createFileRoute("/diwan")({
  head: () => ({
    meta: [
      { title: "الديوان | فريد خدومة" },
      { name: "description", content: "السيرة الأدبية ومؤلفات الكاتب فريد خدومة، من الرواية والشعر إلى الدراسات والمعاجم." },
      { property: "og:title", content: "الديوان | فريد خدومة" },
      { property: "og:description", content: "محطات من سيرة فريد خدومة وأكثر من ثلاثين مؤلفاً في الأدب والفكر والدراسات الشرعية." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiwanPage,
});

const BIOGRAPHY = [
  "أنا الكاتب فريد خدومة من مواليد سنة 1970 بقرية القصر من ولاية قفصة بالجمهورية التونسية. تعلقت بالسياسة صغيراً، وانتميت إلى إحدى التنظيمات المعارضة لحكم بورقيبة ببلادي ولم أبلغ بعد السادسة عشرة، فسُجنت أول مرة سنة 1987، لأغادر السجن بعد انقلاب السابع من نوفمبر على بورقيبة، والحقاً بعد الثورة نشرت كتابي حول حادثة انقلاب السابع والثامن من نوفمبر 1987 وأسميته: الإسلاميون وبورقيبة وجهاً لوجه: مجموعة الإنقاذ الوطني. سُجنت المرة الثانية في عهد الديكتاتور زين العابدين بن علي، واستمرت تلك المحنة لأكثر من ثماني سنوات.",
  "طفولتي كانت بقريتي القصر، كأغلب أبناء جيلي دراسة ولعب، كنا أسرة تتكون من تسعة أفراد، وكانت والدتي رحمها الله هي العائل الوحيد للأسرة، والحقاً كبر إخوتي وتغيرت ظروف البيت نحو الأحسن مع الوقت. كانت بداياتي تماسّي مع الكتابة وأنا بالسنة الأولى من التعليم الثانوي، وحصراً كنت أكتب الشعر بقلب طفل صغير في الثالثة عشرة الزاهي فيما أخط، وكنت أستشير أستاذتي آسية وكانت تثني على ما أكتب خيراً، مع بعض الإرشادات. كنت شغوفاً بالمطالعة ولو على حساب الدراسة، والأستاذ بالصورة، وكثيراً ما كنت أطالع في قاعة الدرس، وكان من الصعب عليّ أن أبدأ كتاباً ولا أنهيه أو أن يشرح مسألة ما. مازلت إلى يوم الناس هذا أرى بأن الثقافة في وادٍ والتعليم المدرسي في وادٍ آخر، ولا توجد علاقة بين هذا وذاك، وأنا كنت مطالعاً لا مدرسياً، وإن كان لذلك، لذا كنت في البداية الجادة مع الكتابة.",
  "حيث اعتقلت للمرة الثانية سنة 1991 ولا رفيق لك في سجن كبير بعد أبناء الأصدقاء، بداية فكرتك بالطبع إلا الورقة والقلم، عدت إلى الشعر وبكل قوة، وكتبت خلال الفترة السجنية الثانية أحلى قصائدي، ومنها: تصنيع الأحلام المحرمة، وقصيدة عروس الأوطان، وجذع النخلة، وغير ذلك كثير، وقد نشرت أغلب تلك القصائد بعد ذلك في مجاميعي الشعرية الأربع. بدأت أتدرب على كتابة القصة القصيرة مع الدكتور السجين الصديق عبد الحميد الشريف أطال الله عمره، ومن القصة القصيرة إلى المطولة، ومنها إلى الرواية. غادرت سجن القصرين سنة 1994 لأنتقل في اتجاه سجون أخرى، ليستقر بي المقام أخيراً في سجن صفاقس، ألكتب هناك أشهر رواياتي وهي: يوم قرر ترشيش الأعرج بأن يصبح رجلاً، وقد نشرت لاحقاً بعد الثورة وتولى نشرها الصديق بلال مسعودي صاحب دار ميارة للنشر والتوزيع، وهو الذي تولى كذلك نشر مجاميعي الشعرية الأربع، وروايتي: كسار في أرض التيه.",
  "بعد السجن وقبل الثورة بعشر سنين بدأت النشر المستمر غير المنقطع إلى يوم الناس هذا، حتى تجاوزت منشوراتي الثلاثين، وعلاوة على ما ذكرت نشرت كتابي الشخصية التونسية بين التاريخ والسياسة، وكنت في الوقت نفسه أوالي نشر مقالات ودراسات في موقع الفجر نيوز المعارض، وتونس نيوز، وأقلام أون لاين، وكان المشرفون على كل تلك المواقع مقيمون خارج الوطن. قبل الثورة كنت أشارك في أغلب المهرجانات والملتقيات الشعرية، فلمع اسمي، وفزت بالجائزة الأولى أكثر من مرة. شاركت في النشاط الحقوقي المعارض فكنت من ضمن جملة من أسسوا منظمة حرية وإنصاف الحقوقية، كما استمرت مضايقة نظام بن علي لي حتى منعني من العمل، وسحب جواز سفري، ومع ذلك ما ابتعدت عن الكتابة والبحث والتوثيق.",
  "بعد الثورة كانت الطريق حقيقة أمامي سالكة، فتمكنت من نشر أغلب كتبي، وانتميت لاتحاد الكتّاب التونسيين، ثم استقلت منه بعد انقلاب الخامس والعشرين من شهر جويلية لسنة 2021 لانحياز المكتب التنفيذي للاتحاد للمنقلب، وانحيازي للثوار الذين غادروا عن رفضهم للانقلاب عن الشرعية، ومع النضال استمر مددي وما انقطع. بعد الثورة وقبل انقلاب 2021 كلفت بالإشراف على الصفحة الثقافية لجريدة الرأي العام، واستمر إشرافي عليها دونما انقطاع لخمس سنوات متتاليات، وفيها نشرت سلاسل بحثية مازلت أحتفظ بها ليوم الناس هذا، كالدين في أمريكا، وفي ظلال السيرة، ومبدعون في الميزان، وغير ذلك كثير، وقد لاقت تلك السلاسل نجاحاً كبيراً وتفاعلاً محترماً، وقد ينشر بعضها لاحقاً في كتاب أو أكثر.",
  "غادرت تونس في اتجاه إسطنبول لأن الظرف السياسي والأمني لم يعد موائماً لي، وهناك انتميت للجمعية الدولية للأكاديميين العرب تحت إشراف الدكتور السوري عاطف نمور، وألقيت فيها محاضرة بعنوان: السيرة النبوية من أجل رؤية تفكيكية، والحقاً أسست منتداي الخاص تحت مسمى: منتدى مثاقفات إسطنبول في إسطنبول. أتممت بعض مشاريعي البحثية في المجال الأدبي، وفي مجال الدراسات الشرعية، وقد وُفقت بفضل الله تعالى في هذه السنة 2026 بأن نشرت ستة كتب معجمية دفعة واحدة تحت مسمى سلسلة المستصحب، وتبنى النشر مركز الشيخ علي الغرياني للكتاب بليبيا. من أنا لست بصدد الاشتغال على أكثر من ذلك، عمل في المجال الشرعي والفكري سيرى ما أخط النور في وقته إن كان في العمر بقية.",
  "أعتبر تجربتي عصامية، وإن أخذت بعداً أكاديمياً حرفياً صارماً مع الوقت، إلا أنني من الذين يرون بأن الإبداع مشروع ذاتي خاص لا يمكن بأن يكون نتاجاً مدرسياً وللمدرسة والجامعة نصيب بالتأكيد في صقل تلك الموهبة، ولكن الجامعة لا تخلق الموهبة ولا توجد ولا تفرض عليك بأن تعانق الورق والحبر سابقاً، والحاسوب اليوم لأكثر من ثماني ساعات يومياً حتى تصبح مبدعاً. أُسّس إسطنبول نيور 2026",
] as const;

const TIMELINE = [
  ["1970", "الميلاد بقرية القصر بولاية قفصة تونس"],
  ["1987", "الاعتقال الأول"],
  ["1991", "الاعتقال الثاني وبداية كتابة الرواية في السجن"],
  ["بعد الثورة", "الإشراف على الصفحة الثقافية بجريدة الرأي العام لخمس سنوات وتأسيس منظمة حرية وإنصاف الحقوقية"],
  ["2021", "الاستقلال عن اتحاد الكتّاب التونسيين"],
  ["إسطنبول", "الانتقال إلى إسطنبول وتأسيس منتدى مثاقفات إسطنبول"],
  ["2026", "صدور سلسلة المستصحب المعجمية عن مركز الشيخ علي الغرياني بليبيا"],
] as const;

type WorkCategory = "روايات" | "شعر" | "دراسات فكرية وسياسية" | "دراسات شرعية ومعاجم";
type Work = { title: string; publisher: string; category: WorkCategory; latest?: boolean };

const WORKS: Work[] = [
  { title: "يوم قرر ترشيش الأعرج أن يصبح رجلاً", publisher: "دار ميارة", category: "روايات" },
  { title: "كسار في أرض التيه", publisher: "دار ميارة", category: "روايات" },
  { title: "منذ تركنا الغضب", publisher: "مجمع الأطرش للكتاب", category: "روايات" },
  { title: "السيناريو الأخير للثورة التونسية", publisher: "دار عليسة", category: "روايات" },
  { title: "حادثة باب سويقة رواية الثورة", publisher: "دار عليسة", category: "روايات" },
  { title: "ليلى والقلعة الهاوية أدب سجون", publisher: "دار ميارة", category: "روايات" },
  { title: "صعلوك مجموعة شعرية", publisher: "دار ميارة", category: "شعر" },
  { title: "رابعة مجموعة شعرية", publisher: "دار ميارة", category: "شعر" },
  { title: "تصنيع الأحلام المحرمة مجموعة شعرية", publisher: "دار ميارة", category: "شعر" },
  { title: "عربي هو", publisher: "دار ميارة", category: "شعر" },
  { title: "السياسة الشرعية في ترشيد الحركة الإسلامية النهضة نموذجاً", publisher: "الأطلسية للنشر", category: "دراسات فكرية وسياسية" },
  { title: "الشخصية التونسية بين التاريخ والسياسة", publisher: "دار كرم الشريف", category: "دراسات فكرية وسياسية" },
  { title: "انقلاب 1962 على بورقيبة", publisher: "دار عليسة", category: "دراسات فكرية وسياسية" },
  { title: "القاعدة دراسة", publisher: "دار عليسة", category: "دراسات فكرية وسياسية" },
  { title: "داعش دراسة", publisher: "دار عليسة", category: "دراسات فكرية وسياسية" },
  { title: "الطالبان دراسة", publisher: "دار عليسة", category: "دراسات فكرية وسياسية" },
  { title: "مجموعة الإنقاذ الوطني", publisher: "دار عليسة", category: "دراسات فكرية وسياسية" },
  { title: "الفن بين الحلال والحرام", publisher: "دار ميارة", category: "دراسات شرعية ومعاجم" },
  { title: "الإسلام دراسة", publisher: "دار عليسة", category: "دراسات شرعية ومعاجم" },
  { title: "القرآن دراسة", publisher: "دار عليسة", category: "دراسات شرعية ومعاجم" },
  { title: "تاريخ المصحف", publisher: "دار عليسة", category: "دراسات شرعية ومعاجم" },
  { title: "السنة دراسة", publisher: "دار عليسة", category: "دراسات شرعية ومعاجم" },
  { title: "تاريخ السنة", publisher: "دار عليسة", category: "دراسات شرعية ومعاجم" },
  { title: "تاريخ أصول الفقه دراسة", publisher: "دار عليسة", category: "دراسات شرعية ومعاجم" },
  ...Array.from({ length: 6 }, (_, index): Work => ({
    title: `سلسلة معجم المستصحب — الجزء ${["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"][index]}`,
    publisher: "مركز علي الغرياني للكتاب بليبيا",
    category: "دراسات شرعية ومعاجم",
    latest: true,
  })),
];

const CATEGORIES = ["الكل", "روايات", "شعر", "دراسات فكرية وسياسية", "دراسات شرعية ومعاجم"] as const;
type MatchedBook = { id: string; title: string; price: number; cover_image_url: string | null };

function normalizeTitle(value: string) {
  return value.trim().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ًٌٍَُِّْـ]/g, "").replace(/\s+/g, " ");
}

function DiwanPage() {
  const { data: settings } = useSiteSettings();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("الكل");
  const { data: books = [] } = useQuery({
    queryKey: ["diwan-books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("id,title,price,cover_image_url").eq("is_visible", true);
      if (error) throw error;
      return (data ?? []) as MatchedBook[];
    },
    staleTime: 60_000,
  });
  const matched = useMemo(() => new Map(books.map((book) => [normalizeTitle(book.title), book])), [books]);
  const filtered = category === "الكل" ? WORKS : WORKS.filter((work) => work.category === category);
  const standardWorks = filtered.filter((work) => !work.latest);
  const latestWorks = filtered.filter((work) => work.latest);

  return (
    <main>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      <section className="glass overflow-hidden rounded-xl p-5 sm:p-8 lg:p-10">
        <div className="grid items-center gap-7 md:grid-cols-[240px_1fr] lg:gap-12">
          <figure className="mx-auto w-full max-w-[240px]">
            <div className="aspect-[3/4] overflow-hidden rounded-lg border border-gold/60">
              <img
                src={settings?.["author_photo_url"] || faridKhadoumaPhoto.url}
                alt="الكاتب فريد خدومة"
                className="size-full object-cover"
              />
            </div>
            <figcaption className="mt-3 text-center font-body text-base text-foreground">فريد خدومة</figcaption>
          </figure>
          <div className="text-center md:text-right">
            <p className="font-kufi text-xs text-gold-soft">الديوان</p>
            <h1 className="mt-2 font-display text-5xl leading-tight text-gold sm:text-6xl">فريد خدومة</h1>
            <blockquote className="mt-5 max-w-3xl text-lg leading-9 text-foreground sm:text-xl">
              "الورق والحبر سابقاً، والحاسوب اليوم، لأكثر من ثماني ساعات يومياً حتى تصبح مبدعاً."
            </blockquote>
            <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gold/25 sm:grid-cols-4">
              {["أكثر من ٣٠ مؤلَّفاً", "٤ مجاميع شعرية", "منذ ١٩٧٠", "إسطنبول"].map((stat) => (
                <span key={stat} className="px-3 py-3 text-center text-xs text-muted-foreground">{stat}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl py-14">
        <div className="space-y-5 text-sm leading-8 text-foreground sm:text-base sm:leading-9">
          {BIOGRAPHY.slice(0, 2).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <details className="group mt-6 glass rounded-xl p-5 sm:p-7">
          <summary className="cursor-pointer list-none text-center font-display text-xl text-gold marker:hidden">
            <span className="group-open:hidden">اقرأ السيرة كاملة</span>
            <span className="hidden group-open:inline">إغلاق السيرة الكاملة</span>
          </summary>
          <div className="mt-7 space-y-5 border-t border-gold/20 pt-7 text-sm leading-8 text-foreground sm:text-base sm:leading-9">
            {BIOGRAPHY.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </details>
      </section>

      <section aria-labelledby="timeline-title" className="py-8">
        <header className="mb-10 text-center">
          <h2 id="timeline-title" className="text-3xl text-gold sm:text-4xl">محطات من السيرة</h2>
          <div className="gold-rule mx-auto mt-4 w-32" />
        </header>
        <ol className="relative mx-auto max-w-4xl border-r border-dashed border-gold/60 pr-8 sm:pr-12">
          {TIMELINE.map(([year, event]) => (
            <li key={`${year}-${event}`} className="relative pb-9 last:pb-0">
              <span className="absolute -right-[2.9rem] top-0 grid min-h-12 w-20 place-items-center rounded-[50%] border border-gold/60 bg-card/70 px-2 text-center font-display text-sm text-gold backdrop-blur sm:-right-[4.25rem]">
                {year}
              </span>
              <p className="min-h-12 pr-12 text-sm leading-7 text-foreground sm:pr-16 sm:text-base">{event}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-14" aria-labelledby="works-title">
        <header className="text-center">
          <Feather className="mx-auto size-6 text-gold" />
          <h2 id="works-title" className="mt-3 text-4xl text-gold">من مؤلفاته</h2>
          <div className="gold-rule mx-auto mt-4 w-32" />
        </header>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((item) => (
            <Button key={item} size="sm" variant={category === item ? "default" : "outline"} onClick={() => setCategory(item)}>
              {item}
            </Button>
          ))}
        </div>
        {standardWorks.length > 0 && (
          <div className="mt-10 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(165px,1fr))]">
            {standardWorks.map((work) => <WorkCard key={work.title} work={work} book={matched.get(normalizeTitle(work.title))} />)}
          </div>
        )}
        {latestWorks.length > 0 && (
          <section className="mt-14">
            <header className="mb-6 flex items-center gap-4">
              <h3 className="shrink-0 text-2xl text-gold">سلسلة المستصحب - أحدث الإصدارات 2026</h3>
              <div className="gold-rule flex-1" />
            </header>
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(165px,1fr))]">
              {latestWorks.map((work) => <WorkCard key={work.title} work={work} book={matched.get(normalizeTitle(work.title))} />)}
            </div>
          </section>
        )}
      </section>

      <section className="pb-16 pt-4 text-center">
        {settings?.["author_signature_url"] && (
          <img src={settings["author_signature_url"]} alt="توقيع فريد خدومة" className="mx-auto mb-8 h-28 max-w-full object-contain" />
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/majlis"><MessagesSquare className="size-4" /> ناقشني في المجلس الثقافي</Link></Button>
          <Button asChild variant="outline"><a href={`mailto:${SUPPORT_EMAIL}`}><Mail className="size-4" /> تواصل عبر البريد الإلكتروني</a></Button>
        </div>
      </section>
      </div>
      <SiteFooter />
    </main>
  );
}

function WorkCard({ work, book }: { work: Work; book: MatchedBook | undefined }) {
  const { add, setOpen } = useCart();
  function addRealBook() {
    if (!book) return;
    add({ id: book.id, title: book.title, price: Number(book.price), cover_image_url: book.cover_image_url });
    setOpen(true);
    toast.success("تمت إضافة الكتاب الحقيقي إلى السلة");
  }
  return (
    <article className="glass group flex min-h-[330px] flex-col overflow-hidden rounded-xl transition duration-300 ease-out hover:-rotate-1 hover:scale-[1.03] hover:border-gold/50 hover:shadow-[var(--shadow-glow),var(--shadow-deep)]">
      <div className="relative flex aspect-3/4 w-full items-center justify-center overflow-hidden">
        <BookCover src={book?.cover_image_url} title={work.title} />
        <span className="absolute top-3 end-3 rounded-full border border-gold/40 bg-background/75 px-2.5 py-1 text-[10px] text-gold backdrop-blur">من الديوان</span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="font-display text-base leading-7">{work.title}</h3>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{work.publisher}</p>
        <div className="mt-auto pt-3">
          {book ? (
            <Button size="sm" className="w-full" onClick={addRealBook}><ShoppingCart className="size-4" /> شراء الكتاب</Button>
          ) : (
            <span className="inline-flex rounded-full border border-gold/35 px-3 py-1 text-[11px] text-gold-soft"><BookOpen className="me-1.5 size-3.5" /> قريباً</span>
          )}
        </div>
      </div>
    </article>
  );
}
import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Crown, Users, Feather } from "lucide-react";
import { LibraryBackdrop } from "@/components/library-backdrop";
import { supabase } from "@/integrations/supabase/client";
import { BookCard, type Book } from "@/components/book-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceTag } from "@/components/price-tag";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مكتبة ترشيش | مجلس المعرفة العربي" },
      {
        name: "description",
        content: "مكتبة ترشيش: كتب مختارة بعناية، مقالات يومية، ومستشار معرفي ذكي بعربية أصيلة.",
      },
      { property: "og:title", content: "مكتبة ترشيش | مجلس المعرفة العربي" },
      { property: "og:description", content: "كتب مختارة، مجلس ثقافي، وحكيمٌ يرشدك إلى قراءتك القادمة." },
    ],
  }),
  component: Home,
});

function Home() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("zaina-ref", ref);
  }, []);

  const { data: books, isLoading } = useQuery({
    queryKey: ["featured-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id,title,author,description,price,cover_image_url,category,badge,stock,external_url,copyright_notice,sample_pdf_url")
        .eq("is_visible", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data as Book[];
    },
  });

  return (
    <main>
      <section className="relative isolate flex min-h-[88vh] items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt="مكتبة عريقة بأرفف خشبية مقوّسة وإضاءة ذهبية دافئة"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 size-full object-cover brightness-[1.7]"
        />
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-veil)" }} />

        <div className="rise-in mx-auto max-w-3xl px-6 text-center">
          <p className="font-kufi text-sm tracking-[0.3em] text-gold-soft">منصة المعرفة العربية</p>
          <h1 className="mt-6 text-5xl leading-[1.35] text-parchment sm:text-7xl">مكتبة ترشيش</h1>
          <div className="gold-rule mx-auto mt-6 w-40" />
          <p className="mt-6 text-lg leading-9 text-parchment/85">
            حيث يلتقي عبقُ المخطوط بذكاء العصر. كتبٌ منتقاة، مجلسٌ ثقافي يومي، وحكيمٌ يصحبك في اختيار قراءتك.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/store">تصفّح المتجر</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/majlis">ادخل المجلس</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <header className="mb-10 text-center">
          <h2 className="text-3xl text-gold sm:text-4xl">مختاراتُ الرفّ الذهبي</h2>
          <p className="mt-3 text-sm text-muted-foreground">نفائس اخترناها لك من أعمدة التراث والفكر</p>
        </header>

        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(165px,1fr))]">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl bg-secondary/50" />)
            : books?.map((b) => <BookCard key={b.id} book={b} />)}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link to="/store">كل الكتب</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Sparkles, title: "حكيم ترشيش", text: "مستشار معرفي يجيبك بعربية أصيلة ويرشّح لك بحسب حالك." },
            { icon: Users, title: "المجلس الثقافي", text: "مقالات يومية ونقاشات متشعّبة بين القرّاء والمؤلفين." },
            { icon: Feather, title: "برنامج الإحالة", text: "عمولة ١٠٪ على كل كتاب يُباع عبر رابطك الخاص." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass rounded-xl p-6">
              <Icon className="size-5 text-gold" />
              <h3 className="mt-4 text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24">
        <div className="glass relative overflow-hidden rounded-2xl p-10 text-center">
          <Crown className="mx-auto size-6 text-gold" />
          <h2 className="mt-4 text-3xl text-gold">عضوية مجلس ترشيش</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-muted-foreground">
            مقالات يومية حصرية، كتبٌ صوتية نادرة، واستشارات غير محدودة مع حكيم المكتبة.
          </p>
          <p className="mt-6 flex items-center justify-center gap-2 font-display text-3xl text-parchment">
            <PriceTag amount={49} className="text-3xl" />
            <span className="text-base text-muted-foreground">/ شهرياً</span>
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link to="/auth">انضم إلى المجلس</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

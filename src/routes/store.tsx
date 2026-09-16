import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookCard, type Book } from "@/components/book-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/store")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search['q'] === "string" && search['q'] ? { q: search['q'] as string } : {},
  head: () => ({
    meta: [
      { title: "متجر الكتب | مكتبة ترشيش" },
      { name: "description", content: "كتب رقمية وورقية منتقاة في التراث والأدب والفلسفة، مع معاينة فورية وشراء سريع." },
      { property: "og:title", content: "متجر الكتب | مكتبة ترشيش" },
      { property: "og:description", content: "نفائس الكتب العربية بين يديك، رقمية وورقية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Store,
});

const PAGE_SIZE = 24;

function Store() {
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const [term, setTerm] = useState(initialQ ?? "");
  const [page, setPage] = useState(0);
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    const t = setTimeout(() => {
      setTerm(q.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["books", term, page],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      let query = supabase
        .from("books")
        .select(
          "id,title,author,description,price,cover_image_url,category,badge,stock,external_url,copyright_notice,sample_pdf_url",
          { count: "exact" },
        )
        .eq("is_visible", true);

      if (term) {
        const safe = term.replace(/[,()]/g, " ");
        query = query.or(`title.ilike.%${safe}%,author.ilike.%${safe}%,category.ilike.%${safe}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: true })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (error) throw error;
      return { books: (data ?? []) as Book[], count: count ?? 0 };
    },
  });

  const live = q.trim().toLocaleLowerCase("ar");
  const allBooks = data?.books ?? [];
  // فلترة فورية أثناء الكتابة على القائمة المعروضة (قبل وصول نتائج الخادم)
  const books = live
    ? allBooks.filter((b) =>
        `${b.title} ${b.author} ${b.category ?? ""}`.toLocaleLowerCase("ar").includes(live),
      )
    : allBooks;
  const total = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // تجميع الكتب حسب التصنيف (مع الحفاظ على ترتيب الظهور)
  const grouped = (() => {
    const map = new Map<string, Book[]>();
    for (const b of books) {
      const cat = b.category?.trim() || "متنوعات";
      const group = map.get(cat);
      if (group) group.push(b);
      else map.set(cat, [b]);
    }
    return [...map.entries()];
  })();

  const gridCls = "grid grid-cols-2 gap-3 sm:gap-5 sm:[grid-template-columns:repeat(auto-fill,minmax(165px,1fr))]";

  return (
    <main className="mx-auto max-w-7xl overflow-x-clip px-3 py-8 sm:px-4 sm:py-14">
      {settings?.["store_banner_url"] && (
        <img
          src={settings["store_banner_url"]}
          alt="بانر متجر مكتبة ترشيش"
          className="mb-7 h-36 w-full rounded-xl border border-gold/20 object-cover sm:mb-10 sm:h-56 sm:rounded-2xl"
        />
      )}
      <header className="mb-8 text-center sm:mb-10">
        <h1 className="text-3xl text-gold sm:text-4xl">قسم متجر الكتب</h1>
        <div className="gold-rule mx-auto mt-4 w-24 sm:mt-5 sm:w-32" />
        <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-muted-foreground sm:mt-4 sm:text-sm">
          {settings?.["store_description"] || "اقتنِ نسختك الرقمية فوراً، أو اطلب النسخة الورقية إلى بابك."}
        </p>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بعنوان الكتاب أو المؤلف…"
          className="mx-auto mt-5 h-10 max-w-md bg-card text-sm sm:mt-6"
        />
      </header>

      {isLoading ? (
        <div className={gridCls}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg bg-secondary/50 sm:h-80 sm:rounded-xl" />
          ))}
        </div>
      ) : live ? (
        // أثناء البحث: شبكة واحدة عادية بدون تقسيم
        <div className={gridCls}>
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      ) : (
        // بدون بحث: أقسام حسب التصنيف
        <div className="space-y-9 sm:space-y-12">
          {grouped.map(([cat, catBooks]) => (
            <section key={cat}>
              <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:mb-5 sm:flex sm:gap-4">
                <div className="flex min-w-0 items-center gap-3 sm:contents">
                  <h2 className="min-w-0 truncate text-xl text-gold sm:shrink-0 sm:text-2xl">{cat}</h2>
                  <div className="gold-rule min-w-4 flex-1" />
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{catBooks.length} كتاب</span>
              </header>
              <div className={gridCls}>
                {catBooks.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {!isLoading && books.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">لا نتائج مطابقة لبحثك.</p>
      )}

      {total > PAGE_SIZE && (
        <nav className="mt-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-xs sm:mt-12 sm:flex sm:justify-center sm:gap-4 sm:text-sm">
          <Button size="sm" variant="outline" disabled={page === 0 || isFetching} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <span className="min-w-0 text-center text-muted-foreground">
            صفحة {page + 1} من {pages} — {total} كتاب
          </span>
          <Button size="sm" variant="outline" disabled={page + 1 >= pages || isFetching} onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        </nav>
      )}
    </main>
  );
}

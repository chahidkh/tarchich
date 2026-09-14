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
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search['q'] === "string" ? (search['q'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "متجر الكتب | مكتبة ترشيش" },
      { name: "description", content: "كتب رقمية وورقية منتقاة في التراث والأدب والفلسفة، مع معاينة فورية وشراء سريع." },
      { property: "og:title", content: "متجر الكتب | مكتبة ترشيش" },
      { property: "og:description", content: "نفائس الكتب العربية بين يديك، رقمية وورقية." },
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
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(b);
    }
    return [...map.entries()];
  })();

  const gridCls = "grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(165px,1fr))]";

  return (
    <main className="mx-auto max-w-7xl px-4 py-14">
      {settings?.["store_banner_url"] && (
        <img
          src={settings["store_banner_url"]}
          alt="بانر متجر مكتبة ترشيش"
          className="mb-10 h-56 w-full rounded-2xl border border-gold/20 object-cover"
        />
      )}
      <header className="mb-10 text-center">
        <h1 className="text-4xl text-gold">قسم متجر الكتب</h1>
        <div className="gold-rule mx-auto mt-5 w-32" />
        <p className="mt-4 text-sm text-muted-foreground">
          {settings?.["store_description"] || "اقتنِ نسختك الرقمية فوراً، أو اطلب النسخة الورقية إلى بابك."}
        </p>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بعنوان الكتاب أو المؤلف…"
          className="mx-auto mt-6 max-w-md bg-card"
        />
      </header>

      {isLoading ? (
        <div className={gridCls}>
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl bg-secondary/50" />
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
        <div className="space-y-12">
          {grouped.map(([cat, catBooks]) => (
            <section key={cat}>
              <header className="mb-5 flex items-center gap-4">
                <h2 className="shrink-0 text-2xl text-gold">{cat}</h2>
                <div className="gold-rule flex-1" />
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
        <nav className="mt-12 flex items-center justify-center gap-4 text-sm">
          <Button variant="outline" disabled={page === 0 || isFetching} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <span className="text-muted-foreground">
            صفحة {page + 1} من {pages} — {total} كتاب
          </span>
          <Button variant="outline" disabled={page + 1 >= pages || isFetching} onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        </nav>
      )}
    </main>
  );
}

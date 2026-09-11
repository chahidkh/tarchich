import { createFileRoute } from "@tanstack/react-router";
import { GAZETTE_CATEGORIES, PUBLISHER, slugify, type GazetteCategory } from "@/lib/gazette";
import { sourceHost } from "@/lib/content-sources";

/**
 * النشر التلقائي المجدول للجريدة.
 * يقتصر حصراً على المصادر المفعّلة ذات التراخيص المفتوحة بالكامل
 * (المشاع الإبداعي أو الملك العام) المسجّلة في جدول content_sources.
 */

const RESTRICTED = /(حقوق محفوظة|اقتباس مختصر|اقتباس محدود|اقتباس قصير)/;

const MAX_PER_RUN = 2;

type Source = { name: string; url: string; license_note: string | null };
type FeedItem = { title: string; summary: string; link: string };

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block: string, tag: string) {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block);
  return m?.[1] ? decode(m[1]) : "";
}

function parseFeed(xml: string): FeedItem[] {
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) ?? [];
  return blocks
    .map((b) => {
      const linkTag = /<link[^>]*href="([^"]+)"/i.exec(b)?.[1] ?? pick(b, "link");
      return {
        title: pick(b, "title"),
        summary: pick(b, "description") || pick(b, "summary") || pick(b, "content"),
        link: linkTag,
      };
    })
    .filter((i) => i.title.length > 8);
}

/** ويكيبيديا العربية: تغذية اليوم (أحداث في مثل هذا اليوم + هل تعلم) بترخيص CC BY-SA. */
async function wikipediaItems(host: string): Promise<FeedItem[]> {
  const d = new Date();
  const path = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
  const res = await fetch(`https://${host}/api/rest_v1/feed/featured/${path}`, {
    headers: { "User-Agent": "TarchishLibraryBot/1.0", Accept: "application/json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as {
    onthisday?: { text?: string; year?: number; pages?: { titles?: { normalized?: string }; extract?: string }[] }[];
    tfa?: { titles?: { normalized?: string }; extract?: string; content_urls?: { desktop?: { page?: string } } };
  };

  const items: FeedItem[] = [];

  for (const ev of (json.onthisday ?? []).slice(0, 4)) {
    const page = ev.pages?.[0];
    const title = page?.titles?.normalized ?? "";
    if (!ev.text || !title) continue;
    items.push({
      title: `في مثل هذا اليوم: ${title}`,
      summary: `${ev.year ? `سنة ${ev.year}: ` : ""}${ev.text}\n\n${page?.extract ?? ""}`,
      link: `https://${host}/wiki/${encodeURIComponent(title)}`,
    });
  }

  const tfa = json.tfa;
  if (tfa?.titles?.normalized && tfa.extract) {
    items.push({
      title: tfa.titles.normalized,
      summary: tfa.extract,
      link: tfa.content_urls?.desktop?.page ?? `https://${host}`,
    });
  }

  return items.filter((i) => i.summary.replace(/\s+/g, " ").trim().length > 200);
}


async function compose(apiKey: string, source: Source, item: FeedItem) {
  const system = `أنت محرّرُ جريدة "${PUBLISHER}"، تكتب بعربية فصيحة رصينة عميقة الثقافة والتاريخ، بلا مبالغة ولا ركاكة.
حوّل المادة الخام المرفقة إلى مقال جريدة متكامل بصوت المكتبة، واعتمد على المادة المرفقة وحدها دون اختلاق وقائع أو أرقام أو اقتباسات.
صنّف المقال في واحد من هذه التصنيفات حصراً: ${GAZETTE_CATEGORIES.join("، ")}.
أعد الجواب بصيغة JSON فقط بالمفاتيح: category, title, excerpt, content.
- title: عنوان موجز أقل من ١٠٠ حرف.
- excerpt: ملخّص أقل من ٣٠٠ حرف.
- content: فقرات مفصولة بسطرين فارغين، بين ٣٥٠ و٦٥٠ كلمة، بلا رموز تنسيق.
اختم المقال بسطر إسناد يذكر المصدر "${source.name}"، ثم سطر: "نشرته جريدة ${PUBLISHER}."`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.7-flash",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `المصدر: ${source.name} (${source.url})\nالترخيص: ${source.license_note ?? "غير محدد"}\nالرابط: ${item.link}\nالعنوان: ${item.title}\nالمادة: ${item.summary.slice(0, 4000)}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    console.error("gazette auto ai error", res.status, await res.text());
    return null;
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = (json.choices?.[0]?.message?.content ?? "").replace(/^```(?:json)?|```$/g, "").trim();
  try {
    const p = JSON.parse(raw) as Partial<{ category: string; title: string; excerpt: string; content: string }>;
    const content = (p.content ?? "").trim();
    if (!p.title || content.length < 200) return null;
    const category: GazetteCategory = (GAZETTE_CATEGORIES as readonly string[]).includes(p.category ?? "")
      ? (p.category as GazetteCategory)
      : "الثقافة";
    return {
      category,
      title: p.title.trim().slice(0, 160),
      excerpt: (p.excerpt ?? "").trim().slice(0, 300),
      content: content.includes(PUBLISHER) ? content : `${content}\n\nنشرته جريدة ${PUBLISHER}.`,
    };
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/hooks/gazette-auto")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // المصادقة: مفتاح المشروع العلني في ترويسة apikey (ما يرسله المجدول)،
        // مع فترة تهدئة تمنع أي تشغيل متكرر مكلف.
        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"];
        const provided = request.headers.get("apikey") ?? "";
        if (!expected || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "ai not configured" }, { status: 500 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const cooldown = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recent } = await supabaseAdmin
          .from("posts")
          .select("id")
          .eq("section", "gazette")
          .not("source_name", "is", null)
          .gte("created_at", cooldown)
          .limit(1);
        if (recent && recent.length > 0) return Response.json({ published: 0, reason: "cooldown" });

        const { data: rows, error } = await supabaseAdmin
          .from("content_sources")
          .select("name,url,license_note")
          .eq("is_active", true);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const sources = ((rows ?? []) as Source[]).filter(
          (s) => OPEN_LICENSE.test(s.license_note ?? "") && !RESTRICTED.test(s.license_note ?? ""),
        );
        if (sources.length === 0) return Response.json({ published: 0, reason: "no open-licence sources" });

        const published: string[] = [];

        for (const source of sources) {
          if (published.length >= MAX_PER_RUN) break;
          const target = source.url.startsWith("http") ? source.url : `https://${source.url}`;
          let items: FeedItem[] = [];
          try {
            const host = sourceHost(target);
            if (host.endsWith("wikipedia.org")) {
              items = await wikipediaItems(host);
            } else {
              const res = await fetch(target, {
                headers: { "User-Agent": "TarchishLibraryBot/1.0", Accept: "application/rss+xml, application/atom+xml, */*" },
                redirect: "follow",
              });
              if (!res.ok) continue;
              if (!sourceHost(res.url || target).endsWith(host)) continue;
              items = parseFeed(await res.text());
            }
          } catch (e) {
            console.error("feed fetch failed", source.name, e);
            continue;
          }

          for (const item of items.slice(0, 6)) {
            if (published.length >= MAX_PER_RUN) break;

            const { data: existing } = await supabaseAdmin
              .from("posts")
              .select("id")
              .eq("section", "gazette")
              .eq("title", item.title)
              .limit(1);
            if (existing && existing.length > 0) continue;

            const article = await compose(apiKey, source, item);
            if (!article) continue;

            const { data: dupe } = await supabaseAdmin
              .from("posts")
              .select("id")
              .eq("section", "gazette")
              .eq("title", article.title)
              .limit(1);
            if (dupe && dupe.length > 0) continue;

            const { error: insertError } = await supabaseAdmin.from("posts").insert({
              title: article.title,
              slug: slugify(article.title),
              excerpt: article.excerpt || null,
              content: article.content,
              category: article.category,
              section: "gazette",
              is_published: true,
              source_name: source.name,
            });
            if (insertError) {
              console.error("gazette auto insert failed", insertError.message);
              continue;
            }
            published.push(article.title);
          }
        }

        return Response.json({ published: published.length, titles: published });
      },
    },
  },
});

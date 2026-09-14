import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GAZETTE_CATEGORIES, PUBLISHER, type GazetteCategory } from "@/lib/gazette";
import { sourceHost } from "@/lib/content-sources";
import { generateGazetteCover } from "@/lib/gazette-cover.server";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(6000),
      }),
    )
    .min(1)
    .max(20),
});

export type ComposerDraft = {
  title: string;
  category: GazetteCategory;
  excerpt: string;
  content: string;
  coverUrl: string | null;
};

export type ComposerReply = {
  reply: string;
  draft: ComposerDraft | null;
  sources: { name: string; url: string }[];
};

type ActiveSource = { name: string; url: string; license_note: string | null };

const MAX_EXCERPT_CHARS = 6000;

function stripMarkup(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fetches grounding text, refusing any URL outside the active-source allowlist. */
async function fetchFromSource(source: ActiveSource, query: string, allowed: Set<string>) {
  const host = sourceHost(source.url);
  let target = source.url.startsWith("http") ? source.url : `https://${source.url}`;

  if (host.endsWith("wikipedia.org")) {
    target = `https://${host}/w/api.php?action=query&format=json&prop=extracts&explaintext=1&generator=search&gsrlimit=3&gsrsearch=${encodeURIComponent(query)}`;
  }

  if (!allowed.has(sourceHost(target))) return null;

  try {
    const res = await fetch(target, {
      headers: { "User-Agent": `${PUBLISHER} Editorial Bot`, Accept: "*/*" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    if (!allowed.has(sourceHost(res.url || target))) return null;

    const body = await res.text();
    let text: string;
    if (target.includes("/w/api.php")) {
      const json = JSON.parse(body) as { query?: { pages?: Record<string, { title?: string; extract?: string }> } };
      text = Object.values(json.query?.pages ?? {})
        .map((p) => `## ${p.title ?? ""}\n${p.extract ?? ""}`)
        .join("\n\n");
    } else {
      text = stripMarkup(body);
    }
    text = text.trim().slice(0, MAX_EXCERPT_CHARS);
    return text.length > 120 ? text : null;
  } catch (e) {
    console.error("source fetch failed", host, e);
    return null;
  }
}

export const composerChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }): Promise<ComposerReply> => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden");

    const { data: rows, error: srcError } = await context.supabase
      .from("content_sources")
      .select("name,url,license_note")
      .eq("is_active", true);
    if (srcError) throw srcError;

    const sources = (rows ?? []) as ActiveSource[];
    if (sources.length === 0) {
      throw new Error("لا توجد مصادر مفعّلة. فعّل مصدراً واحداً على الأقل من تبويب «المصادر».");
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("خدمة التحرير الذكي غير مهيّأة.");

    const allowed = new Set(sources.map((s) => sourceHost(s.url)));
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";

    const gathered = await Promise.all(
      sources.map(async (s) => ({ source: s, text: await fetchFromSource(s, lastUser, allowed) })),
    );
    const used = gathered.filter((g) => g.text);

    const corpus = used.length
      ? used
          .map((g) => `### المصدر: ${g.source.name} (${g.source.url})\nالترخيص: ${g.source.license_note ?? "غير محدد"}\n${g.text}`)
          .join("\n\n---\n\n")
      : "لم تُسترجع أي مادة نصية من المصادر المفعّلة في هذه المحاولة.";

    const system = `أنت محرّرُ جريدة "${PUBLISHER}"، تكتب بعربية فصيحة رصينة عميقة الثقافة.
قيدٌ صارم لا يُخرق: لا تعتمد إلا على المادة المستخرجة من المصادر المفعّلة المرفقة أدناه. يُمنع منعاً باتاً استعمال معرفة خارجية أو اختلاق وقائع أو أرقام أو اقتباسات أو أسماء ليست في المادة المرفقة.
إن كانت المادة المرفقة لا تكفي لتلبية الطلب، فاعتذر بوضوح واطلب من المشرف تفعيل مصدر مناسب أو تحديد الموضوع، ولا تكتب مسودّة.
التصنيفات المسموحة حصراً: ${GAZETTE_CATEGORIES.join("، ")}.
أعد الجواب بصيغة JSON فقط بالمفاتيح: reply, draft.
- reply: ردّك المحاوري القصير للمشرف بالعربية.
- draft: إمّا null، أو كائن فيه title (أقل من ١٠٠ حرف) و category (من القائمة أعلاه) و excerpt (أقل من ٣٠٠ حرف) و content (فقرات مفصولة بسطرين فارغين، ٤٠٠–٧٠٠ كلمة، بلا رموز تنسيق).
قواعد النقل والاقتباس (إلزامية مع أي مصدر إخباري محفوظ الحقوق):
- أعد كتابة المادة بالكامل بأسلوبك وبنيتك (Paraphrase حقيقي)؛ لا تنقل جملة كما هي ولا تكتفِ بتبديل كلمات قليلة أو بإعادة ترتيب طفيف للجمل الأصلية.
- لا تتجاوز خمس كلمات متتالية مطابقة لنصّ المصدر.
- يُسمح باقتباس حرفي واحد فقط من كل مصدر، أقل من ١٥ كلمة وبين علامتَي تنصيص، وعند الضرورة فقط، ويُمنع أي اقتباس ثانٍ من المصدر نفسه في المقال ذاته.
- احتفظ بالوقائع والأرقام والأسماء كما هي دون اختلاق.
اذكر في نهاية المسودّة سطر إسناد صريح بصيغة "بحسب [اسم المصدر]" مع رابط الإحالة، ثم سطر: "نشرته جريدة ${PUBLISHER}."

المادة المستخرجة من المصادر المفعّلة:
${corpus}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "system", content: system }, ...data.messages],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("ازدحمت الخدمة، أعد المحاولة بعد قليل.");
    if (res.status === 402) throw new Error("نفدت أرصدة الذكاء الاصطناعي، يرجى إضافة رصيد.");
    if (!res.ok) {
      console.error("composer ai error", res.status, await res.text());
      throw new Error("تعذّر توليد الرد الآن.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    let parsed: { reply?: string; draft?: Partial<ComposerDraft> | null };
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim());
    } catch {
      throw new Error("تعذّرت قراءة مخرجات المحرّر الذكي.");
    }

    const d = parsed.draft;
    const content = (d?.content ?? "").trim();
    const draftCategory: GazetteCategory = (GAZETTE_CATEGORIES as readonly string[]).includes(d?.category ?? "")
      ? (d?.category as GazetteCategory)
      : "الثقافة";
    // غلاف مولّد بالذكاء الاصطناعي بهوية الجريدة؛ لا تُستعمل صور المصادر محفوظة الحقوق.
    const coverUrl = d && d.title && content ? await generateGazetteCover(apiKey, d.title, draftCategory) : null;
    const draft: ComposerDraft | null =
      d && d.title && content
        ? {
            title: d.title.trim().slice(0, 160),
            category: draftCategory,
            coverUrl,
            excerpt: (d.excerpt ?? "").trim().slice(0, 300),
            content: content.includes(PUBLISHER) ? content : `${content}\n\nنشرته جريدة ${PUBLISHER}.`,
          }
        : null;

    return {
      reply: (parsed.reply ?? "").trim() || (draft ? "أعددتُ مسودّة المقال." : "لم أتمكّن من إعداد مسودّة."),
      draft,
      sources: used.map((g) => ({ name: g.source.name, url: g.source.url })),
    };
  });

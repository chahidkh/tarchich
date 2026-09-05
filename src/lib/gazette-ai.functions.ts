import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GAZETTE_CATEGORIES, PUBLISHER, type GazetteCategory } from "@/lib/gazette";

const schema = z.object({
  source: z.string().trim().min(10).max(6000),
});

const SYSTEM = `أنت محرّرُ جريدة "${PUBLISHER}"، تكتب بعربية فصيحة بليغة، رصينةِ النبرة، عميقةِ الثقافة والتاريخ، بلا مبالغة ولا ركاكة.
مهمتك: تحويل الخبر أو الموضوع الخام إلى مقال جريدة متكامل بصوت المكتبة، مع تصنيفه تصنيفاً دقيقاً في واحدة من هذه التصنيفات حصراً:
- "عاجل": أخبار عاجلة وتطورات حرجة وآنية عالية الأولوية.
- "سياسة": العلاقات الدولية والسياسات الحكومية والتطورات الجيوسياسية الإقليمية.
- "التاريخ": التحليلات التاريخية والحضارات القديمة والسياق التاريخي.
- "الثقافة": الأدب والمقالات الفكرية ومراجعات الكتب والفنون.
أعد الجواب بصيغة JSON فقط دون أي نص خارجها، بالمفاتيح: category, title, excerpt, content.
- title: عنوان جذّاب موجز (أقل من ١٠٠ حرف).
- excerpt: ملخّص في سطرين (أقل من ٣٠٠ حرف).
- content: نص المقال كاملاً في فقرات مفصولة بسطرين فارغين، بين ٤٠٠ و٧٠٠ كلمة، بلا رموز تنسيق مثل ** أو #.
اختم المقال بسطر: "نشرته جريدة ${PUBLISHER}."`;

export type ComposedArticle = {
  category: GazetteCategory;
  title: string;
  excerpt: string;
  content: string;
};

export const composeGazetteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data, context }): Promise<ComposedArticle> => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("خدمة التحرير الذكي غير مهيّأة.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: data.source },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("ازدحمت الخدمة، أعد المحاولة بعد قليل.");
    if (res.status === 402) throw new Error("نفدت أرصدة الذكاء الاصطناعي، يرجى إضافة رصيد.");
    if (!res.ok) {
      console.error("gazette ai error", res.status, await res.text());
      throw new Error("تعذّر توليد المقال الآن.");
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    let parsed: Partial<ComposedArticle>;
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim());
    } catch {
      throw new Error("تعذّرت قراءة مخرجات المحرّر الذكي.");
    }

    const category = (GAZETTE_CATEGORIES as readonly string[]).includes(parsed.category ?? "")
      ? (parsed.category as GazetteCategory)
      : "الثقافة";
    const content = (parsed.content ?? "").trim();
    if (!parsed.title || !content) throw new Error("جاء المقال ناقصاً، أعد المحاولة.");

    return {
      category,
      title: parsed.title.trim().slice(0, 160),
      excerpt: (parsed.excerpt ?? "").trim().slice(0, 300),
      content: content.includes(PUBLISHER) ? content : `${content}\n\nنشرته جريدة ${PUBLISHER}.`,
    };
  });

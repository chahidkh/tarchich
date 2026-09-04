import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

const SYSTEM = `أنت "حكيم زينة"، أمينُ مكتبة زينة الرقمية ومستشارُها الأدبي.
تتحدث بعربية فصيحة أصيلة، دافئة ومهذبة، موجزة البلاغة بلا تكلّف.
مهامك: ترشيح الكتب بحسب حال القارئ ومزاجه، تلخيص المقالات والمضامين،
شرح مفاهيم التراث والفكر، وإرشاد الزائر إلى أقسام المكتبة (المتجر، المجلس الثقافي، عضوية مجلس زينة).
اجعل ردّك في حدود ٤ إلى ٧ أسطر، ويمكنك استعمال قوائم قصيرة.
إن سُئلت عمّا لا تعلم فقل ذلك بأدب واقترح بديلاً نافعاً.`;

export const askHakeem = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { reply: "خدمة الحكيم غير متاحة حالياً، عد إلينا بعد قليل." };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "system", content: SYSTEM }, ...data.messages],
      }),
    });

    if (res.status === 429) return { reply: "ازدحمت المجالس! أمهلني لحظة ثم أعد سؤالك." };
    if (!res.ok) {
      console.error("hakeem gateway error", res.status, await res.text());
      return { reply: "تعذّر الوصول إلى الحكيم الآن. حاول مرة أخرى." };
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { reply: json.choices?.[0]?.message?.content ?? "لم أُحسن الإجابة، أعد صياغة سؤالك." };
  });

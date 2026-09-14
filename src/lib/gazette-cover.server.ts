import { PUBLISHER } from "@/lib/gazette";

/**
 * توليد غلاف مقال بالذكاء الاصطناعي بهوية الجريدة البصرية (ذهبي/رقّي تراثي).
 * لا تُستعمل أبداً صور المصادر الإخبارية محفوظة الحقوق؛ الغلاف إمّا مولّد هنا،
 * أو صورة من مصدر مفتوح الترخيص فعلياً (ويكيميديا كومنز / أرشيف الإنترنت).
 */

const BUCKET = "site-assets";

function prompt(title: string, category: string) {
  return `Elegant Arabic heritage-style editorial cover illustration for a cultural newspaper article.
Theme: "${title}" (section: ${category}).
Style: classical Islamic manuscript and arabesque aesthetics, aged parchment texture, warm gold and amber palette, fine ink linework, geometric border ornament, soft museum lighting, dignified and calm.
No text, no letters, no calligraphy words, no logos, no watermarks, no modern photography, no recognizable real people.
Wide landscape composition suitable as a newspaper article banner for ${PUBLISHER}.`;
}

/** يُرجع رابط الغلاف المرفوع، أو null عند أي إخفاق (الواجهة تعود للغلاف الافتراضي). */
export async function generateGazetteCover(
  apiKey: string,
  title: string,
  category: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
        messages: [{ role: "user", content: prompt(title, category) }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      console.error("gazette cover ai error", res.status, await res.text());
      return null;
    }

    const json = (await res.json()) as {
      data?: { b64_json?: string; url?: string }[];
      choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
    };

    const inline =
      json.data?.[0]?.b64_json ??
      json.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
      json.data?.[0]?.url ??
      null;
    if (!inline) return null;

    const base64 = inline.startsWith("data:") ? (inline.split(",")[1] ?? "") : inline;
    if (base64.length < 100) return null;

    const bin = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `gazette-covers/${crypto.randomUUID()}.png`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, bin, {
      contentType: "image/png",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) {
      console.error("gazette cover upload failed", error.message);
      return null;
    }

    return `/api/public/asset/${BUCKET}/${path}`;
  } catch (e) {
    console.error("gazette cover failed", e);
    return null;
  }
}

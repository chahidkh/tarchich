import { createServerFn } from "@tanstack/react-start";

type StripeSession = { id: string; url?: string; payment_status?: string; amount_total?: number; metadata?: Record<string, string>; error?: { message?: string } };

function stripeKey() {
  const secret = process.env["STRIPE_SECRET_KEY"] || process.env["STRIPE_TEST_API_KEY"];
  if (!secret) throw new Error("مفتاح الدفع غير مُعد بعد");
  if (secret.startsWith("pk_")) throw new Error("المفتاح المُعد هو مفتاح عام (pk_) ولا يصلح للدفع، المطلوب مفتاح سري (sk_)");
  return secret;
}

async function createSession(body: URLSearchParams) {
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeKey()}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
async function createSession(body: URLSearchParams) {
  body.set("payment_method_types[0]", "card");
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${stripeKey()}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as StripeSession;
  if (!res.ok || !json.url) {
    console.error("Stripe checkout failed", json.error);
    throw new Error(json.error?.message ? `تعذّر فتح صفحة الدفع: ${json.error.message}` : "تعذّر فتح صفحة الدفع، حاول لاحقاً");
  }
  return { url: json.url };
}

function lineItem(body: URLSearchParams, i: number, book: { id: string; title: string; author: string | null; price: number; cover_image_url: string | null }, qty: number) {
  const amount = Math.round(Number(book.price) * 100);
  if (!Number.isFinite(amount) || amount < 200) throw new Error(`سعر الكتاب «${book.title}» غير صالح للدفع الإلكتروني`);
  body.set(`line_items[${i}][quantity]`, String(qty));
  body.set(`line_items[${i}][price_data][currency]`, "sar");
  body.set(`line_items[${i}][price_data][unit_amount]`, String(amount));
  body.set(`line_items[${i}][price_data][product_data][name]`, book.title);
  if (book.author) body.set(`line_items[${i}][price_data][product_data][description]`, book.author);
  if (book.cover_image_url?.startsWith("http")) {
    body.set(`line_items[${i}][price_data][product_data][images][0]`, book.cover_image_url);
  }
}

/**
 * Creates a dynamic Stripe Checkout Session for a single book.
 * The price is always read from the database, never from the client.
 */
export const createBookCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { bookId: string; origin: string; userId?: string | null; referrer?: string | null }) => {
    if (!input?.bookId || typeof input.bookId !== "string") throw new Error("معرّف الكتاب غير صالح");
    if (!input?.origin || !/^https?:\/\//.test(input.origin)) throw new Error("عنوان الموقع غير صالح");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: book, error } = await supabaseAdmin
      .from("books")
      .select("id,title,author,price,cover_image_url,is_visible")
      .eq("id", data.bookId)
      .maybeSingle();

    if (error) throw new Error("تعذّر جلب بيانات الكتاب");
    if (!book || !book.is_visible) throw new Error("هذا الكتاب غير متاح للشراء");

    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", `${data.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    body.set("cancel_url", `${data.origin}/store`);
    lineItem(body, 0, book, 1);
    body.set("metadata[book_id]", book.id);
    body.set("metadata[items]", JSON.stringify([{ id: book.id, qty: 1 }]));
    if (data.userId) body.set("metadata[user_id]", data.userId);
    if (data.referrer) body.set("metadata[referrer_code]", data.referrer);

    return createSession(body);
  });

/**
 * Creates one shared Stripe Checkout Session for every book in the cart.
 * Quantities come from the client, prices always come from the database.
 */
export const createCartCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { items: { id: string; qty: number }[]; origin: string; userId?: string | null; referrer?: string | null }) => {
    if (!Array.isArray(input?.items) || input.items.length === 0) throw new Error("السلة خالية");
    if (input.items.length > 50) throw new Error("عدد الكتب في السلة كبير جداً");
    if (!input?.origin || !/^https?:\/\//.test(input.origin)) throw new Error("عنوان الموقع غير صالح");
    return {
      ...input,
      items: input.items.map((i) => ({ id: String(i.id), qty: Math.min(20, Math.max(1, Math.round(Number(i.qty) || 1))) })),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = [...new Set(data.items.map((i) => i.id))];
    const { data: books, error } = await supabaseAdmin
      .from("books")
      .select("id,title,author,price,cover_image_url,is_visible")
      .in("id", ids);

    if (error) throw new Error("تعذّر جلب بيانات الكتب");
    const available = (books ?? []).filter((b) => b.is_visible);
    if (available.length === 0) throw new Error("لا توجد كتب متاحة للشراء في سلّتك");

    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", `${data.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    body.set("cancel_url", `${data.origin}/store`);

    const purchased: { id: string; qty: number }[] = [];
    available.forEach((book, i) => {
      const qty = data.items.find((it) => it.id === book.id)?.qty ?? 1;
      lineItem(body, i, book, qty);
      purchased.push({ id: book.id, qty });
    });

    body.set("metadata[items]", JSON.stringify(purchased).slice(0, 480));
    if (data.userId) body.set("metadata[user_id]", data.userId);
    if (data.referrer) body.set("metadata[referrer_code]", data.referrer);

    return createSession(body);
  });

/**
 * Verifies a completed Stripe session and records the order only once payment succeeded.
 */
export const confirmCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string }) => {
    if (!input?.sessionId || typeof input.sessionId !== "string") throw new Error("معرّف الجلسة غير صالح");
    return input;
  })
  .handler(async ({ data }) => {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(data.sessionId)}`, {
      headers: { Authorization: `Bearer ${stripeKey()}` },
    });
    const session = (await res.json()) as StripeSession;
    if (!res.ok) throw new Error("تعذّر التحقق من عملية الدفع");
    if (session.payment_status !== "paid") return { paid: false as const };

    const meta = session.metadata ?? {};
    const userId = meta["user_id"];
    const total = Number(session.amount_total ?? 0) / 100;

    if (userId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("user_id", userId)
        .contains("items", { session_id: session.id })
        .maybeSingle();

      if (!existing) {
        let items: unknown = [];
        try {
          items = JSON.parse(meta["items"] ?? "[]");
        } catch {
          items = [];
        }
        await supabaseAdmin.from("orders").insert({
          user_id: userId,
          total_amount: total,
          status: "paid",
          referrer_code: meta["referrer_code"] ?? null,
          items: { session_id: session.id, books: items } as never,
        });
      }
    }

    return { paid: true as const, total };
  });

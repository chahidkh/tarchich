import { createServerFn } from "@tanstack/react-start";

/**
 * Creates a dynamic Stripe Checkout Session for a single book.
 * The price is always read from the database, never from the client.
 */
export const createBookCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { bookId: string; origin: string }) => {
    if (!input?.bookId || typeof input.bookId !== "string") throw new Error("معرّف الكتاب غير صالح");
    if (!input?.origin || !/^https?:\/\//.test(input.origin)) throw new Error("عنوان الموقع غير صالح");
    return input;
  })
  .handler(async ({ data }) => {
    const secret = process.env["STRIPE_TEST_API_KEY"];
    if (!secret) throw new Error("مفتاح الدفع غير مُعد بعد");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: book, error } = await supabaseAdmin
      .from("books")
      .select("id,title,author,price,cover_image_url,is_visible")
      .eq("id", data.bookId)
      .maybeSingle();

    if (error) throw new Error("تعذّر جلب بيانات الكتاب");
    if (!book || !book.is_visible) throw new Error("هذا الكتاب غير متاح للشراء");

    const amount = Math.round(Number(book.price) * 100);
    if (!Number.isFinite(amount) || amount < 200) throw new Error("سعر هذا الكتاب غير صالح للدفع الإلكتروني");

    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", `${data.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
    body.set("cancel_url", `${data.origin}/store`);
    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", "sar");
    body.set("line_items[0][price_data][unit_amount]", String(amount));
    body.set("line_items[0][price_data][product_data][name]", book.title);
    if (book.author) body.set("line_items[0][price_data][product_data][description]", book.author);
    if (book.cover_image_url?.startsWith("http")) {
      body.set("line_items[0][price_data][product_data][images][0]", book.cover_image_url);
    }
    body.set("metadata[book_id]", book.id);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      console.error("Stripe checkout failed", json.error);
      throw new Error("تعذّر فتح صفحة الدفع، حاول لاحقاً");
    }
    return { url: json.url };
  });

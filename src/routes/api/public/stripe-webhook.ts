import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe webhook endpoint.
 * Stripe servers POST here directly, so an order is recorded even when the
 * buyer never returns to the success page. The signature is verified with
 * STRIPE_WEBHOOK_SECRET and each event id is stored once (idempotent).
 */
export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) return new Response("Webhook secret not configured", { status: 500 });

        const header = request.headers.get("stripe-signature") ?? "";
        const body = await request.text();

        const { verifyStripeSignature, recordPaidSession } = await import("@/lib/orders.server");
        // Verifies HMAC and rejects replays older than 5 minutes.
        const verified = await verifyStripeSignature(secret, header, body);
        if (!verified.ok) return new Response(verified.reason, { status: verified.status });

        let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
        try {
          event = JSON.parse(body) as typeof event;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
          return new Response("ignored", { status: 200 });
        }

        const session = (event.data?.object ?? {}) as {
          id?: string;
          payment_status?: string;
          amount_total?: number;
          metadata?: Record<string, string>;
        };
        if (!session.id) return new Response("Missing session", { status: 400 });
        if (session.payment_status !== "paid") return new Response("not paid", { status: 200 });

        try {
          const result = await recordPaidSession(
            {
              id: session.id,
              payment_status: session.payment_status,
              ...(session.amount_total !== undefined ? { amount_total: session.amount_total } : {}),
              ...(session.metadata ? { metadata: session.metadata } : {}),
            },
            event.id ?? session.id,
          );
          return Response.json({ ok: true, ...result });
        } catch (error) {
          console.error("stripe webhook failed", error);
          return new Response("processing error", { status: 500 });
        }
      },
    },
  },
});

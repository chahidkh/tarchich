import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { confirmCheckout } from "@/lib/checkout.functions";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/checkout/success")({
  head: () => ({
    meta: [
      { title: "تم إتمام الدفع | مكتبة ترشيش" },
      { name: "description", content: "تأكيد إتمام عملية شراء الكتاب من مكتبة ترشيش." },
      { property: "og:title", content: "تم إتمام الدفع | مكتبة ترشيش" },
      { property: "og:description", content: "شكراً لاقتنائك كتاباً من مكتبة ترشيش." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Success,
});

function Success() {
  const confirm = useServerFn(confirmCheckout);
  const { clear } = useCart();
  const [state, setState] = useState<"loading" | "paid" | "unpaid">("loading");

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setState("unpaid");
      return;
    }
    void confirm({ data: { sessionId } })
      .then((r) => {
        if (r.paid) {
          clear();
          setState("paid");
        } else setState("unpaid");
      })
      .catch(() => setState("unpaid"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      {state === "loading" ? (
        <>
          <Loader2 className="size-14 animate-spin text-gold" />
          <h1 className="mt-6 text-3xl text-gold">جارٍ التحقق من عملية الدفع…</h1>
        </>
      ) : state === "paid" ? (
        <>
          <CheckCircle2 className="size-14 text-gold" />
          <h1 className="mt-6 text-3xl text-gold">تم إتمام عملية الدفع بنجاح</h1>
          <div className="gold-rule mx-auto mt-5 w-32" />
          <p className="mt-5 text-sm leading-8 text-muted-foreground">
            شكراً لاقتنائك من مكتبة ترشيش. سجّلنا طلبك، وستجد نسخك في لوحة حسابك.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-6 text-3xl text-gold">لم يكتمل الدفع بعد</h1>
          <div className="gold-rule mx-auto mt-5 w-32" />
          <p className="mt-5 text-sm leading-8 text-muted-foreground">
            لم نتمكن من تأكيد عملية الدفع. إن كنت قد دفعت فعلاً فسيظهر طلبك خلال لحظات، وإلا يمكنك إعادة المحاولة من المتجر.
          </p>
        </>
      )}
      <Button asChild className="mt-8">
        <Link to="/store">العودة إلى المتجر</Link>
      </Button>
    </main>
  );
}

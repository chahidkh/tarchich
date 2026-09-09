import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <CheckCircle2 className="size-14 text-gold" />
      <h1 className="mt-6 text-3xl text-gold">تم إتمام عملية الدفع بنجاح</h1>
      <div className="gold-rule mx-auto mt-5 w-32" />
      <p className="mt-5 text-sm leading-8 text-muted-foreground">
        شكراً لاقتنائك كتاباً من مكتبة ترشيش. ستصلك تفاصيل الطلب على بريدك الإلكتروني.
      </p>
      <Button asChild className="mt-8">
        <Link to="/store">العودة إلى المتجر</Link>
      </Button>
    </main>
  );
}

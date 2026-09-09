import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useSession } from "@/hooks/use-session";
import { PriceTag } from "@/components/price-tag";
import { createCartCheckout } from "@/lib/checkout.functions";

export function CartDrawer() {
  const { items, remove, total, open, setOpen } = useCart();
  const { user } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const cartCheckout = useServerFn(createCartCheckout);

  async function checkout() {
    if (!user) {
      setOpen(false);
      toast("سجّل الدخول أولاً لإتمام الطلب");
      void navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      const referrer = localStorage.getItem("zaina-ref");
      const { url } = await cartCheckout({
        data: {
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          origin: window.location.origin,
          userId: user.id,
          referrer,
        },
      });
      window.location.href = url;
    } catch (e) {
      setBusy(false);
      toast.error((e as Error).message || "تعذّر فتح صفحة الدفع");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="flex w-full flex-col bg-card sm:max-w-md">
        <SheetHeader className="text-right">
          <SheetTitle className="font-display text-2xl text-gold">سلّة المقتنيات</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          {items.length === 0 && <p className="text-sm text-muted-foreground">السلة خالية بعد.</p>}
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{i.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  {i.qty} × <PriceTag amount={Number(i.price)} className="text-xs" />
                </p>
              </div>
              <button onClick={() => remove(i.id)} aria-label="حذف" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-border p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">الإجمالي</span>
            <PriceTag amount={total} />
          </div>
          <Button className="w-full" disabled={items.length === 0 || busy} onClick={() => void checkout()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "الدفع الفوري"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

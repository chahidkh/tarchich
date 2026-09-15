import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Library, Newspaper, MessagesSquare, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/" as const, label: "الرئيسية", icon: Home },
  { to: "/store" as const, label: "المتجر", icon: Library },
  { to: "/gazette" as const, label: "الجريدة", icon: Newspaper },
  { to: "/majlis" as const, label: "المجلس", icon: MessagesSquare },
];

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { count, setOpen } = useCart();

  return (
    <nav
      aria-label="التنقل الرئيسي للجوال"
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-gold/25 bg-background/95 px-[max(0.5rem,env(safe-area-inset-left))] pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-deep)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground transition-colors",
                active && "text-gold",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(true)}
          aria-label={`السلة، ${count} عناصر`}
          className="relative h-auto min-w-0 flex-col gap-1 rounded-none px-1 text-[10px] font-normal text-muted-foreground hover:text-gold"
        >
          <span className="relative">
            <ShoppingBag className="size-4" />
            {count > 0 && (
              <span className="absolute -end-2.5 -top-2 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </span>
          <span>السلة</span>
        </Button>
      </div>
    </nav>
  );
}
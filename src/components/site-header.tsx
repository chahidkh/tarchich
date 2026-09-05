import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, BookOpen, User, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useIsAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/store", label: "متجر الكتب" },
  { to: "/majlis", label: "المجلس الثقافي" },
];

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { user, isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="size-5 text-gold" />
          <span className="font-display text-xl text-gold">مكتبة ترشيش</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm text-muted-foreground transition-colors hover:text-gold [&.active]:text-gold"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="السلة"
            className="relative rounded-md border border-border p-2 text-foreground transition hover:border-gold/60 hover:text-gold"
          >
            <ShoppingBag className="size-4" />
            {count > 0 && (
              <span className="absolute -top-2 -end-2 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </button>

          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin">
                    <ShieldCheck className="size-4" /> الإشراف
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">
                  <User className="size-4" /> حسابي
                </Link>
              </Button>
              <button
                onClick={() => void signOut()}
                aria-label="خروج"
                className="rounded-md border border-border p-2 text-muted-foreground transition hover:text-destructive"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">انضم إلينا</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

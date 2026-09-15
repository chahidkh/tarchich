import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, BookOpen, User, LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { useIsAdmin } from "@/hooks/use-admin";
import { supabase } from "@/integrations/supabase/client";
import { SettingsMenu } from "@/components/settings-menu";
import { useT, type TransKey } from "@/lib/i18n";

const NAV: { to: string; key: TransKey }[] = [
  { to: "/", key: "nav.home" },
  { to: "/store", key: "nav.store" },
  { to: "/gazette", key: "nav.gazette" },
  { to: "/majlis", key: "nav.majlis" },
  { to: "/diwan", key: "nav.diwan" },
];

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { user, isAdmin } = useIsAdmin();
  const { t } = useT();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/", replace: true });
  }

  return (
    <header className="site-header sticky top-0 z-40 border-b border-border bg-background/60 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 md:flex md:gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <BookOpen className="size-5 text-gold" />
          <span className="truncate font-display text-lg text-gold sm:text-xl">مكتبة ترشيش</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm text-muted-foreground transition-colors hover:text-gold [&.active]:text-gold"
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <SettingsMenu />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t("settings.title")}
            aria-expanded={menuOpen}
            className="rounded-md border border-border p-2 text-foreground transition hover:border-gold/60 hover:text-gold md:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <button
            onClick={() => setOpen(true)}
            aria-label={t("cart.title")}
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
                <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                  <Link to="/admin">
                    <ShieldCheck className="size-4" /> {t("nav.admin")}
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
                <Link to="/dashboard">
                  <User className="size-4" /> {t("nav.account")}
                </Link>
              </Button>
              <button
                onClick={() => void signOut()}
                aria-label="خروج"
                className="hidden rounded-md border border-border p-2 text-muted-foreground transition hover:text-destructive md:inline-flex"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link to="/auth">{t("nav.join")}</Link>
            </Button>
          )}
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-background/95 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMenuOpen(false)}
                className="border-b border-border/50 py-3 text-sm text-muted-foreground transition-colors last:border-0 hover:text-gold [&.active]:text-gold"
              >
                {t(n.key)}
              </Link>
            ))}
            {user ? (
              <div className="grid gap-2 border-t border-border/50 py-3">
                {isAdmin && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin" onClick={() => setMenuOpen(false)}>
                      <ShieldCheck className="size-4" /> {t("nav.admin")}
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm">
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                    <User className="size-4" /> {t("nav.account")}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                  <LogOut className="size-4" /> خروج
                </Button>
              </div>
            ) : (
              <Button asChild size="sm" className="my-3 w-full">
                <Link to="/auth" onClick={() => setMenuOpen(false)}>{t("nav.join")}</Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

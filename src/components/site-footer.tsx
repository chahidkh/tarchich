import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useT } from "@/lib/i18n";

export const SUPPORT_EMAIL = "tarchich@gmail.com";

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="border-t border-border py-10 text-center text-sm text-muted-foreground">
      <p className="font-display text-base text-gold">مكتبة ترشيش — حيث تُصان المعرفة وتُروى.</p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Mail className="size-4 text-gold" />
        <span>{t("contact.support")}:</span>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gold hover:underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <Link to="/about" className="text-gold hover:underline">
          {t("nav.about")}
        </Link>
        <span aria-hidden className="text-border">•</span>
        <Link to="/contact" className="text-gold hover:underline">
          {t("nav.contact")}
        </Link>
        <span aria-hidden className="text-border">•</span>
        <Link to="/privacy" className="text-gold hover:underline">
          {t("nav.privacy")}
        </Link>
        <span aria-hidden className="text-border">•</span>
        <Link to="/terms" className="text-gold hover:underline">
          {t("nav.terms")}
        </Link>
      </p>
    </footer>
  );
}

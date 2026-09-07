import { Link } from "@tanstack/react-router";
import {
  Settings,
  Globe,
  Palette,
  Type,
  Eye,
  Gauge,
  ShieldCheck,
  Coins,
  Minus,
  Plus,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";
import { LANGUAGES } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import { CURRENCIES } from "@/lib/currency";
import { useIsAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children?: React.ReactNode }) {
  return (
    <div className="border-t border-border/60 py-3 first:border-0 first:pt-0">
      <div className="mb-2 flex items-center gap-2 text-xs text-gold">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

export function SettingsMenu() {
  const p = usePrefs();
  const { t } = useT();
  const { isAdmin } = useIsAdmin();

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("settings.title")}
        className="grid size-9 place-items-center rounded-full border border-gold/40 text-gold transition hover:bg-gold/10"
      >
        <Settings className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="glass w-80 max-h-[75vh] overflow-y-auto text-sm">
        <p className="mb-3 font-display text-lg text-gold">{t("settings.title")}</p>

        <Row icon={<Globe className="size-3.5" />} label={t("settings.language")}>
          <div className="grid grid-cols-2 gap-1.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => p.set("lang", l.code)}
                className={cn(
                  "rounded-md border border-border px-2 py-1.5 text-xs transition hover:border-gold/60",
                  p.lang === l.code && "border-gold bg-gold/10 text-gold",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Row>

        <Row icon={<Palette className="size-3.5" />} label={t("settings.theme")}>
          <div className="grid gap-1.5">
            {(
              [
                ["gold", t("settings.theme.gold")],
                ["parchment", t("settings.theme.parchment")],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => p.set("theme", mode)}
                className={cn(
                  "rounded-md border border-border px-3 py-2 text-start text-xs transition hover:border-gold/60",
                  p.theme === mode && "border-gold bg-gold/10 text-gold",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>

        <Row icon={<Type className="size-3.5" />} label={t("settings.typography")}>
          <div className="mb-2 flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              aria-label="A-"
              onClick={() => p.set("fontScale", Math.max(0.85, Number((p.fontScale - 0.05).toFixed(2))))}
            >
              <Minus className="size-3.5" />
            </Button>
            <span className="min-w-14 text-center text-xs text-muted-foreground">
              {Math.round(p.fontScale * 100)}%
            </span>
            <Button
              size="icon"
              variant="outline"
              aria-label="A+"
              onClick={() => p.set("fontScale", Math.min(1.4, Number((p.fontScale + 0.05).toFixed(2))))}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                ["naskh", t("settings.font.naskh")],
                ["kufi", t("settings.font.kufi")],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => p.set("fontFamily", mode)}
                className={cn(
                  "rounded-md border border-border px-2 py-1.5 text-xs transition hover:border-gold/60",
                  p.fontFamily === mode && "border-gold bg-gold/10 text-gold",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>

        <Row icon={<Coins className="size-3.5" />} label={t("settings.currency")}>
          <select
            value={p.currency}
            onChange={(e) => p.set("currency", e.target.value)}
            className="w-full rounded-md border border-border bg-card px-2 py-2 text-xs"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label}
              </option>
            ))}
          </select>
        </Row>

        <Row icon={<Eye className="size-3.5" />} label={t("settings.zen")}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{t("settings.zen.hint")}</span>
            <Switch checked={p.zen} onCheckedChange={(v) => p.set("zen", v)} />
          </div>
        </Row>

        <Row icon={<Gauge className="size-3.5" />} label={t("settings.lowdata")}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{t("settings.lowdata.hint")}</span>
            <Switch checked={p.lowData} onCheckedChange={(v) => p.set("lowData", v)} />
          </div>
        </Row>

        {isAdmin && (
          <Row icon={<ShieldCheck className="size-3.5" />} label={t("settings.admin")}>
            <Button asChild className="w-full">
              <Link to="/admin">{t("settings.admin")}</Link>
            </Button>
          </Row>
        )}
      </PopoverContent>
    </Popover>
  );
}

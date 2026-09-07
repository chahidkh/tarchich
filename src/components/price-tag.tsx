import { ChevronDown } from "lucide-react";
import { CURRENCIES, convert, formatMoney, useRates } from "@/lib/currency";
import { usePrefs } from "@/lib/prefs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** A price with an inline currency switcher, e.g. "100 ر.س ▼". */
export function PriceTag({ amount, className }: { amount: number; className?: string }) {
  const { currency, set } = usePrefs();
  const rates = useRates();
  const value = convert(Number(amount), rates, currency);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1 font-semibold text-gold transition hover:bg-gold/10",
          className,
        )}
        aria-label="تغيير العملة"
        onClick={(e) => e.stopPropagation()}
      >
        {formatMoney(value, currency)}
        <ChevronDown className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        {CURRENCIES.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={(e) => {
              e.stopPropagation();
              set("currency", c.code);
            }}
            className={cn("gap-2 text-sm", c.code === currency && "text-gold")}
          >
            <span className="w-10 font-mono text-xs">{c.code}</span>
            <span className="flex-1">{c.label}</span>
            <span className="text-xs text-muted-foreground">
              {formatMoney(convert(Number(amount), rates, c.code), c.code)}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

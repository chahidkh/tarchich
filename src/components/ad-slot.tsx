import { useQuery } from "@tanstack/react-query";
import { Megaphone, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Ad } from "@/components/admin/ads-panel";

function isImage(src: string) {
  return /^https?:\/\//.test(src) || src.startsWith("/api/") || /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(src);
}

export function useAds() {
  return useQuery({
    queryKey: ["ads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ads").select("*").eq("is_active", true);
      if (error) throw error;
      return data as Ad[];
    },
    staleTime: 60_000,
  });
}

function AdBody({ ad }: { ad: Ad }) {
  const inner = isImage(ad.code_or_image) ? (
    <img src={ad.code_or_image} alt={ad.title} loading="lazy" className="max-h-40 w-full rounded-lg object-cover" />
  ) : (
    <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{ad.code_or_image}</p>
  );
  return (
    <>
      <div className="mb-2 flex items-center gap-2 text-[11px] text-gold-soft">
        <Megaphone className="size-3.5" /> {ad.title} · إعلان
      </div>
      {ad.link ? (
        <a href={ad.link} target="_blank" rel="noreferrer noopener sponsored" className="block transition hover:opacity-90">
          {inner}
        </a>
      ) : (
        inner
      )}
    </>
  );
}

/** In-feed ad card to interleave between posts. */
export function InFeedAd({ ad }: { ad: Ad }) {
  return (
    <aside className="glass rounded-xl border-gold/30 p-5">
      <AdBody ad={ad} />
    </aside>
  );
}

/** Sponsored-article style ad card. */
export function SponsoredAd({ ad }: { ad: Ad }) {
  return (
    <aside className="glass rounded-xl border-2 border-gold/40 p-6">
      <span className="mb-3 inline-block rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold text-gold">
        محتوى إعلاني
      </span>
      <h3 className="font-display text-xl">{ad.title}</h3>
      <div className="mt-3">
        <AdBody ad={ad} />
      </div>
    </aside>
  );
}

/** Dismissible sticky bar pinned to the bottom of the viewport. */
export function StickyBottomAd({ ad }: { ad: Ad }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/30 bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2.5">
        <Megaphone className="size-4 shrink-0 text-gold" />
        <div className="min-w-0 flex-1 truncate text-sm">
          {ad.link ? (
            <a href={ad.link} target="_blank" rel="noreferrer noopener sponsored" className="hover:text-gold">
              {ad.title}
            </a>
          ) : (
            ad.title
          )}
        </div>
        <button aria-label="إغلاق الإعلان" onClick={() => setHidden(true)} className="text-muted-foreground transition hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

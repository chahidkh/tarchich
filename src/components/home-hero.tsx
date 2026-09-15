import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpenText, Landmark, Library, Newspaper } from "lucide-react";

import { LibraryBackdrop } from "@/components/library-backdrop";
import { Button } from "@/components/ui/button";

const DESTINATIONS = [
  { label: "المتجر", to: "/store" as const, icon: Library, position: "start-[7%] top-[43%] sm:start-[12%]" },
  { label: "الجريدة", to: "/gazette" as const, icon: Newspaper, position: "end-[7%] top-[43%] sm:end-[12%]" },
  { label: "المجلس الثقافي", to: "/majlis" as const, icon: Landmark, position: "start-[8%] bottom-[15%] sm:start-[22%]" },
  { label: "الديوان", to: "/diwan" as const, icon: BookOpenText, position: "end-[8%] bottom-[15%] sm:end-[22%]" },
];

function HeroCopy() {
  return (
    <div className="pointer-events-none relative z-20 mx-auto max-w-3xl px-6 text-center">
      <div className="rise-in">
        <p className="font-kufi text-sm tracking-[0.3em] text-gold-soft hero-text">منصة المعرفة العربية</p>
        <h1 className="mt-6 text-5xl leading-[1.35] text-parchment hero-text sm:text-7xl">مكتبة ترشيش</h1>
        <div className="gold-rule mx-auto mt-6 w-40" />
        <p className="mt-6 text-lg leading-9 text-parchment/85 hero-text">
          حيث يلتقي عبقُ المخطوط بذكاء العصر. كتبٌ منتقاة، مجلسٌ ثقافي يومي، وحكيمٌ يصحبك في اختيار قراءتك.
        </p>
        <div className="pointer-events-auto mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/store">تصفّح المتجر</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/majlis">ادخل المجلس</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HomeHero() {
  const imageLayer = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const setPerspective = (x: number, y: number) => {
    const layer = imageLayer.current;
    if (!layer) return;
    const rotateY = Math.max(-1.6, Math.min(1.6, x * 0.008));
    const rotateX = Math.max(-1.1, Math.min(1.1, -y * 0.006));
    layer.style.transform = `perspective(1200px) scale(1.045) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a")) return;
    dragStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragStart.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    setPerspective(event.clientX - dragStart.current.x, event.clientY - dragStart.current.y);
  };

  const releasePointer = (event: ReactPointerEvent<HTMLElement>) => {
    dragStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section
      className="relative isolate flex min-h-[88vh] touch-pan-y items-center justify-center overflow-hidden"
      aria-label="واجهة مكتبة ترشيش"
      data-hero-render-mode="original-image"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={releasePointer}
      onPointerCancel={releasePointer}
    >
      <div
        ref={imageLayer}
        aria-hidden
        className="absolute inset-[-3%] z-0 origin-center transition-transform duration-300 ease-out motion-reduce:transform-none"
      >
        <LibraryBackdrop className="size-full object-cover" eager />
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-background/5 via-background/10 to-background/45" />

      <div className="absolute inset-0 z-20">
        {DESTINATIONS.map(({ label, to, icon: Icon, position }) => (
          <Button
            key={to}
            asChild
            size="sm"
            variant="outline"
            className={`absolute ${position} h-8 border-gold/40 bg-background/75 px-2.5 font-kufi text-[10px] text-gold shadow-md backdrop-blur-sm hover:border-gold hover:bg-background/90 sm:h-9 sm:px-3 sm:text-xs`}
          >
            <Link to={to} aria-label={`الانتقال إلى ${label}`}>
              <Icon aria-hidden />
              {label}
            </Link>
          </Button>
        ))}
      </div>

      <HeroCopy />
      <p className="pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap font-kufi text-[10px] text-parchment/70 hero-text sm:text-[11px]">
        اسحب برفق لاستكشاف الصورة · اختر وجهتك
      </p>
    </section>
  );
}
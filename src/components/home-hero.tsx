import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/prefs";

const HomeLibraryScene = lazy(() => import("@/components/home-library-scene"));

type RenderMode = "checking" | "static" | "three";

function hasSuitable3DPerformance(lowData: boolean) {
  if (lowData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  const mobile = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
  if ((nav.deviceMemory ?? 8) < (mobile ? 6 : 4)) return false;
  if ((nav.hardwareConcurrency ?? 8) < (mobile ? 6 : 4)) return false;

  const canvas = document.createElement("canvas");
  try {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      failIfMajorPerformanceCaveat: true,
      powerPreference: "high-performance",
    });
    if (!gl) return false;
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return maxTextureSize >= 4096;
  } catch {
    return false;
  }
}

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
  const { lowData, theme } = usePrefs();
  const [mode, setMode] = useState<RenderMode>("checking");
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const decide = () => {
      if (!cancelled) setMode(hasSuitable3DPerformance(lowData) ? "three" : "static");
    };
    const idle = window.requestIdleCallback?.(decide, { timeout: 650 });
    const timer = idle === undefined ? window.setTimeout(decide, 80) : undefined;
    return () => {
      cancelled = true;
      if (idle !== undefined) window.cancelIdleCallback?.(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [lowData]);

  return (
    <section
      className="relative isolate flex min-h-[88vh] items-center justify-center overflow-hidden"
      data-hero-render-mode={mode}
      data-hero-scene-painted={String(painted)}
    >
      {mode === "three" && (
        <div className={`absolute inset-0 transition-opacity duration-500 ${painted ? "opacity-100" : "opacity-0"}`}>
          <Suspense fallback={null}>
            <HomeLibraryScene
              theme={theme}
              onFirstFrame={() => setPainted(true)}
              onFailure={() => { setPainted(false); setMode("static"); }}
            />
          </Suspense>
        </div>
      )}
      {painted && <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-background/0 via-background/15 to-background/65" />}
      <HeroCopy />
      {mode === "three" && painted && (
        <p className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-kufi text-[11px] text-parchment/70 hero-text">
          اسحب لاستكشاف المكتبة · اختر الضوء للانتقال
        </p>
      )}
    </section>
  );
}
import { useEffect, useRef } from "react";
import desktopIntroVideo from "@/assets/library-scroll-desktop.mp4.asset.json";
import mobileIntroVideo from "@/assets/library-scroll-mobile.mp4.asset.json";

/** Full-screen intro: shorter phone scroll, unchanged desktop scroll. */
export function ScrollVideoHero() {
  return <ScrollVideo />;
}

function ScrollVideo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;
    let raf = 0;
    const mobileScreen = window.matchMedia("(max-width: 767px)");
    const reloadSource = () => {
      video.load();
    };
    mobileScreen.addEventListener("change", reloadSource);

    // Ignore tiny drift so a settled frame is never re-decoded.
    const DEAD_ZONE = 0.01;

    const tick = () => {
      const rect = wrap.getBoundingClientRect();
      // Use the actual sticky height on phones: browser bars change innerHeight
      // during touch scrolling and must not shift the same frame's position.
      const stickyHeight = wrap.firstElementChild?.clientHeight ?? window.innerHeight;
      const total = wrap.offsetHeight - (mobileScreen.matches ? stickyHeight : window.innerHeight);
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const d = video.duration;
      // Never start a seek while one is still decoding: an aborted backward
      // decode is what made scrolling up lag behind scrolling down. Each seek
      // lands exactly on the scroll position, so both directions read alike.
      if (d && Number.isFinite(d) && !video.seeking && video.readyState >= 2) {
        const target = p * (d - 0.05);
        const dead = mobileScreen.matches ? 0.02 : DEAD_ZONE;
        if (Math.abs(target - video.currentTime) > dead) {
          video.currentTime = target;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    video.pause();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      mobileScreen.removeEventListener("change", reloadSource);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative h-[250svh] md:h-[300svh]" aria-label="مقدمة سينمائية">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          aria-hidden
          className="h-full w-full object-cover object-center"
        >
          <source media="(max-width: 767px)" src={mobileIntroVideo.url} type="video/mp4" />
          <source src={desktopIntroVideo.url} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}

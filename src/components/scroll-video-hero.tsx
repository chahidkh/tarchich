import { useEffect, useRef } from "react";
import introVideo from "@/assets/cinematic_intro.mp4.asset.json";
import introVideoMobile from "@/assets/cinematic_intro_mobile.mp4.asset.json";

/** Full-screen intro video, sticky over 600vh, playback scrubbed 1:1 by scroll. */
export function ScrollVideoHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;
    let raf = 0;
    let last = -1;
    const tick = () => {
      const rect = wrap.getBoundingClientRect();
      const total = wrap.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const d = video.duration;
      if (d && Number.isFinite(d)) {
        const t = p * (d - 0.05);
        if (Math.abs(t - last) > 0.001) {
          video.currentTime = t;
          last = t;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    if (window.matchMedia("(max-width: 767px)").matches) {
      video.src = introVideoMobile.url;
      video.load();
    }
    video.pause();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} className="relative h-[600svh]" aria-label="مقدمة سينمائية">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <video
          ref={videoRef}
          src={introVideo.url}
          muted
          playsInline
          preload="auto"
          aria-hidden
          className="h-full w-full object-cover object-center"
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Change speed here.
    // 1 = normal, 1.5 = faster, 0.7 = slower
    video.playbackRate = 1;
  }, []);

  return (
    <video
      ref={videoRef}
      className="fixed inset-0 z-0 w-full h-full object-cover pointer-events-none transition-[opacity,filter] duration-[350ms] ease-out"
      style={{
        opacity: "var(--video-opacity)" as unknown as number,
        filter: "var(--video-filter)",
      }}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
    >
      <source src="/assets/d1.mp4" type="video/mp4" />
    </video>
  );
}

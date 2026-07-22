import React, { useMemo, useEffect, useState } from "react";

interface PhoneFrameProps {
  children: React.ReactNode;
}

const PETAL_COUNT = 14;

export default function PhoneFrame({ children }: PhoneFrameProps) {
  const petals = useMemo(() => Array.from({ length: PETAL_COUNT }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 14,
    duration: 12 + Math.random() * 10,
    size: 8 + Math.random() * 10,
    rot: Math.random() * 360
  })), []);

  const [isLargeScreen, setIsLargeScreen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsLargeScreen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLargeScreen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="w-full min-h-screen linen-bg relative select-none">
      {/* Animated decorative branches */}
      <div className="absolute top-0 left-0 w-36 h-36 opacity-30 select-none pointer-events-none hidden md:block anim-sway z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-brand-sage">
          <path d="M10,0 C30,10 40,30 30,50 C26,58 18,65 14,75 C10,65 16,55 22,45 C28,35 24,20 10,0 Z" />
          <circle cx="28" cy="38" r="3" />
          <circle cx="20" cy="50" r="3.5" />
          <circle cx="16" cy="62" r="2.8" />
        </svg>
      </div>
      <div className="absolute top-4 right-4 w-40 h-40 opacity-25 select-none pointer-events-none hidden md:block anim-sway-alt z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-brand-sage">
          <path d="M10,0 C30,10 40,30 30,50 C26,58 18,65 14,75 C10,65 16,55 22,45 C28,35 24,20 10,0 Z" />
          <circle cx="28" cy="38" r="3" />
          <circle cx="20" cy="50" r="3.5" />
        </svg>
      </div>

      {/* Falling petals */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {petals.map(p => (
          <span
            key={p.id}
            className="petal"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`
            }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full" style={{ transform: `rotate(${p.rot}deg)` }}>
              <path d="M12 21s-7-4.5-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.5-7 10-7 10z" fill="currentColor" />
            </svg>
          </span>
        ))}
      </div>

      <main className={`relative z-20 w-full flex flex-col ${
        isLargeScreen
          ? "h-screen p-4 lg:p-6"
          : "h-[100dvh] max-h-[100dvh] p-0 sm:p-2 overflow-hidden"
      }`}>
        <div className={`w-full bg-[var(--bg-panel)] border-0 sm:border border-brand-sand rounded-none sm:rounded-2xl shadow-xl relative flex flex-col overflow-hidden ${
          isLargeScreen
            ? "h-full max-w-none"
            : "max-w-md md:max-w-6xl h-[100dvh] sm:h-[730px] md:h-[800px]"
        }`}>
          <div className="flex-1 flex flex-col min-h-0 relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { themes, type ThemeId } from "./themes";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("wedding_theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("wedding_theme", theme);
  }, [theme]);
  return { theme, setTheme, toggle: () => setTheme(t => t === "dark" ? "light" : "dark") };
}

export function usePaletteTheme() {
  // Palette imposée : une seule option "brand"
  const theme = themes.brand;
  // Pas de switching nécessaire
  return {
    palette: "brand" as ThemeId,
    setPalette: () => { /* noop - palette is locked */ },
    theme,
    toggle: () => { /* noop */ }
  };
}

export function useSound() {
  const [enabled, setEnabled] = useState<boolean>(() => localStorage.getItem("wedding_sound") !== "off");
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem("wedding_sound", enabled ? "on" : "off");
  }, [enabled]);

  const ensureCtx = () => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch { /* noop */ }
    }
    return audioCtxRef.current;
  };

  const play = (type: "swipe" | "like" | "nope" | "lock" | "tap" | "pop") => {
    if (!enabled) return;
    if (typeof navigator !== "undefined" && (navigator as any).vibrate) {
      const map: Record<string, number | number[]> = {
        swipe: 8, like: 12, nope: 6, lock: [10, 40, 20], tap: 4, pop: 10
      };
      try { (navigator as any).vibrate(map[type]); } catch { /* noop */ }
    }
    const ctx = ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    const presets: Record<string, { f: number; type: OscillatorType; dur: number; vol: number; slide?: number }> = {
      swipe: { f: 520, type: "sine", dur: 0.08, vol: 0.06 },
      like:  { f: 720, type: "sine", dur: 0.18, vol: 0.08, slide: 240 },
      nope:  { f: 240, type: "sawtooth", dur: 0.12, vol: 0.05 },
      lock:  { f: 880, type: "sine", dur: 0.4, vol: 0.1, slide: 440 },
      tap:   { f: 440, type: "sine", dur: 0.04, vol: 0.04 },
      pop:   { f: 660, type: "triangle", dur: 0.1, vol: 0.07, slide: -120 }
    };
    const p = presets[type];
    osc.frequency.setValueAtTime(p.f, now);
    if (p.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, p.f + p.slide), now + p.dur);
    osc.type = p.type;
    gain.gain.setValueAtTime(p.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);
    osc.start(now);
    osc.stop(now + p.dur + 0.02);
  };

  return { enabled, setEnabled, toggle: () => setEnabled(e => !e), play };
}

export function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(target);
  const previousRef = useRef(target);
  useEffect(() => {
    const from = previousRef.current;
    const to = target;
    if (from === to) return;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(from + (to - from) * eased);
      setValue(v);
      if (k < 1) raf = requestAnimationFrame(step);
      else previousRef.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function usePullToRefresh(onRefresh: () => Promise<void> | void) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [distance, setDistance] = useState(0);
  const startY = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
      lastY = startY.current;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const y = e.touches[0].clientY;
      const dy = y - startY.current;
      if (dy > 0 && el.scrollTop <= 0) {
        setPulling(true);
        setDistance(Math.min(120, dy * 0.5));
      } else {
        setDistance(0);
      }
      lastY = y;
    };
    const onTouchEnd = async () => {
      if (distance > 60) {
        setRefreshing(true);
        try { await onRefresh(); } finally {
          setRefreshing(false);
          setPulling(false);
          setDistance(0);
          startY.current = null;
        }
      } else {
        setPulling(false);
        setDistance(0);
        startY.current = null;
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [distance, onRefresh]);

  return { ref, pulling, refreshing, distance };
}

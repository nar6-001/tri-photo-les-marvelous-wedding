import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X as XIcon, AlertTriangle } from "lucide-react";

/* ================================================================== */
/* CONFETTI                                                            */
/* ================================================================== */

export function ConfettiBurst({ trigger, count = 60 }: { trigger: number; count?: number }) {
  const [pieces, setPieces] = useState<{ id: number; x: number; y: number; rot: number; color: string; delay: number; dx: number; dy: number }[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const colors = ["#C2A679", "#525E43", "#8A9A7E", "#B86F77", "#F5E6D3", "#EFECE6"];
    const arr = Array.from({ length: count }).map((_, i) => ({
      id: trigger + i,
      x: 50 + (Math.random() - 0.5) * 80,
      y: 50 + (Math.random() - 0.5) * 20,
      rot: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 120,
      dx: (Math.random() - 0.5) * 600,
      dy: -200 - Math.random() * 400
    }));
    setPieces(arr);
    const t = setTimeout(() => setPieces([]), 2200);
    return () => clearTimeout(t);
  }, [trigger, count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden">
      {pieces.map(p => (
        <motion.span
          key={p.id}
          initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: 0, opacity: 1, scale: 0.6 }}
          animate={{ x: `calc(${p.x}vw + ${p.dx}px)`, y: `calc(${p.y}vh + ${p.dy + 1000}px)`, rotate: p.rot, opacity: 0, scale: 1 }}
          transition={{ duration: 1.8 + Math.random() * 0.6, delay: p.delay / 1000, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "absolute", top: 0, left: 0, width: 8, height: 14, background: p.color, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

/* ================================================================== */
/* CONFIRM MODAL                                                       */
/* ================================================================== */

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ open, title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler", danger, onConfirm, onClose }: ConfirmModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onConfirm]);

  useEffect(() => {
    if (open) {
      ref.current?.focus();
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            ref={ref}
            tabIndex={-1}
            initial={{ scale: 0.92, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={e => e.stopPropagation()}
            className="bg-[var(--bg-panel)] border border-brand-sand rounded-2xl shadow-2xl p-6 w-full max-w-sm outline-none"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-100 text-red-600" : "bg-brand-sand text-brand-gold"}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif-display font-bold text-[var(--text-strong)] text-lg leading-tight">{title}</h3>
                <p className="text-xs text-brand-sage mt-1.5 leading-relaxed font-serif-display italic">{message}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white border border-brand-sand hover:bg-brand-cream text-brand-sage hover:text-brand-olive py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => { onConfirm(); onClose(); }}
                className={`flex-1 text-white py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer shadow ${
                  danger ? "bg-red-500 hover:bg-red-600" : "bg-brand-olive hover:bg-brand-moss"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/* SKELETON                                                            */
/* ================================================================== */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden />;
}

/* ================================================================== */
/* PROGRESS BAR (tricolore: sage → or → emeraude)                      */
/* ================================================================== */

export function TricolorProgress({ value, height = 8, className = "" }: { value: number; height?: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const colorStops = [
    { at: 0, color: "#8A9A7E" },
    { at: 50, color: "#C2A679" },
    { at: 100, color: "#2D8659" }
  ];
  return (
    <div className={`w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden ${className}`} style={{ height }}>
      <motion.div
        className="h-full rounded-full progress-tricolor"
        initial={{ width: 0 }}
        animate={{ width: `${v}%` }}
        transition={{ type: "spring", damping: 22, stiffness: 200 }}
        style={{ background: `linear-gradient(90deg, ${colorStops[0].color} 0%, ${colorStops[1].color} 50%, ${colorStops[2].color} 100%)`, backgroundSize: v > 0 ? `${10000 / v}% 100%` : "100% 100%" }}
      />
    </div>
  );
}

/* ================================================================== */
/* SMART IMAGE (with skeleton + lazy + retry)                          */
/* ================================================================== */

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  alt: string;
  rounded?: string;
  fit?: "contain" | "cover" | "smart";
  className?: string;
}

export function SmartImage({ src, alt, className = "", rounded = "rounded-md", fit = "contain", ...rest }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);

  const handleRetry = useCallback(() => {
    setFailed(false);
    setLoaded(false);
    setRetryCount(c => c + 1);
  }, []);

  // Smart fit: portrait (ratio < 0.95) → cover, paysage/carré → contain
  const effectiveFit: "contain" | "cover" = fit === "smart"
    ? (naturalRatio !== null && naturalRatio < 0.95 ? "cover" : "contain")
    : fit;

  return (
    <div className={`relative overflow-hidden ${rounded} bg-[var(--bg-subtle)] ${className}`}>
      {!loaded && !failed && <Skeleton className="absolute inset-0" />}
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-sage text-[10px] gap-1.5 p-2">
          <span className="font-bold uppercase tracking-widest">Image indisponible</span>
          <button
            type="button"
            onClick={handleRetry}
            className="px-2.5 py-1 bg-brand-olive text-brand-cream text-[9px] font-bold rounded-full uppercase cursor-pointer"
          >Réessayer</button>
        </div>
      ) : (
        <motion.img
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: loaded ? 1 : 1.06, opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          src={`${src}${src.includes("?") ? "&" : "?"}r=${retryCount}`}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            setLoaded(true);
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setNaturalRatio(img.naturalWidth / img.naturalHeight);
            }
          }}
          onError={() => setFailed(true)}
          className={`w-full h-full object-${effectiveFit} transition-transform duration-700 hover:scale-[1.03] active:scale-[1.05] ${loaded ? "opacity-100" : "opacity-0"}`}
          {...(rest as any)}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/* HEART BURST (mini particle pop on like)                             */
/* ================================================================== */

export function HeartBurst({ trigger, x, y }: { trigger: number; x: number; y: number }) {
  const items = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    id: i, dx: (Math.random() - 0.5) * 200, dy: -120 - Math.random() * 100, rot: (Math.random() - 0.5) * 90, size: 12 + Math.random() * 10, color: ["#B86F77", "#C2A679", "#E07A8C", "#D6B88A"][i % 4]
  })), [trigger]);
  if (!trigger) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {items.map(it => (
        <motion.svg
          key={`${trigger}-${it.id}`}
          width={it.size} height={it.size} viewBox="0 0 24 24"
          initial={{ x, y, opacity: 1, scale: 0.3, rotate: 0 }}
          animate={{ x: x + it.dx, y: y + it.dy, opacity: 0, scale: 1, rotate: it.rot }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <path d="M12 21s-7-4.5-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.5-7 10-7 10z" fill={it.color} />
        </motion.svg>
      ))}
    </div>
  );
}

/* ================================================================== */
/* TOAST CHECKMARK (animated SVG)                                      */
/* ================================================================== */

export function AnimatedCheck({ size = 56, color = "#C2A679" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" className="check-svg">
      <motion.circle
        cx="30" cy="30" r="26"
        fill="none" stroke={color} strokeWidth="3"
        initial={{ pathLength: 0, scale: 0.6, opacity: 0 }}
        animate={{ pathLength: 1, scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
      <motion.path
        d="M18 31 L27 40 L43 22"
        fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ================================================================== */
/* PAGE TRANSITION WRAPPER                                             */
/* ================================================================== */

export function PageTransition({ children, pageKey }: { children: React.ReactNode; pageKey: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col min-h-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ================================================================== */
/* TOAST (success feedback with thumbnail)                              */
/* ================================================================== */

export function LikeToast({ photo, onDone }: { photo: { name: string; image: string } | null; onDone: () => void }) {
  useEffect(() => {
    if (!photo) return;
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [photo, onDone]);
  return (
    <AnimatePresence>
      {photo && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", damping: 18, stiffness: 240 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] bg-brand-olive text-brand-cream rounded-full pl-1.5 pr-5 py-1.5 shadow-2xl flex items-center gap-2 border border-brand-gold/30"
          role="status"
          aria-live="polite"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-cream/40 shrink-0">
            <img src={photo.image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] font-extrabold tracking-widest uppercase text-brand-gold/90">Sélection Album</span>
            <span className="text-[11px] font-bold truncate max-w-[160px]">{photo.name}</span>
          </div>
          <Check className="w-4 h-4 text-brand-gold ml-1" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

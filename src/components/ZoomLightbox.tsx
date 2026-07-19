import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ZoomIn, ZoomOut, RotateCcw, X, HelpCircle, Move } from "lucide-react";
import { WeddingPhoto } from "../utils/weddingData";
import { SmartImage, ConfirmModal } from "./Shared";

interface ZoomLightboxProps {
  photo: WeddingPhoto;
  onClose: () => void;
  isLocked?: boolean;
  onRemove?: () => void;
}

export default function ZoomLightbox({ photo, onClose, isLocked = false, onRemove }: ZoomLightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistanceRef = useRef<number | null>(null);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [photo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleReset();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const handleZoomIn = useCallback(() => setScale(s => clamp(s + 0.4, 1, 6)), []);
  const handleZoomOut = useCallback(() => {
    setScale(s => {
      const next = clamp(s - 0.4, 1, 6);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);
  const handleReset = useCallback(() => { setScale(1); setPosition({ x: 0, y: 0 }); }, []);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale > 1) handleReset();
    else {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = e.clientX - rect.left - rect.width / 2;
        const cy = e.clientY - rect.top - rect.height / 2;
        setScale(2.5);
        setPosition({ x: -cx, y: -cy });
      } else {
        setScale(2.5);
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setScale(s => {
      const next = clamp(s + delta, 1, 6);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
      if (scale <= 1) {
        const now = Date.now();
        if (now - lastTapRef.current < 280) {
          if (scale > 1) handleReset();
          else { setScale(2.5); setPosition({ x: 0, y: 0 }); }
        }
        lastTapRef.current = now;
      }
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      lastTouchDistanceRef.current = distance;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && scale > 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastTouchRef.current.x;
      const dy = touch.clientY - lastTouchRef.current.y;
      setPosition(p => ({ x: p.x + dx, y: p.y + dy }));
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (lastTouchDistanceRef.current) {
        const delta = distance / lastTouchDistanceRef.current;
        setScale(s => {
          const next = clamp(s * delta, 1, 6);
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      }
      lastTouchDistanceRef.current = distance;
    }
  };

  const handleTouchEnd = () => { setIsDragging(false); lastTouchDistanceRef.current = null; };

  return (
    <div className="absolute inset-0 bg-[#0C0F0A]/98 z-[55] flex flex-col justify-between p-4 backdrop-blur-md select-none animate-fade-in text-left font-sans" ref={containerRef}>
      <div className="flex items-center justify-between w-full shrink-0 z-10 pb-2">
        <div className="text-brand-cream/90 flex flex-col">
          <span className="bg-brand-gold/90 text-brand-cream text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block w-fit mb-0.5 shadow-sm">
            {photo.category}
          </span>
          <h3 className="text-sm font-serif-display font-bold tracking-tight text-white">{photo.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {onRemove && !isLocked && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md active:scale-95"
            >Retirer</button>
          )}
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8.5 h-8.5 rounded-full bg-white/10 hover:bg-white/20 text-[#EFECE6] flex items-center justify-center cursor-pointer active:scale-90 transition-all shadow-sm border border-white/5"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 w-full relative flex items-center justify-center overflow-hidden cursor-crosshair"
        onMouseDown={(e) => {
          if (scale <= 1) return;
          e.preventDefault();
          setIsDragging(true);
          dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        }}
        onMouseMove={(e) => {
          if (!isDragging || scale <= 1) return;
          setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onDoubleClick={handleDoubleClick}
        >
          <SmartImage src={photo.image} alt={photo.name} fit="contain" className="max-w-full max-h-full drop-shadow-2xl rounded-sm" />
        </motion.div>

        {/* Mini-map (visible when zoomed) */}
        <AnimatePresence>
          {scale > 1.2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-3 right-3 w-24 h-24 bg-black/70 border border-white/10 rounded-lg overflow-hidden backdrop-blur"
            >
              <div className="relative w-full h-full">
                <img src={photo.image} alt="" className="absolute inset-0 w-full h-full object-contain opacity-50" />
                <motion.div
                  className="absolute border-2 border-brand-gold rounded-sm shadow-[0_0_8px_rgba(194,166,121,0.6)]"
                  animate={{
                    left: `${clamp(50 - (position.x / (scale * 4)), 0, 80)}%`,
                    top: `${clamp(50 - (position.y / (scale * 4)), 0, 80)}%`,
                    width: `${100 / scale}%`,
                    height: `${100 / scale}%`
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {scale > 1 && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-mono text-[10px] tracking-widest flex items-center gap-1.5 pointer-events-none uppercase">
            <Move className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
            <span>Zoom {Math.round(scale * 100)}%</span>
          </div>
        )}

        <AnimatePresence>
          {showHelp && scale <= 1 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 pointer-events-auto opacity-90 flex items-center gap-1 text-[9px] text-zinc-300 font-medium bg-black/60 hover:bg-black/80 px-2.5 py-1.5 rounded-md cursor-pointer"
            >
              <HelpCircle className="w-3 h-3 text-brand-gold" />
              <span>Double-clic pour zoomer · Molette · Esc pour fermer</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-2.5 mt-2.5 shrink-0 z-10 w-full bg-gradient-to-t from-black/80 to-transparent p-3 rounded-2xl border border-white/5">
        <div className="flex items-center gap-1.5 justify-center">
          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={handleZoomOut} disabled={scale <= 1} aria-label="Zoomer arrière"
            className={`w-9.5 h-9.5 rounded-full flex items-center justify-center transition-all ${scale <= 1 ? 'bg-[#1e221a]/50 text-brand-sage/30 cursor-not-allowed border border-white/5' : 'bg-[#2a3024]/85 hover:bg-[#3d4635] text-brand-cream border border-brand-gold/30 cursor-pointer'}`}>
            <ZoomOut className="w-4 h-4" />
          </motion.button>
          <span className="text-[10px] font-mono font-bold text-center w-14 text-brand-cream">{scale === 1 ? '1.0x' : `${scale.toFixed(1)}x`}</span>
          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={handleZoomIn} disabled={scale >= 6} aria-label="Zoomer avant"
            className={`w-9.5 h-9.5 rounded-full flex items-center justify-center transition-all ${scale >= 6 ? 'bg-[#1e221a]/50 text-brand-sage/30 cursor-not-allowed border border-white/5' : 'bg-[#2a3024]/85 hover:bg-[#3d4635] text-brand-cream border border-brand-gold/30 cursor-pointer'}`}>
            <ZoomIn className="w-4 h-4" />
          </motion.button>
          <div className="w-[1px] h-5 bg-white/10 mx-1" />
          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={handleReset} disabled={scale === 1 && position.x === 0 && position.y === 0} aria-label="Réinitialiser"
            className={`w-9.5 h-9.5 rounded-full flex items-center justify-center transition-all ${scale === 1 && position.x === 0 && position.y === 0 ? 'bg-[#1e221a]/50 text-brand-sage/30 cursor-not-allowed border border-white/5' : 'bg-[#2a3024]/85 hover:bg-[#3d4635] text-brand-cream border border-brand-gold/30 cursor-pointer'}`}>
            <RotateCcw className="w-4.5 h-4.5" />
          </motion.button>
        </div>
        <p className="text-[9px] text-[#A0AA9C] font-semibold uppercase tracking-widest text-center">
          Pinch sur mobile · Glisser pour explorer · Toucher 2x pour zoomer
        </p>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Retirer ce cliché ?"
        message={`Le cliché "${photo.name}" sera retiré de votre sélection. Vous pourrez le rajouter plus tard.`}
        confirmLabel="Retirer"
        cancelLabel="Garder"
        danger
        onConfirm={() => { onRemove?.(); onClose(); }}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}

import React, { useRef, useState, MouseEvent } from "react";
import { motion } from "motion/react";
import { RotateCcw, X, MessageSquare } from "lucide-react";

interface ActionButtonsProps {
  onSwipe: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onUndo: () => void;
  canUndo: boolean;
  onCommentClick: () => void;
  disabled?: boolean;
  disabledCategories?: {
    Dot?: boolean;
    Globale?: boolean;
    Album?: boolean;
  };
  categoryCounts?: {
    Dot?: number;
    Globale?: number;
    Album?: number;
    [key: string]: number | undefined;
  };
}

function MagneticButton({ children, onClick, className, style, title, disabled, ariaLabel }: {
  children: React.ReactNode;
  onClick: () => void;
  className: string;
  style?: React.CSSProperties;
  title: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: x * 0.18, y: y * 0.18 });
  };

  const handleMouseLeave = () => setOffset({ x: 0, y: 0 });

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const id = Date.now() + Math.random();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipples(prev => [...prev, { x, y, id }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 650);
    }
    onClick();
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      disabled={disabled}
      aria-label={ariaLabel || title}
      title={title}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {children}
      {ripples.map(r => (
        <span
          key={r.id}
          className="ripple"
          style={{ left: r.x, top: r.y, width: 80, height: 80, marginLeft: -40, marginTop: -40 }}
        />
      ))}
    </motion.button>
  );
}

export default function ActionButtons({ onSwipe, onUndo, canUndo, onCommentClick, disabled, disabledCategories, categoryCounts }: ActionButtonsProps) {
  const dotCount = categoryCounts?.Dot || 0;
  const classiqueCount = categoryCounts?.Globale || 0;
  const albumCount = categoryCounts?.Album || 0;

  return (
    <div className="flex items-center justify-center gap-3 w-full px-2 sm:px-4 select-none shrink-0 py-4 bg-transparent mt-1 z-30">
      <div className="flex flex-col items-center gap-1.5">
        <MagneticButton
          onClick={onUndo}
          disabled={!canUndo || disabled}
          ariaLabel="Revenir à la photo précédente"
          className={`w-11 h-11 flex items-center justify-center rounded-full bg-brand-cream hover:bg-brand-sand border-2 border-brand-sage/40 text-brand-gold shadow-md duration-300 ${
            !canUndo || disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
          }`}
          title="Revenir à la photo précédente"
        >
          <RotateCcw className="w-4.5 h-4.5 stroke-[2.5]" />
        </MagneticButton>
        <span className="text-[8.5px] font-extrabold uppercase text-brand-sage tracking-wider">Retour</span>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <MagneticButton
          onClick={() => onSwipe('left')}
          disabled={disabled}
          ariaLabel="Passer / Ignorer ce cliché"
          className="w-14 h-14 flex items-center justify-center rounded-full bg-white hover:bg-red-50/50 border-2 border-red-200/60 hover:border-red-400/50 text-red-500 shadow-lg duration-300 cursor-pointer"
          title="Passer / Ignorer"
        >
          <X className="w-7 h-7 stroke-[3]" />
        </MagneticButton>
        <span className="text-[8.5px] font-extrabold uppercase text-red-400 tracking-wider">Écarter</span>
      </div>

      {!disabledCategories?.Dot && (
        <div className="flex flex-col items-center gap-1.5 relative">
          <MagneticButton
            onClick={() => onSwipe('down')}
            disabled={disabled}
            ariaLabel="Sélection Dot"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:brightness-95 border-2 shadow-md duration-300 cursor-pointer relative"
            style={{ background: "#E8A87C", borderColor: "#C9744E", color: "#5C2E0E" }}
            title="Sélection Dot"
          >
            <span className="font-serif-display font-black text-[20px] leading-none notranslate" translate="no">D</span>
            {dotCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#5C2E0E] text-white text-[9px] font-black rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-sm border border-white">
                {dotCount}
              </span>
            )}
          </MagneticButton>
          <span className="text-[8.5px] font-extrabold uppercase text-[#C9744E] tracking-wider font-mono">
            Dot ({dotCount})
          </span>
        </div>
      )}

      {!disabledCategories?.Globale && (
        <div className="flex flex-col items-center gap-1.5 relative">
          <MagneticButton
            onClick={() => onSwipe('up')}
            disabled={disabled}
            ariaLabel="Retouche classique"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:brightness-95 border-2 shadow-md duration-300 cursor-pointer relative"
            style={{ background: "#C5D9B5", borderColor: "#8FAF7B", color: "#2D4A1F" }}
            title="Retouche classique"
          >
            <span className="font-serif-display font-black text-[20px] leading-none notranslate" translate="no">C</span>
            {classiqueCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#2D4A1F] text-white text-[9px] font-black rounded-full min-w-5 h-5 px-1 flex items-center justify-center shadow-sm border border-white">
                {classiqueCount}
              </span>
            )}
          </MagneticButton>
          <span className="text-[8.5px] font-extrabold uppercase text-[#4A6B3A] tracking-wider font-mono">
            Classique ({classiqueCount})
          </span>
        </div>
      )}

      {!disabledCategories?.Album && (
        <div className="flex flex-col items-center gap-1.5 relative">
          <motion.div
            animate={disabled ? {} : { scale: [1, 1.04, 1] }}
            transition={disabled ? {} : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className={disabled ? "opacity-50" : ""}
          >
            <MagneticButton
              onClick={() => onSwipe('right')}
              disabled={disabled}
              ariaLabel="Ajouter à l'album"
              className="w-14 h-14 flex items-center justify-center rounded-full hover:brightness-110 border-2 border-white/60 shadow-lg duration-300 cursor-pointer halo-pulse relative"
              style={{ background: "#2E2E2E", color: "#FDFBF8" }}
              title="Ajouter à l'album"
            >
              <span className="font-serif-display font-black text-[26px] leading-none notranslate" translate="no">A</span>
              {albumCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-black rounded-full min-w-5.5 h-5.5 px-1 flex items-center justify-center shadow-sm border border-white">
                  {albumCount}
                </span>
              )}
            </MagneticButton>
          </motion.div>
          <span className="text-[8.5px] font-extrabold uppercase text-brand-olive tracking-wider font-mono">
            Album ({albumCount})
          </span>
        </div>
      )}

      <div className="flex flex-col items-center gap-1.5">
        <MagneticButton
          onClick={onCommentClick}
          disabled={disabled}
          ariaLabel="Laisser un mot"
          className="w-11 h-11 flex items-center justify-center rounded-full bg-brand-cream hover:bg-brand-sand border-2 border-brand-sage/30 text-emerald-650 shadow-md duration-300 cursor-pointer"
          title="Laisser un mot"
        >
          <MessageSquare className="w-4.5 h-4.5 stroke-[2.5] text-brand-olive" />
        </MagneticButton>
        <span className="text-[8.5px] font-extrabold uppercase text-brand-sage tracking-wider">Note</span>
      </div>
    </div>
  );
}

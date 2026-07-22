import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { MapPin, CheckCircle2, ChevronDown, Sparkle, Heart, ZoomIn } from "lucide-react";
import { MultiImageProfile } from "../data";
import { SmartImage } from "./Shared";

interface SwipeCardProps {
  profile: MultiImageProfile;
  onSwipe: (dir: 'left' | 'right' | 'up') => void;
  active: boolean;
  isTop?: boolean;
  stackIndex?: number;
  onZoom?: () => void;
  key?: React.Key;
}

export default function SwipeCard({ profile, onSwipe, active, isTop = true, stackIndex = 0, onZoom }: SwipeCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, 0, 200], [0.6, 1, 0.6]);
  const liftZ = useTransform(x, [-100, 0, 100], [10, 0, 10]);

  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0]);
  const superLikeOpacity = useTransform(y, [-100, -20], [1, 0]);
  const stampScale = useTransform(x, [0, 80], [0.8, 1.1]);

  const handlePhotoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isTop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isRightSide = clickX > rect.width / 2;
    if (isRightSide) {
      if (currentImageIndex < profile.images.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    } else {
      if (currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      }
    }
  };

  const handleDragEnd = (_event: any, info: any) => {
    if (!active || !isTop) return;
    const swipeThreshold = 110;
    if (info.offset.x > swipeThreshold) {
      setDirection('right');
      onSwipe('right');
    } else if (info.offset.x < -swipeThreshold) {
      setDirection('left');
      onSwipe('left');
    } else if (info.offset.y < -swipeThreshold) {
      setDirection('up');
      onSwipe('up');
    }
  };

  // Offsets when stacked
  const stackOffset = stackIndex * 8;
  const stackScale = 1 - stackIndex * 0.04;
  const stackOpacity = stackIndex > 2 ? 0 : 1;

  return (
    <motion.div
      initial={isTop ? { scale: 0.92, y: 30, opacity: 0 } : false}
      animate={
        isTop
          ? { scale: 1, y: 0, opacity: 1 }
          : { scale: stackScale, y: stackOffset, opacity: stackOpacity }
      }
      exit={(dir) => {
        if (dir === 'right') return { x: 600, rotate: 30, opacity: 0, transition: { duration: 0.35 } };
        if (dir === 'left') return { x: -600, rotate: -30, opacity: 0, transition: { duration: 0.35 } };
        if (dir === 'up') return { y: -800, opacity: 0, transition: { duration: 0.4 } };
        return { opacity: 0, scale: 0.9 };
      }}
      transition={{ type: "spring", damping: 22, stiffness: 240 }}
      className={`absolute inset-0 flex flex-col justify-center items-center ${isTop ? "z-10" : "z-0"} p-0 pointer-events-none`}
    >
      <motion.div
        id={`card-${profile.id}`}
        drag={isTop && active && !showDetails}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        style={isTop && active ? { x, y, rotate, opacity, zIndex: liftZ } : {}}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className={`w-full h-full rounded-none overflow-hidden bg-[#EFECE6] p-0 flex flex-col ${isTop ? 'cursor-grab active:cursor-grabbing' : ''} select-none relative pointer-events-auto`}
      >
        {/* Stamps */}
        {isTop && active && (
          <>
            <motion.div
              style={{ opacity: likeOpacity, scale: stampScale, rotate: -14 }}
              className="absolute top-12 left-8 z-40 pointer-events-none"
            >
              <div className="border-4 text-[color:var(--stamp-like,#C2A679)] font-serif font-black text-3xl tracking-widest px-5 py-1 rounded uppercase bg-white/95 shadow-[0_4px_18px_rgba(194,166,121,0.5)] backdrop-blur-sm" style={{ borderColor: "var(--stamp-like, #C2A679)", color: "var(--stamp-like, #C2A679)" }}>
                PRENDRE
              </div>
            </motion.div>
            <motion.div
              style={{ opacity: nopeOpacity, scale: stampScale, rotate: 14 }}
              className="absolute top-12 right-8 z-40 pointer-events-none"
            >
              <div className="border-4 font-serif font-black text-3xl tracking-widest px-5 py-1 rounded uppercase bg-white/95 shadow-[0_4px_18px_rgba(155,58,74,0.5)] backdrop-blur-sm" style={{ borderColor: "var(--stamp-nope, #9B3A4A)", color: "var(--stamp-nope, #9B3A4A)" }}>
                ÉCARTER
              </div>
            </motion.div>
            <motion.div
              style={{ opacity: superLikeOpacity, scale: stampScale }}
              className="absolute bottom-48 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
            >
              <div className="border-2 font-serif font-black text-xl tracking-widest px-4 py-1 rounded uppercase bg-white/95 shadow" style={{ borderColor: "var(--stamp-super, #A56B47)", color: "var(--stamp-super, #A56B47)" }}>
                ★ COUP DE COEUR ★
              </div>
            </motion.div>
          </>
        )}

        {/* Image */}
        <div
          onClick={handlePhotoTap}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (isTop && active && onZoom) onZoom();
          }}
          className="relative flex-1 w-full min-h-0 bg-[#131611] overflow-hidden cursor-pointer flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
            >
              <SmartImage
                src={profile.images[currentImageIndex]}
                alt={profile.name}
                fit="smart"
                className="w-full h-full max-w-full max-h-full select-none pointer-events-none transition-transform duration-700 hover:scale-105"
              />
            </motion.div>
          </AnimatePresence>

          {/* Carousel progress */}
          <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-30">
            {profile.images.map((_, idx) => (
              <motion.div
                key={idx}
                className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"
              >
                <motion.div
                  className="h-full bg-white"
                  initial={false}
                  animate={{ width: idx === currentImageIndex ? "100%" : idx < currentImageIndex ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </motion.div>
            ))}
          </div>

          {isTop && onZoom && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onZoom(); }}
              className="absolute top-8 left-4 w-7.5 h-7.5 rounded-full bg-[#131710]/80 border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-90 opacity-90 hover:opacity-100 hover:scale-105 shadow transition-all duration-300 z-30"
              title="Agrandir / Zoomer"
              aria-label="Zoomer"
            >
              <ZoomIn className="w-3.5 h-3.5 text-brand-gold" />
            </button>
          )}

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-8 right-4 bg-brand-olive/85 backdrop-blur-xs text-brand-cream px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-widest uppercase z-30 shadow-sm"
          >
            {profile.distance}
          </motion.div>

          <div className="absolute bottom-3 inset-x-0 flex flex-col items-center justify-end text-center z-20 pointer-events-none px-4">
            <motion.div
              key={profile.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-black/80 backdrop-blur-md border border-white/25 text-white px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider shadow-xl flex items-center gap-2 notranslate pointer-events-auto"
              translate="no"
            >
              <span className="text-brand-gold">📷</span>
              <span>{profile.name}</span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Details drawer */}
      <AnimatePresence>
        {showDetails && isTop && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="absolute inset-x-3 bottom-0 top-3 bg-[var(--bg-panel)] border border-brand-sage/20 rounded-t-3xl z-50 flex flex-col overflow-hidden text-brand-moss shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative h-60 bg-[#131611] flex items-center justify-center shrink-0 overflow-hidden">
              <SmartImage src={profile.images[currentImageIndex]} alt={profile.name} fit="contain" className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-panel)] via-transparent to-transparent" />
              <button
                onClick={() => setShowDetails(false)}
                aria-label="Fermer les détails"
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-brand-olive text-brand-cream shadow-md hover:bg-brand-moss active:scale-95 transition-all cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-serif-display font-bold text-brand-olive">{profile.name}</h3>
                  {profile.verified && <CheckCircle2 className="w-5 h-5 fill-brand-gold text-brand-cream" />}
                </div>
                <div className="flex items-center gap-1 text-brand-sage text-xs mt-0.5 font-bold uppercase">
                  <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                  <span>{profile.distance}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-5 overflow-y-auto space-y-5 no-scrollbar bg-[var(--bg-panel)]">
              <div className="flex gap-4">
                <div className="bg-white border border-brand-sage/10 rounded-xl px-4 py-3 flex-1 shadow-sm">
                  <span className="text-[10px] text-brand-sage font-extrabold uppercase tracking-wider block mb-0.5">Catégorie</span>
                  <span className="text-xs font-serif-display font-medium text-brand-olive">{profile.distance}</span>
                </div>
                <div className="bg-white border border-brand-sage/10 rounded-xl px-4 py-3 flex-1 shadow-sm">
                  <span className="text-[10px] text-brand-sage font-extrabold uppercase tracking-wider block mb-0.5">Progression</span>
                  <span className="text-xs font-serif-display font-medium text-brand-olive flex items-center gap-1">
                    {profile.status}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-[11px] text-brand-sage font-bold uppercase tracking-widest mb-2 font-serif-display">À propos de ce cliché</h4>
                <p className="text-brand-moss leading-relaxed text-sm bg-white p-4 rounded-xl border border-brand-sand/60 font-serif-display italic">
                  {profile.bio || "Aucune description fournie."}
                </p>
              </div>
              <div className="p-4 rounded-xl border-2 border-dashed border-brand-sage/30 bg-brand-sand/20 text-center">
                <p className="text-[11px] text-brand-sage leading-relaxed font-serif-display">
                  Ces sélections aident directement votre photographe à concevoir le livre d'or et l'album final de votre cérémonie de mariage.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

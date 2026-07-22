import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ZoomIn, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { usePaletteTheme } from '../hooks';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  targetCount: number;
  albumQuota?: number;
}

export function OnboardingTutorial({ isOpen, onClose, clientName, targetCount, albumQuota }: OnboardingTutorialProps) {
  const { theme } = usePaletteTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 safe-top safe-bottom"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[var(--bg-panel)] border border-brand-sand/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 sm:p-8 overflow-y-auto no-scrollbar flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-brand-cream border border-brand-sand flex items-center justify-center mb-5 shadow-sm">
                <Heart className="w-8 h-8 text-brand-gold fill-brand-gold/20" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-serif-display font-black text-brand-olive uppercase tracking-tight leading-tight mb-2">
                Bienvenue,
                <br />
                {clientName}
              </h2>
              
              <p className="text-brand-sage text-sm sm:text-base font-medium mb-8 leading-relaxed px-2">
                Votre objectif : sélectionner vos <strong className="text-brand-olive font-black">{targetCount} clichés favoris</strong> au total{albumQuota && albumQuota > 0 ? <> (dont <strong className="text-brand-olive font-black">{albumQuota} pour l'album</strong>)</> : ''}.
              </p>

              <div className="space-y-4 w-full text-left">
                {/* Swipe Right / Keep */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-brand-olive text-sm uppercase tracking-wide">Glissez vers la droite</h3>
                    <p className="text-xs text-brand-sage mt-0.5 leading-snug">
                      Ou appuyez sur les boutons <strong>C</strong> (Classique) ou <strong>A</strong> (Album) pour conserver une photo.
                    </p>
                  </div>
                </div>

                {/* Swipe Left / Discard */}
                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-red-100 text-red-500 flex items-center justify-center shadow-xs">
                    <ArrowLeft className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-brand-olive text-sm uppercase tracking-wide">Glissez vers la gauche</h3>
                    <p className="text-xs text-brand-sage mt-0.5 leading-snug">
                      Ou appuyez sur le bouton <strong>X</strong> pour écarter une photo de votre sélection.
                    </p>
                  </div>
                </div>

                {/* Click / Zoom */}
                <div className="bg-brand-cream border border-brand-sand/60 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-[var(--bg-subtle)] text-brand-gold flex items-center justify-center shadow-xs border border-brand-sand/30">
                    <ZoomIn className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-brand-olive text-sm uppercase tracking-wide">Appuyez pour zoomer</h3>
                    <p className="text-xs text-brand-sage mt-0.5 leading-snug">
                      Cliquez sur une photo pour la voir en plein écran et explorer les moindres détails.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-8 w-full py-4 px-6 bg-brand-olive text-brand-cream rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-brand-olive/20 transition-all hover:bg-brand-olive/90 active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>C'est parti !</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

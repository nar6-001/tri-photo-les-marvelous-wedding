import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle2, Heart, Sparkles, MessageSquare, Lock, Unlock, ArrowLeft, RefreshCw, FolderOpen, Images, Share2, Award, ExternalLink, Check } from 'lucide-react';
import { ClientAccount, WeddingPhoto } from '../utils/weddingData';
import { SmartImage } from './Shared';

interface FinishViewProps {
  activeClient: ClientAccount;
  globalPhotos: WeddingPhoto[];
  durationFormatted: string;
  onConfirmFinish: () => void;
  onOpenChat: () => void;
  onOpenExplore: () => void;
  onUnlockSelection: () => void;
  onBackToSwipe: () => void;
}

export default function FinishView({
  activeClient,
  globalPhotos,
  durationFormatted,
  onConfirmFinish,
  onOpenChat,
  onOpenExplore,
  onUnlockSelection,
  onBackToSwipe
}: FinishViewProps) {
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);

  const isLocked = Boolean(activeClient.isLocked);

  // Selected photos
  const selectedPhotos = globalPhotos.filter(p => activeClient.selectedPhotoIds.includes(p.id));

  // Category counts
  const choices = activeClient.photoChoices || {};
  const classiqueCount = selectedPhotos.filter(p => (choices[p.id] || 'Classique') === 'Classique').length;
  const albumCount = selectedPhotos.filter(p => choices[p.id] === 'Album').length;

  const targetTotal = activeClient.targetCount || 800;
  const targetAlbum = activeClient.targetCountAlbum || 130;

  const totalPercent = Math.min(100, Math.round((selectedPhotos.length / targetTotal) * 100));

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-app)] overflow-y-auto no-scrollbar pb-16 font-sans select-none">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-b from-brand-olive via-brand-olive to-brand-moss text-brand-cream p-6 sm:p-8 text-center relative overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none" />

        <button
          type="button"
          onClick={onBackToSwipe}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-brand-cream transition-all cursor-pointer backdrop-blur-md"
          title="Retour aux photos"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 200 }}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-gold/20 border-2 border-brand-gold rounded-full flex items-center justify-center mx-auto mb-3 text-brand-gold shadow-lg"
        >
          <Award className={`w-8 h-8 sm:w-10 sm:h-10 text-brand-gold ${isLocked ? 'animate-bounce' : ''}`} />
        </motion.div>

        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-brand-gold font-serif-display block mb-1"
        >
          Espace de Validation du Tri
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl font-serif-display font-black text-brand-cream uppercase tracking-tight"
        >
          {activeClient.name}
        </motion.h1>

        <p className="text-xs sm:text-sm text-brand-cream/80 font-serif-display italic mt-1 max-w-md mx-auto">
          {isLocked
            ? "Félicitations ! Votre sélection d'album est validée et le photographe est informé."
            : "Vérifiez votre sélection ci-dessous et confirmez la fin de votre tri photo."}
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6">

        {/* CARD 1: CHRONOMÈTRE / TEMPS TOTAL PASSÉ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[var(--bg-panel)] border border-brand-sand/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 text-brand-gold flex items-center justify-center shrink-0 shadow-inner">
              <Clock className={`w-6 h-6 text-brand-gold ${!isLocked ? 'animate-spin-slow' : ''}`} />
            </div>
            <div>
              <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-brand-sage block leading-none mb-1">
                {isLocked ? "Temps total de tri (Chrono arrêté)" : "Temps de tri écoulé (Chrono en cours)"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-brand-olive font-mono tabular-nums leading-tight">
                {isLocked
                  ? (activeClient.sortingDurationFormatted || durationFormatted)
                  : durationFormatted}
              </h2>
              <span className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${
                isLocked ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {isLocked ? (
                  <><CheckCircle2 className="w-3 h-3 text-emerald-600 inline" /> Fin du chrono enregistrée</>
                ) : (
                  <><Sparkles className="w-3 h-3 text-amber-600 inline animate-pulse" /> Chrono en cours de calcul...</>
                )}
              </span>
            </div>
          </div>

          <div className="bg-brand-cream border border-brand-sand px-3 py-2 rounded-xl text-center shrink-0 w-full sm:w-auto">
            <span className="text-[9px] uppercase font-bold text-brand-sage block mb-0.5">Statut du dossier</span>
            {isLocked ? (
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wide flex items-center justify-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Sélection Verrouillée
              </span>
            ) : (
              <span className="text-xs font-black text-amber-700 uppercase tracking-wide flex items-center justify-center gap-1 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> En cours de tri
              </span>
            )}
          </div>
        </motion.div>

        {/* CARD 2: RÉCAPITULATIF DES QUOTAS & SÉLECTION */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--bg-panel)] border border-brand-sand/80 rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-brand-sand">
            <div>
              <h3 className="text-sm font-serif-display font-black text-brand-olive uppercase tracking-tight">
                Récapitulatif de votre sélection
              </h3>
              <p className="text-[10.5px] text-brand-sage font-serif-display italic">
                Bilan global des photos retenues
              </p>
            </div>
            <span className="text-lg font-black text-brand-gold font-mono tabular-nums bg-brand-cream px-3 py-1 rounded-xl border border-brand-sand">
              {selectedPhotos.length} / {targetTotal}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-brand-olive">
              <span>Progression globale</span>
              <span className="text-brand-gold font-mono">{totalPercent}%</span>
            </div>
            <div className="h-2.5 w-full bg-brand-sand/40 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totalPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-brand-gold via-brand-olive to-emerald-600 rounded-full"
              />
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-brand-cream/70 border border-brand-sand rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[9.5px] font-extrabold uppercase text-brand-sage block mb-0.5">🎨 Catégorie Classique</span>
                <span className="text-sm font-black text-brand-olive font-mono">{classiqueCount} photo(s)</span>
              </div>
              <span className="text-[10px] font-bold text-brand-sage bg-white px-2 py-1 rounded-md border border-brand-sand">
                sur {targetTotal}
              </span>
            </div>

            <div className={`border rounded-xl p-3.5 flex items-center justify-between ${
              albumCount > targetAlbum
                ? 'bg-red-50/80 border-red-200 text-red-800'
                : 'bg-brand-cream/70 border-brand-sand'
            }`}>
              <div>
                <span className="text-[9.5px] font-extrabold uppercase text-brand-sage block mb-0.5">📖 Catégorie Album</span>
                <span className="text-sm font-black text-brand-olive font-mono">{albumCount} photo(s)</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                albumCount > targetAlbum
                  ? 'bg-red-100 text-red-700 border-red-300 font-mono animate-pulse'
                  : 'bg-white text-brand-sage border-brand-sand'
              }`}>
                sur {targetAlbum}
              </span>
            </div>
          </div>
        </motion.div>

        {/* CARD 3: APERÇU DE QUELQUES PHOTOS SÉLECTIONNÉES */}
        {selectedPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-[var(--bg-panel)] border border-brand-sand/80 rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif-display font-bold text-brand-olive uppercase tracking-wide flex items-center gap-1.5">
                <Images className="w-4 h-4 text-brand-gold" /> Aperçu de votre sélection ({selectedPhotos.length})
              </h3>
              <button
                type="button"
                onClick={onOpenExplore}
                className="text-[10px] font-extrabold uppercase tracking-wider text-brand-gold hover:text-brand-olive transition-colors flex items-center gap-1"
              >
                <span>Voir Tout</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
              {selectedPhotos.slice(0, 6).map((photo) => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-brand-cream border border-brand-sand shadow-2xs group relative">
                  <SmartImage src={photo.image} alt={photo.name} fit="cover" className="w-full h-full duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CARD 4: CONFIRMATION PRINCIPALE & ACTIONS */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 pt-2"
        >
          {!isLocked ? (
            <>
              {/* BIG MAIN CONFIRMATION BUTTON */}
              <button
                type="button"
                onClick={onConfirmFinish}
                className="w-full bg-gradient-to-r from-emerald-700 via-brand-olive to-emerald-800 hover:from-emerald-800 hover:to-brand-moss text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3 text-sm sm:text-base uppercase tracking-wider animate-pulse border border-emerald-500/40"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" />
                <span>CONFIRMER ET VALIDER DÉFINITIVEMENT MON TRI</span>
              </button>

              <button
                type="button"
                onClick={onBackToSwipe}
                className="w-full bg-[var(--bg-panel)] hover:bg-brand-cream border border-brand-sand text-brand-olive font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center block"
              >
                ← Continuer mon tri (Ajouter ou modifier des photos)
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenChat}
                className="w-full bg-brand-olive hover:bg-brand-moss text-brand-cream font-bold py-3.5 px-5 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <MessageSquare className="w-4 h-4 text-brand-gold" />
                <span>Envoyer un message au photographe</span>
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onOpenExplore}
                  className="flex-1 bg-[var(--bg-panel)] hover:bg-brand-cream border border-brand-sand text-brand-olive font-extrabold py-3 px-4 rounded-xl text-[10.5px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Consulter ma sélection</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUnlockConfirm(true)}
                  className="bg-transparent hover:bg-brand-cream border border-dashed border-brand-sand text-brand-sage hover:text-brand-olive font-extrabold py-3 px-4 rounded-xl text-[10.5px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5 text-brand-sage" />
                  <span>Modifier mon tri</span>
                </button>
              </div>
            </>
          )}
        </motion.div>

      </div>

      {/* Unlock confirmation modal */}
      {showUnlockConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-panel)] border border-brand-sand rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <Unlock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-serif-display font-black text-brand-olive uppercase">
              Déverrouiller la sélection ?
            </h3>
            <p className="text-[11px] text-brand-sage leading-relaxed font-serif-display italic">
              Vous allez pouvoir réorganiser, ajouter ou supprimer des clichés. Vous pourrez de nouveau valider votre tri une fois prêt.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlockConfirm(false)}
                className="flex-1 bg-brand-cream border border-brand-sand py-2.5 rounded-xl text-[10px] font-extrabold uppercase text-brand-sage"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnlockConfirm(false);
                  onUnlockSelection();
                }}
                className="flex-1 bg-brand-olive text-white py-2.5 rounded-xl text-[10px] font-extrabold uppercase shadow-sm"
              >
                Oui, Déverrouiller
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

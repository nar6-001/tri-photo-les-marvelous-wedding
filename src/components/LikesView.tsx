import React, { useState, useRef, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, FolderHeart, Check, Image as ImageIcon, ZoomIn, X, Lock, MessageSquare, Edit2, CheckSquare, RefreshCw, RotateCcw,
  Grid, List, LayoutGrid
} from "lucide-react";
import { ClientAccount, WeddingPhoto, CategoryLabels } from '../utils/weddingData';
import { CategoryTab } from '../types';
import ZoomLightbox from './ZoomLightbox';
import { SmartImage, ConfirmModal } from './Shared';
import { CategoryChip } from './AdminShared';
import { usePullToRefresh, useCountUp, usePaletteTheme } from '../hooks';

interface LikesViewProps {
  activeClient: ClientAccount;
  globalPhotos: WeddingPhoto[];
  onRemoveFavorite: (photoId: string) => void;
  onToggleFavorite?: (photoId: string) => void;
  categoryFilter?: CategoryTab;
  categoryLabels?: CategoryLabels;
  onLockSelection?: () => void;
  onUpdatePhotoComment?: (photoId: string, comment: string) => void;
  onRefresh?: () => Promise<void> | void;
  onResetSelection?: () => void;
}

export default function LikesView({
  activeClient,
  globalPhotos,
  onRemoveFavorite,
  onToggleFavorite,
  categoryFilter,
  categoryLabels = { Dot: 'Dot', Globale: 'Globale', Album: 'Album' },
  onLockSelection,
  onUpdatePhotoComment,
  onRefresh,
  onResetSelection
}: LikesViewProps) {
  const { theme } = usePaletteTheme();
  const [viewMode, setViewMode] = useState<'favorites' | 'all'>('favorites');
  const [lightboxPhoto, setLightboxPhoto] = useState<WeddingPhoto | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [commentInputText, setCommentInputText] = useState('');
  const [confirmLock, setConfirmLock] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list' | 'compact'>('grid');

  const selectedPhotos = globalPhotos.filter(photo =>
    activeClient.selectedPhotoIds.includes(photo.id) &&
    (!categoryFilter || categoryFilter === 'Tout' || photo.category === categoryFilter)
  );
  const allCategoryPhotos = globalPhotos.filter(photo => {
    const isClientPhoto = !photo.clientId || photo.clientId === activeClient.id;
    const isCurrentCategory = !categoryFilter || categoryFilter === 'Tout' || photo.category === categoryFilter;
    return isClientPhoto && isCurrentCategory;
  });

  const totalSelectedPhotos = globalPhotos.filter(photo => activeClient.selectedPhotoIds.includes(photo.id));

  const getClientQuotaForCategory = (catKey: string): number => {
    if (activeClient.targetCategoryQuotas && activeClient.targetCategoryQuotas[catKey] !== undefined) {
      return activeClient.targetCategoryQuotas[catKey];
    }
    if (catKey === 'Dot') return activeClient.targetCountDot || 0;
    if (catKey === 'Globale') return activeClient.targetCountGlobale || 0;
    if (catKey === 'Album') return activeClient.targetCountAlbum || 0;
    return 0;
  };

  const isCategoryDisabled = (catKey: string): boolean => {
    return getClientQuotaForCategory(catKey) === -1;
  };

  // Filter out disabled categories from the active labels used in the UI
  const enabledCategoryLabels = Object.fromEntries(
    Object.entries(categoryLabels).filter(([k]) => !isCategoryDisabled(k))
  );

  const target = activeClient.targetCount;
  const totalCount = totalSelectedPhotos.length;
  const isTargetAchieved = totalCount >= target &&
    Object.keys(enabledCategoryLabels).every(cat => {
      const catTarget = getClientQuotaForCategory(cat);
      const catSelectedCount = totalSelectedPhotos.filter(p => p.category === cat).length;
      return catTarget <= 0 || catSelectedCount >= catTarget;
    });
  const isLocked = activeClient.isLocked || false;

  const animatedTotal = useCountUp(totalCount);
  const animatedTarget = useCountUp(target);

  const { ref: pullRef, pulling, refreshing, distance } = usePullToRefresh(async () => {
    if (onRefresh) await onRefresh();
    else await new Promise(r => setTimeout(r, 800));
  });

  let viewTitle = "Ma Sélection";
  let emptyMessage = "Votre livre est vide";
  let emptyDescription = "Commencez à parcourir la liste \"Tout\" pour désigner vos clichés favoris !";
  let categoryHeadline = "";

  if (categoryFilter && categoryFilter !== 'Tout') {
    const label = categoryLabels[categoryFilter] || categoryFilter;
    viewTitle = "Sélection · " + label.toUpperCase();
    categoryHeadline = `Série ${label}`;
    emptyMessage = `Aucun cliché ${label} sélectionné`;
    emptyDescription = `Glissez à droite les photos de la session ${label} pour les voir s'afficher ici.`;
  }

  const handleSaveComment = (photoId: string) => {
    onUpdatePhotoComment?.(photoId, commentInputText.trim());
    setEditingPhotoId(null);
  };

  const startEditingComment = (photoId: string, existingComment = '') => {
    if (isLocked) return;
    setEditingPhotoId(photoId);
    setCommentInputText(existingComment);
  };

  return (
    <div
      ref={pullRef as any}
      className="flex-1 overflow-y-auto px-4 py-5 bg-[var(--bg-app)] text-brand-moss flex flex-col no-scrollbar relative"
    >
      <AnimatePresence>
        {(pulling || refreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-2"
            style={{ height: distance || (refreshing ? 36 : 0) }}
          >
            <RefreshCw className={`w-4 h-4 text-brand-gold ${refreshing ? "pull-spin" : ""}`} />
            <span className="ml-2 text-[10px] uppercase tracking-widest text-brand-sage font-extrabold">
              {refreshing ? "Actualisation..." : "Relâchez pour actualiser"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3.5 shrink-0 select-text text-center"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-0.5 mx-auto">
            <div className="flex items-center gap-1.5 justify-center">
              <h2 className="text-xl font-serif-display font-black text-brand-olive uppercase tracking-tight flex items-center gap-1.5">
                {isLocked && <Lock className="w-4 h-4 text-emerald-600 shrink-0" />}
                {viewTitle}
              </h2>
              <FolderHeart className="w-5 h-5 text-brand-gold fill-brand-gold/10" />
            </div>
            {categoryHeadline && (
              <span className="text-[10px] text-brand-gold font-serif-display font-semibold uppercase tracking-widest">{categoryHeadline}</span>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-extrabold tracking-widest px-3 py-1 rounded-full uppercase border bg-brand-olive text-brand-cream border-brand-moss shadow-sm tabular-nums">
            {selectedPhotos.length} {selectedPhotos.length > 1 ? 'Clichés' : 'Cliché'}
          </span>
          <span className="text-[9px] font-extrabold tracking-widest px-3 py-1 rounded-full uppercase border bg-[var(--bg-panel)] border-brand-sand text-brand-olive shadow-xs font-mono">
            Présentes : {allCategoryPhotos.length} photos
          </span>
          <span className={`text-[9px] font-extrabold tracking-widest px-3 py-1 rounded-full uppercase border tabular-nums ${
            totalCount >= target ? 'bg-[#E3EAE0] text-[#3c5035] border-[#cad7c4] shadow-xs' : 'bg-[var(--bg-panel)] border-brand-sand text-brand-sage'
          }`}>
            Total Sélection : {animatedTotal} / {animatedTarget}
          </span>
        </div>

        <p className="text-xs text-brand-sage leading-relaxed font-serif-display italic max-w-sm mx-auto">
          {categoryFilter
            ? "Retrouvez ci-dessous vos moments favoris retenus ou parcourez tous les clichés mis à disposition."
            : `Voici vos coups de cœur. Seules les photos présentes ici feront partie de votre bel album de mariage de ${target} pages !`}
        </p>

        <div className="flex bg-brand-sand/35 border border-brand-sand p-1 rounded-xl max-w-xs mx-auto w-full mt-2 font-sans shadow-2xs relative">
          <motion.div
            className="absolute top-1 bottom-1 w-1/2 rounded-lg bg-brand-olive shadow-xs"
            animate={{ left: viewMode === 'favorites' ? 4 : '50%' }}
            transition={{ type: "spring", damping: 22, stiffness: 240 }}
          />
          <button type="button" onClick={() => setViewMode('favorites')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors relative z-10 cursor-pointer ${viewMode === 'favorites' ? 'text-white' : 'text-brand-sage hover:text-brand-olive'}`}>
            Ma Sélection ({selectedPhotos.length})
          </button>
          <button type="button" onClick={() => setViewMode('all')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors relative z-10 cursor-pointer ${viewMode === 'all' ? 'text-white' : 'text-brand-sage hover:text-brand-olive'}`}>
            Tous les clichés ({allCategoryPhotos.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 mt-3 mb-1">
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-sage">
            Style d'affichage :
          </span>
          <div className="flex bg-brand-sand/20 border border-brand-sand/40 p-0.5 rounded-lg shadow-4xs">
            <button
              type="button"
              onClick={() => setLayout('grid')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
                layout === 'grid' ? 'bg-brand-olive text-brand-cream shadow-2xs' : 'text-brand-sage hover:text-brand-olive'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-wider">Grille</span>
            </button>
            <button
              type="button"
              onClick={() => setLayout('compact')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
                layout === 'compact' ? 'bg-brand-olive text-brand-cream shadow-2xs' : 'text-brand-sage hover:text-brand-olive'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-wider">Mosaïque</span>
            </button>
            <button
              type="button"
              onClick={() => setLayout('list')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer ${
                layout === 'list' ? 'bg-brand-olive text-brand-cream shadow-2xs' : 'text-brand-sage hover:text-brand-olive'
              }`}
            >
              <List className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase tracking-wider">Liste</span>
            </button>
          </div>
        </div>

        {onResetSelection && !isLocked && (activeClient.selectedPhotoIds.length > 0 || activeClient.dislikedPhotoIds.length > 0) && (
          <button 
            onClick={() => {
              if (window.confirm("Êtes-vous sûr de vouloir effacer toute votre sélection ?")) {
                onResetSelection();
              }
            }}
            className="text-[9.5px] text-brand-sage/80 hover:text-red-400 font-bold uppercase mt-3 mb-1 cursor-pointer transition-colors flex items-center justify-center gap-1.5 mx-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Réinitialiser ma sélection
          </button>
        )}

        {isLocked ? (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-xl p-3 flex items-start gap-2.5 max-w-sm mx-auto shadow-7xs text-left animate-fade-in" style={{ background: "var(--success-bg, #E3F1E8)", border: "1px solid var(--success-border, #9DC9B0)", color: "var(--success, #2D8659)" }}>
            <CheckSquare className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--success, #2D8659)" }} />
            <div className="text-[11px] leading-relaxed font-serif-display font-medium">
              <strong>Sélection Validée pour Tirage !</strong> Votre livre d'or est verrouillé. Damien prépare vos tirages d'exception et la reliure. Merci !
            </div>
          </motion.div>
        ) : isTargetAchieved ? (
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-panel)] border border-brand-sand rounded-xl p-3 flex flex-col gap-2.5 max-w-sm mx-auto shadow-6xs">
            <div className="flex items-start gap-2 text-brand-olive text-left">
              <Check className="w-4.5 h-4.5 shrink-0 text-brand-gold stroke-[3] mt-0.5" />
              <div className="text-[10.5px] leading-tight font-serif-display font-semibold flex-1">
                <strong>Objectif complété !</strong> Vos quotas de sélection sont d'ores et déjà d'exception. Veuillez relire et figer le tri.
              </div>
            </div>
            {onLockSelection && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                type="button"
                onClick={() => setConfirmLock(true)}
                className="w-full text-white py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ background: "linear-gradient(90deg, #1F5E3F 0%, #2D8659 50%, #1A1F1B 100%)" }}
              >
                <Lock className="w-3.5 h-3.5" />
                Figer &amp; Envoyer pour Tirage Royale
              </motion.button>
            )}
          </motion.div>
        ) : null}
      </motion.div>

      <div className="flex-1 py-4">
        {(viewMode === 'favorites' ? selectedPhotos.length : allCategoryPhotos.length) === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[var(--bg-panel)] border border-dashed border-brand-sage/35 rounded-xl"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-brand-sand flex items-center justify-center"
            >
              <ImageIcon className="w-7 h-7 text-brand-sage" />
            </motion.div>
            <div className="space-y-1 animate-fade-in">
              <p className="text-sm font-serif-display font-bold text-brand-olive">{viewMode === 'favorites' ? emptyMessage : "Galerie vide"}</p>
              <p className="text-[10.5px] text-brand-sage max-w-[210px] leading-normal mx-auto font-serif-display italic">
                {viewMode === 'favorites' ? emptyDescription : "Aucune photo n'est actuellement présente pour cette série."}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className={{
            'grid': "grid grid-cols-2 gap-4 pb-6",
            'compact': "grid grid-cols-3 gap-2 pb-6",
            'list': "flex flex-col gap-4 pb-6"
          }[layout]}>
            <AnimatePresence>
              {(viewMode === 'favorites' ? selectedPhotos : allCategoryPhotos).map((photo, idx) => {
                const photoComment = activeClient.photoComments?.[photo.id] || '';
                const isEditing = editingPhotoId === photo.id;
                const isFavorite = activeClient.selectedPhotoIds.includes(photo.id);
                return (
                  <PolaroidCard
                    key={photo.id}
                    photo={photo}
                    index={idx}
                    isFavorite={isFavorite}
                    photoComment={photoComment}
                    isEditing={isEditing}
                    isLocked={isLocked}
                    commentInputText={commentInputText}
                    setCommentInputText={setCommentInputText}
                    onZoom={() => setLightboxPhoto(photo)}
                    onToggle={() => onToggleFavorite ? onToggleFavorite(photo.id) : onRemoveFavorite(photo.id)}
                    onStartEdit={() => startEditingComment(photo.id, photoComment)}
                    onSaveEdit={() => handleSaveComment(photo.id)}
                    onCancelEdit={() => setEditingPhotoId(null)}
                    layout={layout}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {lightboxPhoto && (
        <ZoomLightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
          isLocked={isLocked}
          onRemove={() => onRemoveFavorite(lightboxPhoto.id)}
        />
      )}

      <ConfirmModal
        open={confirmLock}
        title="Figer votre sélection ?"
        message="Cette action verrouillera votre tri de photos et enverra le bon à tirer final au photographe. Vous ne pourrez plus modifier votre album."
        confirmLabel="Figer & Envoyer"
        cancelLabel="Continuer le tri"
        onConfirm={() => onLockSelection?.()}
        onClose={() => setConfirmLock(false)}
      />
    </div>
  );
}

interface PolaroidCardProps {
  photo: WeddingPhoto;
  index: number;
  isFavorite: boolean;
  photoComment: string;
  isEditing: boolean;
  isLocked: boolean;
  commentInputText: string;
  setCommentInputText: (v: string) => void;
  onZoom: () => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  layout: 'grid' | 'list' | 'compact';
  key?: React.Key;
}

function PolaroidCard({
  photo,
  index,
  isFavorite,
  photoComment,
  isEditing,
  isLocked,
  commentInputText,
  setCommentInputText,
  onZoom,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  layout
}: PolaroidCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { theme } = usePaletteTheme();

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    const rotY = (x / rect.width) * 5;
    const rotX = -(y / rect.height) * 5;
    el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = `perspective(800px) rotateX(0) rotateY(0) translateZ(0)`;
  };

  if (layout === 'list') {
    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: Math.min(index * 0.03, 0.3), type: "spring", damping: 20, stiffness: 220 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative bg-[var(--bg-panel)] rounded-xl p-3 shadow-md border border-brand-sand/65 flex flex-row gap-4 text-left"
      >
        <div className="w-28 sm:w-36 aspect-[4/5] rounded-lg bg-[#141612] overflow-hidden relative flex items-center justify-center shrink-0">
          <SmartImage src={photo.image} alt={photo.name} fit="contain" className="duration-500 group-hover:scale-[1.03]" />
          <div className="absolute top-1.5 right-1.5 flex gap-1 z-15">
            <button type="button" onClick={onZoom} aria-label="Agrandir"
              className="w-6.5 h-6.5 rounded-lg bg-brand-cream/95 hover:bg-[var(--bg-panel)] text-brand-olive flex items-center justify-center border border-brand-sand shadow-sm transition-all cursor-pointer">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {!isLocked ? (
              <motion.button
                whileTap={{ scale: 0.85 }}
                type="button"
                onClick={onToggle}
                className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center border shadow-sm transition-all cursor-pointer ${
                  isFavorite ? 'bg-[#ffebee] border-red-200 text-red-500' : 'bg-brand-cream/95 border-brand-sand text-brand-sage hover:text-brand-gold'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </motion.button>
            ) : (
              isFavorite && (
                <div className="w-6.5 h-6.5 rounded-lg flex items-center justify-center border shadow-sm" style={{ background: "var(--success-bg, #E3F1E8)", color: "var(--success, #2D8659)", borderColor: "var(--success-border, #9DC9B0)" }}>
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-1.5">
              <h3 className="font-serif-display font-bold text-lg text-brand-olive leading-tight tracking-tight">{photo.name}</h3>
              <CategoryChip category={photo.category} theme={theme} />
            </div>
          </div>

          {isFavorite && (
            <div className="mt-2.5 pt-2.5 border-t border-dashed border-brand-sand/75 flex-1 flex flex-col justify-end">
              {isEditing ? (
                <div className="space-y-1.5">
                  <textarea
                    rows={2}
                    value={commentInputText}
                    onChange={(e) => setCommentInputText(e.target.value)}
                    placeholder="Consigne de retouche..."
                    className="w-full bg-brand-cream border border-brand-sand rounded-lg p-2 text-[10.5px] text-brand-olive focus:outline-none focus:border-brand-gold resize-none"
                  />
                  <div className="flex gap-1 justify-end">
                    <button type="button" onClick={onCancelEdit} className="bg-[var(--bg-panel)] border border-brand-sand hover:bg-brand-cream text-brand-sage text-[9px] font-bold px-2.5 py-1 rounded uppercase tracking-wider cursor-pointer">Annuler</button>
                    <button type="button" onClick={onSaveEdit} className="bg-brand-olive text-brand-cream text-[9px] font-bold px-3 py-1 rounded uppercase tracking-wider cursor-pointer">Valider</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col justify-end h-full">
                  {photoComment ? (
                    <div className="bg-brand-cream/40 border border-brand-sand/40 p-2 rounded-lg text-left">
                      <span className="text-[8px] font-extrabold uppercase text-brand-gold tracking-wide block leading-none mb-1">Consigne de retouche :</span>
                      <p className="text-[10px] text-brand-sage italic leading-normal font-serif-display select-text">"{photoComment}"</p>
                    </div>
                  ) : (
                    <span className="text-[9px] text-brand-sage/75 italic block">Aucune consigne rédigée pour cette photo.</span>
                  )}
                  {!isLocked && (
                    <button type="button" onClick={onStartEdit} className="inline-flex items-center gap-1 text-[9px] font-extrabold text-brand-olive hover:text-brand-gold cursor-pointer uppercase tracking-wider leading-none self-start">
                      <Edit2 className="w-2.5 h-2.5" />
                      {photoComment ? 'Modifier la consigne' : 'Ajouter une consigne de retouche'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (layout === 'compact') {
    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: Math.min(index * 0.02, 0.2), type: "spring", damping: 18, stiffness: 220 }}
        className="group relative bg-[var(--bg-panel)] rounded-lg p-1.5 shadow-sm border border-brand-sand/50 flex flex-col text-left"
      >
        <div className="aspect-square rounded-md bg-[#141612] overflow-hidden relative flex items-center justify-center">
          <SmartImage src={photo.image} alt={photo.name} fit="cover" className="duration-500 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

          <div className="absolute top-1 right-1 flex gap-0.5 z-15">
            <button type="button" onClick={onZoom} aria-label="Agrandir"
              className="w-5 h-5 rounded bg-brand-cream/95 hover:bg-[var(--bg-panel)] text-brand-olive flex items-center justify-center border border-brand-sand/70 shadow-sm transition-all cursor-pointer">
              <ZoomIn className="w-2.5 h-2.5" />
            </button>
            {!isLocked ? (
              <button
                type="button"
                onClick={onToggle}
                className={`w-5 h-5 rounded flex items-center justify-center border shadow-sm transition-all cursor-pointer ${
                  isFavorite ? 'bg-[#ffebee] border-red-200 text-red-500' : 'bg-brand-cream/95 border-brand-sand text-brand-sage hover:text-brand-gold'
                }`}
              >
                <Heart className={`w-2.5 h-2.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            ) : (
              isFavorite && (
                <div className="w-5 h-5 rounded flex items-center justify-center border shadow-sm" style={{ background: "var(--success-bg, #E3F1E8)", color: "var(--success, #2D8659)", borderColor: "var(--success-border, #9DC9B0)" }}>
                  <Lock className="w-2.5 h-2.5" />
                </div>
              )
            )}
          </div>
        </div>

        <div className="pt-1.5 flex items-center justify-between min-w-0 gap-1.5">
          <p className="font-serif-display font-bold text-xs text-brand-olive truncate leading-none flex-1 tracking-tight" title={photo.name}>{photo.name}</p>
          <div className="flex items-center gap-0.5 shrink-0">
            {photoComment && (
              <MessageSquare className="w-3.5 h-3.5 text-brand-gold fill-brand-gold/10" title={`Consigne : ${photoComment}`} />
            )}
            <CategoryChip category={photo.category} theme={theme} />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), type: "spring", damping: 20, stiffness: 220 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 220ms ease-out" }}
      className="group relative bg-[var(--bg-panel)] rounded-xl p-2.5 shadow-md border border-brand-sand/60 flex flex-col text-left polaroid-frame"
    >
      <div className="aspect-[4/5] rounded-lg bg-[#141612] overflow-hidden relative flex items-center justify-center">
        <SmartImage src={photo.image} alt={photo.name} fit="contain" className="duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-80" />

        <div className="absolute top-1.5 right-1.5 flex gap-1 z-15">
          <button type="button" onClick={onZoom} aria-label="Agrandir"
            className="w-6.5 h-6.5 rounded-lg bg-brand-cream/95 hover:bg-[var(--bg-panel)] text-brand-olive flex items-center justify-center border border-brand-sand shadow-sm active:scale-90 transition-all cursor-pointer">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {!isLocked ? (
            <motion.button
              whileTap={{ scale: 0.85 }}
              type="button"
              onClick={onToggle}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center border shadow-sm transition-all cursor-pointer ${
                isFavorite ? 'bg-[#ffebee] border-red-200 text-red-500' : 'bg-brand-cream/95 border-brand-sand text-brand-sage hover:text-brand-gold'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </motion.button>
          ) : (
            isFavorite && (
              <div className="w-6.5 h-6.5 rounded-lg flex items-center justify-center border shadow-sm" style={{ background: "var(--success-bg, #E3F1E8)", color: "var(--success, #2D8659)", borderColor: "var(--success-border, #9DC9B0)" }} title="Solidifié pour l'album">
                <Lock className="w-3.5 h-3.5" />
              </div>
            )
          )}
        </div>
      </div>

      <div className="pt-2 text-center shrink-0">
        <p className="font-serif-display font-bold text-base text-brand-olive truncate leading-none tracking-tight">{photo.name}</p>
        <CategoryChip
          category={photo.category}
          theme={theme}
        />
      </div>

      {isFavorite && (
        <div className="mt-2.5 pt-2.5 border-t border-dashed border-brand-sand/75 text-left flex-1 flex flex-col justify-end">
          {isEditing ? (
            <div className="space-y-1.5">
              <textarea
                rows={2}
                value={commentInputText}
                onChange={(e) => setCommentInputText(e.target.value)}
                placeholder="Consigne de retouche..."
                className="w-full bg-brand-cream border border-brand-sand rounded-lg p-1.5 text-[9.5px] text-brand-olive focus:outline-none focus:border-brand-gold resize-none"
              />
              <div className="flex gap-1 justify-end">
                <button type="button" onClick={onCancelEdit} className="bg-[var(--bg-panel)] border border-brand-sand hover:bg-brand-cream text-brand-sage text-[8px] font-bold px-2 py-1 rounded uppercase tracking-wider cursor-pointer">Annuler</button>
                <button type="button" onClick={onSaveEdit} className="bg-brand-olive text-brand-cream text-[8px] font-bold px-2.5 py-1 rounded uppercase tracking-wider flex items-center gap-0.5 cursor-pointer">Valider</button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 flex flex-col justify-end h-full">
              {photoComment ? (
                <div className="bg-brand-cream/40 border border-brand-sand/40 p-1.5 rounded-lg text-left">
                  <span className="text-[7.5px] font-extrabold uppercase text-brand-gold tracking-wide block leading-none mb-1">Demande :</span>
                  <p className="text-[9.5px] text-brand-sage italic leading-tight font-serif-display select-text">"{photoComment}"</p>
                </div>
              ) : (
                <span className="text-[8.5px] text-brand-sage italic block">Aucune consigne rédigée.</span>
              )}
              {!isLocked && (
                <button type="button" onClick={onStartEdit} className="mt-1 inline-flex items-center gap-1 text-[8.5px] font-extrabold text-brand-olive hover:text-brand-gold cursor-pointer uppercase tracking-wider leading-none">
                  <Edit2 className="w-2.5 h-2.5" />
                  {photoComment ? 'Modifier consigne' : 'Écrire une consigne'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Heart, Bookmark, Sparkles, User, FolderHeart, ShieldCheck, Mail, Smartphone, Clock, Sun, Moon, Volume2, VolumeX, Palette
} from "lucide-react";
import { ClientAccount } from "../utils/weddingData";
import { SmartImage } from "./Shared";
import { useCountUp, useTheme, useSound } from "../hooks";

interface ProfileViewProps {
  activeClient: ClientAccount;
  onEnterAdmin: () => void;
  onOpenChat?: () => void;
  photosCount: number;
  coverPhotoUrl?: string;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export default function ProfileView({ activeClient, onEnterAdmin, onOpenChat, photosCount, coverPhotoUrl, soundEnabled, onToggleSound }: ProfileViewProps) {
  const [command, setCommand] = useState('');
  const likesCount = activeClient.selectedPhotoIds.length;
  const target = activeClient.targetCount;

  const animatedLikes = useCountUp(likesCount);
  const animatedTarget = useCountUp(target);
  const progressPercent = target > 0 ? Math.min(100, Math.round((likesCount / target) * 100)) : 0;
  const animatedPercent = useCountUp(progressPercent);

  const { theme, toggle: toggleTheme } = useTheme();
  const sound = useSound();
  const finalSound = soundEnabled ?? sound.enabled;
  const finalToggleSound = onToggleSound ?? sound.toggle;

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommand(val);
    if (val.trim().toLowerCase() === 'admin' || val.trim().toLowerCase() === '/admin') {
      onEnterAdmin();
      setCommand('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (command.trim().toLowerCase() === 'admin' || command.trim().toLowerCase() === '/admin') {
        onEnterAdmin();
        setCommand('');
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[var(--bg-app)] text-brand-moss no-scrollbar">
      {/* Hero header */}
      <div className="relative -mx-5 -mt-5 h-44 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
        >
          <SmartImage src={coverPhotoUrl || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200&h=400"} alt="cover" fit="cover" className="w-full h-full" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-[var(--bg-app)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center space-y-3 -mt-12 relative z-10 select-text"
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-brand-sand p-1.5 shadow-xl ring-4 ring-[var(--bg-app)]">
            <SmartImage src={coverPhotoUrl || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=200&h=200"} alt="Profil" fit="cover" className="w-full h-full rounded-full" />
          </div>
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-cream text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm leading-none whitespace-nowrap">
            Compte Client
          </span>
        </div>
        <div className="pt-2">
          <h2 className="text-4xl sm:text-5xl font-serif-display font-black text-brand-olive uppercase tracking-tight">{activeClient.name}</h2>
          <p className="text-[10px] text-brand-sage uppercase font-bold tracking-widest mt-0.5">Tri Collaboratif</p>
        </div>
      </motion.div>

      {/* Quick toggles */}
      <div className="grid grid-cols-2 gap-2.5">
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={toggleTheme}
          className="bg-[var(--bg-panel)] border border-brand-sand p-3 rounded-xl flex items-center gap-2.5 cursor-pointer shadow-sm hover:bg-brand-cream"
        >
          {theme === "dark" ? <Moon className="w-4 h-4 text-brand-gold" /> : <Sun className="w-4 h-4 text-brand-gold" />}
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-widest text-brand-sage font-extrabold block">Thème</span>
            <span className="text-xs font-bold text-brand-olive">{theme === "dark" ? "Sombre" : "Clair"}</span>
          </div>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={finalToggleSound}
          className="bg-[var(--bg-panel)] border border-brand-sand p-3 rounded-xl flex items-center gap-2.5 cursor-pointer shadow-sm hover:bg-brand-cream"
        >
          {finalSound ? <Volume2 className="w-4 h-4 text-brand-gold" /> : <VolumeX className="w-4 h-4 text-brand-sage" />}
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-widest text-brand-sage font-extrabold block">Sons</span>
            <span className="text-xs font-bold text-brand-olive">{finalSound ? "Activés" : "Silencieux"}</span>
          </div>
        </motion.button>
      </div>


      {/* Progress card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[var(--bg-panel)] border border-brand-sand rounded-xl p-4 space-y-3 shadow-sm select-text"
      >
        <h3 className="text-[11px] text-brand-olive font-extrabold uppercase tracking-widest block flex items-center justify-center gap-1.5 font-serif-display">
          <FolderHeart className="w-4 h-4 text-brand-gold fill-brand-gold/10" />
          Votre Objectif de Sélection
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-brand-sage">Progression globale</span>
            <span className="text-brand-olive font-bold tabular-nums">{animatedLikes} / {animatedTarget} photos · {animatedPercent}%</span>
          </div>
          <div className="w-full bg-brand-sand rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-pan"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: "spring", damping: 22, stiffness: 180 }}
            />
          </div>
        </div>

        {progressPercent === 100 ? (
          <div className="bg-brand-olive/10 border border-brand-olive/20 rounded-lg p-2.5 text-center space-y-1">
            <p className="text-xs font-bold text-brand-olive uppercase tracking-wider">🎉 Objectif Atteint !</p>
            <p className="text-[10px] text-brand-sage">Vous avez désigné vos {target} moments forts. Votre sélection est visible par l'atelier.</p>
          </div>
        ) : (
          <p className="text-[10px] text-brand-sage leading-relaxed font-serif-display italic text-center">
            Procédez au tri des photos à droite pour les ajouter à vos favoris. Vous devez en sélectionner précisément <strong>{target}</strong>.
          </p>
        )}

        {activeClient.deadline && (
          <div className="bg-[#FDF1EB] border border-[#f5dfd5] rounded-lg p-2.5 flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#bc5e33] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#bc5e33]"></span>
            </span>
            <p className="text-[10.5px] leading-snug text-[#964724]">
              ⏰ Date limite de tri : <strong className="font-extrabold">{(() => {
                try {
                  const d = new Date(activeClient.deadline);
                  if (isNaN(d.getTime())) return activeClient.deadline;
                  const formatted = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const diffTime = d.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays < 0) return `${formatted} (Dépassée de ${Math.abs(diffDays)}j ⚠️)`;
                  if (diffDays === 0) return `${formatted} (Aujourd'hui !)`;
                  return `${formatted} (${diffDays}j restants)`;
                } catch { return activeClient.deadline; }
              })()}</strong>
            </p>
          </div>
        )}
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2.5 select-text">
        {[
          { label: "Favoris", value: animatedLikes, color: "text-brand-rose" },
          { label: "Total", value: photosCount, color: "text-brand-olive" },
          { label: "Cible", value: animatedTarget, color: "text-brand-gold" }
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="bg-[var(--bg-panel)] border border-brand-sand rounded-xl p-3 text-center"
          >
            <div className={`text-2xl font-serif-display font-black tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[9px] uppercase tracking-widest text-brand-sage font-extrabold mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1 select-text">
        <div className="bg-[var(--bg-panel)] border border-brand-sand p-3.5 rounded-xl flex flex-col justify-between h-28 shadow-sm">
          <Sparkles className="w-4 h-4 text-brand-gold" />
          <div>
            <span className="text-xs text-brand-olive font-bold block">Trieur Collaboratif</span>
            <span className="text-[9.5px] text-brand-sage leading-tight block mt-0.5">Glissez à droite pour valider, à gauche pour passer.</span>
          </div>
        </div>
        <div className="bg-[var(--bg-panel)] border border-brand-sand p-3.5 rounded-xl flex flex-col justify-between h-28 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-brand-sage" />
          <div>
            <span className="text-xs text-brand-olive font-bold block">Sécurisé &amp; Privé</span>
            <span className="text-[9.5px] text-brand-sage leading-tight block mt-0.5">Seul vous et le photographe damien accédez au tri.</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 select-text">
        <h3 className="text-xs text-brand-sage font-bold uppercase tracking-widest px-2 pb-0.5">Menu de l'Atelier</h3>
        <div className="bg-[var(--bg-panel)] border border-brand-sand rounded-xl divide-y divide-brand-sand overflow-hidden shadow-sm">
          <div className="px-4 py-3 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-brand-gold shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <span className="text-xs font-bold block text-brand-olive uppercase tracking-tight">Accès Rapide / Code</span>
                <span className="text-[9px] text-brand-sage block leading-none">Tapez admin ou votre code pour déverrouiller</span>
              </div>
            </div>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                placeholder="/admin ou code..."
                value={command}
                onChange={handleCommandChange}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-brand-cream border border-brand-sand/60 rounded-lg px-2.5 py-1.5 text-xs text-brand-olive font-bold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/15"
              />
              {command.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    if (command.trim().toLowerCase() === 'admin' || command.trim().toLowerCase() === '/admin') {
                      onEnterAdmin();
                    }
                    setCommand('');
                  }}
                  className="bg-brand-olive hover:bg-brand-moss text-brand-cream text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                >Valider</button>
              )}
            </div>
          </div>

          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-brand-cream text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
                <div>
                  <span className="text-xs font-bold block text-brand-olive">Discuter avec le photographe (Chat)</span>
                  <span className="text-[9.5px] text-brand-sage">Envoyez vos demandes de retouches ou messages à Damien</span>
                </div>
              </div>
              <span className="text-brand-gold text-xs font-bold">Ouvrir ›</span>
            </button>
          )}

          <button
            onClick={onEnterAdmin}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-brand-cream text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Bookmark className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-bold block text-brand-olive">Espace Photographe (Admin)</span>
                <span className="text-[9.5px] text-brand-sage">Gérer les couples, charger de nouvelles photos</span>
              </div>
            </div>
            <span className="text-brand-gold text-xs font-bold">Activer ›</span>
          </button>

          <div className="px-4 py-3 text-brand-sage text-[10px] space-y-1 bg-brand-cream/30 text-center">
            <span className="block font-medium">Total des clichés dans la galerie : {photosCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

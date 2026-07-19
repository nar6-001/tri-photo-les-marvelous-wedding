import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X as XIcon, AlertTriangle, Info, Search, Command, ChevronDown, ChevronUp, Filter, ArrowUpDown, MoreVertical, ChevronRight, Star, Archive, Copy, Trash2, Lock, Unlock, Edit2, Send, Sparkles, Calendar, User, Image as ImageIcon, MessageSquare, RefreshCw, Bookmark, Clock } from "lucide-react";

/* ================================================================== */
/* TOAST SYSTEM                                                        */
/* ================================================================== */

interface ToastItem {
  id: number;
  type: "success" | "error" | "info" | "warning";
  message: string;
  description?: string;
  duration?: number;
}

let toastCounter = 0;
let toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let toastStore: ToastItem[] = [];

function emit() {
  toastListeners.forEach(l => l([...toastStore]));
}

export const toast = {
  success: (message: string, description?: string) => {
    const t: ToastItem = { id: ++toastCounter, type: "success", message, description };
    toastStore = [...toastStore, t];
    emit();
    setTimeout(() => {
      toastStore = toastStore.filter(x => x.id !== t.id);
      emit();
    }, t.duration ?? 3500);
  },
  error: (message: string, description?: string) => {
    const t: ToastItem = { id: ++toastCounter, type: "error", message, description, duration: 5000 };
    toastStore = [...toastStore, t];
    emit();
    setTimeout(() => {
      toastStore = toastStore.filter(x => x.id !== t.id);
      emit();
    }, t.duration ?? 5000);
  },
  info: (message: string, description?: string) => {
    const t: ToastItem = { id: ++toastCounter, type: "info", message, description };
    toastStore = [...toastStore, t];
    emit();
    setTimeout(() => {
      toastStore = toastStore.filter(x => x.id !== t.id);
      emit();
    }, t.duration ?? 3500);
  },
  warning: (message: string, description?: string) => {
    const t: ToastItem = { id: ++toastCounter, type: "warning", message, description, duration: 4500 };
    toastStore = [...toastStore, t];
    emit();
    setTimeout(() => {
      toastStore = toastStore.filter(x => x.id !== t.id);
      emit();
    }, t.duration ?? 4500);
  }
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => {
    toastListeners.push(setToasts);
    return () => { toastListeners = toastListeners.filter(l => l !== setToasts); };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => {
          const Icon = t.type === "success" ? Check : t.type === "error" ? XIcon : t.type === "warning" ? AlertTriangle : Info;
          const colors = t.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : t.type === "error"
              ? "bg-red-50 border-red-200 text-red-900"
              : t.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-blue-50 border-blue-200 text-blue-900";
          const iconColor = t.type === "success" ? "text-emerald-600 bg-emerald-100"
            : t.type === "error" ? "text-red-600 bg-red-100"
            : t.type === "warning" ? "text-amber-600 bg-amber-100"
            : "text-blue-600 bg-blue-100";
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: "spring", damping: 22, stiffness: 240 }}
              className={`pointer-events-auto border rounded-xl shadow-lg p-3 flex items-start gap-2.5 ${colors}`}
              role="status"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight">{t.message}</p>
                {t.description && <p className="text-[10px] opacity-80 leading-tight mt-0.5">{t.description}</p>}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/* SPARKLINE                                                           */
/* ================================================================== */

export function Sparkline({ data, color = "#C2A679", height = 28, fill = true }: { data: number[]; color?: string; height?: number; fill?: boolean }) {
  if (!data.length) return <div style={{ height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const step = w / Math.max(1, data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className="overflow-visible" preserveAspectRatio="none">
      {fill && (
        <motion.path
          d={area}
          fill={color}
          fillOpacity="0.15"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
      )}
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <motion.circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="2.5"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.1, type: "spring", stiffness: 300 }}
      />
    </svg>
  );
}

/* ================================================================== */
/* AVATAR WITH INITIALS                                                */
/* ================================================================== */

export function Avatar({ name, src, size = 32, status }: { name: string; src?: string; size?: number; status?: "online" | "offline" }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);
  const hue = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
  }, [name]);
  const dim = `${size}px`;

  return (
    <div className="relative inline-flex shrink-0" style={{ width: dim, height: dim }}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover border-2 border-brand-sand" />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-white font-extrabold border-2 border-white shadow-sm"
          style={{ background: `linear-gradient(135deg, hsl(${hue}, 35%, 45%), hsl(${(hue + 40) % 360}, 30%, 35%))`, fontSize: size * 0.4 }}
        >
          {initials}
        </div>
      )}
      {status && (
        <span className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${status === "online" ? "bg-emerald-500" : "bg-zinc-400"}`} style={{ width: size * 0.3, height: size * 0.3 }} />
      )}
    </div>
  );
}

/* ================================================================== */
/* EMPTY STATE ILLUSTRATIONS                                            */
/* ================================================================== */

export function EmptyStateIllustration({ type = "gallery", message, action }: { type?: "gallery" | "messages" | "couples" | "generic"; message?: string; action?: React.ReactNode }) {
  const illustrations: Record<string, React.ReactNode> = {
    gallery: (
      <svg viewBox="0 0 200 140" className="w-32 h-32">
        <motion.rect x="20" y="30" width="50" height="70" rx="4" fill="#EFECE6" stroke="#8A9A7E" strokeWidth="1.5" initial={{ rotate: -8 }} animate={{ rotate: [-8, -6, -8] }} transition={{ duration: 4, repeat: Infinity }} style={{ originX: "45px", originY: "65px" }} />
        <motion.rect x="75" y="20" width="55" height="80" rx="4" fill="#FAF8F5" stroke="#C2A679" strokeWidth="1.5" initial={{ rotate: 3 }} animate={{ rotate: [3, 5, 3] }} transition={{ duration: 5, repeat: Infinity, delay: 0.5 }} style={{ originX: "102px", originY: "60px" }} />
        <motion.rect x="130" y="35" width="48" height="68" rx="4" fill="#EFECE6" stroke="#8A9A7E" strokeWidth="1.5" initial={{ rotate: -3 }} animate={{ rotate: [-3, -1, -3] }} transition={{ duration: 4.5, repeat: Infinity, delay: 1 }} style={{ originX: "154px", originY: "69px" }} />
        <motion.circle cx="100" cy="60" r="14" fill="none" stroke="#C2A679" strokeWidth="1.5" initial={{ scale: 0.9 }} animate={{ scale: [0.9, 1, 0.9] }} transition={{ duration: 3, repeat: Infinity }} />
        <circle cx="100" cy="60" r="5" fill="#C2A679" />
        <motion.path d="M40 90 L60 70 L75 85 L90 65" stroke="#8A9A7E" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }} />
      </svg>
    ),
    messages: (
      <svg viewBox="0 0 200 140" className="w-32 h-32">
        <motion.g initial={{ y: 0 }} animate={{ y: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity }}>
          <rect x="30" y="40" width="100" height="40" rx="14" fill="#FAF8F5" stroke="#8A9A7E" strokeWidth="1.5" />
          <circle cx="50" cy="60" r="3" fill="#8A9A7E" />
          <circle cx="65" cy="60" r="3" fill="#8A9A7E" />
          <circle cx="80" cy="60" r="3" fill="#8A9A7E" />
        </motion.g>
        <motion.g initial={{ y: 0 }} animate={{ y: [2, -2, 2] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}>
          <rect x="70" y="85" width="100" height="36" rx="14" fill="#525E43" />
          <path d="M165 95 L175 90 L168 100 Z" fill="#525E43" />
        </motion.g>
      </svg>
    ),
    couples: (
      <svg viewBox="0 0 200 140" className="w-32 h-32">
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} style={{ originX: "100px", originY: "70px" }}>
          <circle cx="100" cy="70" r="55" fill="none" stroke="#EFECE6" strokeWidth="1.5" strokeDasharray="4 4" />
        </motion.g>
        <motion.g animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} style={{ originX: "100px", originY: "70px" }}>
          <circle cx="80" cy="65" r="14" fill="#C2A679" />
          <circle cx="120" cy="65" r="14" fill="#8A9A7E" />
          <path d="M100 80 L100 95" stroke="#525E43" strokeWidth="2" />
        </motion.g>
      </svg>
    ),
    generic: (
      <svg viewBox="0 0 200 140" className="w-32 h-32">
        <motion.g animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{ originX: "100px", originY: "70px" }}>
          <circle cx="100" cy="70" r="40" fill="#FAF8F5" stroke="#C2A679" strokeWidth="1.5" />
          <text x="100" y="78" textAnchor="middle" fontSize="24" fill="#C2A679" fontWeight="bold">?</text>
        </motion.g>
      </svg>
    )
  };
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-3">
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 18, stiffness: 220 }}>
        {illustrations[type] || illustrations.generic}
      </motion.div>
      {message && <p className="text-xs text-brand-sage font-serif-display italic max-w-xs leading-relaxed">{message}</p>}
      {action}
    </div>
  );
}

/* ================================================================== */
/* SEARCH BAR WITH KEYBOARD SHORTCUT                                    */
/* ================================================================== */

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  shortcut?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Rechercher...", shortcut, className = "" }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!shortcut) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcut.toLowerCase()) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcut]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-16 py-2 bg-[var(--bg-subtle)] border border-brand-sand/60 rounded-lg text-xs text-brand-olive placeholder:text-brand-sage/70 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/20 transition-all"
      />
      {shortcut && (
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono bg-[var(--bg-panel)] border border-brand-sand/60 px-1.5 py-0.5 rounded text-brand-sage shadow-3xs pointer-events-none">
          {shortcut}
        </kbd>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand-sand hover:bg-brand-gold/20 text-brand-sage hover:text-brand-olive flex items-center justify-center transition-colors"
          aria-label="Effacer la recherche"
        >
          <XIcon className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/* SORT DROPDOWN                                                        */
/* ================================================================== */

export interface SortOption<T extends string> { value: T; label: string; }

export function SortDropdown<T extends string>({ value, onChange, options, label = "Trier" }: { value: T; onChange: (v: T) => void; options: SortOption<T>[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const current = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-[var(--bg-panel)] border border-brand-sand hover:border-brand-gold text-brand-olive px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
      >
        <ArrowUpDown className="w-3 h-3 text-brand-gold" />
        <span>{label}: <span className="text-brand-gold normal-case">{current?.label}</span></span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 z-30 bg-[var(--bg-panel)] border border-brand-sand rounded-lg shadow-xl overflow-hidden min-w-[180px]"
          >
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-brand-cream transition-colors cursor-pointer ${
                  value === o.value ? "bg-brand-cream text-brand-gold" : "text-brand-olive"
                }`}
              >
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/* BULK SELECT TOOLBAR                                                  */
/* ================================================================== */

interface BulkToolbarProps {
  count: number;
  onClear: () => void;
  actions: { label: string; icon?: React.ReactNode; onClick: () => void; danger?: boolean }[];
}

export function BulkToolbar({ count, onClear, actions }: BulkToolbarProps) {
  if (count === 0) return null;
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 240 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-brand-olive text-brand-cream rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-3 border border-brand-gold/30"
    >
      <span className="text-xs font-extrabold uppercase tracking-wider tabular-nums">
        {count} sélectionné{count > 1 ? "s" : ""}
      </span>
      <div className="w-px h-5 bg-brand-cream/20" />
      <div className="flex items-center gap-1">
        {actions.map((a, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={a.onClick}
            className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer ${
              a.danger ? "bg-red-500/90 hover:bg-red-500" : "bg-brand-cream/15 hover:bg-brand-cream/25"
            }`}
          >
            {a.icon}
            {a.label}
          </motion.button>
        ))}
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={onClear}
          className="px-2 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-cream/15 hover:bg-brand-cream/25 transition-colors cursor-pointer"
          aria-label="Annuler la sélection"
        >
          <XIcon className="w-3 h-3" />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/* STATUS BAR (bottom admin bar)                                        */
/* ================================================================== */

export function StatusBar({ version = "1.0.0", couplesCount, photosCount, online }: { version?: string; couplesCount: number; photosCount: number; online: boolean }) {
  return (
    <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-6 bg-[var(--bg-panel)] border-t border-brand-sand items-center justify-between px-4 text-[9px] uppercase tracking-widest font-extrabold text-brand-sage z-30 select-none">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
          {online ? "Connecté" : "Hors-ligne"}
        </span>
        <span>v{version}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums">{couplesCount} couples</span>
        <span>·</span>
        <span className="tabular-nums">{photosCount} photos</span>
        <span>·</span>
        <span>Maison Marvel</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/* BREADCRUMB                                                           */
/* ================================================================== */

export interface Crumb { label: string; onClick?: () => void; icon?: React.ReactNode; }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-extrabold text-brand-sage" aria-label="Fil d'ariane">
      {items.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="w-3 h-3 opacity-50" />}
          {c.onClick ? (
            <button type="button" onClick={c.onClick} className="flex items-center gap-1 hover:text-brand-olive transition-colors cursor-pointer">
              {c.icon}
              <span>{c.label}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-brand-olive">
              {c.icon}
              <span>{c.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/* ================================================================== */
/* COMMAND PALETTE (Cmd+K)                                              */
/* ================================================================== */

interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  group?: string;
  shortcut?: string;
  onSelect: () => void;
}

export function CommandPalette({ open, onClose, items }: { open: boolean; onClose: () => void; items: CommandItem[] }) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter(i => i.label.toLowerCase().includes(q) || i.group?.toLowerCase().includes(q));
  }, [query, items]);

  useEffect(() => { setHighlight(0); }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => Math.min(filtered.length - 1, h + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => Math.max(0, h - 1)); }
    if (e.key === "Enter" && filtered[highlight]) { e.preventDefault(); filtered[highlight].onSelect(); onClose(); }
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  // Group items
  const grouped = useMemo(() => {
    const m = new Map<string, CommandItem[]>();
    filtered.forEach(i => {
      const g = i.group || "Actions";
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(i);
    });
    return Array.from(m.entries());
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            className="bg-[var(--bg-panel)] border border-brand-sand rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-sand">
              <Search className="w-4 h-4 text-brand-sage" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Tapez une commande, une recherche..."
                className="flex-1 bg-transparent text-sm text-brand-olive placeholder:text-brand-sage/70 focus:outline-none"
              />
              <kbd className="text-[9px] font-mono bg-brand-cream border border-brand-sand px-1.5 py-0.5 rounded text-brand-sage">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 no-scrollbar">
              {grouped.length === 0 ? (
                <p className="text-center text-xs text-brand-sage py-8">Aucun résultat</p>
              ) : (
                grouped.map(([group, list]) => (
                  <div key={group} className="mb-2">
                    <div className="text-[8.5px] font-extrabold uppercase tracking-widest text-brand-sage px-2 py-1">{group}</div>
                    {list.map((item, gi) => {
                      const flatIndex = filtered.indexOf(item);
                      const active = flatIndex === highlight;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setHighlight(flatIndex)}
                          onClick={() => { item.onSelect(); onClose(); }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                            active ? "bg-brand-cream text-brand-olive" : "text-brand-olive hover:bg-brand-cream/50"
                          }`}
                        >
                          {item.icon && <span className="text-brand-gold">{item.icon}</span>}
                          <span className="flex-1">{item.label}</span>
                          {item.shortcut && <kbd className="text-[9px] font-mono bg-[var(--bg-subtle)] border border-brand-sand px-1.5 py-0.5 rounded">{item.shortcut}</kbd>}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================== */
/* TAG PILLS                                                            */
/* ================================================================== */

export function TagPills({ tags, onRemove, color = "amber" }: { tags: string[]; onRemove?: (tag: string) => void; color?: "amber" | "rose" | "olive" | "blue" }) {
  const colorMap = {
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
    olive: "bg-brand-cream text-brand-olive border-brand-sand",
    blue: "bg-blue-50 text-blue-800 border-blue-200"
  };
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(t => (
        <motion.span
          key={t}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${colorMap[color]}`}
        >
          {t}
          {onRemove && (
            <button type="button" onClick={() => onRemove(t)} className="hover:opacity-70 cursor-pointer" aria-label={`Retirer ${t}`}>
              <XIcon className="w-2.5 h-2.5" />
            </button>
          )}
        </motion.span>
      ))}
    </div>
  );
}

/* ================================================================== */
/* INLINE TOOLTIP                                                       */
/* ================================================================== */

export function Tooltip({ content, children, side = "top" }: { content: string; children: React.ReactNode; side?: "top" | "bottom" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-1/2 -translate-x-1/2 z-50 px-2 py-1 rounded-md bg-brand-olive text-brand-cream text-[9px] font-bold uppercase tracking-wider whitespace-nowrap pointer-events-none shadow-lg ${
              side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
            role="tooltip"
          >
            {content}
            <span className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent ${side === "top" ? "top-full border-t-4 border-t-brand-olive" : "bottom-full border-b-4 border-b-brand-olive"}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/* INLINE VALIDATION (form helper)                                      */
/* ================================================================== */

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="text-[9.5px] text-red-500 font-bold mt-0.5 flex items-center gap-1"
    >
      <AlertTriangle className="w-2.5 h-2.5" />
      {message}
    </motion.p>
  );
}

/* ================================================================== */
/* COUPLE STATUS BADGE (couleurs par statut)                            */
/* ================================================================== */

export function CoupleStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string; border: string; Icon?: any }> = {
    "En cours": { label: "En cours", color: "var(--info, #5B7A8C)", bg: "var(--info-bg, #E8EFF4)", border: "var(--info-border, #9FB6C5)", Icon: RefreshCw },
    "Quota Atteint": { label: "Quota Atteint", color: "var(--warning, #C58B3D)", bg: "var(--warning-bg, #FDF1E2)", border: "var(--warning-border, #E8C491)", Icon: Bookmark },
    "Clôturé": { label: "Sélection Validée", color: "var(--success, #2D8659)", bg: "var(--success-bg, #E3F1E8)", border: "var(--success-border, #9DC9B0)", Icon: Lock },
    "En retard": { label: "En retard", color: "var(--terracotta, #A56B47)", bg: "#FBF1EC", border: "#D49475", Icon: Clock },
    "Critique": { label: "Critique", color: "var(--danger, #9B3A4A)", bg: "var(--danger-bg, #F8E6E9)", border: "var(--danger-border, #D89198)", Icon: AlertTriangle }
  };
  const c = config[status] || config["En cours"];
  const Icon = c.Icon || RefreshCw;
  return (
    <span
      className="text-[9px] px-3 py-1 rounded-full uppercase tracking-widest font-extrabold flex items-center gap-1"
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      <Icon className={`w-3 h-3 ${status === "En cours" ? "animate-spin" : status === "En retard" ? "animate-pulse" : ""}`} />
      {c.label}
    </span>
  );
}

/* ================================================================== */
/* CATEGORY CHIP (couleur par catégorie)                                */
/* ================================================================== */

import { getCategoryColor } from "../themes";

export function CategoryChip({ category, theme, label }: { category: string; theme: any; label?: string }) {
  const color = getCategoryColor(category, theme);
  return (
    <span
      className="inline-block font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}50` }}
    >
      {label || category}
    </span>
  );
}

/* ================================================================== */
/* COLORED TAG PILL                                                    */
/* ================================================================== */

import { getTagColor } from "../themes";

export function ColoredTagPill({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  const color = getTagColor(tag, { tagColors: { VIP: "#6E2A36", Urgent: "#A56B47", Premium: "#C2A679", Termine: "#2D8659", Default: "#8A9A7E" } } as any);
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {tag}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:opacity-70 cursor-pointer" aria-label={`Retirer ${tag}`}>
          <XIcon className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

/* ================================================================== */
/* INTERNAL NOTES + TAGS EDITOR                                         */
/* ================================================================== */

export function InternalNotesEditor({
  clientId,
  tags,
  note,
  onTagsChange,
  onNoteChange
}: {
  clientId: string;
  tags: string[];
  note: string;
  onTagsChange: (tags: string[]) => void;
  onNoteChange: (n: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      onTagsChange([...tags, t]);
    }
    setTagInput("");
  };

  return (
    <div className="bg-[var(--bg-subtle)] border border-brand-sand/60 rounded-xl p-2.5 space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[9.5px] font-extrabold uppercase tracking-widest text-brand-sage hover:text-brand-olive cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Edit2 className="w-3 h-3 text-brand-gold" />
          Notes internes
          {note || tags.length > 0 ? (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
          ) : null}
        </span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3 h-3" />
        </motion.span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-2"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <TagPills tags={tags} onRemove={(t) => onTagsChange(tags.filter(x => x !== t))} />
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Ajouter un tag (VIP, urgent...)"
                className="flex-1 bg-white border border-brand-sand rounded px-2 py-1 text-[10px] text-brand-olive focus:outline-none focus:border-brand-gold"
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-brand-olive text-brand-cream text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded hover:bg-brand-moss cursor-pointer"
              >
                +
              </button>
            </div>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Note privée (visible uniquement par l'équipe)..."
              rows={2}
              className="w-full bg-white border border-brand-sand rounded-lg p-2 text-[10px] text-brand-olive focus:outline-none focus:border-brand-gold resize-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================== */
/* SECTION HEADER                                                       */
/* ================================================================== */

export function SectionHeader({ icon, title, subtitle, actions }: { icon?: React.ReactNode; title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon && <span className="text-brand-gold">{icon}</span>}
        <div className="text-left">
          <h3 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest font-serif-display leading-none">{title}</h3>
          {subtitle && <p className="text-[9.5px] text-brand-sage mt-0.5 leading-none">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </div>
  );
}

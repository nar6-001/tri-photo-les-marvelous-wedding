import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, Users, Image as ImageIcon, Settings, Plus, Trash2, BarChart3,
  Check, AlertCircle, RefreshCw, Key, HelpCircle, ArrowLeft, Bookmark,
  MessageSquare, Lock, Unlock, Link as LinkIcon, Filter, Camera, FileImage,
  FolderOpen, Send, Copy, Search, Calendar, Globe, X, ZoomIn, Clock, ChevronLeft, ChevronRight,
  Command, Pin, Bell, Eye, EyeOff, Hash, MoreVertical, Sparkles, Tag, Star, Edit2, Archive, Terminal
} from 'lucide-react';
import ZoomLightbox from './ZoomLightbox';
import { SmartImage, ConfirmModal } from './Shared';
import {
  ToastContainer, toast, Sparkline, Avatar, EmptyStateIllustration,
  SearchBar, SortDropdown, BulkToolbar, StatusBar, Breadcrumb, CommandPalette, TagPills, Tooltip, FieldError,
  InternalNotesEditor, CoupleStatusBadge
} from './AdminShared';
import { useCountUp } from '../hooks';
import {
  fetchCloudinaryServerStatus, testCloudinaryConnection,
  listCloudinaryFolder, listCloudinaryFolders, deleteCloudinaryPhoto,
  buildCloudinaryUrl, isCloudinaryUrl, publicIdFromUrl,
  type CloudinaryServerStatus, type CloudinaryResource
} from '../utils/cloudinary';
import { 
  getCloudinarySettings, saveCloudinarySettings, 
  getGlobalPhotos, saveGlobalPhotos, 
  getClients, saveClients, 
  ClientAccount, WeddingPhoto, CloudinarySettings,
  setActiveClientId, CategoryLabels
} from '../utils/weddingData';
import { CategoryTab } from '../types';

interface AdminViewProps {
  onSwitchToClient: (clientId: string) => void;
  onClose: () => void;
  onRefreshPhotos: () => void;
  categoryLabels: CategoryLabels;
  onUpdateCategoryLabels: (newLabels: CategoryLabels) => void;
}

interface UploadTask {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMsg?: string;
}

// CATEGORY ICONS - emoji par dossier de mariage (reconnaissance par clef ou libelle)
const CATEGORY_ICONS_BY_KEY: Record<string, string> = {
  'agrandissement': '🖼️',
  'dot': '🕊️',
  'globale': '🌍',
  'album': '📖',
  'prepa': '💄',
  'prepa-mariee': '👰',
  'prepa-marie': '🤵',
  'preparation-mariee': '👰',
  'preparation-marie': '🤵',
  'mairie': '💍',
  'civil': '💍',
  'couple': '💑',
  'couple-famille': '👨‍👩‍👧',
  'famille': '👨‍👩‍👧',
  'vin-honneur': '🥂',
  'cocktail': '🥂',
  'eglise': '💒',
  'ceremonie': '💒',
  'soiree': '🎉',
  'reception': '🎉'
};
const CATEGORY_ICONS_BY_LABEL: Record<string, string> = {
  'agrandissement': '🖼️',
  'dot': '🕊️',
  'globale': '🌍',
  'album': '📖',
  'prepa': '💄',
  'preparation': '💄',
  'prépa': '💄',
  'préparatifs': '💄',
  'prépa de la mariée': '👰',
  'prépa du marié': '🤵',
  'préparation de la mariée': '👰',
  'préparation du marié': '🤵',
  'mairie': '💍',
  'civil': '💍',
  'couple': '💑',
  'couple & famille': '👨‍👩‍👧',
  'vin d\'honneur': '🥂',
  'cocktail': '🥂',
  'église': '💒',
  'cérémonie': '💒',
  'soirée': '🎉',
  'réception': '🎉'
};
const FORMULA_GROUPS = [
  {
    group: 'Formule Cameroun',
    formulas: [
      {
        id: 'cm-simple',
        name: 'Formule Simple',
        price: '270 000 FCFA',
        description: '400 photos Classique/Globale + 1 Agrandissement',
        quotas: { total: 401, Dot: 0, Globale: 400, Album: 0, Agrandissement: 1 }
      },
      {
        id: 'cm-premium',
        name: 'Formule Premium',
        price: '325 000 FCFA',
        description: '500 photos Classique/Globale + 1 Agrandissement',
        quotas: { total: 501, Dot: 0, Globale: 500, Album: 0, Agrandissement: 1 }
      },
      {
        id: 'cm-complete',
        name: 'Formule Complete',
        price: '490 000 FCFA',
        description: '600 photos Classique/Globale + 100 Album + 1 Agrandissement',
        quotas: { total: 701, Dot: 0, Globale: 600, Album: 100, Agrandissement: 1 }
      },
      {
        id: 'cm-reve',
        name: 'Formule de Reve',
        price: '799 000 FCFA',
        description: '800 photos Classique/Globale + 120 Album + 1 Agrandissement + Dot',
        quotas: { total: 921, Dot: 0, Globale: 800, Album: 120, Agrandissement: 1 }
      }
    ]
  },
  {
    group: 'Formule France',
    formulas: [
      {
        id: 'fr-classique',
        name: 'Formule Classique',
        price: '3 000 EUR',
        description: '550 photos Classique/Globale + 120 Album',
        quotas: { total: 671, Dot: 0, Globale: 550, Album: 120, Agrandissement: 0 }
      },
      {
        id: 'fr-complete',
        name: 'Formule Complete',
        price: '4 500 EUR',
        description: '700 photos Classique/Globale + 100 Album',
        quotas: { total: 801, Dot: 0, Globale: 700, Album: 100, Agrandissement: 0 }
      },
      {
        id: 'fr-reve',
        name: 'Formule de Reve',
        price: '6 000 EUR',
        description: '800 photos Classique/Globale + 130 Album',
        quotas: { total: 931, Dot: 0, Globale: 800, Album: 130, Agrandissement: 0 }
      }
    ]
  }
];
// Flatten helper for searching by id
const FORMULAS = FORMULA_GROUPS.flatMap(g => g.formulas);
// Catégories de facturation — les seules qui apparaissent dans le panneau quotas
const CORE_QUOTA_KEYS = ['Dot', 'Globale', 'Album', 'Agrandissement'] as const;

function getCategoryIcon(key: string, label?: string): string {
  const k = (key || '').toLowerCase();
  if (CATEGORY_ICONS_BY_KEY[k]) return CATEGORY_ICONS_BY_KEY[k];
  if (label) {
    const l = label.toLowerCase().trim();
    if (CATEGORY_ICONS_BY_LABEL[l]) return CATEGORY_ICONS_BY_LABEL[l];
    // Fuzzy match on partial
    for (const [pattern, icon] of Object.entries(CATEGORY_ICONS_BY_LABEL)) {
      if (l.includes(pattern) || pattern.includes(l)) return icon;
    }
  }
  return '📁';
}

export default function AdminView({
  onSwitchToClient, 
  onClose, 
  onRefreshPhotos,
  categoryLabels,
  onUpdateCategoryLabels
}: AdminViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'messages' | 'photos' | 'settings'>('clients');

  // New main navigation: Dashboard / Couples / Messages / Gallery / Settings / Logs
  type MainSection = 'dashboard' | 'clients' | 'messages' | 'gallery' | 'settings' | 'logs';
  const [activeSection, setActiveSection] = useState<MainSection>('dashboard');
  
  // System logs state
  const [logs, setLogs] = useState<{ timestamp: string; level: string; message: string }[]>([]);
  const [logsFilter, setLogsFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [logsSearch, setLogsSearch] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cloudinary, setCloudinary] = useState<CloudinarySettings>(getCloudinarySettings());
  const [photos, setPhotos] = useState<WeddingPhoto[]>(getGlobalPhotos());
  const [clients, setClients] = useState<ClientAccount[]>(getClients());

  // Form states - Category renaming
  const [editableCategoryLabels, setEditableCategoryLabels] = useState<Record<string, string>>({ ...categoryLabels });
  const [newCategoryKey, setNewCategoryKey] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [labelSuccess, setLabelSuccess] = useState(false);

  // Client-specific categories modal state
  const [projectCategoriesClientId, setProjectCategoriesClientId] = useState<string | null>(null);
  const [projectCategoriesLabels, setProjectCategoriesLabels] = useState<Record<string, string>>({});
  const [newProjectCategoryKey, setNewProjectCategoryKey] = useState('');
  const [newProjectCategoryLabel, setNewProjectCategoryLabel] = useState('');
  const [projectCategorySuccess, setProjectCategorySuccess] = useState(false);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [enteredClientId, setEnteredClientId] = useState<string | null>(null);
  const [projectInnertab, setProjectInnertab] = useState<'overview' | 'photos' | 'feedback'>('overview');
  const [projectGalleryFilter, setProjectGalleryFilter] = useState<string>('ALL');
  const [previewPhoto, setPreviewPhoto] = useState<WeddingPhoto | null>(null);

  useEffect(() => {
    setEditableCategoryLabels({ ...categoryLabels });
  }, [categoryLabels]);

  // Form states - Client creation
  const [newClientName, setNewClientName] = useState('');
  const [newClientQuota, setNewClientQuota] = useState('5');
  const [newClientCategoryQuotas, setNewClientCategoryQuotas] = useState<Record<string, string>>({});
  const [newClientNotes, setNewClientNotes] = useState('');
  const [newClientWeddingDate, setNewClientWeddingDate] = useState('');
  const [newClientDeadline, setNewClientDeadline] = useState('');
  const [newClientCountry, setNewClientCountry] = useState('France');
  const [newClientFormula, setNewClientFormula] = useState('');
  const [clientError, setClientError] = useState('');
  const [clientSuccess, setClientSuccess] = useState('');

  // Status Filter & Search for Couples list
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'En cours' | 'Quota Atteint' | 'Clôturé'>('Tous');
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Cover photo selection popup list
  const [coverSelectClientId, setCoverSelectClientId] = useState<string | null>(null);

  // Form states - Client editing
  const [editingClient, setEditingClient] = useState<ClientAccount | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientQuota, setEditClientQuota] = useState('5');
  const [editClientNotes, setEditClientNotes] = useState('');
  const [editClientWeddingDate, setEditClientWeddingDate] = useState('');
  const [editClientDeadline, setEditClientDeadline] = useState('');
  const [editClientCountry, setEditClientCountry] = useState('France');
  const [editCategoryQuotas, setEditCategoryQuotas] = useState<Record<string, string>>({});
  const [editClientError, setEditClientError] = useState('');

  // Confirmation modal states
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);
  const [confirmDeleteCategoryKey, setConfirmDeleteCategoryKey] = useState<string | null>(null);
  const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<string | null>(null);

  // Couple enhancements: tags + internal notes (local extension)
  const [clientTags, setClientTags] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem("wedding_client_tags") || "{}"); } catch { return {}; }
  });
  const [internalNotes, setInternalNotes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("wedding_internal_notes") || "{}"); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem("wedding_client_tags", JSON.stringify(clientTags)); }, [clientTags]);
  useEffect(() => { localStorage.setItem("wedding_internal_notes", JSON.stringify(internalNotes)); }, [internalNotes]);

  // Search + filter for couples list
  const [clientQuickSearch, setClientQuickSearch] = useState("");
  const [clientTagFilter, setClientTagFilter] = useState<string | null>(null);

  // Messaging: search + filter
  const [messagesSearch, setMessagesSearch] = useState("");
  const [messagesFilter, setMessagesFilter] = useState<"all" | "unread" | "with-client">("all");
  const [adminTyping, setAdminTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [unreadByClient, setUnreadByClient] = useState<Record<string, boolean>>({});
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  // Gallery: bulk select + sort + filter
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [gallerySort, setGallerySort] = useState<"recent" | "oldest" | "name" | "client">("name");
  const [galleryFilterClient, setGalleryFilterClient] = useState<string>("all");
  const [galleryFilterCategory, setGalleryFilterCategory] = useState<string>("all");
  const [galleryLayout, setGalleryLayout] = useState<"2x2" | "3x3" | "4x4">("2x2");
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);
  const [confirmRetagOpen, setConfirmRetagOpen] = useState(false);

  // Density
  const [density, setDensity] = useState<"compact" | "normal" | "comfortable">("normal");

  // Command palette
  const [commandOpen, setCommandOpen] = useState(false);

  // Track last activity per client (for the recent activity feed)
  const [recentActivity, setRecentActivity] = useState<{ clientId: string; action: string; time: number }[]>([]);

  // History snapshots (sparkline)
  const [historySnapshot] = useState(() => {
    const cached = (() => { try { return JSON.parse(localStorage.getItem("wedding_history") || "null"); } catch { return null; } })();
    if (cached && Array.isArray(cached)) return cached;
    // seed with 14 days of synthetic history
    return Array.from({ length: 14 }).map((_, i) => ({
      day: i,
      couples: Math.max(1, Math.floor(Math.random() * 3) + 1),
      photos: Math.floor(Math.random() * 30) + 5,
      messages: Math.floor(Math.random() * 8)
    }));
  });
  useEffect(() => {
    localStorage.setItem("wedding_history", JSON.stringify(historySnapshot));
  }, [historySnapshot]);

  // Project specific upload popup states
  const [projectUploadClientId, setProjectUploadClientId] = useState<string | null>(null);
  const [projectUploadCategory, setProjectUploadCategory] = useState<CategoryTab>('Dot');
  const [projectDragActive, setProjectDragActive] = useState(false);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  // File Upload States
  const [uploadCategory, setUploadCategory] = useState<CategoryTab>('Dot');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Bulk Operations Queue State
  const [bulkQueue, setBulkQueue] = useState<UploadTask[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCompleted, setBatchCompleted] = useState(0);
  const [batchTimeRemaining, setBatchTimeRemaining] = useState<number | null>(null);
  const [isUploadPaused, setIsUploadPaused] = useState(false);
  const uploadPausedRef = useRef(false);

  const formatTimeRemaining = (secs: number | null): string => {
    if (secs === null || secs <= 0) return "calcul...";
    if (secs < 60) return `~ ${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `~ ${mins}m ${remainingSecs}s`;
  };

  // Cloudinary Folder Sync State
  const [syncFolderPath, setSyncFolderPath] = useState('');
  const [isSyncingFolder, setIsSyncingFolder] = useState(false);
  const [syncFolderSuccess, setSyncFolderSuccess] = useState('');

  // Unified Inbox State
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});
  const [selectedInboxClientId, setSelectedInboxClientId] = useState<string>('');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  // Clipboard Copied UI feedback
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);
  const [confirmDeleteClientId, setConfirmDeleteClientId] = useState<string | null>(null);

  // Cloudinary Form state
  const [cloudNameInput, setCloudNameInput] = useState(cloudinary.cloudName);
  const [uploadPresetInput, setUploadPresetInput] = useState(cloudinary.uploadPreset);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [serverStatus, setServerStatus] = useState<CloudinaryServerStatus | null>(null);
  const [testResult, setTestResult] = useState<{ status: "idle" | "loading" | "ok" | "error"; message?: string; rateLimit?: number }>({ status: "idle" });
  const [cloudinaryFolders, setCloudinaryFolders] = useState<string[]>([]);
  const [cloudinaryResources, setCloudinaryResources] = useState<CloudinaryResource[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [syncingFolder, setSyncingFolder] = useState(false);

  // Toggle creation form fold state
  const [isCreateFormExpanded, setIsCreateFormExpanded] = useState(false);

  // Carousel index for mobile metrics
  const [activeKpiIndex, setActiveKpiIndex] = useState(0);

  // Synchronise everything on load
  const loadDatabaseState = () => {
    setIsLoadingChats(true);
    fetch("/api/database")
      .then(res => {
        if (!res.ok) throw new Error("API Offline");
        return res.json();
      })
      .then(db => {
        if (db) {
          if (db.globalPhotos) {
            setPhotos(db.globalPhotos);
            saveGlobalPhotos(db.globalPhotos);
          }
          if (db.clientsList) {
            setClients(db.clientsList);
            saveClients(db.clientsList);
          }
          if (db.chatMessages) {
            setChatMessages(db.chatMessages);
          }
          if (db.cloudinarySettings && db.cloudinarySettings.cloudName && db.cloudinarySettings.uploadPreset) {
            setCloudinary(db.cloudinarySettings);
            setCloudNameInput(db.cloudinarySettings.cloudName);
            setUploadPresetInput(db.cloudinarySettings.uploadPreset);
            saveCloudinarySettings(db.cloudinarySettings);
          } else {
            const localSettings = getCloudinarySettings();
            if (localSettings && localSettings.cloudName && localSettings.uploadPreset) {
              console.log("Restoring Cloudinary settings from local storage to server database...");
              setCloudinary(localSettings);
              setCloudNameInput(localSettings.cloudName);
              setUploadPresetInput(localSettings.uploadPreset);
              fetch("/api/cloudinary-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cloudinarySettings: localSettings })
              }).catch(e => console.error("Restoration of Cloudinary to server failed: ", e));
            }
          }
        }
        setIsLoadingChats(false);
      })
      .catch(err => {
        console.log("Sync error AdminView: ", err);
        // Fallback local
        setPhotos(getGlobalPhotos());
        setClients(getClients());
        setIsLoadingChats(false);
      });
  };

  useEffect(() => {
    loadDatabaseState();
  }, []);

  // Set default chat recipient to first couple if not configured
  useEffect(() => {
    if (clients.length > 0 && !selectedInboxClientId) {
      setSelectedInboxClientId(clients[0].id);
    }
  }, [clients, selectedInboxClientId]);

  // Fetch Cloudinary server-side status on mount
  useEffect(() => {
    fetchCloudinaryServerStatus()
      .then(s => { setServerStatus(s); })
      .catch(() => { /* noop */ });
  }, []);

  // Auto-fill Cloud Name from server when frontend has none (Upload Preset still required manually)
  useEffect(() => {
    if (serverStatus && serverStatus.cloudName && !cloudNameInput.trim()) {
      setCloudNameInput(serverStatus.cloudName);
    }
  }, [serverStatus, cloudNameInput]);

  // Fetch system logs on demand or on tab activation
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch server logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'logs') {
      fetchLogs();
      const interval = setInterval(fetchLogs, 4000); // refresh every 4 seconds
      return () => clearInterval(interval);
    }
  }, [activeSection]);

  // 1. CLOUD SETTINGS ACTIONS
  const handleSaveCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { 
      cloudName: cloudNameInput.trim(), 
      uploadPreset: uploadPresetInput.trim() 
    };
    saveCloudinarySettings(updated);
    setCloudinary(updated);
    
    // Sync with backend database
    fetch("/api/cloudinary-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cloudinarySettings: updated })
    })
    .then(res => {
      if (res.ok) {
        console.log("Cloudinary configuration synced successfully with server.");
      }
    })
    .catch(err => {
      console.error("Cloudinary configs server sync failed:", err);
    });

    setConfigSuccess(true);
    setTimeout(() => setConfigSuccess(false), 3000);
  };

  // 2. CLIENT MANAGEMENT ACTIONS
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    setClientSuccess('');

    if (!newClientName.trim()) {
      setClientError('Veuillez entrer le nom du couple (ex: Alice & Bob).');
      return;
    }

    const quotaNum = parseInt(newClientQuota, 10);
    if (isNaN(quotaNum) || quotaNum <= 0) {
      setClientError('Le quota de photos à sélectionner doit être d\'au moins 1.');
      return;
    }

    const newId = newClientName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const normalizedId = newId || `client-${Date.now()}`;

    if (clients.some(c => c.id === normalizedId)) {
      setClientError('Un compte couple avec un nom similaire existe déjà.');
      return;
    }

    const finalQuotas: Record<string, number> = {};
    Object.entries(newClientCategoryQuotas).forEach(([cat, val]) => {
      finalQuotas[cat] = parseInt(val as string, 10) || 0;
    });

    const newClient: ClientAccount = {
      id: normalizedId,
      name: newClientName.trim(),
      targetCount: quotaNum,
      targetCountDot: finalQuotas['Dot'] || 0,
      targetCountGlobale: finalQuotas['Globale'] || 0,
      targetCountAlbum: finalQuotas['Album'] || 0,
      targetCategoryQuotas: finalQuotas,
      selectedPhotoIds: [],
      dislikedPhotoIds: [],
      notes: newClientNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      isLocked: false,
      photoComments: {},
      weddingDate: newClientWeddingDate || undefined,
      country: newClientCountry,
      deadline: newClientDeadline || undefined,
      formula: newClientFormula || undefined
    };

    const updated = [...clients, newClient];
    saveClients(updated);
    setClients(updated);

    // Sync with remote Express database if available
    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientsList: updated })
    })
    .then(() => loadDatabaseState())
    .catch(err => console.log("Local Database Mode Active: ", err));

    // Expose initial chat message
    fetch(`/api/chats/${normalizedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "photographer", text: `Bienvenue ${newClient.name} ! Votre catalogue de mariage est prêt.` })
    }).then(() => loadDatabaseState()).catch(err => {});

    setNewClientName('');
    setNewClientQuota('5');
    setNewClientCategoryQuotas({});
    setNewClientNotes('');
    setNewClientWeddingDate('');
    setNewClientDeadline('');
    setNewClientCountry('France');
    setNewClientFormula('');
    setClientSuccess(`Compte pour "${newClient.name}" créé avec succès !`);
    setTimeout(() => setClientSuccess(''), 4000);
    toast.success(`Compte "${newClient.name}" créé`, `${quotaNum} photos cibles`);
    setRecentActivity(prev => [{ clientId: normalizedId, action: "Compte créé", time: Date.now() }, ...prev].slice(0, 30));
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setEditClientError('');

    if (!editClientName.trim()) {
      setEditClientError('Veuillez entrer le nom du couple.');
      return;
    }

    const quotaNum = parseInt(editClientQuota, 10);
    if (isNaN(quotaNum) || quotaNum <= 0) {
      setEditClientError('Le quota de photos à sélectionner doit être d\'au moins 1.');
      return;
    }

    // compile category quotas
    const finalQuotas: Record<string, number> = {};
    Object.entries(editCategoryQuotas).forEach(([cat, val]) => {
      finalQuotas[cat] = parseInt(val as string, 10) || 0;
    });

    const updated = clients.map(cl => {
      if (cl.id === editingClient.id) {
        return {
          ...cl,
          name: editClientName.trim(),
          targetCount: quotaNum,
          targetCountDot: finalQuotas['Dot'] !== undefined ? finalQuotas['Dot'] : cl.targetCountDot,
          targetCountGlobale: finalQuotas['Globale'] !== undefined ? finalQuotas['Globale'] : cl.targetCountGlobale,
          targetCountAlbum: finalQuotas['Album'] !== undefined ? finalQuotas['Album'] : cl.targetCountAlbum,
          targetCategoryQuotas: finalQuotas,
          notes: editClientNotes.trim() || undefined,
          weddingDate: editClientWeddingDate || undefined,
          country: editClientCountry,
          deadline: editClientDeadline || undefined
        };
      }
      return cl;
    });

    saveClients(updated);
    setClients(updated);

    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientsList: updated })
    })
    .then(() => loadDatabaseState())
    .catch(err => console.log("Local Database Mode Active: ", err));

    setEditingClient(null);
    toast.success(`Couple "${editClientName.trim()}" mis à jour`);
  };

  const handleUpdateClientQuotas = (clientId: string, updates: Partial<ClientAccount>) => {
    const updated = clients.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          ...updates
        };
      }
      return client;
    });
    saveClients(updated);
    setClients(updated);
    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientsList: updated })
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.clientsList) {
        setClients(data.clientsList);
        saveClients(data.clientsList);
      }
      onRefreshPhotos?.();
    })
    .catch(err => {});
  };

  const handleDeleteClient = (id: string, name: string) => {
    const updated = clients.filter(c => c.id !== id);
    saveClients(updated);
    setClients(updated);
    
    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientsList: updated })
    })
    .then(() => loadDatabaseState())
    .catch(err => {});
  };

  const handleToggleLockClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    const willLock = !client?.isLocked;
    const updated = clients.map(c => {
      if (c.id === clientId) {
        return { ...c, isLocked: !c.isLocked };
      }
      return c;
    });
    saveClients(updated);
    setClients(updated);
    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientsList: updated })
    })
    .then(() => loadDatabaseState())
    .catch(err => { /* noop */ });
    if (client) {
      toast[willLock ? "success" : "info"](
        willLock ? `Sélection figée pour ${client.name}` : `Sélection dégelée pour ${client.name}`,
        willLock ? "Le couple ne peut plus modifier" : "Le couple peut à nouveau modifier"
      );
      setRecentActivity(prev => [{ clientId, action: willLock ? "Sélection figée" : "Sélection dégelée", time: Date.now() }, ...prev].slice(0, 30));
    }
  };

  const handleSetCoverPhoto = (clientId: string, photoId: string) => {
    const client = clients.find(c => c.id === clientId);
    const updated = clients.map(client => {
      if (client.id === clientId) {
        return { ...client, coverPhotoId: photoId };
      }
      return client;
    });
    saveClients(updated);
    setClients(updated);
    fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientsList: updated })
    })
    .then(() => {
      loadDatabaseState();
      setCoverSelectClientId(null);
    })
    .catch(err => { /* noop */ });
    if (client) {
      toast.success(`Photo de couverture mise à jour pour ${client.name}`);
    }
  };

  const compressImage = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.65): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // 3. PHOTO UPLOAD & MANAGEMENT ACTIONS
  const processSingleUpload = async (
    file: File, 
    targetClientId?: string, 
    targetCategory?: CategoryTab,
    batchUploadedNames?: Set<string>,
    existingTaskId?: string
  ): Promise<WeddingPhoto | null> => {
    const targetCat = targetCategory || uploadCategory;
    const lastDotIndex = file.name.lastIndexOf('.');
    const baseName = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
    const baseNameLower = baseName.trim().toLowerCase();

    // Check directly in localStorage (getGlobalPhotos) to prevent stale React state closures
    const currentPhotos = getGlobalPhotos();
    const inDb = currentPhotos.some(p => 
      p.name.trim().toLowerCase() === baseNameLower && 
      p.category === targetCat && 
      p.clientId === targetClientId
    );

    // Check if duplicate exists within the currently ongoing upload batch
    const inBatch = batchUploadedNames && batchUploadedNames.has(baseNameLower);

    if (inDb || inBatch) {
      const taskId = existingTaskId || `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      if (existingTaskId) {
        setBulkQueue(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', progress: 100, errorMsg: `La photo "${file.name}" a déjà été ajoutée à ce projet sous la catégorie "${targetCat}". Doublon ignoré.` } : t));
      } else {
        const newTask: UploadTask = {
          id: taskId,
          name: file.name,
          progress: 100,
          status: 'error',
          errorMsg: `La photo "${file.name}" a déjà été ajoutée à ce projet sous la catégorie "${targetCat}". Doublon ignoré.`
        };
        setBulkQueue(prev => [newTask, ...prev]);
      }
      throw new Error(`La photo "${file.name}" est un doublon et a été ignorée.`);
    }

    const taskId = existingTaskId || `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    if (!existingTaskId) {
      const newTask: UploadTask = {
        id: taskId,
        name: file.name,
        progress: 0,
        status: 'pending'
      };
      setBulkQueue(prev => [newTask, ...prev]);
    }

    const activeCloudinary = getCloudinarySettings();
    const finalCloudinary = (cloudinary.cloudName && cloudinary.uploadPreset) ? cloudinary : activeCloudinary;
    const useRealCloudinary = !!(finalCloudinary.cloudName && finalCloudinary.uploadPreset);

    console.log("processSingleUpload starting. File:", file.name, "useRealCloudinary:", useRealCloudinary, "settings:", finalCloudinary);

    try {
      setBulkQueue(prev => prev.map(t => t.id === taskId ? { ...t, status: 'uploading', progress: 15 } : t));

      if (useRealCloudinary) {
        let fileToUpload: File | string = file;
        if (file.type.startsWith('image/')) {
          try {
            // Compresser l'image à 2048px max (excellent rendu HD) et 80% de qualité
            fileToUpload = await compressImage(file, 2048, 2048, 0.80);
          } catch (e) {
            console.warn("Compression échouée, envoi de l'image originale :", e);
          }
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('upload_preset', finalCloudinary.uploadPreset);

        // Dynamically organize into Cloudinary folders mimicking the app structure
        let folderPath = "Mariages/Global";
        const cleanCategory = targetCategory || uploadCategory || 'Generale';
        if (targetClientId) {
          const clientObj = clients.find(c => c.id === targetClientId);
          const cleanClientName = clientObj ? clientObj.name.trim().replace(/[\s\/\\?#%&*:|"<>\.]/g, '_') : targetClientId;
          folderPath = `Mariages/${cleanClientName}/${cleanCategory}`;
          formData.append('tags', `mariage,${cleanClientName},${cleanCategory}`);
        } else {
          folderPath = `Mariages/Global/${cleanCategory}`;
          formData.append('tags', `mariage,global,${cleanCategory}`);
        }
        formData.append('folder', folderPath);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${finalCloudinary.cloudName}/image/upload`,
          { method: 'POST', body: formData }
        );

        if (!response.ok) {
          const rawText = await response.text();
          let errMessage = rawText;
          try {
            const parsed = JSON.parse(rawText);
            if (parsed.error && parsed.error.message) {
              errMessage = parsed.error.message;
            }
          } catch (e) {
            errMessage = response.statusText || rawText;
          }
          
          // Translate common Cloudinary errors to friendly French explanations
          if (errMessage.includes("Upload preset") && errMessage.includes("not found")) {
            errMessage = `Le preset "${finalCloudinary.uploadPreset}" est introuvable. Veuillez vérifier l'orthographe dans l'onglet Configuration et l'existence du preset dans votre console Cloudinary.`;
          } else if (errMessage.includes("must be unsigned")) {
            errMessage = `Le preset "${finalCloudinary.uploadPreset}" existe mais est configuré en mode "Signed" (Signé). Vous devez modifier ses paramètres dans votre console Cloudinary et le régler sur "Unsigned" (Non-signé).`;
          }
          
          throw new Error(`Erreur Cloudinary : ${errMessage}`);
        }

        const resData = await response.json();
        if (resData && resData.secure_url) {
          const newPhoto: WeddingPhoto = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name.split('.')[0] || 'Nouvelle photo',
            image: resData.secure_url,
            category: targetCategory || uploadCategory,
            createdAt: new Date().toISOString(),
            clientId: targetClientId
          };

          setBulkQueue(prev => prev.map(t => t.id === taskId ? { ...t, status: 'success', progress: 100 } : t));
          return newPhoto;
        } else {
          throw new Error("Aucun lien (URL) n'a été retourné par Cloudinary.");
        }
      } else {
        throw new Error("L'importation locale en Base64 a été désactivée à votre demande. Veuillez d'abord configurer le 'Nom du Cloud' et le 'Preset' Cloudinary sous l'onglet 'Configuration & Quotas' > 'Liaison Serveur Cloudinary' pour stocker vos clichés sur un hébergement cloud externe stable.");
      }
    } catch (err: any) {
      console.error(err);
      setBulkQueue(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', errorMsg: err.message || "Erreur" } : t));
      throw err;
    }
  };

  // Mass Multiple Drag and Drop / Pick
  const handleMultipleFiles = async (files: FileList, targetClientId?: string, targetCategory?: CategoryTab) => {
    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');
    
    const count = files.length;
    setBatchTotal(count);
    setBatchCompleted(0);
    setBatchTimeRemaining(null);

    // 1. Pre-create tasks for all files in this batch
    const tasks: UploadTask[] = [];
    const taskIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      taskIds.push(taskId);
      tasks.push({
        id: taskId,
        name: files[i].name,
        progress: 0,
        status: 'pending'
      });
    }

    // Prepend all tasks to the bulkQueue at once
    setBulkQueue(prev => [...tasks, ...prev]);

    const newPhotos: WeddingPhoto[] = [];
    const batchUploadedNames = new Set<string>();
    const uploadStartTime = Date.now();
    let totalPauseDuration = 0;

    for (let i = 0; i < count; i++) {
      // Pause yield check loop
      if (uploadPausedRef.current) {
        const pauseStart = Date.now();
        while (uploadPausedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        totalPauseDuration += (Date.now() - pauseStart);
      }

      try {
        const photo = await processSingleUpload(files[i], targetClientId, targetCategory, batchUploadedNames, taskIds[i]);
        if (photo) {
          newPhotos.push(photo);
          const baseName = files[i].name.split('.')[0] || '';
          batchUploadedNames.add(baseName.toLowerCase());
        }
      } catch (err: any) {
        console.error("Single upload failed", err);
        if (err.message && !err.message.includes("est un doublon")) {
          setUploadError(err.message || "Échec d'importation d'une image");
        }
      }

      // Update completed count and estimate time remaining
      const completed = i + 1;
      setBatchCompleted(completed);
      
      if (completed < count) {
        const elapsedMs = (Date.now() - uploadStartTime) - totalPauseDuration;
        const msPerFile = elapsedMs / completed;
        const remainingFiles = count - completed;
        const estRemainingSec = Math.round((remainingFiles * msPerFile) / 1000);
        setBatchTimeRemaining(estRemainingSec);
      } else {
        setBatchTimeRemaining(null);
      }
    }

    if (newPhotos.length > 0) {
      const currentPhotos = getGlobalPhotos();
      const updated = [...newPhotos, ...currentPhotos];
      saveGlobalPhotos(updated);
      setPhotos(updated);
      onRefreshPhotos();

      // Sync and retrieve updated state
      try {
        const response = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ globalPhotos: updated })
        });
        if (response.ok) {
          await loadDatabaseState();
          setUploadSuccess(`${newPhotos.length} photos importées avec succès !`);
        } else {
          const errText = await response.text();
          console.error("Failed to sync photos with server:", response.status, errText);
          setUploadError(`Erreur de synchronisation avec le serveur (${response.status}). Les photos sont conservées localement.`);
        }
      } catch (err) {
        console.error("Batch sync exception", err);
        setUploadError("Une erreur réseau est survenue lors de la synchronisation.");
      }
    }
    
    setIsUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFiles(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleDeletePhoto = (id?: string) => {
    const targetIds = id ? [id] : Array.from(selectedPhotoIds);
    if (targetIds.length === 0) return;
    const updated = photos.filter(p => !targetIds.includes(p.id));
    saveGlobalPhotos(updated);
    setPhotos(updated);
    onRefreshPhotos();

    fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalPhotos: updated })
    }).then(() => loadDatabaseState()).catch(err => { /* noop */ });
    setSelectedPhotoIds(new Set());
    setConfirmDeleteSelected(false);
    toast.success(`${targetIds.length} photo${targetIds.length > 1 ? "s" : ""} supprimée${targetIds.length > 1 ? "s" : ""}`);
  };

  // Simulate Cloudinary Folder Synchronization
  const handleCloudinaryFolderSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncFolderPath.trim()) return;

    setIsSyncingFolder(true);
    setSyncFolderSuccess('');

    try {
      // Real call to Cloudinary via our backend proxy
      const res = await listCloudinaryFolder(syncFolderPath.trim(), 100);
      if (!res.success) {
        toast.error(res.error || "Erreur de listing Cloudinary");
        setSyncFolderSuccess(`Erreur: ${res.error}`);
        setIsSyncingFolder(false);
        return;
      }

      const resources = res.resources || [];
      if (resources.length === 0) {
        toast.warning(`Aucune photo trouvée dans "${syncFolderPath}"`);
        setSyncFolderSuccess(`Dossier vide: ${syncFolderPath}`);
        setIsSyncingFolder(false);
        return;
      }

      // Convert Cloudinary resources to WeddingPhoto
      const folderPhotos: WeddingPhoto[] = resources.map((r) => {
        // Try to infer category from folder name
        const folderLower = syncFolderPath.toLowerCase();
        let category: CategoryTab = "Globale";
        if (folderLower.includes("dot") || folderLower.includes("cérémonie") || folderLower.includes("ceremonie") || folderLower.includes("civil") || folderLower.includes("préparatifs")) category = "Dot";
        else if (folderLower.includes("album") || folderLower.includes("bal") || folderLower.includes("soirée") || folderLower.includes("soiree")) category = "Album";
        else category = "Globale";

        // Try to extract couple name from folder
        const folderParts = syncFolderPath.split("/").filter(Boolean);
        const clientName = folderParts[1] || "";
        const matchingClient = clients.find(c =>
          c.name.toLowerCase().replace(/[^a-z0-9]/g, "").includes(clientName.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 5))
        );

        return {
          id: `cloudinary-${r.public_id.replace(/\//g, "-")}`,
          name: r.public_id.split("/").pop()?.replace(/[-_]/g, " ") || "Photo Cloudinary",
          image: r.secure_url,
          category,
          createdAt: r.created_at,
          clientId: matchingClient?.id
        };
      });

      // Merge with existing photos (dedup by public_id-derived id)
      const existingIds = new Set(photos.map(p => p.id));
      const newPhotos = folderPhotos.filter(p => !existingIds.has(p.id));
      const updated = [...newPhotos, ...photos];
      saveGlobalPhotos(updated);
      setPhotos(updated);
      onRefreshPhotos();

      await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalPhotos: updated })
      });

      toast.success(`${newPhotos.length} photo(s) importée(s) depuis Cloudinary`);
      setSyncFolderSuccess(`Synchronisation réussie ! ${newPhotos.length} photo(s) importée(s) depuis "${syncFolderPath}".`);
      setSyncFolderPath('');
    } catch (e: any) {
      toast.error(`Erreur: ${e.message}`);
      setSyncFolderSuccess(`Erreur: ${e.message}`);
    } finally {
      setIsSyncingFolder(false);
      setTimeout(() => setSyncFolderSuccess(''), 6000);
    }
  };

  // Unified Chat responder action
  const handleSendInboxReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedInboxClientId) return;

    fetch(`/api/chats/${selectedInboxClientId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "photographer", text: adminReplyText.trim() })
    })
    .then(res => res.json())
    .then(() => {
      setAdminReplyText('');
      loadDatabaseState();
    })
    .catch(err => {
      console.log("Could not compose reply on server", err);
    });
  };

  // Generate and Copy Couple Link
  const handleCopyAccessLink = (clientId: string) => {
    const accessUrl = `${window.location.origin}${window.location.pathname}?client=${clientId}`;
    
    const triggerSuccessFeedback = () => {
      setCopiedClientId(clientId);
      setTimeout(() => setCopiedClientId(null), 2500);
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(accessUrl)
        .then(() => {
          triggerSuccessFeedback();
        })
        .catch(() => {
          fallbackCopyToClipboard(accessUrl);
        });
    } else {
      fallbackCopyToClipboard(accessUrl);
    }

    function fallbackCopyToClipboard(text: string) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          triggerSuccessFeedback();
        } else {
          console.error("Fallback: Copy command was unsuccessful");
        }
      } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
      }
    }
  };

  // Retrieve calculated couple status
  const getCoupleStatus = (client: ClientAccount) => {
    if (client.isLocked) return 'Clôturé';
    if (client.selectedPhotoIds.length >= client.targetCount) return 'Quota Atteint';
    return 'En cours';
  };

  // Filtering list of clients inside UI
  const filteredClients = clients.filter(client => {
    // 1. Status Filter
    if (statusFilter !== 'Tous' && getCoupleStatus(client) !== statusFilter) {
      return false;
    }

    // 2. Quick search (from SearchBar)
    if (clientQuickSearch.trim()) {
      const q = clientQuickSearch.trim().toLowerCase();
      const nameMatched = client.name.toLowerCase().includes(q);
      const countryMatched = client.country ? client.country.toLowerCase().includes(q) : false;
      const slugMatched = client.id.toLowerCase().includes(q);
      const noteMatched = (internalNotes[client.id] || "").toLowerCase().includes(q);
      if (!(nameMatched || countryMatched || slugMatched || noteMatched)) return false;
    }

    // 3. Tag filter
    if (clientTagFilter) {
      const tags = clientTags[client.id] || [];
      if (!tags.includes(clientTagFilter)) return false;
    }

    // 4. Existing search (legacy)
    if (clientSearchQuery.trim()) {
      const q = clientSearchQuery.trim().toLowerCase();
      const nameMatched = client.name.toLowerCase().includes(q);
      const countryMatched = client.country ? client.country.toLowerCase().includes(q) : false;
      const slugMatched = client.id.toLowerCase().includes(q);
      let dateMatched = false;
      if (client.weddingDate) {
        const dStr = client.weddingDate.toLowerCase();
        const parts = dStr.split('-');
        const year = parts[0] || '';
        const month = parts[1] || '';
        const day = parts[2] || '';
        const frenchMonths = [
          "janvier", "février", "mars", "avril", "mai", "juin",
          "juillet", "août", "septembre", "octobre", "novembre", "décembre"
        ];
        const monthIdx = parseInt(month, 10) - 1;
        const monthWord = (monthIdx >= 0 && monthIdx < 12) ? frenchMonths[monthIdx] : '';
        dateMatched = dStr.includes(q) || year.includes(q) || month.includes(q) || day.includes(q) || monthWord.includes(q);
      }
      if (!(nameMatched || countryMatched || slugMatched || dateMatched)) return false;
    }

    return true;
  });

  // Metrics (used by dashboard + clients KPIs)
  const totalCouplesCount = clients.length;
  const closedCouplesCount = clients.filter(c => getCoupleStatus(c) === 'Clôturé').length;
  const activeCouplesCount = clients.filter(c => getCoupleStatus(c) === 'En cours').length;
  const totalPhotosCount = photos.length;
  const cloudPhotosCount = photos.filter(p => !p.image.startsWith('data:image')).length;
  const localBase64PhotosCount = photos.filter(p => p.image.startsWith('data:image')).length;
  const localBase64Warning = localBase64PhotosCount > 0;
  const totalConversationsCount = Object.keys(chatMessages || {}).length;
  const totalMessagesReceivedCount = Object.keys(chatMessages || {}).reduce(
    (acc, k) => acc + (chatMessages[k] || []).filter((m: any) => m.sender !== 'photographer').length, 0
  );

  // Animated counters — must be called unconditionally at top level
  const animatedCouples = useCountUp(totalCouplesCount);
  const animatedPhotos = useCountUp(totalPhotosCount);
  const animatedConvos = useCountUp(totalConversationsCount);
  const animatedMsgs = useCountUp(totalMessagesReceivedCount);
  const animatedClosed = useCountUp(closedCouplesCount);
  const animatedActive = useCountUp(activeCouplesCount);
  const animatedCloud = useCountUp(cloudPhotosCount);

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Build command palette items dynamically
  const commandItems = useMemo<{ id: string; label: string; icon?: React.ReactNode; group?: string; shortcut?: string; onSelect: () => void }[]>(() => [
    { id: "new-client", label: "Créer un nouveau couple", icon: <Plus className="w-3.5 h-3.5" />, group: "Couples", onSelect: () => { goToSection("clients"); setIsCreateFormExpanded(true); } },
    { id: "tab-dashboard", label: "Aller à l'Accueil", icon: <Sparkles className="w-3.5 h-3.5" />, group: "Navigation", onSelect: () => goToSection("dashboard") },
    { id: "tab-clients", label: "Aller à l'onglet Couples", icon: <Users className="w-3.5 h-3.5" />, group: "Navigation", onSelect: () => goToSection("clients") },
    { id: "tab-messages", label: "Aller à l'onglet Messages", icon: <MessageSquare className="w-3.5 h-3.5" />, group: "Navigation", onSelect: () => goToSection("messages") },
    { id: "tab-photos", label: "Aller à l'onglet Galerie", icon: <ImageIcon className="w-3.5 h-3.5" />, group: "Navigation", onSelect: () => goToSection("gallery") },
    { id: "tab-settings", label: "Aller à l'onglet Réglages", icon: <Settings className="w-3.5 h-3.5" />, group: "Navigation", onSelect: () => goToSection("settings") },
    { id: "upload", label: "Téléverser des photos (Bulk)", icon: <Upload className="w-3.5 h-3.5" />, group: "Actions", onSelect: () => { goToSection("gallery"); setTimeout(() => fileInputRef.current?.click(), 200); } },
    { id: "lock-all", label: "Verrouiller la sélection d'un couple", icon: <Lock className="w-3.5 h-3.5" />, group: "Actions", onSelect: () => { goToSection("clients"); } },
    ...clients.slice(0, 5).map(c => ({ id: `go-${c.id}`, label: `Ouvrir ${c.name}`, icon: <Avatar name={c.name} size={14} />, group: "Couples", onSelect: () => { openCouple(c.id); } }))
  ], [clients]);

  // Sync activeSection -> activeSubTab for backward compatibility with existing logic
  const goToSection = (section: MainSection) => {
    setActiveSection(section);
    if (enteredClientId) setEnteredClientId(null);
    if (section === 'clients') setActiveSubTab('clients');
    else if (section === 'messages') setActiveSubTab('messages');
    else if (section === 'gallery') setActiveSubTab('photos');
    else if (section === 'settings') setActiveSubTab('settings');
  };

  // Helper: when a couple is opened, we stay in 'clients' section but show the detail page
  const openCouple = (clientId: string) => {
    setEnteredClientId(clientId);
    setProjectInnertab('overview');
    setActiveSection('clients');
  };
  const closeCouple = () => {
    setEnteredClientId(null);
  };

  // Sidebar nav items (avec couleurs par section)
  const sidebarItems: { key: MainSection; label: string; Icon: any; badge?: number; color: string }[] = [
    { key: 'dashboard', label: 'Accueil', Icon: Sparkles, color: 'var(--section-dashboard, #525E43)' },
    { key: 'clients', label: 'Couples', Icon: Users, badge: clients.length, color: 'var(--section-couples, #C2A679)' },
    { key: 'messages', label: 'Messages', Icon: MessageSquare, badge: Object.values(unreadByClient).filter(Boolean).length, color: 'var(--section-messages, #A56B47)' },
    { key: 'gallery', label: 'Galerie', Icon: ImageIcon, badge: photos.length, color: 'var(--section-gallery, #8A9A7E)' },
    { key: 'settings', label: 'Réglages', Icon: Settings, color: 'var(--section-settings, #3E4634)' },
    { key: 'logs', label: 'Logs Système', Icon: Terminal, color: '#A3704C' }
  ];

  // Couple detail sub-nav items
  const coupleDetailTabs: { key: typeof projectInnertab; label: string; Icon: any }[] = [
    { key: 'overview', label: 'Vue d\'ensemble', Icon: Sparkles },
    { key: 'photos', label: 'Photos', Icon: ImageIcon },
    { key: 'feedback', label: 'Retouches', Icon: MessageSquare }
  ];

  return (
    <div className="flex-1 flex bg-[var(--bg-app)] text-brand-moss overflow-hidden">
      <ToastContainer />

      {/* =================== SIDEBAR PRINCIPALE =================== */}
      <aside className={`hidden md:flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-56'} bg-[var(--bg-panel)] border-r border-brand-sand shrink-0 transition-all duration-300`}>
        {/* Brand */}
        <div className="p-3 border-b border-brand-sand shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-olive text-brand-cream flex items-center justify-center shrink-0 shadow-sm">
              <Bookmark className="w-4 h-4 text-brand-gold" />
            </div>
            {!sidebarCollapsed && (
              <div className="text-left min-w-0">
                <span className="text-[8.5px] font-extrabold uppercase text-brand-gold tracking-widest block leading-none">Maison Marvel</span>
                <span className="text-[10px] font-serif-display font-black text-brand-olive uppercase leading-tight block truncate">Atelier</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto no-scrollbar">
          {sidebarItems.map(item => {
            const isActive = activeSection === item.key && !enteredClientId;
            return (
              <motion.button
                key={item.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => goToSection(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all cursor-pointer relative ${
                  isActive ? 'text-white' : 'text-brand-sage hover:bg-brand-cream'
                }`}
                style={!isActive ? { color: item.color } : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-xl shadow-md"
                    style={{ backgroundColor: item.color }}
                    transition={{ type: "spring", damping: 22, stiffness: 240 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5 w-full">
                  <item.Icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none tabular-nums shrink-0"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.25)",
                        color: "#fff"
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </span>
              </motion.button>
            );
          })}
        </nav>

        {/* Collapse toggle + logout */}
        <div className="p-2 border-t border-brand-sand space-y-1 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-brand-sage hover:text-brand-olive hover:bg-brand-cream transition-all cursor-pointer"
            aria-label={sidebarCollapsed ? "Déplier" : "Replier"}
          >
            <ArrowLeft className={`w-3.5 h-3.5 shrink-0 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            {!sidebarCollapsed && <span>Replier</span>}
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('wedding_admin_authorized');
              onClose();
              window.location.reload();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-brand-sage hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <Key className="w-3.5 h-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* =================== MAIN CONTENT =================== */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top header */}
        <header className="shrink-0 bg-[var(--bg-panel)] border-b border-brand-sand px-3 py-2 flex items-center justify-between gap-2 shadow-xs z-30">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile: logo */}
            <div className="md:hidden w-7 h-7 rounded-lg bg-brand-olive text-brand-cream flex items-center justify-center shrink-0">
              <Bookmark className="w-3.5 h-3.5 text-brand-gold" />
            </div>
            <Breadcrumb
              items={[
                { label: "Atelier", icon: <Sparkles className="w-3 h-3 text-brand-gold" />, onClick: () => { closeCouple(); goToSection('dashboard'); } },
                ...(enteredClientId ? [
                  { label: "Couples", onClick: closeCouple },
                  { label: clients.find(c => c.id === enteredClientId)?.name || "Couple" }
                ] : [
                  { label: activeSection === 'dashboard' ? 'Accueil' : activeSection === 'clients' ? 'Couples' : activeSection === 'messages' ? 'Messages' : activeSection === 'gallery' ? 'Galerie' : activeSection === 'logs' ? 'Logs Système' : 'Réglages' }
                ])
              ]}
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-[var(--bg-subtle)] hover:border-brand-gold border border-brand-sand px-2.5 py-1.5 rounded-lg text-[10px] text-brand-sage font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <kbd className="text-[8.5px] font-mono bg-[var(--bg-panel)] border border-brand-sand px-1 py-0.5 rounded">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-brand-olive border border-brand-sand cursor-pointer"
              aria-label="Rechercher"
            >
              <Command className="w-3.5 h-3.5 text-brand-gold" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 bg-brand-olive text-brand-cream hover:bg-brand-moss px-3 py-1.5 rounded-full text-[10px] font-bold duration-300 shadow cursor-pointer uppercase"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <div className="md:hidden shrink-0 bg-[var(--bg-panel)] border-t border-brand-sand flex items-center justify-around px-1 py-1.5 z-30 order-last">
          {sidebarItems.map(item => {
            const isActive = activeSection === item.key && !enteredClientId;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => goToSection(item.key)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer relative ${isActive ? 'text-brand-olive' : 'text-brand-sage'}`}
              >
                {isActive && <span className="absolute -top-1.5 w-6 h-0.5 bg-brand-olive rounded-full" />}
                <item.Icon className="w-4 h-4" />
                <span className="text-[8px] font-bold uppercase">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* =================== BODY (scrollable) =================== */}
        <div className="flex-1 overflow-y-auto p-3 md:p-5 no-scrollbar">

          {/* ---------- DASHBOARD ---------- */}
          {activeSection === 'dashboard' && !enteredClientId && (
            <div className="space-y-5 max-w-5xl mx-auto">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h1 className="text-xl font-serif-display font-black text-brand-olive uppercase tracking-tight">Bienvenue, Damien</h1>
                  <p className="text-[11px] text-brand-sage mt-0.5">Vue d'ensemble de votre atelier photographique</p>
                </div>
                <button
                  type="button"
                  onClick={() => { goToSection('clients'); setIsCreateFormExpanded(true); }}
                  className="flex items-center gap-1.5 bg-brand-olive hover:bg-brand-moss text-brand-cream text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-brand-gold" /> Nouveau couple
                </button>
              </div>

              {/* KPIs grid - extracted from old clients tab */}
              {(() => {
                // Proactive alerts
                const upcomingDeadlines = clients
                  .filter(c => !c.isLocked && c.deadline)
                  .map(c => { try { const d = new Date(c.deadline); const t = new Date(); t.setHours(0,0,0,0); return { client: c, days: Math.ceil((d.getTime() - t.getTime()) / 86400000) }; } catch { return null; } })
                  .filter((x): x is { client: ClientAccount; days: number } => x !== null && x.days <= 7)
                  .sort((a, b) => a.days - b.days);

                return (
                  <>
                    {upcomingDeadlines.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-800 shadow-sm">
                        <Bell className="w-4 h-4 shrink-0 text-amber-600 mt-0.5 animate-pulse" />
                        <div className="text-[10.5px] flex-1 leading-relaxed">
                          <strong className="font-extrabold uppercase tracking-wide">{upcomingDeadlines.length} couple{upcomingDeadlines.length > 1 ? "s" : ""}</strong> à relancer :{" "}
                          {upcomingDeadlines.slice(0, 3).map((u, i) => (
                            <span key={u.client.id}>
                              <button type="button" onClick={() => openCouple(u.client.id)} className="underline font-extrabold hover:text-amber-900 cursor-pointer">{u.client.name}</button>
                              {u.days < 0 ? ` (dépassée de ${Math.abs(u.days)}j)` : u.days === 0 ? " (aujourd'hui)" : ` (${u.days}j)`}
                              {i < Math.min(2, upcomingDeadlines.length - 1) ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                      {[
                        { label: "Couples", value: animatedCouples, Icon: Users, color: "#525E43", spark: historySnapshot.map(h => h.couples), sub: <><span className="text-emerald-700 truncate">{animatedClosed} validés</span><span className="text-blue-600 truncate">{animatedActive} en cours</span></> },
                        { label: "Galerie", value: animatedPhotos, Icon: ImageIcon, color: "#C2A679", spark: historySnapshot.map(h => h.photos), sub: <><span className="text-brand-gold truncate">{animatedCloud} cloud</span><span className={localBase64Warning ? 'text-amber-600 truncate' : 'text-brand-sage truncate'}>{localBase64PhotosCount} base64</span></> },
                        { label: "Messages", value: animatedConvos, Icon: MessageSquare, color: "#964724", spark: historySnapshot.map(h => h.messages), sub: <span className="truncate">📨 {animatedMsgs} avis</span> },
                        { label: "Cloud", value: cloudinary.cloudName ? "✓" : "—", Icon: Globe, color: "#502E42", spark: [], sub: <span className="truncate">{cloudinary.cloudName ? "Connecté" : "Offline"}</span> }
                      ].map((k, i) => (
                        <motion.button
                          key={k.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileHover={{ y: -2 }}
                          onClick={() => goToSection(k.label === "Couples" ? 'clients' : k.label === "Galerie" ? 'gallery' : k.label === "Messages" ? 'messages' : 'settings')}
                          className="bg-[var(--bg-panel)] border border-brand-sand/70 rounded-2xl p-2.5 sm:p-3.5 shadow-sm flex flex-col gap-1.5 sm:gap-2 text-left cursor-pointer transition-all hover:shadow-md min-w-0 overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] font-extrabold uppercase text-brand-sage tracking-wider block truncate">{k.label}</span>
                              <span className="text-lg md:text-xl font-serif-display font-black text-brand-olive leading-tight tabular-nums block truncate">{k.value}</span>
                            </div>
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-brand-cream flex items-center justify-center shrink-0" style={{ color: k.color }}>
                              <k.Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </div>
                          </div>
                          {k.spark.length > 0 && <div className="h-5 -mx-1"><Sparkline data={k.spark} color={k.color} height={20} /></div>}
                          <div className="text-[8.5px] sm:text-[9px] uppercase font-bold tracking-wider text-brand-sage flex items-center justify-between tabular-nums gap-1 min-w-0 overflow-hidden">{k.sub}</div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Recent activity */}
                    {recentActivity.length > 0 && (
                      <div className="bg-[var(--bg-panel)] border border-brand-sand/60 rounded-xl p-3 space-y-1.5 shadow-sm">
                        <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-widest font-extrabold text-brand-sage">
                          <Sparkles className="w-3 h-3 text-brand-gold" /> Activité récente
                        </div>
                        {recentActivity.slice(0, 5).map((a, i) => {
                          const c = clients.find(x => x.id === a.clientId);
                          if (!c) return null;
                          return (
                            <button key={i} onClick={() => openCouple(a.clientId)} className="w-full flex items-center gap-2 text-[10px] text-brand-olive hover:bg-brand-cream rounded-lg px-1 py-0.5 cursor-pointer">
                              <span className="w-1 h-1 rounded-full bg-brand-gold shrink-0" />
                              <span className="font-extrabold truncate">{c.name}</span>
                              <span className="text-brand-sage truncate">— {a.action}</span>
                              <span className="ml-auto text-[8.5px] text-brand-sage/70 shrink-0">{new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Quick actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Ajouter un couple", Icon: Plus, onClick: () => { goToSection('clients'); setIsCreateFormExpanded(true); } },
                  { label: "Importer photos", Icon: Upload, onClick: () => { goToSection('gallery'); } },
                  { label: "Voir messages", Icon: MessageSquare, onClick: () => goToSection('messages') },
                  { label: "Réglages", Icon: Settings, onClick: () => goToSection('settings') }
                ].map(a => (
                  <button key={a.label} type="button" onClick={a.onClick} className="bg-[var(--bg-panel)] hover:bg-brand-cream border border-brand-sand rounded-xl p-2.5 sm:p-3 flex flex-col items-center gap-1.5 text-center cursor-pointer transition-all hover:shadow-sm min-w-0 overflow-hidden">
                    <a.Icon className="w-4 h-4 text-brand-gold shrink-0" />
                    <span className="text-[9px] sm:text-[9.5px] font-extrabold uppercase tracking-wider text-brand-olive truncate w-full">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ---------- COUPLE DETAIL (page dédiée) ---------- */}
          {activeSection === 'clients' && enteredClientId && (() => {
          const targetClient = clients.find(c => c.id === enteredClientId);
          if (!targetClient) {
            closeCouple();
            return null;
          }

          const clientStatus = getCoupleStatus(targetClient);
          const progressVal = targetClient.targetCount > 0 
            ? Math.min(100, Math.round((targetClient.selectedPhotoIds.length / targetClient.targetCount) * 100))
            : 0;
            
          const currentCategoryLabels: Record<string, string> = {
            ...categoryLabels,
            ...(targetClient.categoryLabels || {})
          };
          photos.forEach(p => {
            if ((!p.clientId || p.clientId === targetClient.id) && p.category) {
              if (!currentCategoryLabels[p.category]) {
                let label = p.category;
                if (label.startsWith('custom-')) {
                  const parts = label.split('-');
                  label = parts.slice(1, parts.length - 1).join(' ') || p.category;
                  label = label.charAt(0).toUpperCase() + label.slice(1);
                }
                currentCategoryLabels[p.category] = label;
              }
            }
          });
          const clientPhotos = photos.filter(p => p.clientId === targetClient.id);
          const coverPhoto = photos.find(p => p.id === targetClient.coverPhotoId) || photos[0];

          return (
            <div className="space-y-6 text-left animate-fade-in">
              
              {/* ============== HEADER CARD ============== */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-white/60 relative">
                {/* Accent gradient bar */}
                <div className={`h-1.5 bg-gradient-to-r ${
                  clientStatus === 'Clôturé' ? 'from-emerald-400 to-emerald-600' : clientStatus === 'Quota Atteint' ? 'from-amber-400 to-brand-gold' : 'from-blue-400 via-brand-olive to-brand-gold'
                }`} />

                <div className="p-6 lg:p-8">
                  {/* Row 1: Back + Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <button 
                      type="button"
                      onClick={closeCouple}
                      className="inline-flex items-center gap-2 bg-brand-cream border border-brand-sand/80 text-brand-olive hover:bg-white hover:border-brand-gold hover:shadow-md px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all duration-300"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-brand-gold" /> Retour aux couples
                    </button>

                    <div className="flex items-center gap-2">
                      {clientStatus === 'Clôturé' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-3.5 py-1.5 rounded-full uppercase tracking-widest font-extrabold flex items-center gap-1.5 shadow-sm">
                          <Check className="w-3 h-3" /> Tirage validé
                        </span>
                      ) : clientStatus === 'Quota Atteint' ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-3.5 py-1.5 rounded-full uppercase tracking-widest font-extrabold flex items-center gap-1.5 shadow-sm">
                          <Bookmark className="w-3 h-3" /> Prêt à figer
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[9px] px-3.5 py-1.5 rounded-full uppercase tracking-widest font-extrabold flex items-center gap-1.5 shadow-sm">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Tri en cours
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Name + ID */}
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-brand-sand/40 pb-5 mb-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-3xl lg:text-4xl font-serif-display font-black text-brand-olive tracking-tight leading-none">
                          {targetClient.name}
                        </h2>
                        <span className="text-[10px] font-mono font-bold text-brand-sage bg-brand-cream border border-brand-sand/80 px-2.5 py-1 rounded-lg tracking-wider">
                          #{targetClient.id}
                        </span>
                      </div>

                      {/* Info chips */}
                      <div className="flex flex-wrap gap-2 text-[10.5px] items-center">
                        {targetClient.weddingDate && (
                          <span className="inline-flex items-center gap-1.5 bg-gradient-to-br from-amber-50 to-[#FBF9F6] border border-amber-200/60 px-3 py-1.5 rounded-xl text-amber-800 font-bold shadow-sm">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" /> 
                            {(() => {
                              try {
                                const d = new Date(targetClient.weddingDate);
                                if (isNaN(d.getTime())) return targetClient.weddingDate;
                                return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                              } catch { return targetClient.weddingDate; }
                            })()}
                          </span>
                        )}
                        {targetClient.country && (
                          <span className="inline-flex items-center gap-1.5 bg-gradient-to-br from-emerald-50 to-[#FBF9F6] border border-emerald-200/60 px-3 py-1.5 rounded-xl text-emerald-800 font-bold shadow-sm">
                            <Globe className="w-3.5 h-3.5 text-emerald-600" /> 
                            {targetClient.country === 'France' ? '🇫🇷 France' : targetClient.country === 'Cameroun' ? '🇨🇲 Cameroun' : targetClient.country}
                          </span>
                        )}
                        {targetClient.deadline && (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold shadow-sm ${
                            (() => {
                              try {
                                const d = new Date(targetClient.deadline);
                                const today = new Date(); today.setHours(0,0,0,0);
                                const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
                                if (diff < 0) return 'bg-red-50 border border-red-200 text-red-700';
                                if (diff <= 3) return 'bg-amber-50 border border-amber-200 text-amber-700';
                                return 'bg-sky-50 border border-sky-200 text-sky-700';
                              } catch { return 'bg-sky-50 border border-sky-200 text-sky-700'; }
                            })()
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {(() => {
                              try {
                                const d = new Date(targetClient.deadline);
                                if (isNaN(d.getTime())) return targetClient.deadline;
                                const formatted = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                                const today = new Date(); today.setHours(0,0,0,0);
                                const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
                                if (diff < 0) return `⚠️ Dépassé (${formatted})`;
                                if (diff === 0) return `⏰ Aujourd'hui !`;
                                return `${formatted} (${diff}j)`;
                              } catch { return targetClient.deadline; }
                            })()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toolbar actions — modern pill group */}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleCopyAccessLink(targetClient.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all duration-300 shadow-sm ${
                          copiedClientId === targetClient.id
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-white border border-brand-sand/80 text-brand-olive hover:bg-brand-cream hover:border-brand-gold hover:shadow-md'
                        }`}>
                        {copiedClientId === targetClient.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-brand-gold" />}
                        {copiedClientId === targetClient.id ? 'Copié !' : 'Lien'}
                      </button>

                      <button type="button" onClick={() => setCoverSelectClientId(targetClient.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-white border border-brand-sand/80 text-brand-olive hover:bg-brand-cream hover:border-brand-gold hover:shadow-md cursor-pointer transition-all duration-300 shadow-sm">
                        <Camera className="w-3.5 h-3.5 text-brand-gold" /> Couverture
                      </button>

                      <button type="button" onClick={() => handleToggleLockClient(targetClient.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all duration-300 shadow-sm ${
                          targetClient.isLocked 
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:shadow-md' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:shadow-md'
                        }`}>
                        {targetClient.isLocked ? <><Unlock className="w-3.5 h-3.5" /> Dégeler</> : <><Lock className="w-3.5 h-3.5" /> Figer</>}
                      </button>

                      <button type="button" onClick={() => {
                        setEditingClient(targetClient);
                        setEditClientName(targetClient.name);
                        setEditClientQuota(targetClient.targetCount.toString());
                        setEditClientWeddingDate(targetClient.weddingDate || '');
                        setEditClientDeadline(targetClient.deadline || '');
                        setEditClientCountry(targetClient.country || 'France');
                        setEditClientNotes(targetClient.notes || '');
                        const quotas: Record<string, string> = {};
                        Object.keys(currentCategoryLabels).forEach(cat => {
                          let val = 0;
                          if (targetClient.targetCategoryQuotas && targetClient.targetCategoryQuotas[cat] !== undefined) {
                            val = targetClient.targetCategoryQuotas[cat];
                          } else if (cat === 'Dot') {
                            val = targetClient.targetCountDot || 0;
                          } else if (cat === 'Globale') {
                            val = targetClient.targetCountGlobale || 0;
                          } else if (cat === 'Album') {
                            val = targetClient.targetCountAlbum || 0;
                          }
                          quotas[cat] = val.toString();
                        });
                        setEditCategoryQuotas(quotas);
                      }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-white border border-brand-sand/80 text-brand-olive hover:bg-brand-cream hover:border-brand-gold hover:shadow-md cursor-pointer transition-all duration-300 shadow-sm">
                        <Edit2 className="w-3.5 h-3.5 text-brand-gold" /> Éditer
                      </button>

                      <button type="button" onClick={() => onSwitchToClient(targetClient.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-brand-olive to-brand-moss text-brand-cream hover:shadow-lg hover:brightness-110 cursor-pointer transition-all duration-300 shadow-sm border border-brand-olive/50">
                        <Eye className="w-3.5 h-3.5 text-brand-gold" /> Espace Client
                      </button>

                      <button onClick={() => setConfirmDeleteProjectId(targetClient.id)}
                        className="inline-flex items-center px-2.5 py-2 rounded-xl text-brand-sage hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                        aria-label="Supprimer ce couple">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats row — live metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-brand-olive/5 to-brand-cream border border-brand-sand/60 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] font-extrabold uppercase text-brand-sage tracking-wider block mb-1">Sélection</span>
                      <span className="text-xl font-serif-display font-black text-brand-olive tabular-nums">{targetClient.selectedPhotoIds.length}<span className="text-sm text-brand-sage font-normal">/{targetClient.targetCount}</span></span>
                    </div>
                    <div className="bg-gradient-to-br from-brand-gold/5 to-brand-cream border border-brand-sand/60 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] font-extrabold uppercase text-brand-sage tracking-wider block mb-1">Photos chargées</span>
                      <span className="text-xl font-serif-display font-black text-brand-olive tabular-nums">{clientPhotos.length}</span>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-brand-cream border border-brand-sand/60 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] font-extrabold uppercase text-brand-sage tracking-wider block mb-1">Dossiers</span>
                      <span className="text-xl font-serif-display font-black text-brand-olive tabular-nums">{Object.keys(currentCategoryLabels).length}</span>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-brand-cream border border-brand-sand/60 rounded-xl p-3.5 text-center">
                      <span className="text-[9px] font-extrabold uppercase text-brand-sage tracking-wider block mb-1">Progression</span>
                      <span className="text-xl font-serif-display font-black text-brand-olive tabular-nums">{progressVal}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============== SUB-NAV ============== */}
              <div className="flex bg-white border border-brand-sand/60 rounded-2xl p-1.5 gap-1.5 sticky top-2 z-20 shadow-md backdrop-blur-sm">
                {[
                  { key: 'overview' as const, label: 'Aperçu', Icon: Sparkles, color: '#C2A679' },
                  { key: 'photos' as const, label: 'Galerie', Icon: ImageIcon, color: '#525E43', badge: clientPhotos.length },
                  { key: 'feedback' as const, label: 'Retouches', Icon: MessageSquare, color: '#964724', badge: targetClient.selectedPhotoIds.length }
                ].map(t => {
                  const isActive = projectInnertab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setProjectInnertab(t.key)}
                      className={`flex-1 py-2.5 px-4 text-center text-[10.5px] font-extrabold tracking-wider uppercase rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer relative ${
                        isActive 
                          ? 'text-white shadow-lg' 
                          : 'text-brand-sage hover:text-brand-olive hover:bg-brand-cream'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="couple-detail-tab"
                          className="absolute inset-0 bg-gradient-to-r from-brand-olive to-brand-moss rounded-xl shadow-md"
                          transition={{ type: "spring", damping: 22, stiffness: 240 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <t.Icon className="w-4 h-4" style={{ color: isActive ? undefined : t.color }} />
                        {t.label}
                        {t.badge !== undefined && (
                          <span className={`text-[9px] tabular-nums px-1.5 py-0.5 rounded-full font-mono ${
                            isActive ? 'bg-white/20 text-brand-cream' : 'bg-brand-sand/60 text-brand-sage'
                          }`}>{t.badge}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* RENDER THE SELECTED ONGLÉT */}
              {projectInnertab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* PROGRESS + CONSIGNES */}
                  <div className="bg-white rounded-2xl p-6 space-y-5 shadow-md border border-white/60 text-left">
                    <div className="flex items-center gap-2 pb-3 border-b border-brand-sand/40">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 flex items-center justify-center">
                        <Check className="w-4 h-4 text-brand-gold" />
                      </div>
                      <h4 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest font-serif-display">Suivi de l'Avancement</h4>
                    </div>

                    <div className="flex items-center gap-6 bg-gradient-to-br from-brand-cream/60 to-white p-5 border border-brand-sand/50 rounded-2xl">
                      {/* Animated progress ring */}
                      <div className="relative shrink-0 w-24 h-24">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                          <circle cx="48" cy="48" r="38" fill="none" stroke="var(--brand-sand, #EBE6DC)" strokeWidth="8" />
                          <circle cx="48" cy="48" r="38" fill="none" 
                            stroke={clientStatus === 'Clôturé' ? '#10b981' : progressVal === 100 ? 'var(--brand-gold, #C2A679)' : 'var(--brand-olive, #525E43)'}
                            strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${progressVal * 2.387} 238.7`}
                            className="transition-all duration-700"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-serif-display font-black text-lg text-brand-olive">{progressVal}%</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <span className="text-[11px] text-brand-sage font-bold block">Sélection pour l'album</span>
                        <div className="text-2xl font-serif-display font-black text-brand-olive tabular-nums">
                          {targetClient.selectedPhotoIds.length} <span className="text-base text-brand-sage font-normal">/ {targetClient.targetCount}</span>
                        </div>
                        <div className="w-full bg-brand-sand/50 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${
                              clientStatus === 'Clôturé' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                              : progressVal === 100 ? 'bg-gradient-to-r from-amber-400 to-brand-gold' 
                              : 'bg-gradient-to-r from-brand-olive to-brand-moss'
                            }`}
                            style={{ width: `${progressVal}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-brand-cream/80 to-white rounded-2xl border border-brand-sand/50 space-y-2.5">
                      <label className="flex items-center gap-1.5 text-[10px] text-brand-olive font-black uppercase tracking-wider">
                        <Edit2 className="w-3.5 h-3.5 text-brand-gold" /> Consignes du couple
                      </label>
                      <textarea
                        value={targetClient.notes || ''}
                        onChange={(e) => handleUpdateClientQuotas(targetClient.id, { notes: e.target.value })}
                        placeholder="Ex: privilégier les images sous le soleil, retouches d'exposition..."
                        rows={3}
                        className="w-full bg-white border border-brand-sand rounded-xl p-3 text-xs text-brand-olive focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all select-text resize-none placeholder:text-brand-sand"
                      />
                      <p className="text-[8.5px] text-brand-sage/70 italic">Modification instantanée — pas besoin de sauvegarder.</p>
                    </div>
                  </div>

                  {/* QUOTAS + FORMULE */}
                  <div className="bg-white rounded-2xl p-6 space-y-5 shadow-md border border-white/60 text-left">
                    <div className="flex items-center gap-2 pb-3 border-b border-brand-sand/40">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-olive/20 to-brand-olive/5 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-brand-olive" />
                      </div>
                      <h4 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest font-serif-display">Formule & Quotas</h4>
                    </div>

                    <div className="bg-brand-cream border border-brand-sand/70 rounded-xl p-3.5 space-y-3">
                      <div>
                        <label className="block text-[9px] text-[#8c672b] font-black uppercase mb-1">
                          📋 Formule Photo / Vidéo Sélectionnée :
                        </label>
                        <select
                          value={targetClient.formula || ''}
                          onChange={(e) => {
                            const formulaId = e.target.value;
                            const formulaObj = FORMULAS.find(f => f.id === formulaId);
                            if (formulaObj) {
                              const originalQuotas = targetClient.targetCategoryQuotas || {};
                              handleUpdateClientQuotas(targetClient.id, {
                                formula: formulaId,
                                targetCount: formulaObj.quotas.total,
                                targetCountDot: formulaObj.quotas.Dot,
                                targetCountGlobale: formulaObj.quotas.Globale,
                                targetCountAlbum: formulaObj.quotas.Album,
                                targetCategoryQuotas: {
                                  ...originalQuotas,
                                  Dot: formulaObj.quotas.Dot,
                                  Globale: formulaObj.quotas.Globale,
                                  Album: formulaObj.quotas.Album,
                                  Agrandissement: formulaObj.quotas.Agrandissement
                                }
                              });
                              toast.success(`Formule "${formulaObj.name}" appliquée`, "Quotas mis à jour.");
                            } else {
                              handleUpdateClientQuotas(targetClient.id, { formula: '' });
                            }
                          }}
                          className="w-full bg-white border border-[#EBE6DC] rounded-lg px-3 py-1.5 text-xs text-brand-olive font-extrabold focus:outline-none focus:border-brand-gold cursor-pointer"
                        >
                          <option value="">-- Aucune formule (personnalisé) --</option>
                          {FORMULA_GROUPS.map(g => (
                            <optgroup key={g.group} label={g.group}>
                              {g.formulas.map(f => (
                                <option key={f.id} value={f.id}>
                                  {f.name} ({f.price}) - {f.description}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] text-[#8c672b] font-black uppercase mb-1 flex justify-between">
                          <span>🎯 TOTAL CLICHÉS FAVORIS REQUIS :</span>
                          <span className="font-mono">{targetClient.targetCount} photos</span>
                        </label>
                        <input 
                          type="number" 
                          min="1"
                          value={targetClient.targetCount}
                          onChange={(e) => handleUpdateClientQuotas(targetClient.id, { targetCount: parseInt(e.target.value, 10) || 1 })}
                          className="w-full bg-white border border-[#EBE6DC] rounded-lg px-3 py-1.5 text-xs text-brand-olive font-extrabold focus:outline-none focus:border-brand-gold font-mono"
                        />
                      </div>

                      <div className="border-t border-brand-sand/30 pt-3">
                        <span className="block text-[8px] font-black uppercase text-brand-sage tracking-widest mb-2">QUOTAS PAR CATÉGORIE :</span>
                        <div className="grid grid-cols-2 gap-2">
                          {CORE_QUOTA_KEYS.map((catKey) => {
                            // Label affiché : depuis les labels du client, avec normalisation Globale→Classique
                            const rawLabel = currentCategoryLabels[catKey] || catKey;
                            const catLabel = rawLabel === 'Globale' ? 'Classique' : rawLabel;
                            const rawQuota = targetClient.targetCategoryQuotas?.[catKey] !== undefined
                              ? targetClient.targetCategoryQuotas[catKey]
                              : (catKey === 'Dot' ? targetClient.targetCountDot : (catKey === 'Globale' ? targetClient.targetCountGlobale : (catKey === 'Album' ? targetClient.targetCountAlbum : 0))) || 0;
                            const isDisabled = rawQuota === -1;
                            const targetVal = isDisabled ? 0 : rawQuota;

                            const uploadedCount = photos.filter(p => p.clientId === targetClient.id && p.category === catKey).length;

                            return (
                              <div key={catKey} className={`p-2 border rounded-lg flex items-center gap-2 transition-all ${
                                isDisabled
                                  ? 'bg-brand-sand/40 border-brand-sand opacity-65'
                                  : 'bg-white border-brand-sand/40'
                              }`}>
                                <div className="flex-1 flex flex-col min-w-0">
                                  <span className={`text-[9.5px] font-extrabold uppercase truncate flex items-center gap-1 ${isDisabled ? 'text-brand-sand' : 'text-brand-sage'}`} title={catLabel}>
                                    {catLabel}
                                    {isDisabled && <span className="text-[7px] bg-brand-moss text-brand-cream px-1 py-0.5 rounded font-black tracking-wider">DÉSACTIVÉE</span>}
                                  </span>
                                  <span className="text-[7.5px] text-brand-gold font-bold">({uploadedCount} {uploadedCount > 1 ? 'photos chargées' : 'photo chargée'})</span>
                                </div>
                                <input 
                                  type="number"
                                  min="0"
                                  disabled={isDisabled}
                                  placeholder={isDisabled ? '∞' : '—'}
                                  value={isDisabled ? '' : targetVal}
                                  onChange={(e) => {
                                    const newVal = parseInt(e.target.value, 10) || 0;
                                    const originalQuotas = targetClient.targetCategoryQuotas || {};
                                    const additionalUpdates: Partial<ClientAccount> = {};
                                    if (catKey === 'Dot') additionalUpdates.targetCountDot = newVal;
                                    if (catKey === 'Globale') additionalUpdates.targetCountGlobale = newVal;
                                    if (catKey === 'Album') additionalUpdates.targetCountAlbum = newVal;

                                    handleUpdateClientQuotas(targetClient.id, {
                                      ...additionalUpdates,
                                      targetCategoryQuotas: {
                                        ...originalQuotas,
                                        [catKey]: newVal
                                      }
                                    });
                                  }}
                                  className={`w-14 border rounded px-1.5 py-0.5 text-[10px] font-extrabold text-center font-mono focus:outline-none focus:border-brand-gold ${
                                    isDisabled
                                      ? 'bg-brand-sand border-brand-sand text-brand-sand/65 cursor-not-allowed'
                                      : 'bg-brand-cream border-brand-sand text-brand-olive'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const originalQuotas = targetClient.targetCategoryQuotas || {};
                                    const newVal = isDisabled ? 0 : -1;
                                    const additionalUpdates: Partial<ClientAccount> = {};
                                    if (catKey === 'Dot') additionalUpdates.targetCountDot = isDisabled ? 0 : (targetClient.targetCountDot || 0);
                                    if (catKey === 'Globale') additionalUpdates.targetCountGlobale = isDisabled ? 0 : (targetClient.targetCountGlobale || 0);
                                    if (catKey === 'Album') additionalUpdates.targetCountAlbum = isDisabled ? 0 : (targetClient.targetCountAlbum || 0);

                                    handleUpdateClientQuotas(targetClient.id, {
                                      ...additionalUpdates,
                                      targetCategoryQuotas: {
                                        ...originalQuotas,
                                        [catKey]: newVal
                                      }
                                    });
                                  }}
                                  title={isDisabled ? 'Réactiver cette catégorie' : 'Désactiver cette catégorie (les photos chargées seront conservées mais ignorées dans les quotas)'}
                                  className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                    isDisabled
                                      ? 'bg-brand-sand border-brand-sand text-brand-moss hover:bg-brand-olive hover:text-brand-cream hover:border-brand-olive'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500'
                                  }`}
                                >
                                  {isDisabled ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[8px] text-brand-sage/80 italic mt-1.5 leading-tight">
                          💡 Cliquez sur 👁/🚫 pour désactiver une catégorie. Une fois désactivée, elle reste archivée avec ses photos mais n'est plus comptée dans la sélection du couple.
                        </p>
                      </div>
                    </div>

                    {/* GESTION DES RE-RENOMMAGES DES SÉRIES POUR CE PROJET */}
                    <div className="p-3.5 bg-[#FAF8F5] border border-brand-sand/70 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-black uppercase text-brand-olive tracking-wider block">📂 Dossiers et Collections de Sélection :</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProjectCategoriesClientId(targetClient.id);
                            setProjectCategoriesLabels({ ...currentCategoryLabels });
                            setNewProjectCategoryKey('');
                            setNewProjectCategoryLabel('');
                            setProjectCategorySuccess(false);
                            setConfirmDeleteKey(null);
                          }}
                          className="bg-brand-cream hover:bg-brand-sand border border-brand-sand text-[8.5px] text-brand-olive font-black px-2.5 py-1 rounded-md uppercase tracking-wide cursor-pointer flex items-center gap-1 transition-all"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-brand-gold" /> Gérer les dossiers du couple
                        </button>
                      </div>
                      <p className="text-[9px] text-brand-sage leading-tight">
                        Vous pouvez cliquez sur "Gérer les dossiers" pour renommer, ajouter ou retirer des étapes de vote de mariage pour ce couple (ex: Cérémonie civile, Cocktail, Soirée, etc).
                      </p>
                    </div>

                  </div>

                  {/* DYNAMIC ACTIVITY & STATISTICS DASHBOARD */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-brand-olive/[0.03] to-white border border-brand-sand/70 rounded-2xl p-6 space-y-6 shadow-md text-left animate-fade-in-up">
                    <div className="flex items-center justify-between pb-3 border-b border-brand-sand/40">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-olive/20 to-brand-olive/5 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-brand-olive" />
                        </div>
                        <h4 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest font-serif-display">Rapport d'Activité et Statistiques</h4>
                      </div>
                      <span className="text-[8.5px] font-extrabold bg-brand-gold/15 text-brand-gold uppercase tracking-wider px-2 py-0.5 rounded">Temps Réel</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* STAT 1: Global swiped progress */}
                      <div className="bg-white border border-brand-sand/60 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                        <span className="text-[9px] font-black text-brand-sage uppercase tracking-wider">Avancement du Tri</span>
                        <div className="my-2 flex items-baseline gap-1.5">
                          <span className="text-2xl font-serif-display font-black text-brand-olive tabular-nums">
                            {((targetClient.selectedPhotoIds?.length || 0) + (targetClient.dislikedPhotoIds?.length || 0))}
                          </span>
                          <span className="text-xs text-brand-sage">/ {clientPhotos.length} photos</span>
                        </div>
                        <div className="space-y-1">
                          <div className="w-full bg-brand-sand/45 h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-olive rounded-full transition-all duration-700" 
                              style={{ width: `${clientPhotos.length > 0 ? Math.min(100, Math.round((((targetClient.selectedPhotoIds?.length || 0) + (targetClient.dislikedPhotoIds?.length || 0)) / clientPhotos.length) * 100)) : 0}%` }}
                            />
                          </div>
                          <span className="text-[8.5px] font-bold text-brand-sage uppercase">
                            {clientPhotos.length > 0 ? Math.round((((targetClient.selectedPhotoIds?.length || 0) + (targetClient.dislikedPhotoIds?.length || 0)) / clientPhotos.length) * 100) : 0}% des clichés swipés
                          </span>
                        </div>
                      </div>

                      {/* STAT 2: Estimation temps restant */}
                      <div className="bg-white border border-brand-sand/60 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                        <span className="text-[9px] font-black text-brand-sage uppercase tracking-wider">Temps Restant Estimé</span>
                        <div className="my-2">
                          {(() => {
                            const swiped = (targetClient.selectedPhotoIds?.length || 0) + (targetClient.dislikedPhotoIds?.length || 0);
                            const remaining = Math.max(0, clientPhotos.length - swiped);
                            const seconds = remaining * 1.5;
                            const formatted = seconds <= 0 
                              ? 'Tri Complété ✅' 
                              : (seconds < 60 ? `~${Math.round(seconds)}s` : `~${Math.round(seconds / 60)} min`);

                            return (
                              <>
                                <span className="text-xl font-serif-display font-black text-[#bc5e33] tracking-tight">{formatted}</span>
                                <p className="text-[8.5px] text-brand-sage mt-1 font-medium leading-tight">Calculé sur une moyenne de 1.5s par action (Swipe/Vote).</p>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* STAT 3: Tendance des votes */}
                      <div className="bg-white border border-brand-sand/60 rounded-xl p-4 flex flex-col justify-between shadow-2xs">
                        <span className="text-[9px] font-black text-brand-sage uppercase tracking-wider">Taux d'Appréciation</span>
                        <div className="my-2">
                          {(() => {
                            const likes = targetClient.selectedPhotoIds?.length || 0;
                            const dislikes = targetClient.dislikedPhotoIds?.length || 0;
                            const totalVotes = likes + dislikes;
                            const pctLiked = totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : 0;

                            return (
                              <>
                                <span className="text-2xl font-serif-display font-black text-emerald-700 tabular-nums">{pctLiked}%</span>
                                <span className="text-xs text-brand-sage ml-1 font-semibold">de Oui</span>
                                <div className="flex gap-2.5 text-[8.5px] font-bold text-brand-sage uppercase mt-2">
                                  <span className="text-emerald-700">👍 {likes} Likes</span>
                                  <span className="text-rose-600">👎 {dislikes} Dislikes</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                    </div>

                    {/* Catégories favorites breakdown */}
                    <div className="bg-white border border-brand-sand/60 rounded-xl p-4.5 space-y-3">
                      <span className="text-[9.5px] font-black text-brand-olive uppercase tracking-wider block">📂 Catégories Favorites (par ordre d'appréciation) :</span>
                      {(() => {
                        const categoryLikes: Record<string, number> = {};
                        targetClient.selectedPhotoIds.forEach(id => {
                          const photo = photos.find(p => p.id === id);
                          if (photo && photo.category) {
                            categoryLikes[photo.category] = (categoryLikes[photo.category] || 0) + 1;
                          }
                        });
                        const favoriteCategories = Object.entries(categoryLikes)
                          .map(([catKey, count]) => ({
                            key: catKey,
                            label: currentCategoryLabels[catKey] || catKey,
                            count
                          }))
                          .sort((a, b) => b.count - a.count);

                        if (favoriteCategories.length === 0) {
                          return (
                            <p className="text-[10px] text-brand-sage italic">Aucune photo sélectionnée dans les favoris pour le moment.</p>
                          );
                        }

                        return (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {favoriteCategories.map((item, index) => {
                              const rankColors = [
                                'bg-[#FAF6F0] border-brand-gold text-brand-gold',
                                'bg-[#F5F8F6] border-emerald-300 text-emerald-800',
                                'bg-[#EEF5F8] border-blue-200 text-blue-800',
                                'bg-[#FAF8F5] border-brand-sand text-brand-sage'
                              ];
                              const colorStyle = rankColors[Math.min(index, rankColors.length - 1)];

                              return (
                                <div key={item.key} className={`border rounded-lg p-2.5 flex flex-col justify-between ${colorStyle}`}>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[8.5px] font-black uppercase tracking-wider font-mono">#{index + 1} Favori</span>
                                    <span className="text-[11px] font-serif-display font-black">{item.count} ❤️</span>
                                  </div>
                                  <span className="text-[10px] font-extrabold truncate text-brand-olive" title={item.label}>
                                    {item.label === 'Globale' ? 'Classique' : item.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                </div>
              )}

              {projectInnertab === 'photos' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* UPLOADER */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white border border-brand-sand rounded-xl p-4 shadow-sm text-left space-y-4">
                      <h4 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest flex items-center gap-1 font-serif-display border-b border-brand-sand/40 pb-2">
                        <Upload className="w-4 h-4 text-brand-gold animate-bounce" /> Importer des Clichés (Photos)
                      </h4>
                      
                      {/* Destination Folder Selector */}
                      {(() => {
                        const resolvedUploadCategory = Object.keys(currentCategoryLabels).includes(projectUploadCategory) 
                          ? projectUploadCategory 
                          : (Object.keys(currentCategoryLabels)[0] || 'Dot');

                        return (
                          <>
                            <div className="bg-brand-cream/40 p-3 rounded-lg border border-brand-sand/75 space-y-1.5 text-left">
                              <label className="text-[9px] text-brand-sage font-black uppercase tracking-wider block">Dossier cible :</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                {Object.entries(currentCategoryLabels).map(([tabKey, tabLabel]) => (
                                  <button
                                    type="button"
                                    key={tabKey}
                                    onClick={() => {
                                      setProjectUploadCategory(tabKey as CategoryTab);
                                    }}
                                    className={`py-1.5 rounded text-[9.5px] font-black border uppercase transition-transform active:scale-95 cursor-pointer ${
                                      resolvedUploadCategory === tabKey 
                                        ? 'bg-brand-olive text-brand-cream border-brand-olive shadow-2xs font-semibold' 
                                        : 'bg-white text-brand-sage border-brand-sand hover:text-brand-olive'
                                    }`}
                                  >
                                    {tabLabel}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Drag Area */}
                            <div 
                              onDragOver={(e) => { e.preventDefault(); setProjectDragActive(true); }}
                              onDragLeave={() => setProjectDragActive(false)}
                              onDrop={async (e) => {
                                e.preventDefault();
                                setProjectDragActive(false);
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                  await handleMultipleFiles(e.dataTransfer.files, targetClient.id, resolvedUploadCategory);
                                }
                              }}
                              onClick={() => projectFileInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                                projectDragActive 
                                  ? 'border-brand-gold bg-brand-sand/30' 
                                  : 'border-brand-sand bg-brand-cream/30 hover:bg-brand-cream/50'
                              }`}
                            >
                              <input 
                                ref={projectFileInputRef}
                                type="file" 
                                accept="image/*"
                                multiple
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    await handleMultipleFiles(e.target.files, targetClient.id, resolvedUploadCategory);
                                  }
                                }}
                                className="hidden" 
                              />

                              {isUploading ? (
                                <div className="py-2 flex flex-col items-center gap-1">
                                  <RefreshCw className="w-5 h-5 text-brand-gold animate-spin" />
                                  <p className="text-[10px] font-black text-brand-olive">Envoi en cours...</p>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <FileImage className="w-6 h-6 text-brand-gold mx-auto animate-pulse" />
                                  <p className="text-[10px] font-black text-brand-olive font-serif-display leading-tight">Glissez ou cliquez pour charger dans <span className="font-extrabold text-brand-gold">"{currentCategoryLabels[resolvedUploadCategory] || 'Album'}"</span></p>
                                </div>
                              )}
                            </div>

                            {/* Import Queue feedback */}
                            {bulkQueue.length > 0 && (
                              <div className="bg-brand-cream/40 border border-brand-sand rounded-xl p-3 space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar mt-3">
                                {bulkQueue.slice(0, 10).map(task => (
                                  <div key={task.id} className="text-left text-[9px] flex flex-col gap-1 bg-white p-2 rounded border border-brand-sand/40">
                                    <div className="flex justify-between items-center font-bold">
                                      <span className="truncate max-w-[120px] text-brand-olive">{task.name}</span>
                                      <span className={`${
                                        task.status === 'success' ? 'text-emerald-600' : task.status === 'error' ? 'text-red-500' : 'text-brand-gold'
                                      }`}>
                                        {task.status === 'success' ? 'Prêt' : task.status === 'error' ? 'Échec' : `${task.progress}%`}
                                      </span>
                                    </div>
                                    <div className="w-full bg-brand-sand h-1 rounded overflow-hidden font-sans">
                                      <div 
                                        className={`h-full transition-all duration-300 ${
                                          task.status === 'success' ? 'bg-emerald-500' : task.status === 'error' ? 'bg-red-500' : 'bg-brand-gold'
                                        }`}
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                    {task.status === 'error' && task.errorMsg && (
                                      <p className="text-[8px] text-red-500 font-sans mt-0.5 leading-normal bg-red-50 p-1.5 rounded border border-red-100 whitespace-pre-wrap">
                                        {task.errorMsg}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* GALLERY VIEWER */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="bg-white border border-brand-sand rounded-xl p-5 shadow-sm text-left">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-sand/40 pb-3 mb-3">
                        <span className="text-xs text-brand-olive font-extrabold uppercase tracking-widest flex items-center gap-1 font-serif-display">
                          <ImageIcon className="w-4 h-4 text-brand-gold" /> Galerie des clichés associés au mariés
                        </span>
                        <span className="bg-brand-cream border border-brand-sand text-brand-olive text-[9.5px] px-2 py-0.5 rounded font-mono font-bold">{clientPhotos.length} clichés au total</span>
                      </div>

                      {clientPhotos.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-brand-sand bg-brand-cream/10 rounded-2xl">
                          <ImageIcon className="w-8 h-8 text-brand-sand/80 mx-auto mb-2 animate-pulse" />
                          <p className="text-[10px] text-brand-sage italic">Aucune photo exclusivement rattachée à ce projet actuellement.</p>
                          <p className="text-[9.5px] text-brand-sage/75 font-medium">Veuillez utiliser le module de téléversement ci-contre pour importer la collection.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          
                          {/* Inner tab filter to filter the grid in space */}
                          <div className="flex gap-1 overflow-x-auto pb-1 border-b border-brand-sand/35 scrollbar-none">
                            {(['A_TOUS', ...Object.keys(currentCategoryLabels).filter(catKey => {
                              // Montrer uniquement les dossiers qui contiennent au moins 1 photo
                              return clientPhotos.some(p => p.category === catKey);
                            })] as const).map(tab => {
                              const tabPhotosCount = tab === 'A_TOUS' 
                                ? clientPhotos.length 
                                : clientPhotos.filter(p => p.category === tab).length;
                              
                              const label = tab === 'A_TOUS' ? 'Tous' : currentCategoryLabels[tab];
                              const isSelected = tab === 'A_TOUS' ? projectGalleryFilter === 'ALL' : projectGalleryFilter === tab;

                              const openCategoryEditor = () => {
                                setProjectCategoriesClientId(targetClient.id);
                                setProjectCategoriesLabels({ ...currentCategoryLabels });
                                setNewProjectCategoryKey('');
                                setNewProjectCategoryLabel('');
                                setProjectCategorySuccess(false);
                                setConfirmDeleteKey(null);
                              };

                              return (
                                <div key={tab} className="flex items-stretch shrink-0 relative group">
                                  <button
                                    type="button"
                                    onClick={() => setProjectGalleryFilter(tab === 'A_TOUS' ? 'ALL' : tab)}
                                    className={`px-3 py-1 rounded-l text-[9.5px] font-black uppercase text-nowrap select-none cursor-pointer border border-r-0 transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-brand-olive text-white border-brand-olive shadow-2xs font-bold font-sans'
                                        : 'bg-[#F9F7F3] text-brand-sage border-brand-sand hover:text-brand-olive hover:bg-brand-cream'
                                    }`}
                                  >
                                    {label} ({tabPhotosCount})
                                  </button>
                                  {tab !== 'A_TOUS' && (
                                    <button
                                      type="button"
                                      onClick={openCategoryEditor}
                                      title="Modifier / Renommer / Supprimer ce dossier"
                                      className={`px-1.5 py-1 rounded-r text-[9.5px] uppercase text-nowrap select-none cursor-pointer border border-l transition-all duration-200 flex items-center justify-center ${
                                        isSelected
                                          ? 'bg-brand-moss text-brand-cream border-brand-olive hover:bg-amber-600 hover:text-white'
                                          : 'bg-brand-cream/60 text-brand-sand border-brand-sand hover:bg-brand-gold hover:text-white hover:border-brand-gold'
                                      }`}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            
                            {/* Quick-add chip button */}
                            <button
                              type="button"
                              onClick={() => {
                                setProjectCategoriesClientId(targetClient.id);
                                setProjectCategoriesLabels({ ...currentCategoryLabels });
                                setNewProjectCategoryKey('');
                                setNewProjectCategoryLabel('');
                                setProjectCategorySuccess(false);
                                setConfirmDeleteKey(null);
                              }}
                              title="Ajouter / modifier les dossiers du couple"
                              className="px-2.5 py-1 rounded text-[9.5px] font-black uppercase text-nowrap select-none cursor-pointer border border-dashed border-brand-gold bg-brand-cream/40 text-brand-olive hover:bg-brand-gold hover:text-brand-cream hover:border-brand-gold transition-all flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Ajouter
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {clientPhotos
                              .filter(p => projectGalleryFilter === 'ALL' || p.category === projectGalleryFilter)
                              .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                              .map(photo => (
                                <div 
                                  key={photo.id}
                                  className="group relative aspect-[3/4] p-1 rounded-lg bg-white shadow-3xs border border-brand-sand flex flex-col justify-end overflow-hidden"
                                >
                                  <img 
                                    src={photo.image} 
                                    alt={photo.name} 
                                    referrerPolicy="no-referrer"
                                    className="absolute inset-0 w-full h-full object-cover rounded-md group-hover:scale-105 duration-300 transition-all cursor-zoom-in"
                                    onClick={() => setPreviewPhoto(photo)}
                                  />
                                  
                                  {/* Hover overlay uploader panel */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 duration-200">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewPhoto(photo)}
                                      className="w-7.5 h-7.5 rounded-full bg-brand-olive text-white flex items-center justify-center shadow-md hover:bg-brand-moss active:scale-90 transition-all cursor-pointer"
                                      title="Prévisualiser la photo"
                                    >
                                      <ZoomIn className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                    onClick={() => setConfirmDeletePhotoId(photo.id)}
                                      className="w-7.5 h-7.5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
                                      title="Supprimer la photo de l'album"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="absolute inset-x-0 bottom-0 bg-black/75 text-[7.5px] px-1.5 py-1 truncate text-center text-white rounded-b-md">
                                    {photo.name}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {projectInnertab === 'feedback' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left animate-fade-in">
                  
                  {/* RETOUCHES & COMMENTAIRES DU COUPLE */}
                  <div className="md:col-span-12 space-y-4">
                    <div className="bg-white border border-brand-sand rounded-xl p-5 shadow-sm space-y-4 text-left">
                      <h4 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest flex items-center gap-1 font-serif-display border-b border-brand-sand/40 pb-2">
                        <MessageSquare className="w-4 h-4 text-[#bc5e33]" /> Retouches, Rognages &amp; Commentaires demandés par le couple ({targetClient.photoComments ? Object.keys(targetClient.photoComments).length : 0})
                      </h4>

                      {!targetClient.photoComments || Object.keys(targetClient.photoComments).length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-brand-sand bg-brand-cream/10 rounded-2xl">
                          <MessageSquare className="w-8 h-8 text-brand-sand/80 mx-auto mb-2" />
                          <p className="text-[10px] text-brand-sage italic">Aucun commentaire de retouche ou consigne spécifique n'a encore été déposé par le couple.</p>
                          <p className="text-[9.5px] text-brand-sage/75">Lorsque le couple commente ses photos favorites, sa parole apparaît instantanément ici.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3">
                          {Object.entries(targetClient.photoComments).map(([phId, phCommText]) => {
                            const relatedPhoto = photos.find(p => p.id === phId);
                            if (typeof phCommText !== 'string' || !phCommText.trim()) return null;
                            return (
                              <div key={phId} className="flex gap-3 bg-brand-cream/40 p-3 rounded-2xl border border-brand-sand/60 items-start hover:bg-brand-cream/65 duration-200">
                                {relatedPhoto && (
                                  <img 
                                    src={relatedPhoto.image} 
                                    alt={relatedPhoto.name}
                                    referrerPolicy="no-referrer"
                                    className="w-14 h-18 object-cover rounded-md border border-brand-sand shrink-0 shadow-xs cursor-zoom-in hover:opacity-85 transition-opacity duration-200" 
                                    onClick={() => setPreviewPhoto(relatedPhoto)}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10.5px] font-black text-brand-olive truncate flex items-center justify-between">
                                    <span>{relatedPhoto ? relatedPhoto.name : `Cliché anonyme [${phId}]`}</span>
                                    <span className="font-mono text-[8px] uppercase text-[#a47b38] bg-brand-cream border border-brand-sand px-1.5 py-0.5 rounded-md font-bold">
                                      {relatedPhoto && currentCategoryLabels[relatedPhoto.category]}
                                    </span>
                                  </p>
                                  <div className="bg-white/85 border border-[#ECE6DC] rounded-xl p-2 mt-1.5 text-[10.5px] text-brand-sage font-serif-display italic leading-snug shadow-7xs">
                                    "{phCommText}"
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PROJET CLICHÉS CHOISIS / FAVORIS */}
                  <div className="md:col-span-12 space-y-4">
                    <div className="bg-white border border-brand-sand rounded-xl p-5 shadow-sm space-y-4 text-left">
                      <h4 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest flex items-center gap-1 font-serif-display border-b border-brand-sand/40 pb-2">
                        <Check className="w-4 h-4 text-emerald-600 animate-pulse" /> Photos Favorisées par le couple ({targetClient.selectedPhotoIds.length})
                      </h4>

                      {targetClient.selectedPhotoIds.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-brand-sand bg-brand-cream/10 rounded-2xl shadow-inner">
                          <p className="text-[10px] text-brand-sage italic">Aucun cliché n'a été favorisé pour le moment.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {targetClient.selectedPhotoIds.map(phId => {
                            const relatedPhoto = photos.find(p => p.id === phId);
                            if (!relatedPhoto) return null;
                            return (
                              <div 
                                key={phId}
                                className="group relative aspect-[3/4] p-1 rounded-lg bg-white shadow-3xs border border-brand-sand/70 flex flex-col justify-end overflow-hidden"
                              >
                                <img 
                                  src={relatedPhoto.image} 
                                  alt={relatedPhoto.name} 
                                  referrerPolicy="no-referrer"
                                  className="absolute inset-0 w-full h-full object-cover rounded-md cursor-zoom-in group-hover:scale-105 duration-300 transition-all"
                                  onClick={() => setPreviewPhoto(relatedPhoto)}
                                />
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                  ✓
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-black/75 text-[7.5px] px-1 py-0.5 truncate text-center text-white rounded-b-md">
                                  {relatedPhoto.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          );
        })()}

          {/* ---------- COUPLES LIST ---------- */}
          {activeSection === 'clients' && !enteredClientId && (
          <div className="space-y-6 text-left">
            
            {/* Dynamic Dashboard metrics panel */}
            {(() => {
              // Proactive alerts: couples near deadline
              const upcomingDeadlines = clients
                .filter(c => !c.isLocked && c.deadline)
                .map(c => {
                  const d = new Date(c.deadline);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  return { client: c, days: diffDays };
                })
                .filter(x => x.days <= 7)
                .sort((a, b) => a.days - b.days);

              return (
                <>
                  {/* Proactive alerts banner */}
                  {upcomingDeadlines.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-800 shadow-sm"
                    >
                      <Bell className="w-4 h-4 shrink-0 text-amber-600 mt-0.5 animate-pulse" />
                      <div className="text-[10.5px] flex-1 leading-relaxed">
                        <strong className="font-extrabold uppercase tracking-wide">{upcomingDeadlines.length} couple{upcomingDeadlines.length > 1 ? "s" : ""}</strong> à relancer avant la date limite :{" "}
                        {upcomingDeadlines.slice(0, 3).map((u, i) => (
                          <span key={u.client.id}>
                            <button
                              type="button"
                              onClick={() => openCouple(u.client.id)}
                              className="underline font-extrabold hover:text-amber-900 cursor-pointer"
                            >
                              {u.client.name}
                            </button>
                            {u.days < 0 ? ` (dépassée de ${Math.abs(u.days)}j)` : u.days === 0 ? " (aujourd'hui)" : ` (${u.days}j)`}
                            {i < Math.min(2, upcomingDeadlines.length - 1) ? ", " : ""}
                          </span>
                        ))}
                        {upcomingDeadlines.length > 3 && " et plus..."}
                      </div>
                    </motion.div>
                  )}

                  {/* Recent activity feed */}
                  {recentActivity.length > 0 && (
                    <div className="bg-[var(--bg-panel)] border border-brand-sand/60 rounded-xl p-3 space-y-1.5 shadow-3xs">
                      <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-widest font-extrabold text-brand-sage">
                        <Sparkles className="w-3 h-3 text-brand-gold" /> Activité récente
                      </div>
                      {recentActivity.slice(0, 5).map((a, i) => {
                        const c = clients.find(x => x.id === a.clientId);
                        if (!c) return null;
                        return (
                          <div key={i} className="flex items-center gap-2 text-[10px] text-brand-olive">
                            <span className="w-1 h-1 rounded-full bg-brand-gold shrink-0" />
                            <span className="font-extrabold">{c.name}</span>
                            <span className="text-brand-sage">— {a.action}</span>
                            <span className="ml-auto text-[8.5px] text-brand-sage/70">
                              {new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Desktop View: Grid Layout */}
                  <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">

                    {/* KPI Card 1: Couple Access Controls */}
                    <motion.div
                      whileHover={{ y: -2, boxShadow: "0 8px 24px -8px rgba(82,94,67,0.18)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-[var(--bg-panel)] border border-brand-sand/70 rounded-2xl p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-extrabold uppercase text-brand-sage tracking-wider block">Accès Couples</span>
                          <h4 className="text-2xl font-serif-display font-black text-brand-olive leading-tight tabular-nums">{animatedCouples}</h4>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-brand-cream flex items-center justify-center text-brand-gold">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2.5 h-6 -mx-1">
                        <Sparkline data={historySnapshot.map(h => h.couples)} color="#525E43" height={24} />
                      </div>
                      <div className="mt-1 pt-2 border-t border-brand-sand/50 flex items-center justify-between text-[10px] text-brand-sage uppercase font-bold tracking-wider tabular-nums">
                        <span className="text-emerald-700">{animatedClosed} Validés</span>
                        <span className="text-blue-600">{animatedActive} En cours</span>
                      </div>
                    </motion.div>

                    {/* KPI Card 2: Interactive Photo Gallery Status */}
                    <motion.div
                      whileHover={{ y: -2, boxShadow: "0 8px 24px -8px rgba(82,94,67,0.18)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-[var(--bg-panel)] border border-brand-sand/70 rounded-2xl p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-extrabold uppercase text-brand-sage tracking-wider block">Galerie Globale</span>
                          <h4 className="text-2xl font-serif-display font-black text-brand-olive leading-tight tabular-nums">{animatedPhotos}</h4>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[#EEF5F8] flex items-center justify-center text-brand-olive">
                          <ImageIcon className="w-4 h-4 text-brand-sage" />
                        </div>
                      </div>
                      <div className="mt-2.5 h-6 -mx-1">
                        <Sparkline data={historySnapshot.map(h => h.photos)} color="#C2A679" height={24} />
                      </div>
                      <div className="mt-1 pt-2 border-t border-brand-sand/50 flex items-center justify-between text-[10px] text-brand-sage font-bold tracking-wider uppercase font-mono">
                        <span className="text-brand-gold">{animatedCloud} Cloud</span>
                        <span className={localBase64Warning ? 'text-amber-600 font-extrabold' : 'text-brand-sage'}>{localBase64PhotosCount} Base64</span>
                      </div>
                    </motion.div>

                    {/* KPI Card 3: Messaging Activities inbox */}
                    <motion.div
                      whileHover={{ y: -2, boxShadow: "0 8px 24px -8px rgba(82,94,67,0.18)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-[var(--bg-panel)] border border-brand-sand/70 rounded-2xl p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-extrabold uppercase text-brand-sage tracking-wider block">Atelier Messagerie</span>
                          <h4 className="text-2xl font-serif-display font-black text-brand-olive leading-tight tabular-nums">{animatedConvos} Fiches</h4>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-[#FDF1EB] flex items-center justify-center text-[#964724]">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-2.5 h-6 -mx-1">
                        <Sparkline data={historySnapshot.map(h => h.messages)} color="#964724" height={24} />
                      </div>
                      <div className="mt-1 pt-2 border-t border-brand-sand/50 text-[10px] text-brand-sage font-bold uppercase tracking-wider">
                        📨 <span className="tabular-nums">{animatedMsgs}</span> avis &amp; consignes de retouche
                      </div>
                    </motion.div>

                    {/* KPI Card 4: Server Config & Storage Health Analyzer */}
                    <motion.div
                      whileHover={{ y: -2, boxShadow: "0 8px 24px -8px rgba(82,94,67,0.18)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-[var(--bg-panel)] border border-brand-sand/70 rounded-2xl p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[9.5px] font-extrabold uppercase text-brand-sage tracking-wider block">État Liaison Cloud</span>
                          <h4 className="text-xs font-serif-display font-bold uppercase text-brand-olive leading-tight pt-1">
                            {cloudinary.cloudName && cloudinary.uploadPreset ? 'Cloudinary Connecté' : 'Accès Offline Local'}
                          </h4>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-brand-cream/80 flex items-center justify-center text-brand-gold">
                          <Globe className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3 py-1 bg-[#FAF8F5]/85 border border-brand-sand/80 rounded-lg px-2 text-[8.5px] text-brand-sage leading-tight">
                        {localBase64Warning
                          ? "⚠️ Images Base64 en local : nous vous conseillons de connecter un compte Cloudinary pour de meilleures performances de chargement."
                          : "✓ Toutes les photos sont optimisées et servies depuis votre CDN Cloudinary."
                        }
                      </div>
                    </motion.div>

                  </div>

                  {/* Mobile View: Dynamic Carousel Slider with Elegant Indicators */}
                  <div className="block sm:hidden space-y-3 animate-fade-in-up">
                    <div className="relative overflow-hidden bg-brand-cream/15 border border-brand-sand p-2 rounded-2xl">
                      <div 
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${activeKpiIndex * 100}%)` }}
                      >
                        {/* Slide 1 */}
                        <div className="w-full shrink-0 px-1 select-none">
                          <div className="bg-white border border-brand-sand/70 rounded-xl p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[145px]">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <span className="text-[9.5px] font-extrabold uppercase text-brand-sage tracking-wider block">Accès Couples</span>
                                <h4 className="text-2xl font-serif-display font-black text-brand-olive leading-tight">{totalCouplesCount}</h4>
                              </div>
                              <div className="w-8 h-8 rounded-xl bg-brand-cream flex items-center justify-center text-brand-gold">
                                <Users className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="mt-3.5 pt-2 border-t border-brand-sand/50 flex items-center justify-between text-[10px] text-brand-sage uppercase font-bold tracking-wider">
                              <span className="text-emerald-700">{closedCouplesCount} Validés</span>
                              <span className="text-blue-600">{activeCouplesCount} En cours</span>
                            </div>
                          </div>
                        </div>

                        {/* Slide 2 */}
                        <div className="w-full shrink-0 px-1 select-none">
                          <div className="bg-white border border-brand-sand/70 rounded-xl p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[145px]">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <span className="text-[9.5px] font-extrabold uppercase text-brand-sage tracking-wider block">Galerie Globale</span>
                                <h4 className="text-2xl font-serif-display font-black text-brand-olive leading-tight">{totalPhotosCount}</h4>
                              </div>
                              <div className="w-8 h-8 rounded-xl bg-[#EEF5F8] flex items-center justify-center text-brand-olive">
                                <ImageIcon className="w-4 h-4 text-brand-sage" />
                              </div>
                            </div>
                            <div className="mt-3.5 pt-2 border-t border-brand-sand/50 flex items-center justify-between text-[10px] text-brand-sage font-bold tracking-wider uppercase font-mono">
                              <span className="text-brand-gold">{cloudPhotosCount} Clichés</span>
                              <span className={localBase64Warning ? 'text-amber-600 font-extrabold' : 'text-brand-sage'}>{localBase64PhotosCount} Base64</span>
                            </div>
                          </div>
                        </div>

                        {/* Slide 3 */}
                        <div className="w-full shrink-0 px-1 select-none">
                          <div className="bg-white border border-brand-sand/70 rounded-xl p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[145px]">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <span className="text-[9.5px] font-extrabold uppercase text-brand-sage tracking-wider block">Atelier Messagerie</span>
                                <h4 className="text-2xl font-serif-display font-black text-brand-olive leading-tight">{totalConversationsCount} Fiches</h4>
                              </div>
                              <div className="w-8 h-8 rounded-xl bg-[#FDF1EB] flex items-center justify-center text-[#964724]">
                                <MessageSquare className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="mt-3.5 pt-2 border-t border-brand-sand/50 text-[10px] text-brand-sage font-bold uppercase tracking-wider">
                              📨 {totalMessagesReceivedCount} avis reçus
                            </div>
                          </div>
                        </div>

                        {/* Slide 4 */}
                        <div className="w-full shrink-0 px-1 select-none">
                          <div className="bg-white border border-brand-sand/70 rounded-xl p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[145px]">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <span className="text-[9.5px] font-extrabold uppercase text-brand-sage tracking-wider block">État Liaison Cloud</span>
                                <h4 className="text-xs font-serif-display font-bold uppercase text-brand-olive leading-tight pt-1">
                                  {cloudinary.cloudName && cloudinary.uploadPreset ? 'CloudName Configuré' : 'Accès Hors ligne'}
                                </h4>
                              </div>
                              <div className="w-8 h-8 rounded-xl bg-brand-cream/80 flex items-center justify-center text-brand-gold">
                                <Globe className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="mt-3.5 py-1 bg-[#FAF8F5]/85 border border-brand-sand/65 rounded-lg px-2 text-[8px] text-brand-sage leading-tight">
                              {localBase64Warning 
                                ? "⚠️ Base64 en local : connectez Cloudinary."
                                : "✓ Clichés optimisés et servis par CDN."
                              }
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Manual Arrows Controls */}
                      <button 
                        type="button"
                        onClick={() => setActiveKpiIndex(prev => (prev > 0 ? prev - 1 : 3))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-brand-sand/80 shadow flex items-center justify-center text-brand-olive cursor-pointer z-10"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        type="button"
                        onClick={() => setActiveKpiIndex(prev => (prev < 3 ? prev + 1 : 0))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-brand-sand/80 shadow flex items-center justify-center text-brand-olive cursor-pointer z-10"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Navigation dot tabs */}
                    <div className="flex justify-center items-center gap-1">
                      {["Accès", "Photos", "Messages", "Cloud"].map((lbl, idx) => {
                        const isActive = activeKpiIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveKpiIndex(idx)}
                            className={`px-2.5 py-1 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider transition-all duration-350 ${isActive ? 'bg-brand-gold text-white shadow-3xs scale-105' : 'bg-[#FAF8F5] border border-brand-sand text-brand-sage hover:text-brand-olive'}`}
                          >
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Title Header with collapsible creator action link */}
            <div className="bg-white border border-brand-sand rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
              <div className="text-left space-y-0.5">
                <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-brand-gold">Serrurerie de l'Atelier</span>
                <p className="text-xs font-serif-display text-brand-olive font-medium">Configurez les codes d'accès mariés, leurs dates de noces et leurs quotas de sélection respectifs.</p>
              </div>
              <div className="flex items-center gap-2">
                <SortDropdown
                  value={density}
                  onChange={setDensity}
                  options={[
                    { value: "compact", label: "Compact" },
                    { value: "normal", label: "Normal" },
                    { value: "comfortable", label: "Confortable" }
                  ]}
                  label="Densité"
                />
                <button
                  type="button"
                  onClick={() => setIsCreateFormExpanded(!isCreateFormExpanded)}
                  className="inline-flex items-center justify-center gap-1.5 bg-brand-olive hover:bg-brand-moss text-brand-cream text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer shadow-sm transition-all hover:scale-[1.025] duration-200"
                >
                  {isCreateFormExpanded ? (
                    <>
                      <X className="w-3.5 h-3.5 text-brand-gold" />
                      Fermer
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
                      Nouveau couple
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick search + tag filter for couple list */}
            {filteredClients.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-panel)] border border-brand-sand/60 rounded-xl p-2.5">
                <div className="flex-1 min-w-[200px]">
                  <SearchBar value={clientQuickSearch} onChange={setClientQuickSearch} placeholder="Filtrer les couples (nom, pays, date...)" shortcut="F" />
                </div>
                {/* All unique tags from local state */}
                {Array.from(new Set(Object.values(clientTags).flat())).slice(0, 8).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setClientTagFilter(clientTagFilter === tag ? null : tag)}
                    className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors cursor-pointer flex items-center gap-1 ${
                      clientTagFilter === tag
                        ? "bg-brand-olive text-brand-cream border-brand-olive"
                        : "bg-brand-cream text-brand-sage border-brand-sand hover:text-brand-olive"
                    }`}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </button>
                ))}
                {clientTagFilter && (
                  <button
                    type="button"
                    onClick={() => setClientTagFilter(null)}
                    className="text-[9px] text-brand-sage hover:text-brand-olive font-bold uppercase cursor-pointer"
                  >
                    <X className="w-3 h-3 inline" /> Effacer filtre
                  </button>
                )}
              </div>
            )}

            {/* Formulaire Rétractable */}
            {isCreateFormExpanded && (
              <form onSubmit={handleCreateClient} className="bg-white border border-brand-sand rounded-xl p-4 space-y-4 shadow-sm animate-fade-in-up">
                <h3 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest flex items-center gap-1 font-serif-display">
                  <Plus className="w-4 h-4 text-brand-gold" /> Créer un accès couple
                </h3>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[10px] text-brand-sage font-bold uppercase mb-1">Cibles / Noms des Mariés</label>
                    <input 
                      type="text" 
                      placeholder="Sophie & Marc"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full bg-brand-cream border border-brand-sand rounded-lg px-3 py-2 text-xs text-brand-olive focus:outline-none focus:border-brand-sage"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-brand-sage font-bold uppercase mb-1">Formule Photo / Vidéo</label>
                    <select
                      value={newClientFormula}
                      onChange={(e) => {
                        const formulaId = e.target.value;
                        setNewClientFormula(formulaId);
                        const formulaObj = FORMULAS.find(f => f.id === formulaId);
                        if (formulaObj) {
                          setNewClientQuota(formulaObj.quotas.total.toString());
                          const quotas: Record<string, string> = {};
                          CORE_QUOTA_KEYS.forEach(cat => {
                            const val = formulaObj.quotas[cat as 'Dot' | 'Globale' | 'Album' | 'Agrandissement'];
                            if (val !== undefined) {
                              quotas[cat] = val.toString();
                            }
                          });
                          setNewClientCategoryQuotas(quotas);
                        }
                      }}
                      className="w-full bg-brand-cream border border-brand-sand rounded-lg px-3 py-2 text-xs text-brand-olive focus:outline-none focus:border-brand-sage cursor-pointer"
                    >
                      <option value="">-- Aucune formule (personnalisé) --</option>
                      {FORMULA_GROUPS.map(g => (
                        <optgroup key={g.group} label={g.group}>
                          {g.formulas.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.price}) - {f.description}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-brand-sage font-bold uppercase mb-1">Nombre de clichés favorites requis</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="1"
                        value={newClientQuota}
                        onChange={(e) => setNewClientQuota(e.target.value)}
                        className="w-20 bg-brand-cream border border-brand-sand rounded-lg px-3 py-2 text-xs text-brand-olive"
                      />
                      <span className="text-brand-sage text-[10px] leading-tight">Le couple devra valider ce nombre exact de photos.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FBF9F6] border border-brand-sand/50 rounded-xl p-3">
                    <div>
                      <label className="block text-[9.5px] text-brand-sage font-black uppercase mb-1 flex items-center gap-1">
                        <span>📅 Date du Mariage</span>
                      </label>
                      <input 
                        type="date" 
                        value={newClientWeddingDate}
                        onChange={(e) => setNewClientWeddingDate(e.target.value)}
                        className="w-full bg-white border border-brand-sand rounded-lg px-2.5 py-1.5 text-xs text-brand-olive focus:outline-none focus:border-brand-sage font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] text-[#bc5e33] font-black uppercase mb-1 flex items-center gap-1">
                        <span>⏰ Limite de tri</span>
                      </label>
                      <input 
                        type="date" 
                        value={newClientDeadline}
                        onChange={(e) => setNewClientDeadline(e.target.value)}
                        className="w-full bg-white border border-brand-sand rounded-lg px-2.5 py-1.5 text-xs text-[#bc5e33] border-[#bc5e33]/30 focus:outline-none focus:border-[#bc5e33] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] text-brand-sage font-black uppercase mb-1 flex items-center gap-1">
                        <span>🌍 Pays de l'événement</span>
                        <Tooltip content="Tapez ou sélectionnez un pays">
                          <HelpCircle className="w-2.5 h-2.5 text-brand-sage/60 cursor-help" />
                        </Tooltip>
                      </label>
                      <input
                        type="text"
                        list="country-list"
                        value={newClientCountry}
                        onChange={(e) => setNewClientCountry(e.target.value)}
                        placeholder="Tapez un pays..."
                        className="w-full bg-white border border-brand-sand rounded-lg px-2.5 py-1.5 text-xs text-brand-olive focus:outline-none focus:border-brand-sage font-medium"
                      />
                      <datalist id="country-list">
                        {["France 🇫🇷", "Cameroun 🇨🇲", "Afrique du Sud 🇿🇦", "Belgique 🇧🇪", "Canada 🇨🇦", "Suisse 🇨🇭", "Luxembourg 🇱🇺", "Maroc 🇲🇦", "Tunisie 🇹🇳", "Côte d'Ivoire 🇨🇮", "Sénégal 🇸🇳", "Madagascar 🇲🇬", "Congo 🇨🇬", "RDC 🇨🇩"].map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                  </div>

                  <div className="bg-brand-cream/40 border border-brand-sand/55 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-brand-olive tracking-wider block">🎯 Quotas par catégorie (Optionnel) :</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubTab('settings');
                          setTimeout(() => {
                            const el = document.getElementById('categories-config-form');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="text-[9px] text-[#a47b38] font-extrabold hover:underline flex items-center gap-1 cursor-pointer hover:text-brand-olive"
                      >
                        ➕/❌ Ajouter ou supprimer des categories/dossiers
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(categoryLabels).map(([catKey, catLabel]) => (
                        <div key={catKey}>
                          <label className="block text-[8.5px] text-brand-sage font-black uppercase mb-1 truncate" title={catLabel}>{catLabel}</label>
                          <input 
                            type="number" 
                            min="0"
                            value={newClientCategoryQuotas[catKey] || '0'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewClientCategoryQuotas(prev => ({
                                ...prev,
                                [catKey]: val
                              }));
                            }}
                            placeholder="0"
                            className="w-full bg-white border border-brand-sand rounded-lg px-2.5 py-1.5 text-xs text-brand-olive font-mono"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[8.5px] text-brand-sage leading-normal">
                      Laisser à <strong>0</strong> pour ne pas imposer de quota de sélection pour cette catégorie.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] text-brand-sage font-bold uppercase mb-1">Consignes (Optionnel)</label>
                    <textarea 
                      placeholder="Ex: privilégier les images sous le soleil..."
                      rows={2}
                      value={newClientNotes}
                      onChange={(e) => setNewClientNotes(e.target.value)}
                      className="w-full bg-brand-cream border border-brand-sand rounded-lg p-2.5 text-xs text-brand-olive focus:outline-none focus:border-brand-sage"
                    />
                  </div>

                  {clientError && (
                    <div className="flex items-center gap-1.5 text-red-500 text-xs py-1 px-2 rounded bg-red-50 border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{clientError}</span>
                    </div>
                  )}

                  {clientSuccess && (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs py-1 px-2 rounded bg-emerald-50 border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>{clientSuccess}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-brand-olive hover:bg-brand-moss text-brand-cream font-bold text-xs py-2 rounded-lg duration-300 shadow cursor-pointer uppercase tracking-wider lg:py-2.5"
                  >
                    Ajouter le couple
                  </button>
                </div>
              </form>
            )}

            {/* List with Status Filters */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xs text-brand-sage font-bold uppercase tracking-widest px-1">Comptes Couples Actifs</h3>
                
                {/* Segmented Filter Picker */}
                <div className="inline-flex rounded-lg bg-brand-sand/30 p-0.5 border border-brand-sand overflow-x-auto shrink-0 scrollbar-none">
                  {(['Tous', 'En cours', 'Quota Atteint', 'Clôturé'] as const).map(fName => (
                    <button
                      key={fName}
                      type="button"
                      onClick={() => setStatusFilter(fName)}
                      className={`px-3 py-1 text-[9px] rounded-md font-extrabold uppercase tracking-wide cursor-pointer text-nowrap transition-all ${
                        statusFilter === fName 
                          ? 'bg-brand-olive text-brand-cream shadow-xs' 
                          : 'text-brand-sage hover:text-brand-olive'
                      }`}
                    >
                      {fName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Elegant Interactive Search Bar */}
              <div className="bg-white border border-brand-sand rounded-xl p-3 shadow-xs space-y-2">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-brand-gold absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom d'époux, date, année (ex: 2026), pays (ex: Cameroun, France)..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="w-full bg-brand-cream/40 border border-[#EBE6DC] rounded-lg pl-9 pr-8 py-2 text-xs text-brand-olive placeholder-brand-sage/75 focus:outline-none focus:border-brand-gold font-medium"
                  />
                  {clientSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setClientSearchQuery('')}
                      className="absolute right-3 text-brand-sage hover:text-brand-gold font-bold text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {/* Quick Filters Shortlinks */}
                <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-brand-sage pt-0.5">
                  <span className="font-semibold uppercase tracking-wider text-[8px] text-brand-gold">Suggestion :</span>
                  <button
                    type="button"
                    onClick={() => setClientSearchQuery('France')}
                    className="bg-[#F6F3ED] hover:bg-brand-sand/40 border border-brand-sand/80 px-2 py-0.5 rounded-full transition-colors font-semibold cursor-pointer"
                  >
                    🇫🇷 France
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientSearchQuery('Cameroun')}
                    className="bg-[#F6F3ED] hover:bg-brand-sand/40 border border-brand-sand/80 px-2 py-0.5 rounded-full transition-colors font-semibold cursor-pointer"
                  >
                    🇨🇲 Cameroun
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientSearchQuery('2026')}
                    className="bg-[#F6F3ED] hover:bg-brand-sand/40 border border-brand-sand/80 px-2 py-0.5 rounded-full transition-colors font-semibold cursor-pointer"
                  >
                    📅 Année 2026
                  </button>
                </div>
              </div>

              {filteredClients.length === 0 ? (
                <div className="bg-white border border-brand-sand rounded-xl p-2">
                  <EmptyStateIllustration
                    type="couples"
                    message={clientQuickSearch ? `Aucun couple ne correspond à "${clientQuickSearch}".` : `Aucun couple avec le statut "${statusFilter}".`}
                  />
                </div>
              ) : (
                <div className={`space-y-${density === "compact" ? "2" : density === "comfortable" ? "5" : "4"}`}>
                  {filteredClients.map(client => {
                    const progressVal = client.targetCount > 0
                      ? Math.min(100, Math.round((client.selectedPhotoIds.length / client.targetCount) * 100))
                      : 0;

                    const clientStatus = getCoupleStatus(client);

                    // Identify cover photo preview
                    const coverPhoto = photos.find(p => p.id === client.coverPhotoId) || photos[0];

                    return (
                      <motion.div
                        key={client.id}
                        layout
                        whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(82,94,67,0.18)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 22 }}
                        className="bg-white border border-brand-sand rounded-xl p-4 space-y-4 shadow-sm relative overflow-hidden"
                      >
                        {/* Elegant status band accent */}
                        <div className={`absolute top-0 inset-x-0 h-1 ${
                          clientStatus === 'Clôturé' ? 'bg-emerald-500' : clientStatus === 'Quota Atteint' ? 'bg-brand-gold' : 'bg-blue-400'
                        }`} />

                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 pt-1">
                          
                          {/* Left Details column */}
                          <div className="space-y-1.5 flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  openCouple(client.id);
                                }}
                                className="font-serif-display font-black text-[17px] text-brand-olive hover:text-brand-gold tracking-tight leading-tight text-left cursor-pointer duration-200 hover:underline"
                                title="Gérer ce projet dans l'espace détaillé"
                              >
                                {client.name} ↗
                              </button>

                              {/* Status badges with precise guidelines branding */}
                              {clientStatus === 'Clôturé' ? (
                                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[8.5px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1 animate-pulse">
                                  <Lock className="w-2.5 h-2.5 text-emerald-600" /> Sélection Validée
                                </span>
                              ) : clientStatus === 'Quota Atteint' ? (
                                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[8.5px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1">
                                  <Bookmark className="w-2.5 h-2.5 text-amber-600" /> Quota Atteint
                                </span>
                              ) : (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[8.5px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1 animate-pulse">
                                  <RefreshCw className="w-2.5 h-2.5 opacity-70 animate-spin" /> En cours
                                </span>
                              )}
                            </div>

                             <div className="flex flex-wrap gap-2 items-center text-[10px] text-brand-sage uppercase font-semibold tracking-wider pt-0.5">
                               <span>ID Unique : <code className="bg-brand-cream border border-brand-sand px-1.5 py-0.5 rounded text-brand-olive font-mono text-[9px]">{client.id}</code></span>
                               {client.weddingDate && (
                                 <span className="flex items-center gap-1 bg-[#FBF9F6] border border-[#ECE6DC] px-2 py-0.5 rounded-md text-[#84632a] font-bold normal-case">
                                   <Calendar className="w-3 h-3 text-[#A08149]" /> Le {(() => {
                                     try {
                                       const d = new Date(client.weddingDate);
                                       if (isNaN(d.getTime())) return client.weddingDate;
                                       return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
                                     } catch {
                                       return client.weddingDate;
                                     }
                                   })()}
                                 </span>
                               )}
                               {client.country && (
                                 <span className="flex items-center gap-1 bg-[#FBF9F6] border border-[#ECE6DC] px-2 py-0.5 rounded-md text-[#425446] font-bold">
                                   <Globe className="w-3 h-3 text-brand-olive" /> {client.country === 'France' ? 'France 🇫🇷' : client.country === 'Cameroun' ? 'Cameroun 🇨🇲' : client.country}
                                 </span>
                               )}
                               {client.deadline && (
                                 <span className="flex items-center gap-1 bg-[#FDF1EB] border border-[#FAF1EC] px-2 py-0.5 rounded-md text-[#964724] font-bold animate-pulse">
                                   <Clock className="w-3 h-3 text-[#bc5e33]" /> Limite : {(() => {
                                     try {
                                       const d = new Date(client.deadline);
                                       if (isNaN(d.getTime())) return client.deadline;
                                       return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                                     } catch {
                                       return client.deadline;
                                     }
                                   })()}
                                 </span>
                               )}
                             </div>

                            {/* Custom Cover Photo thumbnail visual display */}
                            {client.coverPhotoId && coverPhoto && (
                              <div className="inline-flex items-center gap-1 bg-brand-cream/60 border border-brand-sand rounded px-1.5 py-0.5 text-[9px] text-brand-olive font-serif-display font-medium">
                                <span className="text-brand-gold font-bold">★ Cover :</span>
                                <span className="truncate max-w-[120px]">{coverPhoto.name}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Right Action buttons column */}
                          <div className="flex items-center gap-1 md:self-start shrink-0">
                            
                            {/* Access Link Copier Generator with clipboard feedback */}
                            <button
                              type="button"
                              onClick={() => handleCopyAccessLink(client.id)}
                              className="p-1.5 bg-brand-cream hover:bg-brand-sand border border-brand-sand text-brand-olive rounded-lg duration-200 cursor-pointer flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider"
                              title="Copier le lien de connexion directe pour le couple"
                            >
                              {copiedClientId === client.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-brand-gold" />
                                  <span>Partager Lien</span>
                                </>
                              )}
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClient(client);
                                setEditClientName(client.name);
                                setEditClientQuota(client.targetCount.toString());
                                setEditClientWeddingDate(client.weddingDate || '');
                                setEditClientDeadline(client.deadline || '');
                                setEditClientCountry(client.country || 'France');
                                setEditClientNotes(client.notes || '');
                                // categories quotas
                                const quotas: Record<string, string> = {};
                                Object.keys(client.categoryLabels || categoryLabels).forEach(cat => {
                                  let val = 0;
                                  if (client.targetCategoryQuotas && client.targetCategoryQuotas[cat] !== undefined) {
                                    val = client.targetCategoryQuotas[cat];
                                  } else if (cat === 'Dot') {
                                    val = client.targetCountDot || 0;
                                  } else if (cat === 'Globale') {
                                    val = client.targetCountGlobale || 0;
                                  } else if (cat === 'Album') {
                                    val = client.targetCountAlbum || 0;
                                  }
                                  quotas[cat] = val.toString();
                                });
                                setEditCategoryQuotas(quotas);
                              }}
                              className="p-1.5 bg-brand-cream hover:bg-brand-sand border border-brand-sand text-brand-olive rounded-lg duration-200 cursor-pointer flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider hover:scale-[1.02] transition-transform"
                              title="Modifier ou renommer le projet"
                            >
                              <Settings className="w-3.5 h-3.5 text-brand-gold" />
                              <span>Éditer</span>
                            </button>

                            {/* Cover selector button */}
                            <button
                              type="button"
                              onClick={() => setCoverSelectClientId(client.id)}
                              className="p-1.5 bg-brand-cream hover:bg-brand-sand border border-brand-sand text-brand-olive rounded-lg duration-200 cursor-pointer flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider"
                              title="Définir la photo de couverture dediee"
                            >
                              <Camera className="w-3.5 h-3.5 text-brand-sage" />
                              <span>Couverture</span>
                            </button>

                            {/* Lock/Unlock Switcher action */}
                            <button
                              type="button"
                              onClick={() => handleToggleLockClient(client.id)}
                              className={`p-1.5 border rounded-lg duration-200 cursor-pointer flex items-center gap-1 font-bold text-[9px] uppercase tracking-wider ${
                                client.isLocked 
                                  ? 'bg-red-50 text-red-650 border-red-200 hover:bg-red-100' 
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title={client.isLocked ? "Déverrouiller le tri" : "Figer la sélection (Bloquer modifications)"}
                            >
                              {client.isLocked ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Dégeler</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Figer le Tri</span>
                                </>
                              )}
                            </button>

                            {/* Delete Button with state confirmation */}
                            {confirmDeleteClientId === client.id ? (
                              <div className="flex items-center gap-1 bg-red-50 border border-red-200 p-1 rounded-lg animate-fade-in">
                                <span className="text-[8px] font-black text-red-650 uppercase px-1">Supprimer ?</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmDeleteProjectId(client.id);
                                    setConfirmDeleteClientId(null);
                                  }}
                                  className="bg-red-500 text-white font-bold text-[8.5px] px-2 py-1 rounded hover:bg-red-600 cursor-pointer active:scale-95 transition-all"
                                >
                                  Oui
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteClientId(null)}
                                  className="bg-brand-cream border border-brand-sand text-brand-olive font-bold text-[8.5px] px-2 py-1 rounded hover:bg-brand-sand cursor-pointer active:scale-95 transition-all"
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteProjectId(client.id)}
                                className="p-1.5 text-brand-sage hover:text-red-500 rounded-lg hover:bg-red-50 transition-all cursor-pointer border border-transparent"
                                title="Supprimer compte couple"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2.5 pt-2 border-t border-dashed border-brand-sand">
                          {(() => {
                            const clientPhotosCount = photos.filter(p => p.clientId === client.id).length;
                            const swipedCount = (client.selectedPhotoIds?.length || 0) + (client.dislikedPhotoIds?.length || 0);
                            const swipeProgress = clientPhotosCount > 0
                              ? Math.min(100, Math.round((swipedCount / clientPhotosCount) * 100))
                              : 0;
                            const remainingCount = Math.max(0, clientPhotosCount - swipedCount);
                            const estRemainingSec = remainingCount * 1.5;
                            const estRemainingFormatted = estRemainingSec <= 0 
                              ? 'Terminé' 
                              : (estRemainingSec < 60 ? `~${Math.round(estRemainingSec)}s` : `~${Math.round(estRemainingSec / 60)}m`);

                            return (
                              <>
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-brand-sage">Avancement du tri global ({swipedCount} / {clientPhotosCount} photos)</span>
                                  <span className="text-brand-olive font-extrabold text-xs">
                                    {swipeProgress}% {remainingCount > 0 && <span className="text-[8.5px] font-normal text-brand-sage/80 ml-1">(rest. {estRemainingFormatted})</span>}
                                  </span>
                                </div>
                                <div className="w-full bg-brand-sand/55 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="h-full rounded-full bg-brand-olive transition-all duration-500"
                                    style={{ width: `${swipeProgress}%` }}
                                  />
                                </div>

                                <div className="flex items-center justify-between text-[9.5px] font-bold pt-0.5">
                                  <span className="text-brand-sage">Quota Favoris choisi</span>
                                  <span className="text-brand-gold font-extrabold text-[11px]">
                                    {client.selectedPhotoIds.length} / {client.targetCount} clichés ({progressVal}%)
                                  </span>
                                </div>
                                <div className="w-full bg-brand-sand/35 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      clientStatus === 'Clôturé' ? 'bg-emerald-500' : progressVal >= 100 ? 'bg-emerald-600' : 'bg-brand-gold'
                                    }`}
                                    style={{ width: `${progressVal}%` }}
                                  />
                                </div>
                              </>
                            );
                          })()}

                          {/* Category breakdowns */}
                          <div className="flex flex-wrap gap-x-4 gap-y-2 bg-[#F6F3ED]/40 border border-[#E9E4DB] rounded-lg p-2.5 text-[9.5px] font-sans">
                            {Object.entries(client.categoryLabels || categoryLabels).map(([catKey, catLabel], idx) => {
                              const selectedCount = client.selectedPhotoIds.filter(id => {
                                const photoObj = photos.find(p => p.id === id);
                                return photoObj?.category === catKey;
                              }).length;

                              const rawTarget = client.targetCategoryQuotas?.[catKey] !== undefined
                                ? client.targetCategoryQuotas[catKey]
                                : (catKey === 'Dot' ? client.targetCountDot : (catKey === 'Globale' ? client.targetCountGlobale : (catKey === 'Album' ? client.targetCountAlbum : 0))) || 0;
                              const isDisabled = rawTarget === -1;
                              const targetVal = isDisabled ? 0 : rawTarget;

                              const uploadedCount = photos.filter(p => p.clientId === client.id && p.category === catKey).length;

                              return (
                                <div key={catKey} className={`flex flex-col min-w-[90px] ${idx > 0 ? 'border-sm border-l border-brand-sand/65 pl-2.5' : ''} ${isDisabled ? 'opacity-55' : ''}`}>
                                  <span className={`font-bold text-[10px] truncate flex items-center gap-1 ${isDisabled ? 'text-brand-sand line-through' : 'text-brand-olive'}`} title={catLabel}>
                                    {catLabel}: {isDisabled && <EyeOff className="w-2.5 h-2.5 text-brand-sand" />}
                                  </span>
                                  <div className="flex flex-col mt-0.5 space-y-0.5">
                                    <span className="text-[#a47b38] text-[8.5px] font-bold">
                                      Tri : <strong className="text-brand-olive font-extrabold">{selectedCount}</strong> / {isDisabled ? '∞' : targetVal}
                                    </span>
                                    <span className="text-brand-sage text-[8.5px] font-bold">
                                      Présentes : <strong className="text-brand-olive font-extrabold">{uploadedCount}</strong>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Quick Edit Targets Panel */}
                          <div className="bg-brand-cream border border-brand-sand/70 rounded-xl p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="text-[8.5px] font-black uppercase text-brand-gold tracking-widest leading-none">⚙️ PARAMÉTRER LES QUOTAS DE SÉLECTION :</div>
                              <button
                                type="button"
                                onClick={() => {
                                  setProjectCategoriesClientId(client.id);
                                  setProjectCategoriesLabels(client.categoryLabels || { ...categoryLabels });
                                  setNewProjectCategoryKey('');
                                  setNewProjectCategoryLabel('');
                                  setProjectCategorySuccess(false);
                                  setConfirmDeleteKey(null);
                                }}
                                className="text-[8.5px] text-[#2d4a3e] font-extrabold underline hover:text-[#a47b38] cursor-pointer flex items-center gap-0.5"
                              >
                                📂 Gérer les dossiers (Ajouter/Supprimer)
                              </button>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1">
                              <div>
                                <label className="block text-[7.5px] text-brand-sage font-bold uppercase mb-0.5 text-center">Total</label>
                                <input 
                                  type="number" 
                                  min="1"
                                  value={client.targetCount}
                                  onChange={(e) => handleUpdateClientQuotas(client.id, { targetCount: parseInt(e.target.value, 10) || 1 })}
                                  className="w-full bg-white border border-brand-sand rounded px-1 py-0.5 text-[10px] text-brand-olive font-extrabold text-center focus:outline-none focus:border-brand-gold font-mono"
                                />
                              </div>
                              {Object.entries(client.categoryLabels || categoryLabels).map(([catKey, catLabel]) => {
                                const rawVal = client.targetCategoryQuotas?.[catKey] !== undefined
                                  ? client.targetCategoryQuotas[catKey]
                                  : (catKey === 'Dot' ? client.targetCountDot : (catKey === 'Globale' ? client.targetCountGlobale : (catKey === 'Album' ? client.targetCountAlbum : 0))) || 0;
                                const isDisabled = rawVal === -1;
                                const targetVal = isDisabled ? 0 : rawVal;

                                return (
                                  <div key={catKey}>
                                    <label className={`block text-[7.5px] font-bold uppercase mb-0.5 text-center truncate flex items-center justify-center gap-0.5 ${isDisabled ? 'text-brand-sand line-through' : 'text-brand-sage'}`} title={catLabel + (isDisabled ? ' (désactivée)' : '')}>
                                      {catLabel}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const originalQuotas = client.targetCategoryQuotas || {};
                                          const newVal = isDisabled ? 0 : -1;
                                          handleUpdateClientQuotas(client.id, {
                                            targetCategoryQuotas: {
                                              ...originalQuotas,
                                              [catKey]: newVal
                                            }
                                          });
                                        }}
                                        title={isDisabled ? 'Réactiver' : 'Désactiver'}
                                        className={`ml-0.5 w-3.5 h-3.5 rounded flex items-center justify-center cursor-pointer transition-colors ${isDisabled ? 'text-brand-sand hover:text-brand-olive' : 'text-brand-gold hover:text-brand-moss'}`}
                                      >
                                        {isDisabled ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                                      </button>
                                    </label>
                                    <div className="relative">
                                      <input 
                                        type="number" 
                                        min="0"
                                        disabled={isDisabled}
                                        placeholder={isDisabled ? '∞' : '—'}
                                        value={isDisabled ? '' : targetVal}
                                        onChange={(e) => {
                                          const newVal = parseInt(e.target.value, 10) || 0;
                                          const originalQuotas = client.targetCategoryQuotas || {};
                                          // Update standard props too for safety
                                          const additionalUpdates: Partial<ClientAccount> = {};
                                          if (catKey === 'Dot') additionalUpdates.targetCountDot = newVal;
                                          if (catKey === 'Globale') additionalUpdates.targetCountGlobale = newVal;
                                          if (catKey === 'Album') additionalUpdates.targetCountAlbum = newVal;

                                          handleUpdateClientQuotas(client.id, {
                                            ...additionalUpdates,
                                            targetCategoryQuotas: {
                                              ...originalQuotas,
                                              [catKey]: newVal
                                            }
                                          });
                                        }}
                                        className={`w-full border rounded px-1 py-0.5 text-[10px] font-extrabold text-center font-mono focus:outline-none focus:border-brand-gold ${
                                          isDisabled
                                            ? 'bg-brand-sand/60 border-brand-sand text-brand-sand cursor-not-allowed'
                                            : 'bg-white border-brand-sand text-brand-olive'
                                        }`}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Photo Specific Comments section */}
                        {client.photoComments && Object.keys(client.photoComments).length > 0 && (
                          <div className="bg-brand-cream/80 rounded-xl p-3 border border-brand-sand shadow-7xs text-left space-y-2">
                            <span className="text-[9px] font-extrabold uppercase text-brand-gold tracking-widest block font-serif-display">💬 Commentaires &amp; Retouches demandés par le couple :</span>
                            <div className="space-y-2 divide-y divide-brand-sand/40">
                              {Object.entries(client.photoComments).map(([phId, phCommText]) => {
                                const relatedPhoto = photos.find(p => p.id === phId);
                                if (typeof phCommText !== 'string' || !phCommText.trim()) return null;
                                return (
                                  <div key={phId} className="flex gap-2.5 pt-2 first:pt-0 items-start">
                                    {relatedPhoto && (
                                      <img 
                                        src={relatedPhoto.image} 
                                        alt={relatedPhoto.name}
                                        referrerPolicy="no-referrer"
                                        className="w-10 h-12 object-cover rounded-sm border border-brand-sand shrink-0 shadow-3xs cursor-zoom-in hover:opacity-85 transition-opacity" 
                                        onClick={() => setPreviewPhoto(relatedPhoto)}
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-bold text-brand-olive truncate">
                                        {relatedPhoto ? relatedPhoto.name : `Cliché anonyme [${phId}]`}
                                      </p>
                                      <p className="text-[10px] text-brand-sage font-serif-display italic leading-tight mt-0.5 select-text">
                                        "{phCommText}"
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {client.notes && (
                          <div className="bg-brand-cream/40 rounded-lg p-2.5 text-[10px] text-brand-sage border border-brand-sand leading-relaxed italic text-left">
                            <strong>📌 Consignes initiales :</strong> {client.notes}
                          </div>
                        )}

                        <div className="pt-2 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => openCouple(client.id)}
                            className="w-full bg-brand-gold hover:bg-[#c99a41] text-brand-cream font-extrabold text-[10px] py-2.5 rounded-lg active:scale-98 duration-350 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm transition-all"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Ouvrir &amp; Gérer le projet (Détaillé &amp; Maniable)
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProjectUploadClientId(client.id);
                              setProjectUploadCategory('Dot');
                            }}
                            className="w-full bg-brand-olive hover:bg-brand-moss text-brand-cream font-extrabold text-[10px] py-2.5 rounded-lg active:scale-98 duration-300 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wide shadow-6xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
                            Charger des photos pour ce couple
                          </button>

                          <button
                            type="button"
                            onClick={() => onSwitchToClient(client.id)}
                            className="w-full bg-brand-cream hover:bg-brand-sand border border-brand-sand text-brand-olive font-extrabold text-[10px] py-2 rounded-lg active:scale-98 duration-300 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wide"
                          >
                            <Key className="w-3.5 h-3.5 text-brand-gold" />
                            Prendre la place du couple "{client.name}"
                          </button>

                          {/* Tags + Internal notes */}
                          <InternalNotesEditor
                            clientId={client.id}
                            tags={clientTags[client.id] || []}
                            note={internalNotes[client.id] || ""}
                            onTagsChange={(t) => setClientTags(prev => ({ ...prev, [client.id]: t }))}
                            onNoteChange={(n) => setInternalNotes(prev => ({ ...prev, [client.id]: n }))}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Cover Selector Modal dialog */}
            {coverSelectClientId && (
              <div className="fixed inset-0 bg-[#3a3325]/70 backdrop-blur-3xs z-50 flex items-center justify-center p-3 select-none">
                <div className="bg-white rounded-2xl w-full max-w-md border border-brand-sand max-h-[80vh] flex flex-col shadow-2xl p-4">
                  <div className="flex justify-between items-center pb-2 border-b border-brand-sand">
                    <h4 className="text-xs font-serif-display font-black text-brand-olive uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-brand-gold" /> Définir l'image de couverture
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => setCoverSelectClientId(null)} 
                      className="text-brand-sage hover:text-brand-olive text-xs font-bold font-mono"
                    >
                      Fermer X
                    </button>
                  </div>
                  <p className="text-[10px] text-brand-sage my-2 text-left">Sélectionnez le cliché phare de ce mariage pour illustrer l'espace d'accueil d'accueil du couple :</p>
                  
                  {(() => {
                    const clientPhotosForCover = photos.filter(p => p.clientId === coverSelectClientId);
                    
                    if (clientPhotosForCover.length === 0) {
                      return (
                        <div className="py-8 px-4 text-center bg-brand-cream/50 border border-dashed border-brand-sand rounded-xl space-y-2">
                          <ImageIcon className="w-8 h-8 text-brand-sand mx-auto" />
                          <p className="text-[10px] font-black text-brand-olive uppercase tracking-wide">Aucune photo pour ce couple</p>
                          <p className="text-[9px] text-brand-sage leading-normal">Veuillez d'abord importer des clichés dans l'onglet <strong>"Import & Galerie"</strong> pour ce projet avant de pouvoir définir une couverture.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[50vh] p-1 text-left no-scrollbar">
                        {clientPhotosForCover
                          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                          .map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSetCoverPhoto(coverSelectClientId, p.id)}
                            className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-brand-sand p-0.5 bg-brand-cream hover:border-brand-gold transition-all"
                          >
                            <img 
                              src={p.image} 
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded-sm group-hover:scale-105 duration-300"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[7.5px] py-1 px-1 truncate text-center uppercase">
                              {p.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Custom Edit Client Modal dialog */}
            {editingClient && (
              <div className="fixed inset-0 bg-[#3a3325]/70 backdrop-blur-3xs z-50 flex items-center justify-center p-3">
                <form 
                  onSubmit={handleUpdateClient} 
                  className="bg-white rounded-2xl w-full max-w-md border border-brand-sand max-h-[90vh] flex flex-col shadow-2xl p-5 text-left"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-brand-sand">
                    <h4 className="text-xs font-serif-display font-black text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4 text-brand-gold" /> Modifier le Projet : {editingClient.name}
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => setEditingClient(null)} 
                      className="text-brand-sage hover:text-brand-olive text-xs font-bold font-mono"
                    >
                      Fermer X
                    </button>
                  </div>
                  
                  <div className="overflow-y-auto p-1 text-left no-scrollbar space-y-3.5 my-3 flex-1">
                    <div>
                      <label className="block text-[10px] text-brand-sage font-bold uppercase mb-1">Désignation du Couple</label>
                      <input 
                        type="text" 
                        value={editClientName}
                        onChange={(e) => setEditClientName(e.target.value)}
                        className="w-full bg-brand-cream border border-brand-sand rounded-lg px-3 py-2 text-xs text-brand-olive focus:outline-none focus:border-brand-sage"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-brand-sage font-bold uppercase mb-1">Nombre de clichés favorites requis (Quota Global)</label>
                      <input 
                        type="number" 
                        min="1"
                        value={editClientQuota}
                        onChange={(e) => setEditClientQuota(e.target.value)}
                        className="w-full bg-brand-cream border border-brand-sand rounded-lg px-3 py-2 text-xs text-brand-olive"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FBF9F6] border border-brand-sand/50 rounded-xl p-3">
                      <div>
                        <label className="block text-[9.5px] text-brand-sage font-black uppercase mb-1">📅 Mariage</label>
                        <input 
                          type="date" 
                          value={editClientWeddingDate}
                          onChange={(e) => setEditClientWeddingDate(e.target.value)}
                          className="w-full bg-white border border-brand-sand rounded-lg px-px py-1.5 text-[11px] text-brand-olive focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] text-[#bc5e33] font-black uppercase mb-1">⏰ Limite tri</label>
                        <input 
                          type="date" 
                          value={editClientDeadline}
                          onChange={(e) => setEditClientDeadline(e.target.value)}
                          className="w-full bg-white border border-[#bc5e33]/30 rounded-lg px-px py-1.5 text-[11px] text-[#bc5e33] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] text-brand-sage font-black uppercase mb-1">🌍 Pays</label>
                        <select
                          value={editClientCountry}
                          onChange={(e) => setEditClientCountry(e.target.value)}
                          className="w-full bg-white border border-brand-sand rounded-lg px-px py-1.5 text-[11px] text-brand-olive focus:outline-none"
                        >
                          <option value="France">France 🇫🇷</option>
                          <option value="Cameroun">Cameroun 🇨🇲</option>
                          <option value="Afrique du Sud">Afrique du Sud 🇿🇦</option>
                          <option value="Belgique">Belgique 🇧🇪</option>
                          <option value="Canada">Canada 🇨🇦</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-brand-cream/40 border border-brand-sand/55 rounded-xl p-3 space-y-2.5">
                      <span className="text-[10px] font-extrabold uppercase text-brand-olive tracking-wider block">🎯 Quotas exigés par catégorie de l'événement :</span>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(editingClient ? (editingClient.categoryLabels || categoryLabels) : categoryLabels).map(([cat, label]) => (
                          <div key={cat}>
                            <label className="block text-[8.5px] text-brand-sage font-black uppercase mb-1">{label}</label>
                            <input 
                              type="number" 
                              min="0"
                              value={editCategoryQuotas[cat] || '0'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditCategoryQuotas(prev => ({
                                  ...prev,
                                  [cat]: val
                                }));
                              }}
                              placeholder="0"
                              className="w-full bg-white border border-brand-sand rounded-lg px-2 py-1 text-xs text-brand-olive"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[8px] text-brand-sage leading-normal">Mettre à 0 pour ignorer le contrôle de cette catégorie.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] text-brand-sage font-bold uppercase mb-1">Consignes spécifiques</label>
                      <textarea 
                        rows={2}
                        value={editClientNotes}
                        onChange={(e) => setEditClientNotes(e.target.value)}
                        className="w-full bg-brand-cream border border-brand-sand rounded-lg p-2.5 text-xs text-brand-olive focus:outline-none"
                      />
                    </div>

                    {editClientError && (
                      <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded border border-red-250">{editClientError}</p>
                    )}
                  </div>

                  <div className="flex gap-2.5 pt-2.5 border-t border-brand-sand shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingClient(null)}
                      className="flex-1 bg-white border border-brand-sand hover:bg-brand-cream text-brand-olive text-xs font-bold py-2 rounded-xl transition-all cursor-pointer uppercase text-center"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-brand-olive hover:bg-brand-moss text-white text-xs font-bold py-2 rounded-xl transition-all cursor-pointer uppercase text-center h-9"
                    >
                      Mettre à jour
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Custom Project specific Upload Modal */}
            {projectUploadClientId && (() => {
              const targetClient = clients.find(c => c.id === projectUploadClientId);
              if (!targetClient) return null;

              // Filter photos uploaded specifically for this project
              const clientPhotos = photos.filter(p => p.clientId === projectUploadClientId);

              return (
                <div className="fixed inset-0 bg-[#3a3325]/70 backdrop-blur-3xs z-50 flex items-center justify-center p-3 select-none">
                  <div className="bg-white rounded-2xl w-full max-w-xl border border-brand-sand max-h-[85vh] flex flex-col shadow-2xl p-5">
                    <div className="flex justify-between items-center pb-2.5 border-b border-brand-sand text-left">
                      <div>
                        <h4 className="text-xs font-serif-display font-black text-brand-olive uppercase tracking-wider flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-brand-gold" /> Album de Noces — Importer des photos
                        </h4>
                        <p className="text-[10px] text-brand-sage font-bold font-sans mt-0.5">PROJET CIBLE : <span className="text-brand-gold uppercase">{targetClient.name}</span></p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setProjectUploadClientId(null)} 
                        className="text-brand-sage hover:text-brand-olive text-xs font-semibold uppercase flex items-center gap-1 transition-all cursor-pointer bg-brand-cream border border-brand-sand px-2 py-1 rounded"
                      >
                        <X className="w-3.5 h-3.5" /> Fermer
                      </button>
                    </div>

                    <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-4 no-scrollbar text-left">
                      {/* Explanatory */}
                      <p className="text-[10px] text-brand-sage leading-relaxed leading-normal">
                        Les photos importées via ce formulaire seront rattachées <strong>uniquement</strong> aux mariés <strong className="text-brand-olive">"{targetClient.name}"</strong>. Elles n'apparaîtront pas dans les listes des autres clients.
                      </p>

                      {/* Category Selector */}
                      <div className="p-3 bg-brand-cream/40 border border-brand-sand rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <label className="block text-[10px] text-brand-sage font-bold uppercase">Série / Catégorie de destination :</label>
                          <button
                            type="button"
                            onClick={() => {
                              setProjectCategoriesClientId(targetClient.id);
                              setProjectCategoriesLabels({ ...(targetClient.categoryLabels || categoryLabels) });
                              setNewProjectCategoryKey('');
                              setNewProjectCategoryLabel('');
                              setProjectCategorySuccess(false);
                              setConfirmDeleteKey(null);
                            }}
                            className="text-[8.5px] text-brand-olive hover:text-brand-moss font-black uppercase tracking-wider bg-white border border-brand-sand hover:border-brand-gold px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1"
                            title="Ouvrir le gestionnaire complet de catégories pour ce couple"
                          >
                            <FolderOpen className="w-3 h-3 text-brand-gold" /> Gérer les dossiers du couple
                          </button>
                        </div>

                        {/* Visual selector for existing categories */}
                        {Object.keys(targetClient.categoryLabels || categoryLabels).length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {Object.keys(targetClient.categoryLabels || categoryLabels).map(tab => {
                              const count = clientPhotos.filter(p => p.category === tab).length;
                              const isActive = projectUploadCategory === tab;
                              return (
                                <button
                                  type="button"
                                  key={tab}
                                  onClick={() => setProjectUploadCategory(tab as CategoryTab)}
                                  className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer uppercase flex items-center justify-center gap-0.5 ${
                                    isActive 
                                      ? 'bg-brand-olive text-brand-cream border-brand-olive shadow-sm' 
                                      : 'bg-white text-brand-sage border-brand-sand hover:text-brand-olive'
                                  }`}
                                >
                                  <span className="text-sm leading-none">{getCategoryIcon(tab, (targetClient.categoryLabels || categoryLabels)[tab])}</span>
                                  <span className="truncate">{(targetClient.categoryLabels || categoryLabels)[tab] || tab}</span>
                                  <span className={`text-[8px] rounded-full px-1 py-0.5 font-mono ${isActive ? 'bg-brand-cream/20 text-brand-cream' : 'bg-brand-sand/60 text-brand-sage'}`}>
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Quick-add preset chips (only categories not already present) */}
                        <div className="pt-1.5 border-t border-brand-sand/60 space-y-1.5">
                          <span className="text-[8.5px] font-extrabold uppercase text-brand-sage tracking-widest block">➕ Ajout rapide — Cliquez pour ajouter à ce couple :</span>
                          <div className="flex flex-wrap gap-1.5">
                            {([
                              ['dot', 'Dot'],
                              ['prepa-mariee', 'Prépa de la mariée'],
                              ['prepa-marie', 'Prépa du marié'],
                              ['prepa', 'Prépa'],
                              ['mairie', 'Mairie'],
                              ['couple-famille', 'Couple & Famille'],
                              ['vin-honneur', "Vin d'honneur"],
                              ['eglise', 'Église'],
                              ['soiree', 'Soirée'],
                            ] as const)
                            .filter(([key]) => !((targetClient.categoryLabels || categoryLabels))[key])
                            .map(([key, label]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => {
                                  const currentLabels = targetClient.categoryLabels || categoryLabels;
                                  const updated = { ...currentLabels, [key]: label };
                                  handleUpdateClientQuotas(targetClient.id, { categoryLabels: updated });
                                  setProjectUploadCategory(key as CategoryTab);
                                  toast.success(`"${label}" ajouté pour ${targetClient.name}`);
                                }}
                                className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-brand-sand hover:bg-brand-gold hover:text-white hover:border-brand-gold transition-all cursor-pointer font-medium"
                              >
                                + {label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const folderName = prompt("Entrez le nom du nouveau dossier personnalisé (ex: Église, Soirée, Groupe) :");
                                if (folderName && folderName.trim()) {
                                  const labelClean = folderName.trim();
                                  const key = `custom-${labelClean.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36).substr(-4)}`;
                                  const currentLabels = targetClient.categoryLabels || categoryLabels;
                                  const updated = { ...currentLabels, [key]: labelClean };
                                  handleUpdateClientQuotas(targetClient.id, { categoryLabels: updated });
                                  setProjectUploadCategory(key as CategoryTab);
                                  toast.success(`Dossier "${labelClean}" créé avec succès !`);
                                }
                              }}
                              className="text-[10px] px-3 py-1 rounded-full bg-brand-sand/50 border border-[#a47b38] text-brand-olive hover:bg-brand-gold hover:text-white transition-all cursor-pointer font-bold flex items-center gap-0.5"
                            >
                              📁 + Créer un dossier perso
                            </button>
                          </div>
                          {([
                            ['dot', 'Dot'],
                            ['prepa-mariee', 'Prépa de la mariée'],
                            ['prepa-marie', 'Prépa du marié'],
                            ['prepa', 'Prépa'],
                            ['mairie', 'Mairie'],
                            ['couple-famille', 'Couple & Famille'],
                            ['vin-honneur', "Vin d'honneur"],
                            ['eglise', 'Église'],
                            ['soiree', 'Soirée'],
                          ] as const)
                          .filter(([key]) => !((targetClient.categoryLabels || categoryLabels))[key]).length === 0 && (
                            <p className="text-[9px] text-brand-gold italic">Toutes les catégories prédéfinies sont déjà ajoutées. Utilisez "Gérer les dossiers" pour les renommer ou en supprimer.</p>
                          )}
                        </div>
                      </div>

                      {/* Drag & Drop File Selector area */}
                      {(() => {
                        const currentLabels = targetClient.categoryLabels || categoryLabels;
                        const resolvedTab = Object.keys(currentLabels).includes(projectUploadCategory)
                          ? projectUploadCategory
                          : (Object.keys(currentLabels)[0] || 'Dot');
                        const activeLabel = currentLabels[resolvedTab] || resolvedTab;
                        const activeIcon = getCategoryIcon(resolvedTab, activeLabel);
                        const activeCount = clientPhotos.filter(p => p.category === resolvedTab).length;
                        const quotaRaw = (targetClient.targetCategoryQuotas?.[resolvedTab] !== undefined
                          ? targetClient.targetCategoryQuotas[resolvedTab]
                          : (resolvedTab === 'Dot' ? targetClient.targetCountDot
                          : (resolvedTab === 'Globale' ? targetClient.targetCountGlobale
                          : (resolvedTab === 'Album' ? targetClient.targetCountAlbum : 0)))) || 0;
                        const hasQuota = quotaRaw > 0;
                        const fillRatio = hasQuota ? Math.min(1, activeCount / quotaRaw) : 0;
                        const quotaTone = !hasQuota ? 'emerald' : (fillRatio >= 1 ? 'red' : (fillRatio >= 0.85 ? 'amber' : 'emerald'));

                        const toneClasses = {
                          emerald: { border: 'border-emerald-300', bg: 'bg-emerald-50/55', text: 'text-emerald-700', chip: 'bg-emerald-100/80 text-emerald-700' },
                          amber:   { border: 'border-amber-300',   bg: 'bg-amber-50/55',   text: 'text-amber-700',   chip: 'bg-amber-100/80 text-amber-700' },
                          red:     { border: 'border-red-300',     bg: 'bg-red-50/55',     text: 'text-red-700',     chip: 'bg-red-100/80 text-red-700' }
                        }[quotaTone];

                        return (
                          <div 
                            onDragOver={(e) => { e.preventDefault(); setProjectDragActive(true); }}
                            onDragLeave={() => setProjectDragActive(false)}
                            onDrop={async (e) => {
                              e.preventDefault();
                              setProjectDragActive(false);
                              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                await handleMultipleFiles(e.dataTransfer.files, projectUploadClientId, resolvedTab);
                              }
                            }}
                            onClick={() => projectFileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                              projectDragActive 
                                ? 'border-brand-gold bg-brand-sand/30 shadow-[0_0_0_4px_rgba(194,166,121,0.18)]' 
                                : `${toneClasses.border} ${toneClasses.bg} hover:brightness-95`
                            }`}
                          >
                            <input 
                              ref={projectFileInputRef}
                              type="file" 
                              accept="image/*"
                              multiple
                              onChange={async (e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  await handleMultipleFiles(e.target.files, projectUploadClientId, resolvedTab);
                                }
                              }}
                              className="hidden" 
                            />

                            {isUploading ? (
                              <div className="py-3 flex flex-col items-center justify-center gap-3.5 w-full px-4 text-center animate-pulse">
                                <div className="flex items-center gap-2">
                                  <RefreshCw className={`w-5 h-5 text-brand-gold ${isUploadPaused ? '' : 'animate-spin'}`} />
                                  <span className="text-xs font-black text-brand-olive uppercase tracking-widest font-serif-display">
                                    {isUploadPaused ? 'Importation en Pause' : `Traitement et Envoi (${batchCompleted} / ${batchTotal})`}
                                  </span>
                                </div>
                                
                                {/* Progress bar container */}
                                <div className="w-full bg-brand-sand/35 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                                  <div 
                                    className="h-full bg-gradient-to-r from-brand-gold via-brand-olive to-brand-gold transition-all duration-300 rounded-full" 
                                    style={{ width: `${batchTotal > 0 ? (batchCompleted / batchTotal) * 100 : 0}%` }}
                                  />
                                </div>

                                <div className="flex justify-between w-full text-[9.5px] font-black uppercase text-brand-sage tracking-wider">
                                  <span>{batchTotal > 0 ? Math.round((batchCompleted / batchTotal) * 100) : 0}% complété</span>
                                  <span>
                                    {isUploadPaused ? 'Suspendu' : (batchTimeRemaining !== null ? `Temps : ${formatTimeRemaining(batchTimeRemaining)}` : 'Calcul restant...')}
                                  </span>
                                </div>

                                {/* Pause & Cancel Controls */}
                                <div className="flex justify-center gap-2 pt-1 z-20" onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextPaused = !isUploadPaused;
                                      setIsUploadPaused(nextPaused);
                                      uploadPausedRef.current = nextPaused;
                                    }}
                                    className="px-3 py-1.5 bg-brand-cream hover:bg-brand-sand border border-brand-sand rounded-full text-[9px] font-black uppercase text-brand-olive tracking-wider flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                  >
                                    {isUploadPaused ? '▶️ Reprendre' : '⏸️ Suspendre'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsUploading(false);
                                      setIsUploadPaused(false);
                                      uploadPausedRef.current = false;
                                      toast.info("Envoi de masse interrompu.");
                                    }}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full text-[9px] font-black uppercase text-rose-700 tracking-wider flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                  >
                                    ✕ Annuler
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="py-1 space-y-2 animate-fade-in-up w-full">
                                {/* Active folder summary line */}
                                <div className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${toneClasses.chip}`}>
                                  <span className="text-base leading-none">{activeIcon}</span>
                                  Dossier actif : {activeLabel}
                                  <span className="text-[8.5px] opacity-70">({activeCount}{hasQuota ? ` / ${quotaRaw}` : ''} photo{activeCount > 1 ? 's' : ''})</span>
                                </div>

                                {/* Mini quota bar (if quota exists) */}
                                {hasQuota && (
                                  <div className="w-3/5 mx-auto h-1 bg-brand-sand/55 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${quotaTone === 'red' ? 'bg-red-500' : quotaTone === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.max(2, fillRatio * 100)}%` }}
                                    />
                                  </div>
                                )}

                                <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center mx-auto text-brand-gold shadow-xs">
                                  <FileImage className="w-5 h-5 animate-pulse" />
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-brand-olive font-serif-display">
                                    Glissez une OU PLUSIEURS photos
                                    {activeCount > 0 && <span className="text-brand-sage"> pour le dossier {activeIcon} <span className="text-brand-gold">{activeLabel}</span></span>}
                                    {' '}ou <span className="text-brand-gold underline font-extrabold">cliquez</span>
                                  </p>
                                  <p className="text-[9px] text-brand-sage mt-0.5">
                                    Envoi vers Cloudinary ou encodage local Base64
                                    {hasQuota && (
                                      <span className={`ml-1 font-bold ${toneClasses.text}`}>
                                        {quotaTone === 'red' ? '• Quota atteint' : (quotaTone === 'amber' ? `• Bientôt plein (${quotaRaw - activeCount} restantes)` : `• ${quotaRaw - activeCount} photo${quotaRaw - activeCount > 1 ? 's' : ''} restantes`)}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Display bulk progress queue specifically for the modal view if there's any pending */}
                      {bulkQueue.length > 0 && (
                        <div className="bg-brand-cream/55 border border-brand-sand rounded-xl p-3 space-y-2 max-h-[145px] overflow-y-auto no-scrollbar">
                          <span className="text-[8px] font-extrabold uppercase text-brand-sage tracking-widest block">Suivi des imports :</span>
                          <div className="space-y-1.5">
                            {bulkQueue.slice(0, 10).map(task => (
                              <div key={task.id} className="text-left text-[9.5px] leading-tight flex flex-col gap-1 bg-white p-2 rounded border border-brand-sand/40">
                                <div className="flex justify-between items-center font-medium font-serif-display">
                                  <span className="truncate max-w-[200px] text-brand-olive">{task.name}</span>
                                  <span className={`${
                                    task.status === 'success' ? 'text-emerald-600 font-bold' : task.status === 'error' ? 'text-red-500' : 'text-brand-gold font-mono'
                                  }`}>
                                    {task.status === 'success' ? '✓ Prêt' : task.status === 'error' ? 'Échec' : `${task.progress}%`}
                                  </span>
                                </div>
                                <div className="w-full bg-brand-sand/55 h-1 rounded overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-300 ${
                                      task.status === 'success' ? 'bg-emerald-500' : task.status === 'error' ? 'bg-red-500' : 'bg-brand-gold'
                                    }`}
                                    style={{ width: `${task.progress}%` }}
                                  />
                                </div>
                                {task.status === 'error' && task.errorMsg && (
                                  <p className="text-[8.5px] text-red-500 font-sans mt-0.5 leading-normal bg-red-50 p-1.5 rounded border border-red-100 whitespace-pre-wrap">
                                    {task.errorMsg}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Client Specific Gallery inside Modal so photographer can verify/delete current uploaded photos */}
                      <div className="space-y-2">
                        <h5 className="text-[10px] text-brand-sage font-extrabold uppercase tracking-wider">
                          Photos déjà associées à ce projet ({clientPhotos.length})
                        </h5>
                        
                        {clientPhotos.length === 0 ? (
                          <div className="text-center py-6 border border-dashed border-brand-sand/60 bg-brand-cream/10 rounded-xl">
                            <p className="text-[10px] text-brand-sage italic">Aucune photo exclusivement rattachée à ce projet pour le moment.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2.5">
                            {clientPhotos
                              .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                              .map(photo => (
                              <div 
                                key={photo.id}
                                className="group relative aspect-[3/4] p-1 rounded-lg bg-white shadow-3xs border border-brand-sand/70 flex flex-col justify-end overflow-hidden"
                              >
                                <img 
                                  src={photo.image} 
                                  alt={photo.name} 
                                  referrerPolicy="no-referrer"
                                  className="absolute inset-0 w-full h-full object-cover rounded-md cursor-zoom-in group-hover:scale-105 duration-300 transition-all"
                                  onClick={() => setPreviewPhoto(photo)}
                                />
                                
                                {/* Hover panel to delete photo */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewPhoto(photo)}
                                    className="w-7.5 h-7.5 rounded-full bg-brand-olive hover:bg-brand-moss text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                                    title="Prévisualiser la photo"
                                  >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePhoto(photo.id)}
                                    className="w-7.5 h-7.5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                                    title="Supprimer cette photo du projet"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="absolute inset-x-0 bottom-0 bg-black/75 text-[7.5px] px-1 py-0.5 truncate text-center text-white rounded-b-md">
                                  {photo.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Custom Project specific Category Folders Management Modal / Popup */}
            {projectCategoriesClientId && (() => {
              const targetClient = clients.find(c => c.id === projectCategoriesClientId);
              if (!targetClient) return null;

              return (
                <div className="fixed inset-0 bg-[#3a3325]/70 backdrop-blur-3xs z-50 flex items-center justify-center p-3 select-none">
                  <div className="bg-white rounded-2xl w-full max-w-md border border-brand-sand max-h-[85vh] flex flex-col shadow-2xl p-5 text-left">
                    <div className="flex justify-between items-center pb-2.5 border-b border-brand-sand">
                      <div>
                        <h4 className="text-xs font-serif-display font-black text-brand-olive uppercase tracking-wider flex items-center gap-1.5">
                          <Bookmark className="w-4 h-4 text-brand-gold" /> Gérer les dossiers du couple
                        </h4>
                        <p className="text-[10px] text-brand-sage font-bold font-sans mt-0.5">PROJET CIBLE : <span className="text-brand-gold uppercase">{targetClient.name}</span></p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setProjectCategoriesClientId(null)} 
                        className="text-brand-sage hover:text-brand-olive text-xs font-semibold uppercase flex items-center gap-1 transition-all cursor-pointer bg-brand-cream border border-brand-sand px-2 py-1 rounded"
                      >
                        <X className="w-3.5 h-3.5" /> Fermer
                      </button>
                    </div>

                    <div className="overflow-y-auto flex-1 py-4 space-y-4 no-scrollbar">
                      {/* Explanatory */}
                      <p className="text-[10px] text-brand-sage leading-normal">
                        Ajoutez, modifiez ou supprimez les séries/dossiers de sélection <strong>uniquement</strong> pour ce projet mariés. Les photos importées pour ce couple utiliseront ces dossiers.
                      </p>

                      {projectCategorySuccess && (
                        <div className="bg-emerald-50 text-emerald-800 text-[10px] font-bold p-2.5 rounded-xl border border-emerald-100 animate-fade-in text-center">
                          ✓ Dossiers enregistrés avec succès pour ce projet !
                        </div>
                      )}

                      {/* Folder Listing / Key values */}
                      <div className="space-y-2.5">
                        <span className="text-[9px] font-extrabold uppercase text-brand-gold tracking-widest block">📂 Dossiers actuels de sélection :</span>
                        
                        <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                          {Object.entries(projectCategoriesLabels).length === 0 ? (
                            <p className="text-[10px] text-brand-sage italic">Aucun dossier configuré (Le couple verra les dossiers généraux par défaut).</p>
                          ) : (
                            Object.entries(projectCategoriesLabels).map(([catKey, catLabel]) => (
                              <div key={catKey} className="flex items-center gap-2 bg-brand-cream/40 px-3 py-2 rounded-xl border border-brand-sand/50">
                                <div className="flex-1 shrink-0">
                                  <span className="text-[8px] font-mono text-brand-sage font-bold block uppercase">Identifiant technique : {catKey}</span>
                                  <input 
                                    type="text"
                                    value={catLabel}
                                    onChange={(e) => {
                                      const newVal = e.target.value;
                                      setProjectCategoriesLabels(prev => ({
                                        ...prev,
                                        [catKey]: newVal
                                      }));
                                    }}
                                    className="bg-white border border-brand-sand text-xs rounded px-2 py-1 text-brand-olive font-extrabold w-full focus:outline-none focus:border-brand-gold mt-1"
                                  />
                                </div>
                                {confirmDeleteKey === catKey ? (
                                  <div className="flex flex-col items-center gap-1 shrink-0 self-end mb-1">
                                    <span className="text-[7.5px] font-black text-red-600 uppercase leading-none mb-0.5 animate-pulse">Sûr ?</span>
                                    <div className="flex gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = { ...projectCategoriesLabels };
                                          delete updated[catKey];
                                          setProjectCategoriesLabels(updated);
                                          setConfirmDeleteKey(null);
                                        }}
                                        className="py-1 px-2 rounded text-[8.5px] bg-red-600 hover:bg-red-700 text-white font-black uppercase cursor-pointer transition-all active:scale-95 leading-none"
                                      >
                                        Oui
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteKey(null)}
                                        className="py-1 px-2 rounded text-[8.5px] bg-brand-cream border border-[#ccc] text-brand-sage font-black uppercase cursor-pointer transition-all active:scale-95 leading-none"
                                      >
                                        Non
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteKey(catKey)}
                                    className="self-end mb-1 p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 transition-colors cursor-pointer active:scale-95"
                                    title="Supprimer la catégorie"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Addition Form */}
                      <div className="p-3 bg-brand-cream/55 border border-brand-sand rounded-xl space-y-3">
                        <span className="text-[9px] font-extrabold uppercase text-brand-olive tracking-widest block">➕ Ajouter un nouveau dossier/série :</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] text-brand-sage font-bold uppercase mb-0.5">Clé unique (ex: Cocktail)</label>
                            <input 
                              type="text" 
                              placeholder="Cocktail"
                              value={newProjectCategoryKey}
                              onChange={(e) => setNewProjectCategoryKey(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                              className="w-full bg-white border border-brand-sand rounded-lg px-2 py-1 text-[11px] text-brand-olive"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-brand-sage font-bold uppercase mb-0.5">Label affiché (ex: Le Cocktail)</label>
                            <input 
                              type="text" 
                              placeholder="Le Cocktail"
                              value={newProjectCategoryLabel}
                              onChange={(e) => setNewProjectCategoryLabel(e.target.value)}
                              className="w-full bg-white border border-brand-sand rounded-lg px-2 py-1 text-[11px] text-brand-olive"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const trimmedKey = newProjectCategoryKey.trim();
                            const trimmedLabel = newProjectCategoryLabel.trim();
                            if (!trimmedKey || !trimmedLabel) {
                              toast.error("Veuillez remplir les deux champs.");
                              return;
                            }
                            if (projectCategoriesLabels[trimmedKey]) {
                              toast.warning("Cet identifiant de catégorie existe déjà.");
                              return;
                            }
                            setProjectCategoriesLabels(prev => ({
                              ...prev,
                              [trimmedKey]: trimmedLabel
                            }));
                            setNewProjectCategoryKey('');
                            setNewProjectCategoryLabel('');
                          }}
                          className="w-full bg-brand-olive hover:bg-brand-moss text-brand-cream text-[10px] font-black uppercase py-1.5 rounded-lg font-serif-display cursor-pointer active:scale-95 transition-all text-center"
                        >
                          Ajouter ce dossier au projet
                        </button>
                      </div>

                    </div>

                    <div className="border-t border-brand-sand pt-3 flex justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setProjectCategoriesClientId(null)}
                        className="bg-brand-cream border border-brand-sand text-brand-sage hover:text-brand-olive text-[10px] font-bold uppercase px-3 py-2 rounded-xl cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateClientQuotas(targetClient.id, {
                            categoryLabels: projectCategoriesLabels
                          });
                          setProjectCategorySuccess(true);
                          setTimeout(() => {
                            setProjectCategorySuccess(false);
                            setProjectCategoriesClientId(null);
                          }, 1200);
                        }}
                        className="bg-brand-gold hover:bg-[#a47b38] text-white text-[10px] font-extrabold uppercase px-4 py-2 rounded-xl shadow cursor-pointer active:scale-95 transition-all"
                      >
                        Enregistrer & Appliquer
                      </button>
                    </div>

                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* ==================== CENTRAL UNIFIED INTERACTIVE INBOX SUBTAB ==================== */}
        {/* ---------- MESSAGES ---------- */}
        {activeSection === 'messages' && (
          <div className="bg-white border border-brand-sand rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row h-[560px] text-left">

            {/* Left Column: List of Couples Chat threads */}
            <div className="w-full md:w-64 border-r border-brand-sand bg-brand-cream/35 flex flex-col shrink-0">
              <div className="p-3 border-b border-brand-sand bg-[#EFECE6]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[8.5px] font-extrabold text-brand-gold uppercase tracking-widest block mb-0.5">Discussions actives</span>
                    <span className="text-xs font-serif-display font-bold text-brand-olive uppercase">Boîte de Réception</span>
                  </div>
                </div>
                <SearchBar value={messagesSearch} onChange={setMessagesSearch} placeholder="Rechercher une conversation..." />
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { key: "all" as const, label: "Toutes" },
                    { key: "unread" as const, label: "Non lus" },
                    { key: "with-client" as const, label: "Avec client" }
                  ].map(f => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setMessagesFilter(f.key)}
                      className={`text-[8.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        messagesFilter === f.key
                          ? "bg-brand-olive text-brand-cream border-brand-olive"
                          : "bg-[var(--bg-panel)] text-brand-sage border-brand-sand hover:text-brand-olive"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-brand-sand/50 no-scrollbar">
                {clients
                  .filter(cl => {
                    if (messagesSearch && !cl.name.toLowerCase().includes(messagesSearch.toLowerCase())) return false;
                    if (messagesFilter === "unread" && !unreadByClient[cl.id]) return false;
                    if (messagesFilter === "with-client" && (!chatMessages[cl.id] || chatMessages[cl.id].length === 0)) return false;
                    return true;
                  })
                  .map(cl => {
                    const hasHistory = chatMessages[cl.id] && chatMessages[cl.id].length > 0;
                    const lastMsg = hasHistory ? chatMessages[cl.id][chatMessages[cl.id].length - 1] : null;
                    const isActive = cl.id === selectedInboxClientId;
                    const isPinned = pinnedChats.includes(cl.id);

                    return (
                      <motion.button
                        key={cl.id}
                        layout
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => { setSelectedInboxClientId(cl.id); setUnreadByClient(prev => ({ ...prev, [cl.id]: false })); }}
                        className={`w-full px-3 py-3 text-left transition-colors flex flex-col gap-1 cursor-pointer relative ${
                          isActive ? 'bg-white border-l-4 border-l-brand-gold' : 'hover:bg-brand-sand/10 bg-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-serif-display font-black text-brand-olive truncate flex items-center gap-1.5">
                            {isPinned && <Pin className="w-2.5 h-2.5 text-brand-gold" />}
                            <Avatar name={cl.name} size={16} />
                            {cl.name}
                          </span>
                          <div className="flex items-center gap-1">
                            {unreadByClient[cl.id] && (
                              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-1.5 h-1.5 rounded-full bg-brand-rose" />
                            )}
                            {cl.isLocked && (
                              <span className="scale-75 origin-right bg-emerald-100 text-emerald-800 border border-emerald-200 text-[8px] px-1.5 py-0.2 rounded font-extrabold uppercase shrink-0">ROVAL ✓</span>
                            )}
                          </div>
                        </div>

                        <p className="text-[9.5px] text-brand-sage truncate leading-relaxed">
                          {lastMsg ? (
                            <>
                              <strong className="text-brand-gold">{lastMsg.sender === 'photographer' ? 'Vous: ' : 'Lui: '}</strong>
                              {lastMsg.text}
                            </>
                          ) : (
                            "Aucune discussion initiée."
                          )}
                        </p>
                      </motion.button>
                    );
                  })}
              </div>
            </div>

            {/* Right Column: Interactive feed and response box */}
            {selectedInboxClientId ? (
              (() => {
                const threadClient = clients.find(c => c.id === selectedInboxClientId);
                const msgsList = chatMessages[selectedInboxClientId] || [];

                return (
                  <div className="flex-1 flex flex-col h-full bg-white relative min-w-0">

                    {/* Active Recipients Info Bar */}
                    <div className="p-3 bg-[#EFECE6]/40 border-b border-brand-sand flex justify-between items-center shrink-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={threadClient?.name || "?"} size={28} status="online" />
                        <div>
                          <h4 className="text-xs font-bold text-brand-olive uppercase tracking-tight truncate">{threadClient ? threadClient.name : 'Selection'}</h4>
                          <p className="text-[9px] text-brand-sage">{adminTyping ? "En train d'écrire..." : "Discussion officielle sécurisée en temps de tri"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPinnedChats(prev => prev.includes(selectedInboxClientId) ? prev.filter(x => x !== selectedInboxClientId) : [...prev, selectedInboxClientId])}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${pinnedChats.includes(selectedInboxClientId) ? "bg-brand-gold text-brand-cream border-brand-gold" : "bg-[var(--bg-panel)] text-brand-sage border-brand-sand hover:text-brand-olive"}`}
                          aria-label="Épingler la conversation"
                          title="Épingler"
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <div className="text-[8.5px] uppercase font-bold text-brand-gold tabular-nums">
                          {msgsList.length} msgs
                        </div>
                      </div>
                    </div>

                    {/* Messages feed viewport */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#fdfdfc]/80 no-scrollbar relative">
                      {msgsList.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center">
                          <EmptyStateIllustration type="messages" message="Aucun message. Lancez la conversation ci-dessous !" />
                        </div>
                      ) : (
                        msgsList.map((m, mIdx) => {
                          const isPhotographer = m.sender === 'photographer';
                          const prevMsg = mIdx > 0 ? msgsList[mIdx - 1] : null;
                          const showDateSeparator = !prevMsg || new Date(m.timestamp || m.id).toDateString() !== new Date(prevMsg.timestamp || prevMsg.id).toDateString();
                          const dateLabel = (() => {
                            const d = new Date(m.timestamp || m.id);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const diffDays = Math.floor((today.getTime() - d.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
                            if (diffDays === 0) return "Aujourd'hui";
                            if (diffDays === 1) return "Hier";
                            return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
                          })();
                          return (
                            <React.Fragment key={m.id || mIdx}>
                              {showDateSeparator && (
                                <div className="flex items-center justify-center my-2">
                                  <span className="bg-brand-sand/50 text-brand-sage text-[8.5px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                    {dateLabel}
                                  </span>
                                </div>
                              )}
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col max-w-[85%] ${isPhotographer ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                              >
                                <div className={`rounded-xl p-2.5 text-[11px] leading-relaxed shadow-5xs border ${
                                  isPhotographer
                                    ? 'bg-[#E3EAE0] text-brand-olive border-[#cad7c4] rounded-tr-none'
                                    : 'bg-brand-cream text-brand-moss border-brand-sand/70 rounded-tl-none'
                                }`}>
                                  <p className="whitespace-pre-wrap select-text">{m.text}</p>
                                </div>
                                <span className="text-[8px] text-brand-sage scale-90 mt-1 uppercase tracking-wide font-mono">
                                  {isPhotographer ? "Atelier d'Art" : threadClient?.name} • {new Date(m.timestamp || m.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </motion.div>
                            </React.Fragment>
                          );
                        })
                      )}

                      <AnimatePresence>
                        {adminTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 mr-auto bg-brand-cream border border-brand-sand rounded-2xl rounded-bl-none px-3 py-2 shadow-5xs w-fit"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-sage typing-dot" />
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-sage typing-dot" />
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-sage typing-dot" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Quick replies + Reply input */}
                    <div className="border-t border-brand-sand bg-brand-cream/20 shrink-0">
                      <AnimatePresence>
                        {showQuickReplies && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-2 flex flex-wrap gap-1.5 border-b border-brand-sand/50">
                              {["Bien reçu !", "Merci pour votre retour 👍", "Je note votre demande", "On revient vers vous très vite", "Pouvez-vous préciser ?", "Magnifique choix !"].map(qr => (
                                <button
                                  key={qr}
                                  type="button"
                                  onClick={() => { setAdminReplyText(qr); setShowQuickReplies(false); }}
                                  className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--bg-panel)] border border-brand-sand text-brand-sage hover:text-brand-olive hover:border-brand-gold transition-colors cursor-pointer"
                                >
                                  {qr}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <form onSubmit={(e) => {
                        e.preventDefault();
                        setAdminTyping(true);
                        setTimeout(() => setAdminTyping(false), 1800);
                        handleSendInboxReply(e);
                      }} className="p-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowQuickReplies(s => !s)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${showQuickReplies ? "bg-brand-gold text-brand-cream border-brand-gold" : "bg-[var(--bg-panel)] text-brand-sage border-brand-sand hover:text-brand-olive"}`}
                          aria-label="Réponses rapides"
                          title="Réponses rapides"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="text"
                          placeholder={`Répondre à ${threadClient ? threadClient.name : 'couple'}...`}
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          onFocus={() => setAdminTyping(true)}
                          onBlur={() => setAdminTyping(false)}
                          className="flex-1 bg-[var(--bg-panel)] border border-brand-sand rounded-xl px-3 py-2 text-xs text-brand-olive focus:outline-none focus:border-brand-sage"
                        />
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          type="submit"
                          className="bg-brand-olive hover:bg-brand-moss text-brand-cream p-2.5 rounded-xl cursor-pointer transition-all shrink-0 flex items-center justify-center shadow"
                          aria-label="Envoyer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </motion.button>
                      </form>
                    </div>

                  </div>
                );
              })()
            ) : (
              <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-6 text-brand-sage text-xs">
                <EmptyStateIllustration type="messages" message="Sélectionnez une conversation pour commencer à tchatter." />
              </div>
            )}
          </div>
        )}

        {/* ==================== PHOTOS SUBTAB ==================== */}
        {/* ---------- GALLERY ---------- */}
        {activeSection === 'gallery' && (
          <div className="space-y-6 text-left">
            
            {/* Multiple Async Bulk Queue Form */}
            <div className="bg-white border border-brand-sand rounded-xl p-4 space-y-4 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest flex items-center gap-1 font-serif-display">
                  <Upload className="w-4 h-4 text-brand-gold" /> Téléversement de Masse (Bulk Upload)
                </h3>
                <span className="text-[8px] font-extrabold uppercase bg-brand-sand px-2 py-0.5 rounded text-brand-olive shrink-0">
                  File d'Attente Interactive
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] text-brand-sage font-bold uppercase">Catégorie cible des clichés</label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab('settings');
                        setTimeout(() => {
                          const el = document.getElementById('categories-config-form');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="text-[9px] text-[#a47b38] font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer hover:text-brand-olive"
                    >
                      ➕/❌ Ajouter ou supprimer des categories/dossiers
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(categoryLabels).map(tab => (
                      <button
                        type="button"
                        key={tab}
                        onClick={() => setUploadCategory(tab as CategoryTab)}
                        className={`py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer uppercase ${
                          uploadCategory === tab 
                            ? 'bg-brand-olive text-brand-cream border-brand-olive shadow-sm' 
                            : 'bg-brand-cream text-brand-sage border-brand-sand hover:text-brand-olive'
                        }`}
                      >
                        {categoryLabels[tab] || tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multiple drag and dropped area file */}
                <motion.div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  animate={dragActive ? { scale: 1.02 } : { scale: 1 }}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-brand-gold bg-brand-sand/30 shadow-[0_0_0_4px_rgba(194,166,121,0.15)]'
                      : 'border-brand-sand bg-brand-cream/50'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden" 
                  />

                  {isUploading ? (
                    <div className="py-3 flex flex-col items-center justify-center gap-3.5 w-full px-4 text-center animate-pulse">
                      <div className="flex items-center gap-2">
                        <RefreshCw className={`w-5 h-5 text-brand-gold ${isUploadPaused ? '' : 'animate-spin'}`} />
                        <span className="text-xs font-black text-brand-olive uppercase tracking-widest font-serif-display">
                          {isUploadPaused ? 'Importation en Pause' : `Importation de masse (${batchCompleted} / ${batchTotal})`}
                        </span>
                      </div>
                      
                      {/* Progress bar container */}
                      <div className="w-full bg-brand-sand/35 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-brand-gold via-brand-olive to-brand-gold transition-all duration-300 rounded-full" 
                          style={{ width: `${batchTotal > 0 ? (batchCompleted / batchTotal) * 100 : 0}%` }}
                        />
                      </div>

                      <div className="flex justify-between w-full text-[9.5px] font-black uppercase text-brand-sage tracking-wider">
                        <span>{batchTotal > 0 ? Math.round((batchCompleted / batchTotal) * 100) : 0}% complété</span>
                        <span>
                          {isUploadPaused ? 'Suspendu' : (batchTimeRemaining !== null ? `Temps : ${formatTimeRemaining(batchTimeRemaining)}` : 'Calcul restant...')}
                        </span>
                      </div>

                      {/* Pause & Cancel Controls */}
                      <div className="flex justify-center gap-2 pt-1 z-20" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            const nextPaused = !isUploadPaused;
                            setIsUploadPaused(nextPaused);
                            uploadPausedRef.current = nextPaused;
                          }}
                          className="px-3 py-1.5 bg-brand-cream hover:bg-brand-sand border border-brand-sand rounded-full text-[9px] font-black uppercase text-brand-olive tracking-wider flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          {isUploadPaused ? '▶️ Reprendre' : '⏸️ Suspendre'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUploading(false);
                            setIsUploadPaused(false);
                            uploadPausedRef.current = false;
                            toast.info("Envoi de masse interrompu.");
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full text-[9px] font-black uppercase text-rose-700 tracking-wider flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          ✕ Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-1 space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center mx-auto text-brand-gold shadow-xs">
                        <FileImage className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-brand-olive">Glissez une OU PLUSIEURS photos ici ou <span className="text-brand-gold underline font-extrabold">cliquez</span></p>
                        <p className="text-[9px] text-brand-sage mt-0.5">Traitement asynchrone simultané avec barre de progression</p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Render bulk queue progress bars */}
                {bulkQueue.length > 0 && (
                  <div className="bg-brand-cream/55 border border-brand-sand rounded-xl p-3 space-y-2 max-h-[160px] overflow-y-auto no-scrollbar">
                    <span className="text-[8px] font-extrabold uppercase text-brand-sage tracking-widest block">Statut individuel des téléversements :</span>
                    <div className="space-y-2">
                      {bulkQueue.map(task => (
                        <div key={task.id} className="text-left text-[9.5px] leading-tight flex flex-col gap-1 bg-white p-2 rounded border border-brand-sand/40">
                          <div className="flex justify-between items-center font-medium font-serif-display">
                            <span className="truncate max-w-[170px] text-brand-olive">{task.name}</span>
                            <span className={`${
                              task.status === 'success' ? 'text-emerald-600 font-bold' : task.status === 'error' ? 'text-red-500' : 'text-brand-gold font-mono'
                            }`}>
                              {task.status === 'success' ? '✓ Succès' : task.status === 'error' ? 'Échec' : `${task.progress}%`}
                            </span>
                          </div>
                          <div className="w-full bg-brand-sand/55 h-1 rounded overflow-hidden font-sans">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                task.status === 'success' ? 'bg-emerald-500' : task.status === 'error' ? 'bg-red-500' : 'bg-brand-gold'
                              }`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                          {task.status === 'error' && task.errorMsg && (
                            <p className="text-[8.5px] text-red-500 font-sans mt-0.5 leading-normal bg-red-50 p-1.5 rounded border border-red-100 whitespace-pre-wrap">
                              {task.errorMsg}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="flex items-center gap-1.5 text-red-500 text-xs py-1.5 px-2 rounded bg-red-50 border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs py-1.5 px-2 rounded bg-emerald-50 border border-emerald-200 animate-fade-in-up">
                    <Check className="w-3.5 h-3.5" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cloudinary folder synchronisation section */}
            <div className="bg-white border border-brand-sand rounded-xl p-4 space-y-4 shadow-sm">
              <h3 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-serif-display">
                <FolderOpen className="w-4 h-4 text-brand-gold" /> Synchroniser un dossier Cloudinary
              </h3>
              
              <form onSubmit={handleCloudinaryFolderSync} className="space-y-3.5">
                <p className="text-[10px] text-brand-sage leading-relaxed leading-normal">
                  Renseignez le chemin ou nom du dossier (tag) présent sur votre compte Cloudinary. L'application scannera tous les fichiers associés pour les ajouter en lot.
                </p>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="/mariage-alice-bob"
                    value={syncFolderPath}
                    onChange={(e) => setSyncFolderPath(e.target.value)}
                    className="flex-1 bg-brand-cream border border-brand-sand rounded-lg px-2.5 py-1.5 text-xs text-brand-olive font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isSyncingFolder}
                    className="bg-brand-olive hover:bg-brand-moss text-brand-cream text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm font-bold uppercase cursor-pointer"
                  >
                    {isSyncingFolder ? 'Analyse...' : 'Synchroniser'}
                  </button>
                </div>

                {isSyncingFolder && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <RefreshCw className="w-4 h-4 text-brand-gold animate-spin" />
                    <span className="text-[10px] text-brand-olive font-bold">Importation asynchrone des métadonnées du dossier Cloudinary...</span>
                  </div>
                )}

                {syncFolderSuccess && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs py-2 px-2.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-serif-display font-medium">{syncFolderSuccess}</span>
                  </div>
                )}
              </form>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <h3 className="text-xs text-brand-sage font-bold uppercase tracking-widest">Galerie Globale ({photos.length})</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SortDropdown
                    value={gallerySort}
                    onChange={setGallerySort}
                    options={[
                      { value: "name", label: "Référence (Croissant)" },
                      { value: "recent", label: "Plus récent" },
                      { value: "oldest", label: "Plus ancien" },
                      { value: "client", label: "Par couple" }
                    ]}
                  />
                  <SortDropdown
                    value={galleryLayout}
                    onChange={(v) => setGalleryLayout(v as any)}
                    options={[
                      { value: "2x2", label: "2 colonnes" },
                      { value: "3x3", label: "3 colonnes" },
                      { value: "4x4", label: "4 colonnes" }
                    ]}
                    label="Vue"
                  />
                </div>
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap items-center gap-1.5 px-1">
                <button
                  type="button"
                  onClick={() => { setGalleryFilterClient("all"); setGalleryFilterCategory("all"); }}
                  className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                    galleryFilterClient === "all" && galleryFilterCategory === "all" ? "bg-brand-olive text-brand-cream border-brand-olive" : "bg-[var(--bg-panel)] text-brand-sage border-brand-sand hover:text-brand-olive"
                  }`}
                >
                  Toutes ({photos.length})
                </button>
                {Object.keys(categoryLabels).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGalleryFilterCategory(cat === galleryFilterCategory ? "all" : cat)}
                    className={`text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                      galleryFilterCategory === cat ? "bg-brand-gold text-brand-cream border-brand-gold" : "bg-[var(--bg-panel)] text-brand-sage border-brand-sand hover:text-brand-olive"
                    }`}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
                {clients.length > 0 && (
                  <select
                    value={galleryFilterClient}
                    onChange={(e) => setGalleryFilterClient(e.target.value)}
                    className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-[var(--bg-panel)] border-brand-sand text-brand-sage focus:outline-none cursor-pointer"
                  >
                    <option value="all">Tous les couples</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              {(() => {
                const filteredGallery = photos
                  .filter(p => galleryFilterClient === "all" || (galleryFilterClient === "global" ? !p.clientId : p.clientId === galleryFilterClient))
                  .filter(p => galleryFilterCategory === "all" || p.category === galleryFilterCategory)
                  .sort((a, b) => {
                    if (gallerySort === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    if (gallerySort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    if (gallerySort === "client") {
                      const ca = a.clientId || "";
                      const cb = b.clientId || "";
                      const comp = ca.localeCompare(cb);
                      if (comp !== 0) return comp;
                    }
                    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
                  });

                if (filteredGallery.length === 0) {
                  return <EmptyStateIllustration type="gallery" message="Aucun cliché ne correspond à vos filtres." />;
                }

                return (
                  <motion.div
                    layout
                    className={`grid gap-3 ${galleryLayout === "3x3" ? "grid-cols-3" : galleryLayout === "4x4" ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"}`}
                  >
                    <AnimatePresence>
                      {filteredGallery.map(photo => {
                        const isSelected = selectedPhotoIds.has(photo.id);
                        return (
                          <motion.div
                            key={photo.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ y: -2 }}
                            className={`group relative aspect-[3/4] p-1.5 rounded bg-white shadow-sm border flex flex-col justify-end overflow-hidden cursor-pointer transition-all ${
                              isSelected ? "border-brand-gold ring-2 ring-brand-gold/40" : "border-brand-sand"
                            }`}
                            onClick={(e) => {
                              if (e.shiftKey || e.metaKey) {
                                e.preventDefault();
                                setSelectedPhotoIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(photo.id)) next.delete(photo.id);
                                  else next.add(photo.id);
                                  return next;
                                });
                              } else {
                                setPreviewPhoto(photo);
                              }
                            }}
                          >
                            <div className="flex-1 rounded overflow-hidden relative">
                              <SmartImage
                                src={photo.image}
                                alt={photo.name}
                                fit="cover"
                                className="absolute inset-0 w-full h-full transition-transform group-hover:scale-105"
                              />
                              {/* Selection checkbox */}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedPhotoIds(prev => { const n = new Set(prev); if (n.has(photo.id)) n.delete(photo.id); else n.add(photo.id); return n; }); }}
                                className={`absolute top-1.5 left-1.5 w-5 h-5 rounded border-2 z-10 flex items-center justify-center transition-all cursor-pointer ${
                                  isSelected ? "bg-brand-gold border-brand-gold" : "bg-brand-cream/90 border-white/80 opacity-0 group-hover:opacity-100"
                                }`}
                                aria-label="Sélectionner la photo"
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </button>
                              <div className="absolute top-1.5 right-1.5 z-10">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmDeletePhotoId(photo.id); }}
                                  className="w-6 h-6 rounded bg-brand-cream/90 hover:bg-red-50 text-red-500 flex items-center justify-center border border-brand-sand shadow active:scale-90 transition-all cursor-pointer"
                                  title="Supprimer"
                                  aria-label="Supprimer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="pt-1.5 text-center">
                              <p className="text-[10px] text-brand-olive font-bold truncate leading-tight">{photo.name}</p>
                              <div className="flex flex-wrap items-center justify-center gap-1 mt-1 font-sans">
                                <span className="inline-block bg-brand-cream text-brand-sage font-extrabold text-[7.5px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-brand-sand">
                                  {(() => {
                                    const pClient = photo.clientId ? clients.find(c => c.id === photo.clientId) : null;
                                    const pLabels = pClient?.categoryLabels || categoryLabels;
                                    return pLabels[photo.category] || photo.category;
                                  })()}
                                </span>
                                {photo.clientId && (
                                  <span className="inline-block bg-[#FAF2E5] text-[#b38531] border border-[#f0dfc8] font-extrabold text-[7.5px] uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0">
                                    👤 {clients.find(c => c.id === photo.clientId)?.name || photo.clientId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                );
              })()}

              <BulkToolbar
                count={selectedPhotoIds.size}
                onClear={() => setSelectedPhotoIds(new Set())}
                actions={[
                  {
                    label: "Retagger",
                    icon: <Tag className="w-3 h-3" />,
                    onClick: () => setConfirmRetagOpen(true)
                  },
                  {
                    label: "Supprimer",
                    icon: <Trash2 className="w-3 h-3" />,
                    onClick: () => setConfirmDeleteSelected(true),
                    danger: true
                  }
                ]}
              />
            </div>

          </div>
        )}

        {/* ==================== SETTINGS (CLOUDINARY) SUBTAB ==================== */}
        {/* ---------- SETTINGS ---------- */}
        {activeSection === 'settings' && (
          <div className="space-y-6 text-left">
            
            {/* Custom Category Renaming Form */}
            <form 
              id="categories-config-form"
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateCategoryLabels(editableCategoryLabels);
                setLabelSuccess(true);
                setTimeout(() => setLabelSuccess(false), 3000);
              }}
              className="bg-white border border-[#c4b18c] rounded-xl p-4 space-y-4 shadow-md scroll-mt-20 focus-within:ring-2 focus-within:ring-brand-gold/50"
            >
              <h3 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-serif-display">
                <Bookmark className="w-4 h-4 text-brand-gold" /> Catégories de Sélection (Dossiers des mariés)
              </h3>

              <p className="text-[10px] text-brand-sage leading-relaxed italic">
                Saisissez les libellés de vos dossiers de sélection. Vous pouvez renommer, ajouter de nouveaux dossiers (ex: Soirée, Civil, Cocktail) ou supprimer des dossiers.
              </p>

              <div className="space-y-3.5 pt-1">
                {Object.entries(editableCategoryLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3 border-b border-brand-sand/40 pb-2.5">
                    <div className="flex-1">
                      <span className="block text-[8.5px] font-extrabold uppercase tracking-wider text-brand-sage mb-0.5">Clef technique : <code className="font-mono lowercase text-[#a08149] bg-brand-cream px-1 py-0.2 rounded font-normal">{key}</code></span>
                      <input 
                        type="text" 
                        value={label}
                        onChange={(e) => {
                          setEditableCategoryLabels(prev => ({
                            ...prev,
                            [key]: e.target.value
                          }));
                        }}
                        className="w-full bg-brand-cream border border-brand-sand rounded-lg px-2.5 py-1.5 text-xs text-brand-olive font-bold focus:outline-none focus:border-brand-emerald"
                      />
                    </div>
                    
                    {/* Delete category item option */}
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteCategoryKey(key)}
                      className="mt-3.5 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 flex items-center justify-center cursor-pointer transition-colors"
                      title="Supprimer la catégorie"
                      aria-label={`Supprimer la catégorie ${label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Form segment to ADD a brand new Category */}
              <div className="bg-[#FAF9F5] border border-brand-sand/50 rounded-xl p-3.5 space-y-3">
                <span className="text-[9.5px] font-black uppercase text-brand-olive tracking-widest block">➕ Ajouter un nouveau dossier ou catégorie</span>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[8px] text-brand-sage font-extrabold uppercase mb-1">Clef unique (ex: "cocktail", "preparatifs")</label>
                    <input 
                      type="text"
                      placeholder="civil"
                      value={newCategoryKey}
                      onChange={(e) => setNewCategoryKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                      className="w-full bg-white border border-brand-sand rounded-lg px-2.5 py-1.5 text-xs text-brand-olive font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] text-[#2d4a3e] font-extrabold uppercase mb-1">Libellé Affiché (ex: "Mariage Civil")</label>
                    <input 
                      type="text"
                      placeholder="Mariage Civil"
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      className="w-full bg-white border border-brand-sand rounded-lg px-2.5 py-1.5 text-xs text-brand-olive font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const cleanKey = newCategoryKey.trim();
                    const cleanLabel = newCategoryLabel.trim();
                    if (!cleanKey || !cleanLabel) {
                      toast.error("Veuillez remplir les deux champs.");
                      return;
                    }
                    if (editableCategoryLabels[cleanKey]) {
                      toast.warning("Cette clef existe déjà.");
                      return;
                    }
                    setEditableCategoryLabels(prev => ({
                      ...prev,
                      [cleanKey]: cleanLabel
                    }));
                    setNewCategoryKey('');
                    setNewCategoryLabel('');
                    toast.success(`Catégorie "${cleanLabel}" ajoutée`);
                  }}
                  className="bg-brand-gold hover:bg-brand-gold/90 text-brand-cream text-[10px] font-extrabold uppercase px-3 py-1.5 rounded transition-colors tracking-wider cursor-pointer"
                >
                  Ajouter à la liste
                </button>
              </div>

              {/* Preset category list — quick-add common wedding categories */}
              <div className="bg-[#FAF9F5] border border-brand-sand/50 rounded-xl p-3.5 space-y-2">
                <span className="text-[9.5px] font-black uppercase text-brand-olive tracking-widest block">Ajout rapide</span>
                <p className="text-[9px] text-brand-sage">Cliquez pour ajouter une catégorie standard :</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ['dot', 'Dot'],
                    ['prepa-mariee', 'Prépa de la mariée'],
                    ['prepa-marie', 'Prépa du marié'],
                    ['prepa', 'Prépa'],
                    ['mairie', 'Mairie'],
                    ['couple-famille', 'Couple & Famille'],
                    ['vin-honneur', "Vin d'honneur"],
                    ['eglise', 'Église'],
                    ['soiree', 'Soirée'],
                  ] as const)
                  .filter(([key]) => !editableCategoryLabels[key])
                  .map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setEditableCategoryLabels(prev => ({ ...prev, [key]: label }));
                        toast.success(`"${label}" ajouté`);
                      }}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-brand-sand hover:bg-brand-gold hover:text-brand-cream hover:border-brand-gold transition-all cursor-pointer font-medium"
                    >
                      + {label}
                    </button>
                  ))}
                </div>
                {([
                  ['dot', 'Dot'],
                  ['prepa-mariee', 'Prépa de la mariée'],
                  ['prepa-marie', 'Prépa du marié'],
                  ['prepa', 'Prépa'],
                  ['mairie', 'Mairie'],
                  ['couple-famille', 'Couple & Famille'],
                  ['vin-honneur', "Vin d'honneur"],
                  ['eglise', 'Église'],
                  ['soiree', 'Soirée'],
                ]).filter(([key]) => !editableCategoryLabels[key]).length === 0 && (
                  <p className="text-[9px] text-brand-gold italic">Toutes les catégories prédéfinies sont déjà dans votre liste.</p>
                )}
              </div>

              {labelSuccess && (
                <div className="flex items-center gap-1.5 text-emerald-650 text-xs py-1 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dossiers et catégories mis à jour avec grand succès ! ✓</span>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-brand-olive hover:bg-brand-moss text-brand-cream font-bold text-xs py-2 rounded-lg transition-all shadow cursor-pointer uppercase tracking-wider h-10"
              >
                Enregistrer l'ensemble des catégories
              </button>
            </form>

            <form onSubmit={handleSaveCloudinary} className="bg-white border border-brand-sand rounded-xl p-4 space-y-4 shadow-sm">
              <h3 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-serif-display">
                <Settings className="w-4 h-4 text-brand-gold" /> Liaison Cloudinary
              </h3>

              {/* Server-side status banner */}
              {serverStatus && (
                <div className={`flex items-start gap-2 p-2.5 rounded-lg text-[10.5px] leading-snug ${
                  serverStatus.fullyConfigured
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}>
                  {serverStatus.fullyConfigured ? (
                    <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  )}
                  <div>
                    {serverStatus.fullyConfigured ? (
                      <>
                        <strong>Serveur configuré.</strong> Cloud Name : <code className="font-mono">{serverStatus.cloudName}</code>.
                        Les credentials serveur (API Key + Secret) sont définis dans les variables d'environnement.
                      </>
                    ) : (
                      <>
                        <strong>Credentials serveur manquantes.</strong> Pour activer la gestion Cloudinary depuis l'app, définissez <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>, <code className="font-mono">CLOUDINARY_API_KEY</code> et <code className="font-mono">CLOUDINARY_API_SECRET</code> dans le fichier <code className="font-mono">.env</code> du serveur.
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-brand-sage font-bold uppercase mb-1">Nom du Cloud ("Cloud Name")</label>
                  <input 
                    type="text" 
                    placeholder="dy2xjsf2y"
                    value={cloudNameInput}
                    onChange={(e) => setCloudNameInput(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-sand rounded-lg px-3 py-2 text-xs text-brand-olive font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-brand-sage font-bold uppercase mb-1">Preset non-signé ("Upload Preset")</label>
                  <input 
                    type="text" 
                    placeholder="wedding_preset"
                    value={uploadPresetInput}
                    onChange={(e) => setUploadPresetInput(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-sand rounded-lg px-3 py-2 text-xs text-brand-olive font-mono"
                  />
                </div>

                {configSuccess && (
                  <div className="flex items-center gap-1.5 text-emerald-650 text-xs py-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Configuration Cloud sauvegardée ✓</span>
                  </div>
                )}

                {/* Test connection button + result */}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-brand-olive hover:bg-brand-moss text-brand-cream font-bold text-xs py-2 rounded-lg transition-all shadow cursor-pointer uppercase tracking-wider"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    disabled={testResult.status === "loading"}
                    onClick={async () => {
                      setTestResult({ status: "loading" });
                      try {
                        const res = await testCloudinaryConnection();
                        if (res.success) {
                          setTestResult({ status: "ok", message: `Connecté (${res.cloudName})`, rateLimit: res.rate_limit_remaining });
                          toast.success("Connexion Cloudinary réussie");
                        } else {
                          setTestResult({ status: "error", message: res.error || "Échec" });
                          toast.error(res.error || "Échec de connexion");
                        }
                      } catch (e: any) {
                        setTestResult({ status: "error", message: e.message });
                        toast.error(e.message);
                      }
                    }}
                    className="px-3 py-2 bg-brand-cream hover:bg-brand-sand text-brand-olive border border-brand-sand rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 uppercase tracking-wider flex items-center gap-1"
                  >
                    {testResult.status === "loading" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Tester
                  </button>
                </div>

                {testResult.status === "ok" && (
                  <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2 leading-snug">
                    <Check className="w-3 h-3 inline mr-1" />{testResult.message}
                    {testResult.rateLimit !== undefined && <span className="opacity-60 ml-1">({testResult.rateLimit} req restantes)</span>}
                  </div>
                )}
                {testResult.status === "error" && (
                  <div className="text-[10px] text-red-700 bg-red-50 border border-red-200 rounded p-2 leading-snug">
                    <AlertCircle className="w-3 h-3 inline mr-1" />{testResult.message}
                  </div>
                )}
              </div>
            </form>

            {/* Guide */}
            <div className="bg-white border border-brand-sand rounded-xl p-4 space-y-2.5 shadow-sm leading-relaxed text-left text-xs">
              <h4 className="text-xs font-serif-display font-bold text-brand-olive flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-brand-gold" /> Comment configurer Cloudinary ?
              </h4>
              <p className="text-[11px] text-brand-sage">
                Si non configuré, l'application fonctionne à l'aide d'une <strong>mémoire cache en local</strong> pour que vous puissiez tester directement et charger des images sans délais !
              </p>
            </div>

          </div>
        )}

        {/* ==================== SYSTEM LOGS PANEL ==================== */}
        {activeSection === 'logs' && (
          <div className="space-y-4 text-left h-full flex flex-col pb-4 animate-fade-in">
            <div className="bg-white border border-brand-sand rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-xs text-brand-olive font-extrabold uppercase tracking-widest flex items-center gap-1.5 font-serif-display">
                  <Terminal className="w-4 h-4 text-[#A3704C]" /> Diagnostic & Logs Système
                </h3>
                <p className="text-[10px] text-brand-sage leading-relaxed mt-0.5">
                  Visualisez en temps réel l'activité du serveur Node.js, les uploads Cloudinary et les requêtes PostgreSQL Supabase.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchLogs}
                  disabled={isLoadingLogs}
                  className="px-3 py-1.5 bg-brand-cream hover:bg-brand-sand text-brand-olive border border-brand-sand rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-50 uppercase tracking-wider flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold cursor-pointer uppercase tracking-wider flex items-center gap-1"
                >
                  Vider l'écran
                </button>
              </div>
            </div>

            {/* Filters and search */}
            <div className="bg-white border border-brand-sand rounded-xl p-3 shadow-xs shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex rounded-lg overflow-hidden border border-brand-sand/70 p-0.5 bg-brand-cream/40">
                {(['all', 'info', 'warn', 'error'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setLogsFilter(f)}
                    className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      logsFilter === f ? 'bg-[#A3704C] text-white shadow-xs' : 'text-brand-sage hover:text-brand-olive'
                    }`}
                  >
                    {f === 'all' ? 'Tous' : f}
                  </button>
                ))}
              </div>
              
              <div className="flex-1 w-full relative">
                <Search className="w-3.5 h-3.5 text-brand-sage absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher dans les messages des logs..."
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  className="w-full bg-brand-cream/30 border border-brand-sand rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold/60 text-brand-olive"
                />
                {logsSearch && (
                  <button onClick={() => setLogsSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-sage hover:text-brand-olive font-black text-xs">
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Terminal Console View */}
            <div className="flex-1 bg-zinc-950 text-zinc-200 font-mono text-[10px] p-4 rounded-xl border border-zinc-800 shadow-2xl overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 min-h-[300px]">
              {(() => {
                const filteredLogs = logs.filter(log => {
                  if (logsFilter !== 'all' && log.level !== logsFilter) return false;
                  if (logsSearch && !log.message.toLowerCase().includes(logsSearch.toLowerCase())) return false;
                  return true;
                });

                if (filteredLogs.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
                      <Terminal className="w-8 h-8 opacity-25 mb-2" />
                      <span>Aucun log enregistré ou correspondant aux critères</span>
                    </div>
                  );
                }

                return filteredLogs.map((log, idx) => {
                  const time = new Date(log.timestamp).toLocaleTimeString();
                  let levelColor = 'text-sky-400';
                  if (log.level === 'warn') levelColor = 'text-amber-400';
                  else if (log.level === 'error') levelColor = 'text-rose-500 font-bold';

                  return (
                    <div key={idx} className="flex gap-2 hover:bg-zinc-900/60 p-0.5 rounded transition-colors group">
                      <span className="text-zinc-600 select-none group-hover:text-zinc-500 shrink-0">{time}</span>
                      <span className={`${levelColor} shrink-0 select-none`}>[{log.level.toUpperCase()}]</span>
                      <span className="text-zinc-300 break-all select-text whitespace-pre-wrap">{log.message}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

      </div>
      </main>

      {/* Status bar at bottom of admin */}
      <StatusBar couplesCount={clients.length} photosCount={photos.length} online />

      {previewPhoto && (
        <ZoomLightbox
          photo={previewPhoto}
          onClose={() => setPreviewPhoto(null)}
        />
      )}

      {/* Confirm retag selected */}
      {confirmRetagOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmRetagOpen(false)}>
          <motion.div
            initial={{ scale: 0.92, y: 14 }} animate={{ scale: 1, y: 0 }}
            className="bg-[var(--bg-panel)] border border-brand-sand rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-serif-display font-bold text-brand-olive text-lg leading-tight mb-1.5">Retagger {selectedPhotoIds.size} cliché{selectedPhotoIds.size > 1 ? "s" : ""}</h3>
            <p className="text-[10px] text-brand-sage mb-3">Choisissez la nouvelle catégorie à appliquer à la sélection.</p>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.keys(categoryLabels).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    const updated = photos.map(p => selectedPhotoIds.has(p.id) ? { ...p, category: cat as any } : p);
                    saveGlobalPhotos(updated);
                    setPhotos(updated);
                    fetch("/api/photos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ globalPhotos: updated }) }).then(() => loadDatabaseState()).catch(() => { /* noop */ });
                    setSelectedPhotoIds(new Set());
                    setConfirmRetagOpen(false);
                    toast.success(`Catégorie "${categoryLabels[cat]}" appliquée`);
                  }}
                  className="bg-brand-olive hover:bg-brand-moss text-brand-cream py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* =================== CONFIRMATION MODALS =================== */}
      <ConfirmModal
        open={!!confirmDeletePhotoId}
        title="Supprimer ce cliché ?"
        message="Cette action est irréversible. Le cliché sera retiré de toutes les galeries des couples qui l'auraient déjà en favoris."
        confirmLabel="Supprimer définitivement"
        danger
        onConfirm={() => { handleDeletePhoto(confirmDeletePhotoId!); setConfirmDeletePhotoId(null); }}
        onClose={() => setConfirmDeletePhotoId(null)}
      />

      <ConfirmModal
        open={confirmDeleteSelected && selectedPhotoIds.size > 0}
        title={`Supprimer ${selectedPhotoIds.size} cliché${selectedPhotoIds.size > 1 ? "s" : ""} ?`}
        message={`Cette action est irréversible et affectera toutes les galeries des couples qui auraient déjà ces clichés en favoris.`}
        confirmLabel="Supprimer la sélection"
        danger
        onConfirm={() => handleDeletePhoto()}
        onClose={() => setConfirmDeleteSelected(false)}
      />

      <ConfirmModal
        open={!!confirmDeleteCategoryKey}
        title="Supprimer cette catégorie ?"
        message="Les photos existantes ne seront pas supprimées mais elles ne seront plus catégorisées. Les quotas associés seront masqués."
        confirmLabel="Supprimer la catégorie"
        danger
        onConfirm={() => {
          const k = confirmDeleteCategoryKey!;
          const updated = { ...editableCategoryLabels };
          delete updated[k];
          setEditableCategoryLabels(updated);
          setConfirmDeleteCategoryKey(null);
          toast.success("Catégorie supprimée");
        }}
        onClose={() => setConfirmDeleteCategoryKey(null)}
      />

      <ConfirmModal
        open={!!confirmDeleteProjectId}
        title="Supprimer ce couple ?"
        message="Cette action est irréversible. Toutes les données associées (sélection, commentaires, photos dédiées) seront perdues."
        confirmLabel="Supprimer le couple"
        danger
        onConfirm={() => {
          const id = confirmDeleteProjectId!;
          handleDeleteClient(id, clients.find(c => c.id === id)?.name || "");
          setConfirmDeleteProjectId(null);
          setConfirmDeleteClientId(null);
          setEnteredClientId(null);
          toast.success("Couple supprimé");
        }}
        onClose={() => setConfirmDeleteProjectId(null)}
      />

      {/* =================== COMMAND PALETTE =================== */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} items={commandItems} />
    </div>
  );
}

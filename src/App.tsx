import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Sliders, User, RefreshCw, X, Layers, CircleDot, Globe, Images, Bookmark, Heart, MessageSquare, Check, Mail, Key, Lock, Unlock, Clock, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight, FolderOpen, Folder, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Data & Types
import { CategoryTab, BottomNavTab } from './types';
import PhoneFrame from './components/PhoneFrame';
import SwipeCard from './components/SwipeCard';
import ActionButtons from './components/ActionButtons';
import LikesView from './components/LikesView';
import ChatView from './components/ChatView';
import ProfileView from './components/ProfileView';
import FinishView from './components/FinishView';
import AdminView from './components/AdminView';
import ZoomLightbox from './components/ZoomLightbox';
import { NumericKeypad } from './components/NumericKeypad';
import { AnimatedCheck, ConfettiBurst, HeartBurst, PageTransition, SmartImage, ConfirmModal } from './components/Shared';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { useSound, useTheme } from './hooks';

import {
  getGlobalPhotos, getClients, getActiveClientId, getIsAdminMode,
  saveClients, setActiveClientId, setIsAdminMode, ClientAccount, WeddingPhoto,
  CategoryLabels, getCategoryLabels, saveCategoryLabels
} from './utils/weddingData';

export default function App() {
  // Global Data States
  const [globalPhotos, setGlobalPhotos] = useState<WeddingPhoto[]>(() => getGlobalPhotos());
  const [clientsList, setClientsList] = useState<ClientAccount[]>(() => getClients());
  const [activeClientId, setActiveClientIdState] = useState<string>(() => getActiveClientId());
  const [isAdminMode, setIsAdminModeState] = useState<boolean>(() => getIsAdminMode());
  const [categoryLabels, setCategoryLabels] = useState<CategoryLabels>(() => getCategoryLabels());

  // Lightbox zoom preview modal state
  const [lightboxPhoto, setLightboxPhoto] = useState<WeddingPhoto | null>(null);

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<BottomNavTab>('Swipe');
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('Tout');
  const [direction, setDirection] = useState<1 | -1>(1);

  // Dynamic celebratory notification
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [heartBurst, setHeartBurst] = useState<{ trigger: number; x: number; y: number }>({ trigger: 0, x: 0, y: 0 });

  // Comments/messages state on current photo
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Client Sidebar collapse state
  const [isClientSidebarCollapsed, setIsClientSidebarCollapsed] = useState(false);

  // Finish sorting modal state
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

  // Onboarding Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const currClient = clientsList.find(c => c.id === activeClientId) || clientsList[0];
    if (currClient && !isAdminMode) {
      const tutorialKey = `hasSeenTutorial_${currClient.id}`;
      const hasSeen = localStorage.getItem(tutorialKey);
      if (!hasSeen) {
        setShowTutorial(true);
      }
    }
  }, [activeClientId, isAdminMode, clientsList]);

  const handleCloseTutorial = () => {
    const currClient = clientsList.find(c => c.id === activeClientId) || clientsList[0];
    if (currClient) {
      localStorage.setItem(`hasSeenTutorial_${currClient.id}`, 'true');
    }
    setShowTutorial(false);
  };

  const getActiveClient = useCallback(() => {
    return clientsList.find(c => c.id === activeClientId) || clientsList[0];
  }, [clientsList, activeClientId]);

  const calculateSortingDuration = useCallback(() => {
    const curr = clientsList.find(c => c.id === activeClientId) || clientsList[0];
    if (!curr) return "N/A";
    const start = new Date(curr.sortingStartTime || curr.createdAt || Date.now()).getTime();
    const end = curr.sortingEndTime ? new Date(curr.sortingEndTime).getTime() : Date.now();
    const diffMs = Math.max(1000, end - start);
    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes} min ${seconds} sec`;
    return `${seconds} secondes`;
  }, [clientsList, activeClientId]);

  const handleFinishSorting = () => {
    goToTab('Finish');
  };

  // Admin passcode states
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(true);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Theme + sound
  useTheme();
  const sound = useSound();

  const handleVerifyPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = adminPasscode.trim().toLowerCase();
    if (clean === '0237' || clean === 'adgère237' || clean === 'adgere237') {
      setIsAdminAuthorized(true);
      localStorage.setItem('wedding_admin_authorized', 'true');
      setIsPasscodeModalOpen(false);
      setAdminPasscode('');
      setPasscodeError('');
      setIsAdminModeState(true);
      setIsAdminMode(true);
      sound.play("pop");
    } else {
      setPasscodeError('Code d\'accès incorrect');
    }
  };

  // Load real-time database with fail-safe selection merging
  useEffect(() => {
    fetch("/api/database")
      .then(res => {
        if (!res.ok) throw new Error("API Offline");
        return res.json();
      })
      .then(db => {
        if (db && db.globalPhotos && db.clientsList) {
          setGlobalPhotos(db.globalPhotos);
          
          const localClients = getClients();
          const localMap = new Map(localClients.map(c => [c.id, c]));

          const mergedClients = db.clientsList.map((serverC: any) => {
            const localC = localMap.get(serverC.id);
            if (!localC) return serverC;

            const mergedSelected = Array.from(new Set([...(serverC.selectedPhotoIds || []), ...(localC.selectedPhotoIds || [])]));
            const mergedDisliked = Array.from(new Set([...(serverC.dislikedPhotoIds || [])]))
              .filter((id: string) => !mergedSelected.includes(id));

            const mergedComments = {
              ...(localC.photoComments || {}),
              ...(serverC.photoComments || {})
            };

            const mergedChoices = {
              ...(localC.photoChoices || {}),
              ...(serverC.photoChoices || {})
            };

            return {
              ...serverC,
              selectedPhotoIds: mergedSelected,
              dislikedPhotoIds: mergedDisliked,
              photoComments: mergedComments,
              photoChoices: mergedChoices
            };
          });

          saveClients(mergedClients);
          setClientsList(mergedClients);
        }
      })
      .catch(err => { /* offline fallback */ });
  }, []);

  // Detect /adgère237 or /admin in URL vs Client URL
  useEffect(() => {
    const rawPath = window.location.pathname;
    const rawSearch = window.location.search;
    const rawHash = window.location.hash;

    const decodedPath = decodeURIComponent(rawPath).toLowerCase();
    const decodedSearch = decodeURIComponent(rawSearch).toLowerCase();
    const decodedHash = decodeURIComponent(rawHash).toLowerCase();

    const isAdgereRoute = 
      decodedPath.includes('adgère237') || 
      decodedPath.includes('adgere237') ||
      decodedSearch.includes('adgère237') ||
      decodedSearch.includes('adgere237') ||
      decodedHash.includes('adgère237') ||
      decodedHash.includes('adgere237') ||
      rawPath.includes('adg%c3%a8re237') ||
      rawPath.includes('adg%C3%A8re237') ||
      decodedPath.endsWith('/admin') ||
      decodedSearch.includes('admin=true');

    const hasClientParam = rawSearch.includes('client=') || decodedSearch.includes('client=');

    if (isAdgereRoute) {
      setIsAdminAuthorized(true);
      localStorage.setItem('wedding_admin_authorized', 'true');
      setIsAdminModeState(true);
      setIsAdminMode(true);
    } else if (hasClientParam) {
      // Force Client View when accessing via ?client= URL
      setIsAdminModeState(false);
      setIsAdminMode(false);
    }
  }, []);

  // Direct access URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let targetId = params.get('client');
    if (!targetId && window.location.hash) {
      const parsedHash = window.location.hash.replace('#', '').trim();
      if (parsedHash && parsedHash !== 'admin') targetId = parsedHash;
    }
    if (targetId) {
      setActiveClientIdState(targetId);
      setActiveClientId(targetId);
    }
  }, []);

  const refreshDatabase = useCallback(() => {
    fetch("/api/database")
      .then(res => res.json())
      .then(db => {
        if (db && db.globalPhotos && db.clientsList) {
          setGlobalPhotos(db.globalPhotos);
          
          const localClients = getClients();
          const localMap = new Map(localClients.map(c => [c.id, c]));

          const mergedClients = db.clientsList.map((serverC: any) => {
            const localC = localMap.get(serverC.id);
            if (!localC) return serverC;

            const mergedSelected = Array.from(new Set([...(serverC.selectedPhotoIds || []), ...(localC.selectedPhotoIds || [])]));
            const mergedDisliked = Array.from(new Set([...(serverC.dislikedPhotoIds || []), ...(localC.dislikedPhotoIds || [])]))
              .filter(id => !mergedSelected.includes(id));

            return {
              ...serverC,
              selectedPhotoIds: mergedSelected,
              dislikedPhotoIds: mergedDisliked,
              photoComments: { ...(localC.photoComments || {}), ...(serverC.photoComments || {}) }
            };
          });

          setClientsList(mergedClients);
          saveClients(mergedClients);
          if (db.categoryLabels) {
            setCategoryLabels(db.categoryLabels);
            saveCategoryLabels(db.categoryLabels);
          }
        }
      })
      .catch(() => {
        setGlobalPhotos(getGlobalPhotos());
        setClientsList(getClients());
        setCategoryLabels(getCategoryLabels());
      });
  }, []);

  const handleSwitchToClient = (clientId: string) => {
    setActiveClientIdState(clientId);
    setActiveClientId(clientId);
    setIsAdminModeState(false);
    setIsAdminMode(false);
    setActiveTab('Swipe');
    setActiveCategory('Tout');
    refreshDatabase();
  };

  const handleEnterAdmin = () => {
    setIsAdminModeState(true);
    setIsAdminMode(true);
  };

  const handleCloseAdmin = () => {
    setIsAdminModeState(false);
    setIsAdminMode(false);
    refreshDatabase();
  };

  const activeClient = clientsList.find(c => c.id === activeClientId) || clientsList[0];
  const selectedPhotos = activeClient
    ? globalPhotos
        .filter(photo => activeClient.selectedPhotoIds.includes(photo.id))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
    : [];

  const currentCategoryLabels = useMemo(() => {
    const merged: Record<string, string> = activeClient?.categoryLabels
      ? { ...activeClient.categoryLabels }
      : {};

    if (activeClient) {
      const hasSpecific = globalPhotos.some(p => p.clientId === activeClient.id);
      const hasAnySpecific = globalPhotos.some(p => !!p.clientId);
      const clientPhotos = hasSpecific 
        ? globalPhotos.filter(p => p.clientId === activeClient.id) 
        : (hasAnySpecific ? [] : globalPhotos.filter(p => !p.clientId));

      clientPhotos.forEach(p => {
        if (p.category && !merged[p.category]) {
          let label = p.category;
          if (label.startsWith('custom-')) {
            const parts = label.split('-');
            label = parts.slice(1, parts.length - 1).join(' ') || p.category;
            label = label.charAt(0).toUpperCase() + label.slice(1);
          }
          merged[p.category] = label;
        }
      });
    }

    return merged;
  }, [categoryLabels, activeClient, globalPhotos]);

  const getActiveClientPhotos = useCallback(() => {
    if (!activeClient) return [];
    return globalPhotos.filter(p => p.clientId === activeClient.id);
  }, [activeClient, globalPhotos]);

  const firstCat = Object.keys(currentCategoryLabels)[0] || 'Dot';
  const secondCat = Object.keys(currentCategoryLabels)[1] || 'Globale';
  const thirdCat = Object.keys(currentCategoryLabels)[2] || 'Album';

  const dotCount = selectedPhotos.filter(p => p.category === firstCat).length;
  const globaleCount = selectedPhotos.filter(p => p.category === secondCat).length;
  const albumCount = selectedPhotos.filter(p => p.category === thirdCat).length;

  const dotTotal = activeClient ? getActiveClientPhotos().filter(p => p.category === firstCat).length : 0;
  const globaleTotal = activeClient ? getActiveClientPhotos().filter(p => p.category === secondCat).length : 0;
  const albumTotal = activeClient ? getActiveClientPhotos().filter(p => p.category === thirdCat).length : 0;

  useEffect(() => {
    if (!activeClient && clientsList.length > 0) {
      setActiveClientIdState(clientsList[0].id);
      setActiveClientId(clientsList[0].id);
    }
  }, [activeClient, clientsList]);

  // Keyboard shortcuts for Swipe actions
  useEffect(() => {
    if (!activeClient) return;
    const handler = (e: KeyboardEvent) => {
      if (activeTab !== 'Swipe') return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); handleSwipeAction('left'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleSwipeAction('right'); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); handleSwipeAction('up'); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); handleSwipeAction('down'); }
      else if (e.key === 'u' || e.key === 'U') { e.preventDefault(); handleUndoAction(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, activeClient]);

  const getClientPhotoQueue = (): WeddingPhoto[] => {
    if (!activeClient) return [];
    let filtered = getActiveClientPhotos();
    if (activeCategory !== 'Tout') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    return filtered
      .filter(p =>
        !activeClient.selectedPhotoIds.includes(p.id) &&
        !activeClient.dislikedPhotoIds.includes(p.id)
      )
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  };

  const photoQueue = getClientPhotoQueue();
  const currentPhoto = photoQueue[0];
  const nextPhotos = photoQueue.slice(1, 3);

  const likeBtnRef = useRef<HTMLDivElement>(null);

  const handleSwipeAction = (dir: 'left' | 'right' | 'up' | 'down') => {
    if (!currentPhoto || !activeClient) return;
    if (activeClient.isLocked) return;

    const photoId = currentPhoto.id;
    const updatedClients = clientsList.map(client => {
      if (client.id === activeClient.id) {
        if (dir === 'right' || dir === 'up' || dir === 'down') {
          const updatedLikes = client.selectedPhotoIds.includes(photoId)
            ? client.selectedPhotoIds
            : [...client.selectedPhotoIds, photoId];

          const choiceType = dir === 'right' ? 'Album' : (dir === 'down' ? 'Dot' : 'Classique');
          const updatedChoices = { ...(client.photoChoices || {}), [photoId]: choiceType };

          if (dir === 'right') {
            // Heart burst from Like button position
            if (likeBtnRef.current) {
              const rect = likeBtnRef.current.getBoundingClientRect();
              setHeartBurst({ trigger: Date.now(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            }
            sound.play("like");
          } else {
            sound.play("pop");
          }
          return {
            ...client,
            selectedPhotoIds: updatedLikes,
            dislikedPhotoIds: client.dislikedPhotoIds.filter(id => id !== photoId),
            photoChoices: updatedChoices
          };
        } else {
          sound.play("nope");
          const updatedDislikes = client.dislikedPhotoIds.includes(photoId)
            ? client.dislikedPhotoIds
            : [...client.dislikedPhotoIds, photoId];
          return {
            ...client,
            dislikedPhotoIds: updatedDislikes,
            selectedPhotoIds: client.selectedPhotoIds.filter(id => id !== photoId)
          };
        }
      }
      return client;
    });

    saveClients(updatedClients);
    setClientsList(updatedClients);

    const updatedActive = updatedClients.find(c => c.id === activeClient.id);
    if (updatedActive) {
      fetch("/api/clients/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          selectedPhotoIds: updatedActive.selectedPhotoIds || [],
          dislikedPhotoIds: updatedActive.dislikedPhotoIds || [],
          photoComments: updatedActive.photoComments || {},
          photoChoices: updatedActive.photoChoices
        })
      }).catch(() => {});
    }

    // Check if we just hit the target count
    const activeTargetCount = activeClient.targetCount || 5;
    if (updatedActive && updatedActive.selectedPhotoIds.length === activeTargetCount) {
      sound.play("pop");
      setConfettiTrigger(Date.now());
    }
  };

  const handleUndoAction = () => {
    if (!activeClient) return;
    if (activeClient.selectedPhotoIds.length === 0 && activeClient.dislikedPhotoIds.length === 0) return;
    sound.play("tap");
    const updatedClients = clientsList.map(client => {
      if (client.id === activeClient.id) {
        const lastSelected = client.selectedPhotoIds[client.selectedPhotoIds.length - 1];
        const lastDisliked = client.dislikedPhotoIds[client.dislikedPhotoIds.length - 1];
        if (lastSelected) {
          return { ...client, selectedPhotoIds: client.selectedPhotoIds.filter(id => id !== lastSelected) };
        } else if (lastDisliked) {
          return { ...client, dislikedPhotoIds: client.dislikedPhotoIds.filter(id => id !== lastDisliked) };
        }
      }
      return client;
    });
    saveClients(updatedClients);
    setClientsList(updatedClients);

    const updatedActive = updatedClients.find(c => c.id === activeClient.id);
    if (updatedActive) {
      fetch("/api/clients/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          selectedPhotoIds: updatedActive.selectedPhotoIds || [],
          dislikedPhotoIds: updatedActive.dislikedPhotoIds || [],
          photoComments: updatedActive.photoComments || {},
          photoChoices: updatedActive.photoChoices
        })
      }).catch(() => {});
    }
  };

  const handleRemoveFavorite = (photoId: string) => {
    if (!activeClient) return;
    if (activeClient.isLocked) return;
    const updatedClients = clientsList.map(client => {
      if (client.id === activeClient.id) {
        const updatedChoices = { ...(client.photoChoices || {}) };
        delete updatedChoices[photoId];
        return {
          ...client,
          selectedPhotoIds: client.selectedPhotoIds.filter(id => id !== photoId),
          photoChoices: updatedChoices
        };
      }
      return client;
    });
    saveClients(updatedClients);
    setClientsList(updatedClients);

    const updatedActive = updatedClients.find(c => c.id === activeClient.id);
    if (updatedActive) {
      fetch("/api/clients/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          selectedPhotoIds: updatedActive.selectedPhotoIds || [],
          dislikedPhotoIds: updatedActive.dislikedPhotoIds || [],
          photoComments: updatedActive.photoComments || {},
          photoChoices: updatedActive.photoChoices
        })
      }).catch(() => {});
    }
  };

  const handleResetSelection = () => {
    if (!activeClient) return;
    if (activeClient.isLocked) return;
    const updatedClients = clientsList.map(client => {
      if (client.id === activeClient.id) {
        return { ...client, selectedPhotoIds: [], dislikedPhotoIds: [], photoChoices: {} };
      }
      return client;
    });
    setClientsList(updatedClients);
    saveClients(updatedClients);

    fetch("/api/clients/selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: activeClient.id,
        selectedPhotoIds: [],
        dislikedPhotoIds: [],
        photoComments: activeClient.photoComments || {},
        photoChoices: {}
      })
    }).catch(() => {});
  };

  const handleUpdatePhotoChoice = (photoId: string, choice: 'Album' | 'Classique' | 'Dot') => {
    if (!activeClient || activeClient.isLocked) return;
    sound.play("tap");
    const updatedClients = clientsList.map(client => {
      if (client.id === activeClient.id) {
        const updatedChoices = { ...(client.photoChoices || {}), [photoId]: choice };
        return { ...client, photoChoices: updatedChoices };
      }
      return client;
    });
    setClientsList(updatedClients);
    saveClients(updatedClients);

    const updatedActive = updatedClients.find(c => c.id === activeClient.id);
    if (updatedActive) {
      fetch("/api/clients/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          selectedPhotoIds: updatedActive.selectedPhotoIds || [],
          dislikedPhotoIds: updatedActive.dislikedPhotoIds || [],
          photoComments: updatedActive.photoComments || {},
          photoChoices: updatedActive.photoChoices || {}
        })
      }).catch(() => {});
    }
  };

  const handleToggleFavorite = (photoId: string) => {
    if (!activeClient) return;
    if (activeClient.isLocked) return;
    const isCurrentlyFavorite = activeClient.selectedPhotoIds.includes(photoId);
    let updatedClients;
    if (isCurrentlyFavorite) {
      updatedClients = clientsList.map(client => client.id === activeClient.id
        ? { ...client, selectedPhotoIds: client.selectedPhotoIds.filter(id => id !== photoId) }
        : client);
    } else {
      updatedClients = clientsList.map(client => client.id === activeClient.id
        ? { ...client, selectedPhotoIds: [...client.selectedPhotoIds, photoId], dislikedPhotoIds: client.dislikedPhotoIds.filter(id => id !== photoId) }
        : client);
    }
    saveClients(updatedClients);
    setClientsList(updatedClients);

    const updatedActive = updatedClients.find(c => c.id === activeClient.id);
    if (updatedActive) {
      fetch("/api/clients/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          selectedPhotoIds: updatedActive.selectedPhotoIds || [],
          dislikedPhotoIds: updatedActive.dislikedPhotoIds || [],
          photoComments: updatedActive.photoComments || {},
          photoChoices: updatedActive.photoChoices
        })
      }).catch(() => {});
    }
  };

  const handleLockActiveClient = () => {
    if (!activeClient) return;
    setConfettiTrigger(Date.now());
    sound.play("lock");
    const updatedClients = clientsList.map(client =>
      client.id === activeClient.id ? { ...client, isLocked: true } : client
    );
    saveClients(updatedClients);
    setClientsList(updatedClients);

    fetch("/api/clients/selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: activeClient.id,
        selectedPhotoIds: activeClient.selectedPhotoIds || [],
        dislikedPhotoIds: activeClient.dislikedPhotoIds || [],
        photoComments: activeClient.photoComments || {},
        photoChoices: activeClient.photoChoices
      })
    }).catch(() => {});

    fetch(`/api/chats/${activeClient.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "client", text: "🔒 Sélection Figée & Envoyée pour Tirage Royale ! Notre tri de photos est validé et prêt à être imprimé." })
    }).catch(err => { /* noop */ });
  };

  const handleUpdatePhotoComment = (photoId: string, comment: string) => {
    if (!activeClient) return;
    const updatedClients = clientsList.map(client => client.id === activeClient.id
      ? { ...client, photoComments: { ...(client.photoComments || {}), [photoId]: comment } }
      : client);
    saveClients(updatedClients);
    setClientsList(updatedClients);

    const updatedActive = updatedClients.find(c => c.id === activeClient.id);
    if (updatedActive) {
      fetch("/api/clients/selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeClient.id,
          selectedPhotoIds: updatedActive.selectedPhotoIds || [],
          dislikedPhotoIds: updatedActive.dislikedPhotoIds || [],
          photoComments: updatedActive.photoComments || {},
          photoChoices: updatedActive.photoChoices
        })
      }).catch(() => {});
    }
  };

  const handleResetClientSwipes = () => {
    if (!activeClient) return;
    const updatedClients = clientsList.map(client => client.id === activeClient.id
      ? { ...client, selectedPhotoIds: [], dislikedPhotoIds: [], photoChoices: {} }
      : client);
    saveClients(updatedClients);
    setClientsList(updatedClients);
    fetch("/api/clients/selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: activeClient.id,
        selectedPhotoIds: [],
        dislikedPhotoIds: [],
        photoComments: activeClient.photoComments || {},
        photoChoices: {}
      })
    }).catch(err => { /* noop */ });
  };

  const handleSendComment = () => {
    if (!activeClient || !currentPhoto || !commentText.trim()) return;
    const formattedText = `💬 Photo "${currentPhoto.name}" : ${commentText.trim()}`;
    const storageKey = `wedding_chat_history_${activeClient.id}`;
    let localMsgs: any[] = [];
    try {
      const data = localStorage.getItem(storageKey);
      if (data) {
        localMsgs = JSON.parse(data);
      } else {
        localMsgs = [
          { id: '1', text: `Félicitations encore pour votre merveilleux mariage, ${activeClient.name} ! 🎉`, sender: 'them', time: 'Hier, 10:00' },
          { id: '2', text: `J'ai terminé le tri des photos de votre journée d'exception. J'ai chargé les clichés dans votre espace de tri. Votre objectif de sélection est de ${activeClient.targetCount} photos favorites.`, sender: 'them', time: 'Hier, 10:02' },
          { id: '3', text: `Faites simplement glisser à droite ("PRENDRE") les photos que vous voulez absolument dans votre album physique final. Écrivez-moi ici si vous voulez des retouches sur un cliché !`, sender: 'them', time: 'Hier, 10:05' }
        ];
      }
    } catch (e) {
      localMsgs = [];
    }
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { id: Date.now().toString(), text: formattedText, sender: 'me' as const, time: timeString };
    const updated = [...localMsgs, newMsg];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    fetch(`/api/chats/${activeClient.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "client", text: formattedText })
    })
      .then(() => {
        setTimeout(() => {
          const reply = `Merci pour votre note sur le cliché "${currentPhoto.name}". J'en prends bonne note ! 👍`;
          const simulated = { id: (Date.now() + 1).toString(), text: reply, sender: 'them' as const, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          try {
            const currentHistory = JSON.parse(localStorage.getItem(storageKey) || '[]');
            localStorage.setItem(storageKey, JSON.stringify([...currentHistory, simulated]));
          } catch(e) { /* noop */ }
          fetch(`/api/chats/${activeClient.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sender: "photographer", text: reply })
          }).catch(() => { /* noop */ });
        }, 1500);
      })
      .catch(err => { /* noop */ });
    setCommentSuccess(true);
    setTimeout(() => {
      setIsCommentModalOpen(false);
      setCommentSuccess(false);
      setCommentText('');
    }, 1200);
  };

  const getMappedProfile = (photo: WeddingPhoto) => ({
    id: photo.id,
    name: photo.name,
    age: activeClient ? activeClient.selectedPhotoIds.length + 1 : 1,
    distance: `${photo.category}`,
    status: `${activeClient ? activeClient.selectedPhotoIds.length : 0} / ${activeClient ? activeClient.targetCount : 5} validés`,
    verified: true,
    image: photo.image,
    images: [photo.image],
    bio: "Faites glisser à droite ou appuyez sur le coeur pour valider ce cliché dans votre album de noces !"
  });

  const navOrder: BottomNavTab[] = ['Swipe', 'Explore', 'Likes', 'Conversations', 'Chat'];
  const goToTab = (tab: BottomNavTab) => {
    const currentIdx = navOrder.indexOf(activeTab);
    const newIdx = navOrder.indexOf(tab);
    setDirection(newIdx > currentIdx ? 1 : -1);
    setActiveTab(tab);
  };

  if (isAdminMode) {
    return (
      <div className="w-full h-screen flex flex-col relative min-h-0 bg-[var(--bg-app)] overflow-hidden">
        <ConfettiBurst trigger={confettiTrigger} />
        <AdminView
          onSwitchToClient={handleSwitchToClient}
          onClose={handleCloseAdmin}
          onRefreshPhotos={refreshDatabase}
          categoryLabels={categoryLabels}
          onUpdateCategoryLabels={(newLabels) => {
            setCategoryLabels(newLabels);
            saveCategoryLabels(newLabels);
            fetch("/api/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ categoryLabels: newLabels })
            }).catch(err => { /* noop */ });
          }}
        />
      </div>
    );
  }

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col relative min-h-0 bg-[var(--bg-app)]">
        <ConfettiBurst trigger={confettiTrigger} />
        <HeartBurst trigger={heartBurst.trigger} x={heartBurst.x} y={heartBurst.y} />

        {/* CLIENT MODE */}
        <div className="flex-1 flex flex-col xl:flex-row min-h-0 relative divide-y xl:divide-y-0 xl:divide-x divide-brand-sand select-none">

            {/* DESKTOP LEFT SIDEBAR (RETRACTABLE) */}
            {activeClient && (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-[var(--bg-subtle)] hidden xl:flex flex-col shrink-0 border-r border-brand-sand justify-between overflow-y-auto no-scrollbar transition-all duration-300 relative select-none ${
                  isClientSidebarCollapsed ? 'w-16 p-3 items-center' : 'w-64 xl:w-72 p-5 xl:p-6'
                }`}
              >
                <div className="space-y-4 w-full">
                  {/* Top Header */}
                  <div className="pb-3 border-b border-brand-sand flex items-center justify-between gap-1 w-full">
                    <div className="flex flex-col text-left min-w-0 flex-1">
                      <span className="text-[9.5px] font-extrabold uppercase text-brand-gold tracking-widest font-serif-display block leading-normal mb-0.5">
                        Maison Marvel
                      </span>
                      <h1 className="text-sm font-serif-display font-black text-brand-olive uppercase leading-tight tracking-tight truncate">
                        L'ALBUM DE NOCES
                      </h1>
                      <p className="text-[9.5px] font-serif-display text-brand-sage italic mt-0.5 leading-tight">
                        Votre livre d'or interactif
                      </p>
                    </div>
                  </div>

                  {/* Couple Info & Progress */}
                  {!isClientSidebarCollapsed ? (
                    <div className="py-1 flex flex-col text-left space-y-1.5 w-full">
                      <span className="text-[8.5px] font-extrabold uppercase text-brand-sage tracking-wider">Espace Couple</span>
                      <p className="text-lg sm:text-xl xl:text-2xl font-serif-display font-black text-brand-olive uppercase tracking-tight leading-tight my-1.5 break-words">{activeClient.name}</p>

                      <div className="bg-[var(--bg-subtle)] border border-brand-sand/60 rounded-xl p-3 flex flex-col space-y-1.5 shadow-5xs">
                        <div className="flex justify-between items-center text-sm text-brand-olive font-extrabold">
                          <span>Ma Sélection</span>
                          <span className="text-brand-gold font-black tabular-nums">{selectedPhotos.length} / {activeClient.targetCount}</span>
                        </div>
                        <div className="h-1.5 w-full bg-brand-sand/35 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full gradient-pan rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (selectedPhotos.length / activeClient.targetCount) * 100)}%` }}
                            transition={{ type: "spring", damping: 22, stiffness: 200 }}
                          />
                        </div>
                        <span className="text-xs sm:text-sm text-brand-sage leading-normal font-serif-display italic">
                          {selectedPhotos.length >= activeClient.targetCount
                            ? "🎉 Objectif de sélection complété !"
                            : `Encore ${activeClient.targetCount - selectedPhotos.length} clichés à choisir.`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-brand-cream/80 border border-brand-sand/60 text-brand-olive w-full"
                      title={`Sélection: ${selectedPhotos.length} / ${activeClient.targetCount}`}
                    >
                      <Heart className="w-3.5 h-3.5 text-brand-gold fill-brand-gold/20 mb-0.5" />
                      <span className="text-[10px] font-black tabular-nums">{selectedPhotos.length}</span>
                      <span className="text-[8px] text-brand-sage">/ {activeClient.targetCount}</span>
                    </div>
                  )}

                  {/* Navigation List */}
                  <div className="space-y-1 flex flex-col w-full">
                    {!isClientSidebarCollapsed && (
                      <span className="text-[8.5px] font-extrabold uppercase text-brand-sage tracking-wider mb-1 block text-left">Navigation</span>
                    )}

                    {[
                      { tab: 'Swipe' as BottomNavTab, label: 'Tri-photos', Icon: Layers },
                      { tab: 'Explore' as BottomNavTab, label: 'Ma Sélection', Icon: Heart, badge: globalPhotos.filter(p => activeClient?.selectedPhotoIds?.includes(p.id)).length },
                      { tab: 'Chat' as BottomNavTab, label: 'Messagerie', Icon: Mail },
                      { tab: 'Profil' as BottomNavTab, label: 'Mon Profil', Icon: User }
                    ].map((item) => {
                      const getFolderPhotoCount = (catKey: string): number => {
                        if (!activeClient) return 0;
                        const clientPhotos = getActiveClientPhotos();
                        if (catKey === 'Tout') {
                          return clientPhotos.length;
                        }
                        return clientPhotos.filter(p => p.category === catKey).length;
                      };

                      return (
                        <React.Fragment key={item.tab}>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              goToTab(item.tab);
                              if (item.tab === 'Swipe') {
                                setActiveCategory('Tout');
                              }
                            }}
                            title={isClientSidebarCollapsed ? item.label : undefined}
                            className={`flex items-center justify-between rounded-xl text-left text-[11px] font-extrabold uppercase tracking-wide transition-all cursor-pointer outline-none border-none relative ${
                              isClientSidebarCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2'
                            } ${
                              activeTab === item.tab
                                ? 'bg-brand-olive text-brand-cream shadow-xs'
                                : 'text-brand-sage hover:text-brand-olive hover:bg-brand-cream'
                            }`}
                          >
                            {activeTab === item.tab && (
                              <motion.span
                                layoutId="sidebar-pill"
                                className="absolute inset-0 bg-brand-olive rounded-xl"
                                transition={{ type: "spring", damping: 22, stiffness: 240 }}
                              />
                            )}
                            <span className={`relative z-10 flex items-center ${isClientSidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                              <item.Icon className="w-3.5 h-3.5 shrink-0" />
                              {!isClientSidebarCollapsed && <span className="truncate max-w-[120px]">{item.label}</span>}
                            </span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <span className={`relative z-10 bg-brand-rose text-white font-bold text-[8.5px] flex items-center justify-center rounded-full leading-none shadow-xs font-sans tabular-nums ${
                                isClientSidebarCollapsed ? 'absolute -top-1 -right-1 w-4 h-4 border border-white' : 'min-w-[16px] h-3.5 px-1'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </motion.button>

                          {/* Sub-menu containing photo folders with (count) */}
                          {item.tab === 'Swipe' && !isClientSidebarCollapsed && (
                            <div className="ml-3 pl-2 border-l-2 border-brand-sand/70 my-1 space-y-1">
                              {/* Option Tous les dossiers */}
                              <button
                                type="button"
                                onClick={() => {
                                  goToTab('Swipe');
                                  setActiveCategory('Tout');
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs xl:text-sm font-bold text-left transition-all cursor-pointer ${
                                  activeTab === 'Swipe' && activeCategory === 'Tout'
                                    ? 'bg-brand-gold/20 text-brand-olive font-black'
                                    : 'text-brand-sage hover:text-brand-olive hover:bg-brand-cream/80'
                                }`}
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <FolderOpen className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                                  <span className="truncate">Tous les dossiers</span>
                                </span>
                                <span className="text-[11px] xl:text-xs font-mono font-bold text-brand-olive/80 shrink-0">
                                  ({getFolderPhotoCount('Tout')})
                                </span>
                              </button>

                              {/* List of custom photo folders containing photos */}
                              {Object.entries(currentCategoryLabels).map(([catKey, label]) => {
                                const count = getFolderPhotoCount(catKey);
                                if (count === 0) return null;
                                const isSelected = activeTab === 'Swipe' && activeCategory === catKey;

                                return (
                                  <button
                                    key={catKey}
                                    type="button"
                                    onClick={() => {
                                      goToTab('Swipe');
                                      setActiveCategory(catKey);
                                    }}
                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs xl:text-sm font-bold text-left transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-brand-gold/20 text-brand-olive font-black'
                                        : 'text-brand-sage hover:text-brand-olive hover:bg-brand-cream/80'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5 truncate">
                                      <Folder className="w-3.5 h-3.5 text-brand-gold/80 shrink-0" />
                                      <span className="truncate">{label}</span>
                                    </span>
                                    <span className="text-[11px] xl:text-xs font-mono font-bold text-brand-olive/80 shrink-0">
                                      ({count})
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Finish Sorting Button */}
                <div className="pt-3 border-t border-brand-sand shrink-0 w-full">
                  <button
                    type="button"
                    onClick={handleFinishSorting}
                    className={`w-full py-2 rounded-xl text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${
                      activeClient?.isLocked
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-brand-olive text-brand-cream hover:bg-brand-moss border-brand-moss'
                    } ${isClientSidebarCollapsed ? 'px-1' : 'px-3'}`}
                  >
                    {activeClient?.isLocked ? <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-600" /> : <CheckSquare className="w-3.5 h-3.5 shrink-0 text-brand-gold" />}
                    {!isClientSidebarCollapsed && <span>{activeClient?.isLocked ? 'Tri Validé' : 'Terminer Mon Tri'}</span>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* CENTER MAIN */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              {activeTab !== 'Chat' && activeTab !== 'Profile' && activeClient && (
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="min-h-[56px] py-1.5 shrink-0 bg-[var(--bg-panel)] border-b border-brand-sand px-3 sm:px-4 flex items-center justify-between z-44 sticky top-0 shadow-sm md:hidden gap-2"
                >
                  <div className="flex flex-col items-start text-left min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-brand-gold tracking-widest leading-none font-serif-display">
                      <span>Album de Noces</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-serif-display font-black text-brand-olive mt-0.5 leading-tight truncate max-w-full">{activeClient.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goToTab('Chat')}
                      className="w-8 h-8 rounded-full border border-brand-sand bg-brand-cream hover:bg-brand-sand text-brand-olive flex items-center justify-center transition-all cursor-pointer shadow-sm relative outline-none"
                      title="Contacter le photographe"
                      aria-label="Messagerie"
                    >
                      <Mail className="w-4 h-4 text-brand-olive" />
                    </button>
                    {(() => {
                      const selCount = selectedPhotos.length;
                      const targetCount = activeClient.targetCount;
                      const isOverQuota = targetCount > 0 && selCount > targetCount;
                      const isExactQuota = targetCount > 0 && selCount === targetCount;
                      return (
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                          isOverQuota
                            ? 'bg-red-50 text-red-600 border-red-300 animate-pulse font-black shadow-sm'
                            : isExactQuota
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black shadow-xs'
                            : 'bg-brand-cream border-brand-sand text-brand-olive'
                        }`}>
                          <Heart className={`w-3.5 h-3.5 ${
                            isOverQuota
                              ? 'text-red-500 fill-red-500/20'
                              : isExactQuota
                              ? 'text-emerald-600 fill-emerald-600/20'
                              : 'text-brand-gold fill-brand-gold/10'
                          }`} />
                          <span className="text-[11px] font-bold tracking-tight tabular-nums">
                            {selCount} / {targetCount}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}

              {activeTab === 'Swipe' && activeClient && (
                <div className="bg-[var(--bg-panel)]/80 backdrop-blur border-b border-brand-sand py-1.5 px-2 flex items-center gap-2 justify-between z-40 relative shrink-0 max-w-full overflow-hidden">
                  <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-brand-sage whitespace-nowrap tabular-nums hidden sm:inline shrink-0">
                    Photo {currentPhoto ? photoQueue.findIndex(p => p.id === currentPhoto.id) + 1 : 0} / {photoQueue.length}
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 justify-start sm:justify-center">
                  {['Tout', ...Object.keys(currentCategoryLabels)].map((cat) => {
                    const isActive = activeCategory === cat;
                    const displayName = cat === 'Tout' ? 'TOUT' : (currentCategoryLabels[cat] || cat);
                    const clientPhotos = getActiveClientPhotos();
                    const totalPhotosInFolder = cat === 'Tout'
                      ? clientPhotos.length
                      : clientPhotos.filter(p => p.category === cat).length;

                    return (
                      <motion.button
                        key={cat}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveCategory(cat)}
                        className={`relative shrink-0 whitespace-nowrap text-xs sm:text-sm uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'text-brand-cream'
                            : 'bg-brand-cream text-brand-sage hover:text-brand-olive border border-brand-sand/40'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="category-pill"
                            className="absolute inset-0 bg-brand-olive rounded-full shadow-xs"
                            transition={{ type: "spring", damping: 22, stiffness: 240 }}
                          />
                        )}
                        <span className="relative z-10">{displayName}</span>
                        <span className={`relative z-10 text-[10px] sm:text-[11px] tabular-nums rounded-full px-1.5 py-0.5 font-mono ${
                          isActive
                            ? 'bg-white/20 text-brand-cream'
                            : 'bg-brand-sand/80 text-brand-olive/80 font-bold'
                        }`}>
                          ({totalPhotosInFolder})
                        </span>
                      </motion.button>
                    );
                  })}
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-brand-sage whitespace-nowrap hidden md:inline">
                    ← ✕ D C A →
                  </span>
                </div>
              )}

              <div className="flex-1 flex flex-col relative min-h-0">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={activeTab}
                    custom={direction}
                    initial={{ opacity: 0, x: direction * 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -direction * 30 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    {activeTab === 'Swipe' && activeClient?.isLocked ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-brand-olive bg-[var(--bg-app)] space-y-4">
                        <motion.div initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 14, stiffness: 200 }} className="w-20 h-20 rounded-full flex items-center justify-center shadow-sm" style={{ background: "var(--success-bg, #E3F1E8)", border: "1px solid var(--success-border, #9DC9B0)", color: "var(--success, #2D8659)" }}>
                          <Lock className="w-9 h-9 stroke-[2.5]" />
                        </motion.div>
                        <h3 className="text-xl font-serif-display font-black text-brand-olive uppercase tracking-tight">Sélection Figée Royale !</h3>
                        <div className="rounded-xl p-4.5 max-w-[280px] text-[11.5px] leading-relaxed font-serif-display font-medium text-left" style={{ background: "var(--success-bg, #E3F1E8)", color: "var(--success, #2D8659)", border: "1px solid var(--success-border, #9DC9B0)" }}>
                          <strong>Félicitations !</strong> Votre sélection de {activeClient.selectedPhotoIds.length} photos favorites a été validée et verrouillée.
                          <br />
                          <span className="text-[10px] text-brand-gold block mt-1.5 leading-normal">Damien a bien été notifié et procède actuellement aux derniers tirages et à la fabrication de votre album d'exception.</span>
                        </div>
                        <button
                          onClick={() => goToTab('Explore')}
                          className="bg-brand-olive text-brand-cream hover:bg-brand-moss font-bold text-[10px] px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Consulter ma sélection ({activeClient.selectedPhotoIds.length})
                        </button>
                      </div>
                    ) : activeTab === 'Swipe' ? (
                      <div className="flex-1 flex flex-col relative min-h-0">
                        <div className="flex-1 w-full relative min-h-0 bg-[var(--bg-app)]">
                          <AnimatePresence>
                            {currentPhoto ? (
                              <>
                                {/* Stack: top card + 2 background */}
                                <AnimatePresence>
                                  {nextPhotos.map((p, i) => (
                                    <SwipeCard
                                      key={p.id}
                                      profile={getMappedProfile(p)}
                                      onSwipe={() => {}}
                                      active={false}
                                      isTop={false}
                                      stackIndex={i + 1}
                                    />
                                  ))}
                                </AnimatePresence>
                                <SwipeCard
                                  key={currentPhoto.id}
                                  profile={getMappedProfile(currentPhoto)}
                                  onSwipe={handleSwipeAction}
                                  active={true}
                                  isTop={true}
                                  onZoom={() => setLightboxPhoto(currentPhoto)}
                                />
                              </>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-brand-olive select-none z-0"
                              >
                                <motion.div
                                  animate={{ rotate: [0, -10, 10, -5, 0], scale: [1, 1.1, 1] }}
                                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                  className="w-20 h-20 rounded-full bg-brand-sand flex items-center justify-center text-brand-sage mb-4"
                                >
                                  <Heart className="w-9 h-9 fill-brand-rose/30 text-brand-rose" />
                                </motion.div>
                                <h3 className="text-xl font-serif-display font-bold">Sélection achevée !</h3>
                                <p className="text-xs text-brand-sage mt-1.5 max-w-[240px] leading-relaxed mx-auto font-serif-display italic">
                                  Toutes les photos chargées ont été triées pour cette ambiance. Félicitations !
                                </p>
                                <div className="flex flex-col gap-2 w-full max-w-[240px] pt-6">
                                  <button
                                    onClick={() => goToTab('Explore')}
                                    className="bg-brand-olive text-brand-cream hover:bg-brand-moss font-bold text-[11px] px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer uppercase tracking-wider"
                                  >
                                    Voir mes coups de coeur ({activeClient ? activeClient.selectedPhotoIds.length : 0})
                                  </button>
                                  <button
                                    onClick={handleResetClientSwipes}
                                    className="bg-[var(--bg-panel)] border border-brand-sand hover:bg-brand-cream text-brand-sage hover:text-brand-olive text-[10px] py-2 rounded-lg shadow-xs transition-all cursor-pointer font-bold uppercase"
                                  >
                                    Recommencer à zéro
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {currentPhoto && (
                          <div className="absolute bottom-3 inset-x-0 z-30 pointer-events-auto" ref={likeBtnRef}>
                            <div className="max-w-md mx-auto bg-[var(--bg-panel)]/90 backdrop-blur-md border border-brand-sand/60 rounded-2xl shadow-lg py-1 px-2 overflow-hidden">
                              <ActionButtons
                                onSwipe={handleSwipeAction}
                                onUndo={handleUndoAction}
                                canUndo={activeClient ? activeClient.selectedPhotoIds.length > 0 || activeClient.dislikedPhotoIds.length > 0 : false}
                                onCommentClick={() => { setIsCommentModalOpen(true); setCommentText(''); setCommentSuccess(false); }}
                                disabled={activeClient?.isLocked}
                                disabledCategories={{
                                  Dot: activeClient ? (activeClient.targetCategoryQuotas?.['Dot'] !== undefined ? activeClient.targetCategoryQuotas['Dot'] : activeClient.targetCountDot) === -1 : false,
                                  Globale: activeClient ? (activeClient.targetCategoryQuotas?.['Globale'] !== undefined ? activeClient.targetCategoryQuotas['Globale'] : activeClient.targetCountGlobale) === -1 : false,
                                  Album: activeClient ? (activeClient.targetCategoryQuotas?.['Album'] !== undefined ? activeClient.targetCategoryQuotas['Album'] : activeClient.targetCountAlbum) === -1 : false,
                                }}
                                categoryCounts={activeClient ? {
                                  Dot: selectedPhotos.filter(p => activeClient.photoChoices?.[p.id] === 'Dot' || p.category === 'Dot').length,
                                  Globale: selectedPhotos.filter(p => activeClient.photoChoices?.[p.id] === 'Classique' || (!activeClient.photoChoices?.[p.id] && p.category !== 'Album' && p.category !== 'Dot')).length,
                                  Album: selectedPhotos.filter(p => activeClient.photoChoices?.[p.id] === 'Album' || (!activeClient.photoChoices?.[p.id] && p.category === 'Album')).length,
                                  Disliked: activeClient.dislikedPhotoIds.length,
                                } : undefined}
                              />
                            </div>
                          </div>
                        )}

                        <AnimatePresence>
                          {isCommentModalOpen && currentPhoto && (
                            <motion.div
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
                              onClick={() => setIsCommentModalOpen(false)}
                            >
                              <motion.div
                                initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
                                className="bg-[var(--bg-panel)] rounded-2xl border border-brand-sand shadow-2xl p-5 w-full max-w-sm flex flex-col text-left space-y-4"
                                onClick={(e) => e.stopPropagation()}
                                role="dialog" aria-modal="true" aria-label="Commenter la photo"
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="font-serif-display font-medium text-brand-olive text-lg flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-brand-gold" />
                                    Commenter la photo
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() => setIsCommentModalOpen(false)}
                                    aria-label="Fermer"
                                    className="text-brand-sage hover:text-brand-olive p-1 rounded-full hover:bg-brand-cream transition-colors cursor-pointer"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-3 bg-brand-cream p-2.5 rounded-xl border border-brand-sand">
                                  <SmartImage src={currentPhoto.image} alt={currentPhoto.name} fit="cover" className="w-12 h-12 rounded-lg shrink-0" />
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-brand-sage block font-bold uppercase tracking-wider">Au sujet du cliché</span>
                                    <span className="text-xs font-bold text-brand-olive block truncate">{currentPhoto.name}</span>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <label htmlFor="comment-text" className="text-[11px] text-brand-sage font-extrabold uppercase tracking-wide block">Votre consigne ou question</label>
                                  <textarea
                                    id="comment-text"
                                    rows={3}
                                    placeholder="Écrivez votre message..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="w-full bg-brand-cream border border-brand-sand rounded-xl p-3 text-xs text-brand-olive focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/15 resize-none font-medium leading-relaxed"
                                  />
                                </div>
                                {commentSuccess ? (
                                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 flex items-center gap-2 justify-center font-bold text-xs">
                                    <Check className="w-4.5 h-4.5 text-emerald-600" />
                                    <span>Consigne transmise au photographe !</span>
                                  </motion.div>
                                ) : (
                                  <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsCommentModalOpen(false)} className="flex-1 bg-[var(--bg-panel)] border border-brand-sand hover:bg-brand-cream text-brand-sage hover:text-brand-olive py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer">Annuler</button>
                                    <button type="button" disabled={!commentText.trim()} onClick={handleSendComment} className={`flex-1 text-brand-cream py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 shadow cursor-pointer ${commentText.trim() ? 'bg-brand-olive hover:bg-brand-moss' : 'bg-brand-olive/40 cursor-not-allowed shadow-none'}`}>Envoyer</button>
                                  </div>
                                )}
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : null}

                    {activeTab === 'Explore' && activeClient && (
                      <LikesView
                        activeClient={activeClient}
                        globalPhotos={globalPhotos}
                        onRemoveFavorite={handleRemoveFavorite}
                        onToggleFavorite={handleToggleFavorite}
                        categoryLabels={currentCategoryLabels}
                        onLockSelection={handleLockActiveClient}
                        onUpdatePhotoComment={handleUpdatePhotoComment}
                        onRefresh={refreshDatabase}
                        onResetSelection={handleResetSelection}
                        onUpdatePhotoChoice={handleUpdatePhotoChoice}
                      />
                    )}

                    {activeTab === 'Likes' && activeClient && (
                      <LikesView
                        activeClient={activeClient}
                        globalPhotos={globalPhotos}
                        onRemoveFavorite={handleRemoveFavorite}
                        onToggleFavorite={handleToggleFavorite}
                        categoryFilter={secondCat}
                        categoryLabels={currentCategoryLabels}
                        onLockSelection={handleLockActiveClient}
                        onUpdatePhotoComment={handleUpdatePhotoComment}
                        onRefresh={refreshDatabase}
                        onResetSelection={handleResetSelection}
                        onUpdatePhotoChoice={handleUpdatePhotoChoice}
                      />
                    )}

                    {activeTab === 'Conversations' && activeClient && (
                      <LikesView
                        activeClient={activeClient}
                        globalPhotos={globalPhotos}
                        onRemoveFavorite={handleRemoveFavorite}
                        onToggleFavorite={handleToggleFavorite}
                        categoryFilter={thirdCat}
                        categoryLabels={currentCategoryLabels}
                        onLockSelection={handleLockActiveClient}
                        onUpdatePhotoComment={handleUpdatePhotoComment}
                        onRefresh={refreshDatabase}
                        onResetSelection={handleResetSelection}
                        onUpdatePhotoChoice={handleUpdatePhotoChoice}
                      />
                    )}

                    {activeTab === 'Profil' && activeClient && (
                      <ProfileView
                        activeClient={activeClient}
                        onEnterAdmin={handleEnterAdmin}
                        onOpenChat={() => goToTab('Chat')}
                        photosCount={globalPhotos.length}
                        coverPhotoUrl={globalPhotos.find(p => p.id === activeClient.coverPhotoId)?.image}
                      />
                    )}

                    {activeTab === 'Chat' && activeClient && (
                      <ChatView
                        activeClient={activeClient}
                        onBack={() => goToTab('Swipe')}
                      />
                    )}

                    {activeTab === 'Finish' && activeClient && (
                      <FinishView
                        activeClient={activeClient}
                        globalPhotos={globalPhotos}
                        durationFormatted={calculateSortingDuration()}
                        onConfirmFinish={() => {
                          const curr = getActiveClient();
                          if (!curr) return;
                          const duration = calculateSortingDuration();
                          const now = new Date().toISOString();

                          const updatedClients = clientsList.map(c => {
                            if (c.id === curr.id) {
                              return {
                                ...c,
                                isLocked: true,
                                sortingEndTime: c.sortingEndTime || now,
                                sortingDurationFormatted: c.sortingDurationFormatted || duration
                              };
                            }
                            return c;
                          });

                          saveClients(updatedClients);
                          setClientsList(updatedClients);
                          setConfettiTrigger(Date.now());
                          sound.play("pop");

                          // Post system message in chat to notify photographer
                          const activeSel = globalPhotos.filter(p => curr.selectedPhotoIds.includes(p.id));
                          const finishMsg = `🎉 TRI PHOTO TERMINÉ ET VALIDÉ PAR LE CLIENT (${curr.name}) !\n\nTotal sélectionné : ${activeSel.length} / ${curr.targetCount} photos.\nTemps de tri : ${duration}.\nStatut : Sélection validée et verrouillée.`;

                          fetch("/api/clients/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              clientId: curr.id,
                              message: finishMsg,
                              sender: "system"
                            })
                          }).catch(() => {});
                        }}
                        onOpenChat={() => goToTab('Chat')}
                        onOpenExplore={() => goToTab('Explore')}
                        onUnlockSelection={() => {
                          const updated = clientsList.map(c => c.id === activeClient.id ? { ...c, isLocked: false } : c);
                          saveClients(updated);
                          setClientsList(updated);
                          goToTab('Swipe');
                        }}
                        onBackToSwipe={() => goToTab('Swipe')}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* BOTTOM NAV */}
              <div className="h-[64px] bg-[var(--bg-panel)] border-t border-brand-sand flex items-center justify-around z-35 px-2 shrink-0 md:hidden safe-bottom relative">
                {[
                  { tab: 'Swipe' as BottomNavTab, label: 'Tri-photos', Icon: Layers },
                  { tab: 'Explore' as BottomNavTab, label: 'Ma Sélection', Icon: Heart, badge: selectedPhotos.length },
                  { tab: 'Chat' as BottomNavTab, label: 'Messagerie', Icon: Mail },
                  { tab: 'Profil' as BottomNavTab, label: 'Mon Profil', Icon: User }
                ].map((item) => {
                  const isActive = activeTab === item.tab;
                  return (
                    <motion.button
                      key={item.tab}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => goToTab(item.tab)}
                      className={`flex flex-col items-center justify-center gap-1 cursor-pointer w-14 relative transition-colors ${isActive ? 'text-brand-olive' : 'text-brand-sage'}`}
                      aria-label={item.label}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="bottom-nav-pill"
                          className="absolute -top-1 w-8 h-1 bg-brand-olive rounded-full"
                          transition={{ type: "spring", damping: 22, stiffness: 240 }}
                        />
                      )}
                      <div className="relative">
                        <item.Icon className="w-5 h-5" />
                        {item.badge !== undefined && item.badge > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-2.5 bg-brand-rose text-white font-bold text-[8px] min-w-[14px] h-3.5 flex items-center justify-center rounded-full leading-none shadow px-1 font-sans tabular-nums"
                          >
                            {item.badge}
                          </motion.span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wide">{item.label}</span>
                    </motion.button>
                  );
                })}
                <motion.button
                  id="nav-finish"
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={handleFinishSorting}
                  className={`flex flex-col items-center justify-center gap-1 cursor-pointer w-14 transition-all relative ${
                    activeClient?.isLocked
                      ? 'text-emerald-700 font-black'
                      : 'text-brand-gold hover:text-brand-olive font-extrabold'
                  }`}
                  aria-label="Fin du tri"
                >
                  <div className="relative">
                    {activeClient?.isLocked ? (
                      <Lock className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <CheckSquare className="w-5 h-5 text-brand-gold" />
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wide">
                    {activeClient?.isLocked ? 'Validé' : 'Fin'}
                  </span>
                </motion.button>
              </div>
            </div>

            {/* DESKTOP RIGHT SIDEBAR (Pellicule en Direct) */}
            {activeClient && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-80 xl:w-96 bg-[var(--bg-panel)] hidden xl:flex flex-col p-5 overflow-y-auto shrink-0 select-none no-scrollbar border-l border-brand-sand"
              >
                <div className="pb-3 border-b border-brand-sand mb-4 flex items-center gap-1.5 shrink-0">
                  <Bookmark className="w-4 h-4 text-brand-gold" />
                  <div className="text-left">
                    <span className="text-[8px] font-extrabold uppercase text-brand-gold tracking-widest block leading-none mb-0.5">Album Physique</span>
                    <h3 className="text-xs font-serif-display font-bold text-brand-olive uppercase leading-tight">Pellicule en Direct</h3>
                  </div>
                </div>

                {(() => {
                  const selection = globalPhotos.filter(p => activeClient.selectedPhotoIds.includes(p.id)).reverse().slice(0, 8);
                  if (selection.length === 0) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-brand-cream/40 rounded-xl border border-dashed border-brand-sand/70 my-auto">
                        <Heart className="w-8 h-8 text-brand-sand/65 mb-2 stroke-[1.5]" />
                        <p className="text-[10px] text-brand-sage font-serif-display leading-relaxed italic max-w-[180px]">
                          Faites glisser des photos à droite ("PRENDRE") pour voir votre album se remplir en direct ici.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="flex-1 flex flex-col h-full justify-between">
                      <div className="space-y-3">
                        <span className="text-[9px] font-extrabold uppercase text-brand-sage tracking-wider block text-left">Ajouts Récents :</span>
                        <div className="flex flex-col gap-2 pb-4">
                          <AnimatePresence>
                            {selection.map(photo => (
                              <motion.div
                                key={photo.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", damping: 20, stiffness: 240 }}
                                className="relative bg-[var(--bg-subtle)] border border-brand-sand/55 rounded-lg shadow-xs group overflow-hidden flex items-stretch hover:border-brand-gold/60 transition-colors"
                              >
                                <div className="w-16 h-16 shrink-0 bg-[#131611] overflow-hidden">
                                  <SmartImage src={photo.image} alt={photo.name} fit="cover" className="w-full h-full duration-300 group-hover:scale-110" />
                                </div>
                                <div className="flex-1 min-w-0 px-2.5 py-1.5 flex flex-col justify-center">
                                  <p className="text-[10px] font-bold text-brand-olive truncate leading-tight">{photo.name}</p>
                                  <p className="text-[8.5px] text-brand-sage uppercase tracking-wider mt-0.5">Ajouté</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFavorite(photo.id)}
                                  aria-label={`Retirer ${photo.name}`}
                                  className="absolute top-1 right-1 w-5 h-5 bg-white/94 text-red-500 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 border border-brand-sand/50 shadow-sm hover:bg-red-50 hover:text-red-650 transition-all cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => goToTab('Explore')}
                        className="w-full bg-brand-cream hover:bg-brand-sand text-brand-olive text-[9px] font-extrabold uppercase tracking-wide py-2.5 rounded-xl border border-brand-sand transition-all mt-auto text-center cursor-pointer block shrink-0"
                      >
                        Consulter mon tri complet ({activeClient.selectedPhotoIds.length})
                      </button>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </div>

        {/* PASSCODE MODAL — iOS style keypad */}
        <AnimatePresence>
          {isPasscodeModalOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/65 backdrop-blur-md z-[60] flex items-center justify-center p-4"
              onClick={() => setIsPasscodeModalOpen(false)}
              role="dialog" aria-modal="true" aria-label="Code d'accès administrateur"
            >
              <motion.div
                initial={{ scale: 0.94, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 15 }}
                className="bg-[var(--bg-panel)] border border-brand-sand shadow-2xl rounded-3xl p-6 w-full max-w-[320px] text-center flex flex-col space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ scale: 0.6, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="w-14 h-14 bg-brand-sand text-brand-gold rounded-full flex items-center justify-center mx-auto shadow-inner"
                >
                  <Lock className="w-6 h-6" />
                </motion.div>

                <div className="space-y-1">
                  <h3 className="text-sm font-serif-display font-black text-brand-olive uppercase tracking-tight">Accès Photographe</h3>
                  <p className="text-[10px] text-brand-sage leading-relaxed font-serif-display italic">
                    Écran protégé. Saisissez le code d'accès pour déverrouiller l'espace d'administration.
                  </p>
                </div>

                <form onSubmit={handleVerifyPasscode} className="space-y-4">
                  <NumericKeypad value={adminPasscode} onChange={(v) => { setAdminPasscode(v); if (passcodeError) setPasscodeError(''); }} maxLength={4} />

                  {passcodeError && (
                    <motion.p initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-[10px] font-bold text-red-500">
                      {passcodeError}
                    </motion.p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsPasscodeModalOpen(false)}
                      className="flex-1 bg-[var(--bg-subtle)] border border-brand-sand text-brand-sage hover:text-brand-olive py-2.5 rounded-xl text-[10px] font-extrabold uppercase transition-colors cursor-pointer"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={adminPasscode.length === 0}
                      className={`flex-1 text-brand-cream py-2.5 rounded-xl text-[10px] font-extrabold uppercase shadow-sm transition-colors cursor-pointer ${
                        adminPasscode.length === 0 ? "bg-brand-olive/40 cursor-not-allowed" : "bg-brand-olive hover:bg-brand-moss"
                      }`}
                    >
                      Valider
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {lightboxPhoto && (
          <ZoomLightbox
            photo={lightboxPhoto}
            onClose={() => setLightboxPhoto(null)}
            isLocked={activeClient?.isLocked}
            onRemove={activeClient?.selectedPhotoIds.includes(lightboxPhoto.id) ? () => handleRemoveFavorite(lightboxPhoto.id) : undefined}
          />
        )}
        
        {activeClient && (
          <OnboardingTutorial 
            isOpen={showTutorial} 
            onClose={handleCloseTutorial} 
            clientName={activeClient.name} 
            targetCount={activeClient.targetCount}
            albumQuota={activeClient.targetCategoryQuotas?.['Album'] !== undefined ? activeClient.targetCategoryQuotas['Album'] : activeClient.targetCountAlbum}
          />
        )}
      </div>
    </PhoneFrame>
  );
}

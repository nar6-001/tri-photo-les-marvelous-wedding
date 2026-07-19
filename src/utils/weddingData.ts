import { CategoryTab } from '../types';

export interface WeddingPhoto {
  id: string;
  name: string;
  image: string; // url
  category: CategoryTab;
  createdAt: string;
  clientId?: string;
}

export interface ClientAccount {
  id: string;
  name: string;
  targetCount: number; // quota they need to select
  targetCountDot?: number; // custom quota for category Dot
  targetCountGlobale?: number; // custom quota for category Globale
  targetCountAlbum?: number; // custom quota for category Album
  targetCategoryQuotas?: Record<string, number>; // custom quotas per category key
  selectedPhotoIds: string[]; // liked photos
  dislikedPhotoIds: string[]; // nope photos
  notes?: string;
  createdAt: string;
  isLocked?: boolean; // locked status for final physical printing
  photoComments?: Record<string, string>; // specific requests/comments per photo
  coverPhotoId?: string; // custom cover photo ID to personalize the experience
  weddingDate?: string; // date of wedding event
  country?: string; // country of wedding (France, Cameroun, etc.)
  deadline?: string; // deadline for photo selection
  categoryLabels?: Record<string, string>; // custom categories ONLY for this client!
  formula?: string; // price formula chosen (Simple, Premium, Complete, Reve)
}

export interface CloudinarySettings {
  cloudName: string;
  uploadPreset: string;
}

// Default High-Quality Unsplash Wedding Photos
const DEFAULT_WEDDING_PHOTOS: WeddingPhoto[] = [
  {
    id: 'photo-1',
    name: 'Cérémonie sous la tonnelle',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'photo-2',
    name: 'Échange des alliances',
    image: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date(Date.now() - 500000).toISOString()
  },
  {
    id: 'photo-3',
    name: 'Baiser sous le voile',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 400000).toISOString()
  },
  {
    id: 'photo-4',
    name: 'Décoration champêtre de la table',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Globale',
    createdAt: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'photo-5',
    name: 'Ouverture du bal des mariés',
    image: 'https://images.unsplash.com/photo-1507504038482-7621c51b30ab?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 200000).toISOString()
  },
  {
    id: 'photo-6',
    name: 'La coupe de la pièce montée',
    image: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Album',
    createdAt: new Date(Date.now() - 100000).toISOString()
  },
  {
    id: 'photo-7',
    name: 'Rire spontané au cocktail',
    image: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=800&h=1000',
    category: 'Dot',
    createdAt: new Date().toISOString()
  }
];

// Initial default clients
const DEFAULT_CLIENTS: ClientAccount[] = [
  {
    id: 'sophie-marc',
    name: 'Sophie & Marc',
    targetCount: 4, // Must select 4 photos is their goal
    selectedPhotoIds: ['photo-1', 'photo-3'],
    dislikedPhotoIds: ['photo-5'],
    notes: 'Nous aimons beaucoup les cadrages naturels et ensoleillés ! Merci pour ce travail magnifique !',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isLocked: false,
    photoComments: {
      'photo-1': 'Est-il possible d\'adoucir la luminosité sur les visages ?',
      'photo-3': 'C\'est notre préférée ! Pourrions-nous l\'avoir également en version Noir & Blanc dans le livre d\'or ?'
    },
    weddingDate: '2026-06-20',
    country: 'France'
  },
  {
    id: 'chloe-thomas',
    name: 'Chloé & Thomas',
    targetCount: 3,
    selectedPhotoIds: ['photo-2'],
    dislikedPhotoIds: [],
    notes: 'Merci de privilégier les portraits noir et blanc s\'il y en a dans l\'album final.',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    isLocked: false,
    photoComments: {
      'photo-2': 'Superbe cadrage sur les alliances.'
    },
    weddingDate: '2026-08-15',
    country: 'Cameroun'
  }
];

export const getCloudinarySettings = (): CloudinarySettings => {
  const data = localStorage.getItem('wedding_cloudinary_settings');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return {
          cloudName: parsed.cloudName || '',
          uploadPreset: parsed.uploadPreset || ''
        };
      }
    } catch (e) {
      // fallback
    }
  }
  return { cloudName: '', uploadPreset: '' };
};

export const saveCloudinarySettings = (settings: CloudinarySettings) => {
  localStorage.setItem('wedding_cloudinary_settings', JSON.stringify(settings));
};

export const getGlobalPhotos = (): WeddingPhoto[] => {
  const data = localStorage.getItem('wedding_global_photos');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {}
  }
  // save initial
  localStorage.setItem('wedding_global_photos', JSON.stringify(DEFAULT_WEDDING_PHOTOS));
  return DEFAULT_WEDDING_PHOTOS;
};

export const saveGlobalPhotos = (photos: WeddingPhoto[]) => {
  try {
    localStorage.setItem('wedding_global_photos', JSON.stringify(photos));
  } catch (e) {
    console.warn("Storage quota exceeded for global photos, keeping transiently in memory", e);
  }
};

export const getClients = (): ClientAccount[] => {
  const data = localStorage.getItem('wedding_clients');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {}
  }
  // save initial
  try {
    localStorage.setItem('wedding_clients', JSON.stringify(DEFAULT_CLIENTS));
  } catch (e) {}
  return DEFAULT_CLIENTS;
};

export const saveClients = (clients: ClientAccount[]) => {
  try {
    localStorage.setItem('wedding_clients', JSON.stringify(clients));
  } catch (e) {
    console.warn("Storage quota exceeded for clients list", e);
  }
};

export const getActiveClientId = (): string => {
  const id = localStorage.getItem('wedding_active_client_id');
  if (id) return id;
  return 'sophie-marc'; // default to Sophie & Marc
};

export const setActiveClientId = (id: string) => {
  localStorage.setItem('wedding_active_client_id', id);
};

export const getIsAdminMode = (): boolean => {
  return localStorage.getItem('wedding_is_admin_mode') === 'true';
};

export const setIsAdminMode = (isAdmin: boolean) => {
  localStorage.setItem('wedding_is_admin_mode', isAdmin ? 'true' : 'false');
};

export type CategoryLabels = Record<string, string>;

export const getCategoryLabels = (): CategoryLabels => {
  const data = localStorage.getItem('wedding_category_labels');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
  }
  return { Dot: 'Dot', Globale: 'Classique', Album: 'Album' };
};

export const saveCategoryLabels = (labels: CategoryLabels) => {
  localStorage.setItem('wedding_category_labels', JSON.stringify(labels));
};

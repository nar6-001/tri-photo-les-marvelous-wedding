import { Profile } from './types';

export interface MultiImageProfile extends Profile {
  images: string[];
}

export const MOCK_PROFILES: MultiImageProfile[] = [
  {
    id: 'queen-france',
    name: 'Queen France',
    age: 29,
    distance: 'à 3 km',
    status: 'À proximité',
    verified: true,
    image: 'https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?auto=format&fit=crop&q=80&w=600&h=800',
    images: [
      'https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?auto=format&fit=crop&q=80&w=600&h=800',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600&h=800',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600&h=800'
    ],
    bio: 'Passionnée de photo, de bonne cuisine et de voyages. Faisons connaissance ! ✨ Je vis à Paris et je cherche de nouvelles connexions authentiques.',
    interests: ['Voyages', 'Photo', 'Cuisine', 'Café', 'Musique']
  },
  {
    id: 'noemie',
    name: 'Noémie',
    age: 24,
    distance: 'à 6 km',
    status: 'À proximité',
    verified: true,
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600&h=800',
    images: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600&h=800',
      'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=600&h=800'
    ],
    bio: 'Jeune diplômée en architecture, fan d\'indie rock et de musées gratuits le dimanche.',
    interests: ['Architecture', 'Rock', 'Musées', 'Randonnée']
  },
  {
    id: 'amandine',
    name: 'Amandine',
    age: 26,
    distance: 'à 2 km',
    status: 'Récemment actif',
    verified: true,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600&h=800',
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600&h=800',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600&h=800'
    ],
    bio: 'À la recherche de quelqu\'un d\'assez courageux pour me battre au tennis de table 🏓 Rire est indispensable !',
    interests: ['Tennis de table', 'Brunch', 'Cinéma', 'Pédale']
  },
  {
    id: 'sophia',
    name: 'Sophia',
    age: 28,
    distance: 'à 12 km',
    status: 'À proximité',
    verified: false,
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600&h=800',
    images: [
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600&h=800',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=800'
    ],
    bio: 'Designer d\'intérieur. J\'adore voyager hors des sentiers battus et promener mon golden retriever.',
    interests: ['Design', 'Animaux', 'Camping', 'Photographie']
  },
  {
    id: 'chloe',
    name: 'Chloé',
    age: 27,
    distance: 'à 4 km',
    status: 'Récemment actif',
    verified: true,
    image: 'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=600&h=800',
    images: [
      'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=600&h=800',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600&h=800'
    ],
    bio: 'Positive vibing, gourmet cooking enthusiast. Let\'s trade our favorite spots in town!',
    interests: ['Cuisine', 'Vins', 'Plage', 'Festivals']
  }
];

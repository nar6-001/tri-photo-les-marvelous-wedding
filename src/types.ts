export interface Profile {
  id: string;
  name: string;
  age: number;
  distance: string;
  status: string; // e.g. "À proximité", "Récemment actif"
  verified: boolean;
  image: string;
  interests?: string[];
  bio?: string;
}

export type CategoryTab = string;

export type BottomNavTab = 'Swipe' | 'Explore' | 'Likes' | 'Conversations' | 'Profil' | 'Chat';

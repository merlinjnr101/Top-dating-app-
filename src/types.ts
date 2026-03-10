export interface UserProfile {
  uid: string;
  displayName: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  interestedIn: string[];
  bio: string;
  photoURL: string;
  photos: string[];
  interests: string[];
  location?: {
    lat: number;
    lng: number;
    city: string;
  };
  isVerified: boolean;
  createdAt: string;
  lastActive: string;
  isPremium: boolean;
  role?: 'user' | 'admin';
}

export interface Match {
  id: string;
  users: string[];
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageURL?: string;
  voiceURL?: string;
  createdAt: string;
  read: boolean;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  details: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface Status {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string;
  content: string;
  type: 'text' | 'image';
  createdAt: string;
  expiresAt: string;
}

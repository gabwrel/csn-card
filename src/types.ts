export type CardStatus =
  | 'unassigned'
  | 'pending_redemption'
  | 'awaiting_confirmation'
  | 'used'
  | 'revoked';

export interface Card {
  id: string;
  ownerId: string;
  ownerName: string;
  recipientName: string;
  recipientNote?: string;
  status: CardStatus;
  task?: string | null;
  taskDeadline?: string | null; // ISO string
  createdAt: string; // ISO string
  loadedAt?: string | null;
  acceptedAt?: string | null;
  confirmedAt?: string | null;
  qrUrl?: string;
  reissuedFromId?: string;
  themeColor?: 'amber' | 'emerald' | 'indigo' | 'rose' | 'slate';
}

export interface PublicCard {
  id: string;
  recipientName: string;
  recipientNote?: string;
  status: CardStatus;
  task?: string | null;
  taskDeadline?: string | null;
  createdAt: string;
  loadedAt?: string | null;
  acceptedAt?: string | null;
  confirmedAt?: string | null;
  creatorName: string;
  isExpired?: boolean;
  themeColor?: 'amber' | 'emerald' | 'indigo' | 'rose' | 'slate';
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  createdAt: string;
  photoURL?: string | null;
  providerId?: string;
  isAnonymous?: boolean;
}

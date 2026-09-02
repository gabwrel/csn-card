import QRCode from 'qrcode';
import { Card, PublicCard, User } from './types.ts';
import {
  db,
  auth,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
} from './lib/firebase.ts';

// Default Demo User for guest/preview states
export const DEFAULT_DEMO_USER: User = {
  uid: 'usr_default_alex',
  displayName: 'Alex Rivers',
  email: 'alex.rivers@example.com',
  createdAt: new Date().toISOString(),
  photoURL: null,
  isAnonymous: true,
};

// Initial sample cards seeded into Firestore or local cache if none exist
const INITIAL_DEMO_CARDS: Card[] = [
  {
    id: 'card_demo_unassigned',
    ownerId: 'usr_default_alex',
    ownerName: 'Alex Rivers',
    recipientName: 'Sarah Jenkins',
    recipientNote: 'A special favor I can redeem whenever I need help!',
    status: 'unassigned',
    task: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    themeColor: 'amber',
  },
  {
    id: 'card_demo_pending',
    ownerId: 'usr_default_alex',
    ownerName: 'Alex Rivers',
    recipientName: 'Marcus Vance',
    recipientNote: 'Thanks for promising you would never say no.',
    status: 'pending_redemption',
    task: 'Cover my 4-hour shift this coming Sunday afternoon at the community coffee bar.',
    taskDeadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    loadedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    themeColor: 'indigo',
  },
  {
    id: 'card_demo_awaiting',
    ownerId: 'usr_default_alex',
    ownerName: 'Alex Rivers',
    recipientName: "Liam O'Connor",
    recipientNote: 'You lost the bet, so this card is active!',
    status: 'awaiting_confirmation',
    task: 'Give my Subaru Outback a thorough foam wash and interior vacuum.',
    taskDeadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    loadedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    acceptedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    themeColor: 'emerald',
  },
  {
    id: 'card_demo_used',
    ownerId: 'usr_default_alex',
    ownerName: 'Alex Rivers',
    recipientName: 'Elena Rostova',
    recipientNote: 'Airport ride promise honored in full.',
    status: 'used',
    task: 'Drive to Terminal 2 at 5:00 AM on Monday morning with hot coffee in hand.',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    loadedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    acceptedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    confirmedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    themeColor: 'slate',
  },
];

/**
 * Get current user from Firebase Auth, with fallback
 */
export async function fetchCurrentUser(): Promise<{ user: User; allUsers: User[] }> {
  const firebaseUser = auth.currentUser;
  let activeUser: User;

  if (firebaseUser) {
    activeUser = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : 'Card Issuer'),
      email: firebaseUser.email || (firebaseUser.isAnonymous ? 'guest@local' : 'user@example.com'),
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      photoURL: firebaseUser.photoURL,
      providerId: firebaseUser.providerData[0]?.providerId || (firebaseUser.isAnonymous ? 'anonymous' : 'firebase'),
      isAnonymous: firebaseUser.isAnonymous,
    };
  } else {
    // Check localStorage for preferred demo user
    const saved = localStorage.getItem('csn_active_user');
    activeUser = saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
  }

  // Fetch recent creators from Firestore or default list
  let allUsers: User[] = [activeUser];
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (!usersSnap.empty) {
      allUsers = usersSnap.docs.map((d) => d.data() as User);
      if (!allUsers.find((u) => u.uid === activeUser.uid)) {
        allUsers.unshift(activeUser);
      }
    }
  } catch (e) {
    // Ignore and return activeUser
  }

  return { user: activeUser, allUsers };
}

/**
 * Switch creator in local cache (for demo testing multiple identities)
 */
export async function switchUser(uid: string): Promise<User> {
  const userObj: User = {
    uid,
    displayName: uid === 'usr_default_alex' ? 'Alex Rivers' : 'Alternate Creator',
    email: `${uid}@example.com`,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem('csn_active_user', JSON.stringify(userObj));
  return userObj;
}

/**
 * Create creator identity in Firestore
 */
export async function createCreator(displayName: string, email?: string): Promise<User> {
  const uid = `usr_${Date.now()}`;
  const newUser: User = {
    uid,
    displayName: displayName.trim(),
    email: (email || `${displayName.toLowerCase().replace(/\s+/g, '')}@example.com`).trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', uid), newUser);
  } catch (e) {
    console.warn('Could not write user to Firestore:', e);
  }

  localStorage.setItem('csn_active_user', JSON.stringify(newUser));
  return newUser;
}

/**
 * Fetch cards created by the active user from Firestore
 */
export async function fetchCreatorCards(ownerId?: string): Promise<Card[]> {
  const activeOwnerId = ownerId || auth.currentUser?.uid || JSON.parse(localStorage.getItem('csn_active_user') || '{}').uid || DEFAULT_DEMO_USER.uid;

  try {
    const q = query(collection(db, 'cards'), where('ownerId', '==', activeOwnerId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const fetchedCards = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Card));
      fetchedCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return fetchedCards;
    }

    // If active user is the demo user and Firestore is empty, seed demo cards
    if (activeOwnerId === DEFAULT_DEMO_USER.uid) {
      for (const card of INITIAL_DEMO_CARDS) {
        await setDoc(doc(db, 'cards', card.id), card);
      }
      return INITIAL_DEMO_CARDS;
    }

    return [];
  } catch (err) {
    console.warn('Firestore fetch cards warning:', err);
    // Return demo cards if running offline or first run
    if (activeOwnerId === DEFAULT_DEMO_USER.uid) {
      return INITIAL_DEMO_CARDS;
    }
    return [];
  }
}

/**
 * Create new card in Firestore
 */
export async function createCard(params: {
  recipientName: string;
  recipientNote?: string;
  themeColor?: Card['themeColor'];
  ownerId?: string;
  ownerName?: string;
}): Promise<Card> {
  const currentUser = auth.currentUser;
  const localUser = JSON.parse(localStorage.getItem('csn_active_user') || '{}');

  const ownerId = params.ownerId || currentUser?.uid || localUser.uid || DEFAULT_DEMO_USER.uid;
  const ownerName = params.ownerName || currentUser?.displayName || localUser.displayName || DEFAULT_DEMO_USER.displayName;
  const ownerEmail = currentUser?.email || localUser.email || DEFAULT_DEMO_USER.email;

  const cardId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newCard: Card = {
    id: cardId,
    ownerId,
    ownerName,
    recipientName: params.recipientName.trim(),
    recipientNote: params.recipientNote?.trim() || undefined,
    status: 'unassigned',
    task: null,
    createdAt: new Date().toISOString(),
    themeColor: params.themeColor || 'amber',
  };

  await setDoc(doc(db, 'cards', cardId), {
    ...newCard,
    ownerEmail,
  });

  return newCard;
}

/**
 * Fetch a public card by ID (for recipient scanning or view)
 */
export async function fetchPublicCard(id: string): Promise<PublicCard> {
  const cardDoc = await getDoc(doc(db, 'cards', id));

  if (cardDoc.exists()) {
    const data = cardDoc.data() as Card;
    const isExpired = data.taskDeadline ? new Date(data.taskDeadline).getTime() < Date.now() : false;

    return {
      id: data.id,
      recipientName: data.recipientName,
      recipientNote: data.recipientNote,
      status: data.status,
      task: data.task,
      taskDeadline: data.taskDeadline,
      createdAt: data.createdAt,
      loadedAt: data.loadedAt,
      acceptedAt: data.acceptedAt,
      confirmedAt: data.confirmedAt,
      creatorName: data.ownerName || 'The Issuer',
      isExpired,
      themeColor: data.themeColor || 'amber',
    };
  }

  // Fallback to demo cards if checking a demo id
  const demo = INITIAL_DEMO_CARDS.find((c) => c.id === id);
  if (demo) {
    return {
      id: demo.id,
      recipientName: demo.recipientName,
      recipientNote: demo.recipientNote,
      status: demo.status,
      task: demo.task,
      taskDeadline: demo.taskDeadline,
      createdAt: demo.createdAt,
      loadedAt: demo.loadedAt,
      acceptedAt: demo.acceptedAt,
      confirmedAt: demo.confirmedAt,
      creatorName: demo.ownerName,
      isExpired: false,
      themeColor: demo.themeColor,
    };
  }

  throw new Error('Favor Card not found in registry');
}

/**
 * Recipient Cashes In Favor (assigns the task they want the issuer to do)
 */
export async function cashInFavor(
  id: string,
  task: string,
  taskDeadline?: string | null
): Promise<Card> {
  const cardRef = doc(db, 'cards', id);
  const now = new Date().toISOString();

  const updates = {
    status: 'awaiting_confirmation' as const,
    task: task.trim(),
    taskDeadline: taskDeadline || null,
    loadedAt: now,
    acceptedAt: now,
  };

  await updateDoc(cardRef, updates);
  const updatedDoc = await getDoc(cardRef);
  return { id: updatedDoc.id, ...updatedDoc.data() } as Card;
}

/**
 * Creator manually records a demand onto an unassigned card
 */
export async function loadFavorTask(
  id: string,
  task: string,
  taskDeadline?: string | null
): Promise<Card> {
  const cardRef = doc(db, 'cards', id);
  const now = new Date().toISOString();

  const updates = {
    status: 'awaiting_confirmation' as const,
    task: task.trim(),
    taskDeadline: taskDeadline || null,
    loadedAt: now,
  };

  await updateDoc(cardRef, updates);
  const updatedDoc = await getDoc(cardRef);
  return { id: updatedDoc.id, ...updatedDoc.data() } as Card;
}

/**
 * Complete and seal the card
 */
export async function completeFavor(id: string): Promise<Card> {
  const cardRef = doc(db, 'cards', id);
  const now = new Date().toISOString();

  const updates = {
    status: 'used' as const,
    confirmedAt: now,
  };

  await updateDoc(cardRef, updates);
  const updatedDoc = await getDoc(cardRef);
  return { id: updatedDoc.id, ...updatedDoc.data() } as Card;
}

export async function confirmFavorDone(id: string): Promise<Card> {
  return completeFavor(id);
}

export async function acceptFavor(id: string): Promise<void> {
  const cardRef = doc(db, 'cards', id);
  await updateDoc(cardRef, {
    status: 'awaiting_confirmation',
    acceptedAt: new Date().toISOString(),
  });
}

/**
 * Revoke card
 */
export async function revokeCard(id: string): Promise<Card> {
  const cardRef = doc(db, 'cards', id);
  await updateDoc(cardRef, {
    status: 'revoked',
  });
  const updatedDoc = await getDoc(cardRef);
  return { id: updatedDoc.id, ...updatedDoc.data() } as Card;
}

/**
 * Reissue card
 */
export async function reissueCard(id: string): Promise<Card> {
  const oldCard = await getDoc(doc(db, 'cards', id));
  if (!oldCard.exists()) throw new Error('Card not found');
  const data = oldCard.data() as Card;

  return createCard({
    recipientName: data.recipientName,
    recipientNote: data.recipientNote,
    themeColor: data.themeColor,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
  });
}

/**
 * Delete card
 */
export async function deleteCard(id: string): Promise<void> {
  await deleteDoc(doc(db, 'cards', id));
}

/**
 * Generate crisp QR code client-side using `qrcode` library
 * This eliminates any server dependency, making it 100% Vercel-ready!
 */
export async function fetchQRCode(
  id: string
): Promise<{ qrDataUrl: string; redemptionUrl: string }> {
  const redemptionUrl = `${window.location.origin}/c/${id}`;
  const qrDataUrl = await QRCode.toDataURL(redemptionUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 360,
    color: {
      dark: '#1A1A1A',
      light: '#FFFFFF',
    },
  });

  return { qrDataUrl, redemptionUrl };
}

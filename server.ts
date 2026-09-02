import express from 'express';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { Card, PublicCard, User } from './src/types.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// Setup data directory and store
const DATA_DIR = path.join(process.cwd(), 'data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state backed by JSON
let users: User[] = [];
let cards: Card[] = [];

// Seed users and cards if empty
function loadInitialData() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } else {
      users = [
        {
          uid: 'usr_default_alex',
          displayName: 'Alex Rivers',
          email: 'alex.rivers@example.com',
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
  } catch (e) {
    console.error('Error loading users:', e);
    users = [
      {
        uid: 'usr_default_alex',
        displayName: 'Alex Rivers',
        email: 'alex.rivers@example.com',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  try {
    if (fs.existsSync(CARDS_FILE)) {
      cards = JSON.parse(fs.readFileSync(CARDS_FILE, 'utf-8'));
    } else {
      const now = Date.now();
      cards = [
        {
          id: 'card_unassigned_demo',
          ownerId: 'usr_default_alex',
          ownerName: 'Alex Rivers',
          recipientName: 'Sarah Jenkins',
          recipientNote: 'A special favor I can redeem whenever I need help!',
          status: 'unassigned',
          task: null,
          createdAt: new Date(now - 86400000 * 2).toISOString(),
          themeColor: 'amber',
        },
        {
          id: 'card_pending_demo',
          ownerId: 'usr_default_alex',
          ownerName: 'Alex Rivers',
          recipientName: 'Marcus Vance',
          recipientNote: 'Thanks for promising you would never say no.',
          status: 'pending_redemption',
          task: 'Cover my 4-hour shift this coming Sunday afternoon at the community coffee bar.',
          taskDeadline: new Date(now + 86400000 * 3).toISOString(),
          createdAt: new Date(now - 86400000 * 4).toISOString(),
          loadedAt: new Date(now - 3600000 * 5).toISOString(),
          themeColor: 'indigo',
        },
        {
          id: 'card_awaiting_demo',
          ownerId: 'usr_default_alex',
          ownerName: 'Alex Rivers',
          recipientName: 'Liam O\'Connor',
          recipientNote: 'You lost the bet, so this card is active!',
          status: 'awaiting_confirmation',
          task: 'Give my Subaru Outback a thorough foam wash and interior vacuum.',
          taskDeadline: new Date(now + 86400000 * 5).toISOString(),
          createdAt: new Date(now - 86400000 * 6).toISOString(),
          loadedAt: new Date(now - 86400000 * 1).toISOString(),
          acceptedAt: new Date(now - 3600000 * 2).toISOString(),
          themeColor: 'emerald',
        },
        {
          id: 'card_used_demo',
          ownerId: 'usr_default_alex',
          ownerName: 'Alex Rivers',
          recipientName: 'Emma Watson',
          recipientNote: 'Redeemed during moving week.',
          status: 'used',
          task: 'Bake your famous 3-cheese lasagna and deliver it hot for dinner.',
          createdAt: new Date(now - 86400000 * 12).toISOString(),
          loadedAt: new Date(now - 86400000 * 10).toISOString(),
          acceptedAt: new Date(now - 86400000 * 9).toISOString(),
          confirmedAt: new Date(now - 86400000 * 8).toISOString(),
          themeColor: 'rose',
        },
      ];
      fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
    }
  } catch (e) {
    console.error('Error loading cards:', e);
    cards = [];
  }
}

loadInitialData();

function persistCards() {
  try {
    fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
  } catch (e) {
    console.error('Error persisting cards:', e);
  }
}

function persistUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Error persisting users:', e);
  }
}

// Current session simulated cookie/header or default
let currentUserId = 'usr_default_alex';

// API ROUTES
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', cardsCount: cards.length });
});

// Auth endpoints
app.get('/api/auth/current', (req, res) => {
  const user = users.find((u) => u.uid === currentUserId) || users[0];
  res.json({ user, allUsers: users });
});

app.post('/api/auth/switch', (req, res) => {
  const { uid } = req.body;
  const user = users.find((u) => u.uid === uid);
  if (user) {
    currentUserId = user.uid;
    return res.json({ success: true, user });
  }
  res.status(404).json({ error: 'User not found' });
});

app.post('/api/auth/create', (req, res) => {
  const { displayName, email } = req.body;
  if (!displayName?.trim()) {
    return res.status(400).json({ error: 'Display name is required' });
  }
  const cleanEmail = (email || '').trim() || `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
  const newUser: User = {
    uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    displayName: displayName.trim(),
    email: cleanEmail,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  currentUserId = newUser.uid;
  persistUsers();
  res.json({ success: true, user: newUser });
});

// Cards collection for authenticated creator
app.get('/api/cards', (req, res) => {
  const ownerCards = cards.filter((c) => c.ownerId === currentUserId);
  res.json({ cards: ownerCards });
});

// Create a new card
app.post('/api/cards', async (req, res) => {
  const { recipientName, recipientNote, themeColor } = req.body;
  if (!recipientName?.trim()) {
    return res.status(400).json({ error: 'Recipient name is required' });
  }

  const currentUser = users.find((u) => u.uid === currentUserId) || users[0];
  const cardId = `cns_${Math.random().toString(36).substring(2, 6)}_${Math.random().toString(36).substring(2, 6)}`;

  const newCard: Card = {
    id: cardId,
    ownerId: currentUser.uid,
    ownerName: currentUser.displayName,
    recipientName: recipientName.trim(),
    recipientNote: recipientNote ? recipientNote.trim() : undefined,
    status: 'unassigned',
    task: null,
    createdAt: new Date().toISOString(),
    themeColor: themeColor || 'amber',
  };

  cards.unshift(newCard);
  persistCards();

  res.status(201).json({ success: true, card: newCard });
});

// Public sanitized card read for Recipient (no auth needed, no ownerId leaked)
app.get('/api/cards/:id/public', (req, res) => {
  const { id } = req.params;
  const card = cards.find((c) => c.id === id);

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  // Check if expired while pending_redemption
  let isExpired = false;
  if (card.status === 'pending_redemption' && card.taskDeadline) {
    if (new Date(card.taskDeadline).getTime() < Date.now()) {
      isExpired = true;
    }
  }

  const publicData: PublicCard = {
    id: card.id,
    recipientName: card.recipientName,
    recipientNote: card.recipientNote,
    status: card.status,
    task: card.task,
    taskDeadline: card.taskDeadline,
    createdAt: card.createdAt,
    loadedAt: card.loadedAt,
    acceptedAt: card.acceptedAt,
    confirmedAt: card.confirmedAt,
    creatorName: card.ownerName,
    isExpired,
    themeColor: card.themeColor,
  };

  res.json({ card: publicData });
});

// Recipient action: Cash in card by demanding a task for the creator
app.post('/api/cards/:id/cash-in', (req, res) => {
  const { id } = req.params;
  const { task, taskDeadline } = req.body;

  if (!task || !task.trim()) {
    return res.status(400).json({ error: 'Please describe the task you want done.' });
  }

  const card = cards.find((c) => c.id === id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  if (card.status !== 'unassigned') {
    return res.status(400).json({
      error: `This card has already been cashed in (status: ${card.status}).`,
    });
  }

  const now = new Date().toISOString();
  card.task = task.trim();
  card.taskDeadline = taskDeadline || null;
  card.status = 'awaiting_confirmation';
  card.loadedAt = now;
  card.acceptedAt = now;

  persistCards();
  res.json({ success: true, card });
});

// Load task onto unassigned card (creator manual fallback)
app.post('/api/cards/:id/load-task', (req, res) => {
  const { id } = req.params;
  const { task, taskDeadline } = req.body;

  if (!task || !task.trim()) {
    return res.status(400).json({ error: 'Task description is required' });
  }

  const card = cards.find((c) => c.id === id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  // State constraint check
  if (card.status !== 'unassigned') {
    return res.status(400).json({
      error: `Cannot load task onto card in '${card.status}' status. Only unassigned cards can receive a favor.`,
    });
  }

  const now = new Date().toISOString();
  card.task = task.trim();
  card.taskDeadline = taskDeadline || null;
  card.status = 'awaiting_confirmation';
  card.loadedAt = now;
  card.acceptedAt = now;

  persistCards();
  res.json({ success: true, card });
});

// Recipient action: Accept favor (Atomic state transition: pending_redemption -> awaiting_confirmation)
app.post('/api/cards/:id/accept', (req, res) => {
  const { id } = req.params;
  const card = cards.find((c) => c.id === id);

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  // Enforce atomic one-time transition
  if (card.status !== 'pending_redemption' && card.status !== 'unassigned') {
    return res.status(409).json({
      error: `Card cannot be accepted again. Current status is '${card.status}'.`,
      currentStatus: card.status,
    });
  }

  card.status = 'awaiting_confirmation';
  card.acceptedAt = new Date().toISOString();

  persistCards();

  res.json({
    success: true,
    message: 'Favor locked in! Awaiting fulfillment.',
    card: {
      id: card.id,
      status: card.status,
      acceptedAt: card.acceptedAt,
    },
  });
});

// Confirm done / complete favor (awaiting_confirmation or pending_redemption -> used)
app.post('/api/cards/:id/confirm', (req, res) => {
  const { id } = req.params;
  const card = cards.find((c) => c.id === id);

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  if (card.status === 'used') {
    return res.status(400).json({ error: 'Card is already marked as completed.' });
  }

  card.status = 'used';
  card.confirmedAt = new Date().toISOString();

  persistCards();
  res.json({ success: true, card });
});

app.post('/api/cards/:id/complete', (req, res) => {
  const { id } = req.params;
  const card = cards.find((c) => c.id === id);

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  if (card.status === 'used') {
    return res.status(400).json({ error: 'Card is already marked as completed.' });
  }

  card.status = 'used';
  card.confirmedAt = new Date().toISOString();

  persistCards();
  res.json({ success: true, card });
});

// Creator action: Revoke card
app.post('/api/cards/:id/revoke', (req, res) => {
  const { id } = req.params;
  const card = cards.find((c) => c.id === id);

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  if (card.status === 'used') {
    return res.status(400).json({ error: 'Cannot revoke an already used card.' });
  }

  card.status = 'revoked';
  persistCards();
  res.json({ success: true, card });
});

// Creator action: Reissue new card from a used/revoked card
app.post('/api/cards/:id/reissue', (req, res) => {
  const { id } = req.params;
  const oldCard = cards.find((c) => c.id === id);

  if (!oldCard) {
    return res.status(404).json({ error: 'Original card not found' });
  }

  const currentUser = users.find((u) => u.uid === currentUserId) || users[0];
  const newCardId = `cns_${Math.random().toString(36).substring(2, 6)}_${Math.random().toString(36).substring(2, 6)}`;

  const newCard: Card = {
    id: newCardId,
    ownerId: currentUser.uid,
    ownerName: currentUser.displayName,
    recipientName: oldCard.recipientName,
    recipientNote: oldCard.recipientNote ? `Reissued: ${oldCard.recipientNote}` : undefined,
    status: 'unassigned',
    task: null,
    createdAt: new Date().toISOString(),
    themeColor: oldCard.themeColor || 'amber',
    reissuedFromId: oldCard.id,
  };

  cards.unshift(newCard);
  persistCards();

  res.json({ success: true, card: newCard });
});

// QR code generation endpoint (returns PNG data URL or SVG)
app.get('/api/cards/:id/qr-code', async (req, res) => {
  const { id } = req.params;
  const card = cards.find((c) => c.id === id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const redemptionUrl = `${protocol}://${host}/card/${id}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(redemptionUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });
    res.json({ qrDataUrl, redemptionUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`"Can't Say No" server active on http://0.0.0.0:${PORT}`);
  });
}

start();

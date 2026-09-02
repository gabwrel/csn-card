import { useState, useEffect, useMemo } from 'react';
import { Card, CardStatus, User } from './types.ts';
import {
  fetchCurrentUser,
  fetchCreatorCards,
  switchUser,
  createCreator,
  createCard,
  loadFavorTask,
  confirmFavorDone,
  revokeCard,
  reissueCard,
} from './api.ts';
import { auth, onAuthStateChanged, logoutUser } from './lib/firebase.ts';
import { Navbar } from './components/Navbar.tsx';
import { CardItem } from './components/CardItem.tsx';
import { CreateCardModal } from './components/CreateCardModal.tsx';
import { LoadFavorModal } from './components/LoadFavorModal.tsx';
import { ShareQRModal } from './components/ShareQRModal.tsx';
import { PrintableCardView } from './components/PrintableCardView.tsx';
import { RecipientView } from './components/RecipientView.tsx';
import { RecipientSimulatorModal } from './components/RecipientSimulatorModal.tsx';
import { CreatorSwitchModal } from './components/CreatorSwitchModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { VercelDeployModal } from './components/VercelDeployModal.tsx';
import {
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  AlertCircle,
  RefreshCw,
  LogIn,
} from 'lucide-react';

export default function App() {
  // Navigation state (for URL path routing)
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  // Creator state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [selectedStatus, setSelectedStatus] = useState<CardStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNewCreatorOpen, setIsNewCreatorOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isVercelOpen, setIsVercelOpen] = useState(false);
  const [activeSimulatorCardId, setActiveSimulatorCardId] = useState<string | null>(null);
  const [loadFavorCard, setLoadFavorCard] = useState<Card | null>(null);
  const [shareQRCard, setShareQRCard] = useState<Card | null>(null);
  const [printCard, setPrintCard] = useState<Card | null>(null);

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Initial data loading
  const loadData = async (uidToLoad?: string) => {
    try {
      setLoading(true);
      setError(null);
      const authData = await fetchCurrentUser();
      setCurrentUser(authData.user);
      setAllUsers(authData.allUsers);

      const cardsData = await fetchCreatorCards(uidToLoad || authData.user.uid);
      setCards(cardsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userObj: User = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || (fbUser.isAnonymous ? 'Guest User' : 'Card Issuer'),
          email: fbUser.email || (fbUser.isAnonymous ? 'guest@local' : 'user@example.com'),
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          photoURL: fbUser.photoURL,
          providerId: fbUser.providerData[0]?.providerId || (fbUser.isAnonymous ? 'anonymous' : 'firebase'),
          isAnonymous: fbUser.isAnonymous,
        };
        setCurrentUser(userObj);
        localStorage.setItem('csn_active_user', JSON.stringify(userObj));
        try {
          const cardsData = await fetchCreatorCards(fbUser.uid);
          setCards(cardsData);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        loadData();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      localStorage.removeItem('csn_active_user');
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Creator switch handler
  const handleSwitchUser = async (uid: string) => {
    try {
      setLoading(true);
      const user = await switchUser(uid);
      setCurrentUser(user);
      const cardsData = await fetchCreatorCards(uid);
      setCards(cardsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Add new creator
  const handleCreateCreator = async (displayName: string, email: string) => {
    const newUser = await createCreator(displayName, email);
    setCurrentUser(newUser);
    const authData = await fetchCurrentUser();
    setAllUsers(authData.allUsers);
    const cardsData = await fetchCreatorCards(newUser.uid);
    setCards(cardsData);
  };

  // Card actions
  const handleCreateCard = async (data: {
    recipientName: string;
    recipientNote?: string;
    themeColor: Card['themeColor'];
  }) => {
    const newCard = await createCard(data);
    setCards((prev) => [newCard, ...prev]);
    return newCard;
  };

  const handleLoadFavor = async (cardId: string, task: string, taskDeadline?: string | null) => {
    const updated = await loadFavorTask(cardId, task, taskDeadline);
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
  };

  const handleConfirmDone = async (cardId: string) => {
    const updated = await confirmFavorDone(cardId);
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
  };

  const handleRevoke = async (cardId: string) => {
    if (!confirm('Are you sure you want to revoke this favor card?')) return;
    const updated = await revokeCard(cardId);
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
  };

  const handleReissue = async (cardId: string) => {
    const newCard = await reissueCard(cardId);
    setCards((prev) => [newCard, ...prev]);
    setShareQRCard(newCard);
  };

  // Simulator helper
  const handleOpenSimulatorForCard = (cardId: string) => {
    setActiveSimulatorCardId(cardId);
    setIsSimulatorOpen(true);
  };

  // Filtered cards calculation
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesStatus =
        selectedStatus === 'all' ? true : card.status === selectedStatus;
      const matchesSearch =
        card.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.task && card.task.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (card.recipientNote && card.recipientNote.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [cards, selectedStatus, searchQuery]);

  // Status statistics counts
  const stats = useMemo(() => {
    return {
      total: cards.length,
      unassigned: cards.filter((c) => c.status === 'unassigned').length,
      pending: cards.filter((c) => c.status === 'pending_redemption').length,
      awaiting: cards.filter((c) => c.status === 'awaiting_confirmation').length,
      used: cards.filter((c) => c.status === 'used').length,
    };
  }, [cards]);

  // ROUTE 1: Check for /card/:id/qr or /c/:id/qr (Printable QR view)
  const qrMatch = currentPath.match(/^\/(?:card|c)\/([^/]+)\/qr$/);
  if (qrMatch) {
    const cardId = qrMatch[1];
    const targetCard = cards.find((c) => c.id === cardId) || ({
      id: cardId,
      ownerId: 'creator',
      ownerName: currentUser?.displayName || 'Creator',
      recipientName: 'Recipient',
      status: 'unassigned',
      createdAt: new Date().toISOString(),
    } as Card);

    return (
      <PrintableCardView
        card={targetCard}
        onBack={() => navigate('/')}
      />
    );
  }

  // ROUTE 2: Check for /card/:id or /c/:id (Public recipient page)
  const cardMatch = currentPath.match(/^\/(?:card|c)\/([^/]+)$/);
  if (cardMatch) {
    const cardId = cardMatch[1];
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col justify-between py-8 px-4 sm:px-6 font-serif">
        <div className="max-w-md mx-auto w-full mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-[#F5F5F0] hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2A2A] border border-[#444] font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            ← Back to Dashboard
          </button>
          <span className="text-[11px] text-amber-300 font-sans font-bold uppercase tracking-wider">
            Public Recipient Terminal
          </span>
        </div>

        <RecipientView cardId={cardId} isStandalone={true} />

        <div className="max-w-md mx-auto text-center mt-8 text-xs text-white/50 font-serif">
          Powered by Can't Say No • Digital IOU Favor Protocol
        </div>
      </div>
    );
  }

  // If in printable modal mode from dashboard
  if (printCard) {
    return (
      <PrintableCardView
        card={printCard}
        onBack={() => setPrintCard(null)}
      />
    );
  }

  // MAIN ROUTE: Creator Dashboard
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col text-[#1A1A1A] font-serif">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onOpenCreateCard={() => setIsCreateOpen(true)}
        onOpenSimulator={() => {
          if (cards.length > 0) setActiveSimulatorCardId(cards[0].id);
          setIsSimulatorOpen(true);
        }}
        onOpenNewCreatorModal={() => setIsNewCreatorOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
        onOpenVercelModal={() => setIsVercelOpen(true)}
        onLogout={handleLogout}
        isSimulatorOpen={isSimulatorOpen}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Concept Explainer / Hero Banner */}
        <div className="bg-[#EAE9E4] border-2 border-[#1A1A1A] p-6 sm:p-8 text-[#1A1A1A] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white border border-[#1A1A1A] text-[#1A1A1A] text-[10px] font-sans font-bold uppercase tracking-[0.2em] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span>Digital IOU • Single-Action Guarantee</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#1A1A1A] leading-tight">
              Create favor cards your friends <span className="italic underline decoration-1">literally can't decline</span>.
            </h1>

            <p className="mt-3 text-sm sm:text-base font-serif text-[#1A1A1A]/80 leading-relaxed max-w-2xl">
              Gift a card now without deciding the task up front. When you're ready to cash it in, attach your favor.
              The recipient sees only one option: <span className="font-bold text-[#1A1A1A]">"I Accept"</span>. Once confirmed done, it's permanently locked.
            </p>

            {/* Lifecycle Steps Ribbon */}
            <div className="mt-6 pt-6 border-t border-[#1A1A1A] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans">
              <div className="flex items-start space-x-3">
                <span className="font-serif italic text-2xl font-bold text-[#1A1A1A]/40 shrink-0 leading-none">01</span>
                <div>
                  <p className="font-bold text-[#1A1A1A] uppercase text-[11px] tracking-wider">Mint Unassigned</p>
                  <p className="text-[#1A1A1A]/60 text-[11px]">Generate QR link for recipient</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="font-serif italic text-2xl font-bold text-[#1A1A1A]/40 shrink-0 leading-none">02</span>
                <div>
                  <p className="font-bold text-[#1A1A1A] uppercase text-[11px] tracking-wider">Load the Favor</p>
                  <p className="text-[#1A1A1A]/60 text-[11px]">Attach task when ready</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="font-serif italic text-2xl font-bold text-[#1A1A1A]/40 shrink-0 leading-none">03</span>
                <div>
                  <p className="font-bold text-[#1A1A1A] uppercase text-[11px] tracking-wider">Recipient Accepts</p>
                  <p className="text-[#1A1A1A]/60 text-[11px]">Only "I Accept" is offered</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="font-serif italic text-2xl font-bold text-[#1A1A1A]/40 shrink-0 leading-none">04</span>
                <div>
                  <p className="font-bold text-[#1A1A1A] uppercase text-[11px] tracking-wider">Confirm Done</p>
                  <p className="text-[#1A1A1A]/60 text-[11px]">Card permanently seals</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Sync & Login Notice (shown if not logged in with real auth) */}
        {(!currentUser || currentUser.isAnonymous || currentUser.uid === 'usr_default_alex') && (
          <div className="bg-white border-2 border-[#1A1A1A] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[#1A1A1A]">
                  Save Your Favor Ledger to the Cloud
                </h3>
                <p className="font-serif text-xs text-[#1A1A1A]/70">
                  Sign in with Google or Facebook to preserve minted cards, sync real-time recipient status, and access from any device.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                id="hero-signin-btn"
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] font-sans text-xs font-bold uppercase tracking-wider transition-all editorial-shadow-sm flex items-center space-x-2 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google / FB</span>
              </button>
            </div>
          </div>
        )}

        {/* Section Header: Active Obligations */}
        <div className="flex justify-between items-baseline pt-2">
          <h2 className="text-3xl sm:text-4xl italic font-serif text-[#1A1A1A]">Active Obligations</h2>
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/50">
            {cards.length.toString().padStart(2, '0')} Cards in Rotation
          </span>
        </div>

        {/* Action Bar: Stats + Filter Tabs + Search */}
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`p-3.5 border border-[#1A1A1A] text-left transition-all cursor-pointer font-sans ${
                selectedStatus === 'all'
                  ? 'bg-[#1A1A1A] text-white shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                  : 'bg-white text-[#1A1A1A] hover:bg-[#EAE9E4]'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold tracking-widest block ${selectedStatus === 'all' ? 'text-white/60' : 'text-[#1A1A1A]/50'}`}>
                Total Cards
              </span>
              <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">{stats.total}</span>
            </button>

            <button
              onClick={() => setSelectedStatus('unassigned')}
              className={`p-3.5 border border-[#1A1A1A] text-left transition-all cursor-pointer font-sans ${
                selectedStatus === 'unassigned'
                  ? 'bg-[#1A1A1A] text-white shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                  : 'bg-white text-[#1A1A1A] hover:bg-[#EAE9E4]'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold tracking-widest block ${selectedStatus === 'unassigned' ? 'text-white/60' : 'text-[#1A1A1A]/50'}`}>
                Unassigned
              </span>
              <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                {stats.unassigned}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus('pending_redemption')}
              className={`p-3.5 border border-[#1A1A1A] text-left transition-all cursor-pointer font-sans ${
                selectedStatus === 'pending_redemption'
                  ? 'bg-[#1A1A1A] text-white shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                  : 'bg-white text-[#1A1A1A] hover:bg-[#EAE9E4]'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold tracking-widest block ${selectedStatus === 'pending_redemption' ? 'text-white/60' : 'text-[#1A1A1A]/50'}`}>
                Pending
              </span>
              <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                {stats.pending}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus('awaiting_confirmation')}
              className={`p-3.5 border border-[#1A1A1A] text-left transition-all cursor-pointer font-sans ${
                selectedStatus === 'awaiting_confirmation'
                  ? 'bg-[#1A1A1A] text-white shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                  : 'bg-white text-[#1A1A1A] hover:bg-[#EAE9E4]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-bold tracking-widest block ${selectedStatus === 'awaiting_confirmation' ? 'text-white/60' : 'text-[#1A1A1A]/50'}`}>
                  Accepted
                </span>
                {stats.awaiting > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                )}
              </div>
              <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
                {stats.awaiting}
              </span>
            </button>

            <button
              onClick={() => setSelectedStatus('used')}
              className={`p-3.5 border border-[#1A1A1A] text-left transition-all cursor-pointer font-sans ${
                selectedStatus === 'used'
                  ? 'bg-[#1A1A1A] text-white shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]'
                  : 'bg-white text-[#1A1A1A] hover:bg-[#EAE9E4]'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold tracking-widest block ${selectedStatus === 'used' ? 'text-white/60' : 'text-[#1A1A1A]/50'}`}>
                Completed
              </span>
              <span className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">{stats.used}</span>
            </button>
          </div>

          {/* Search and Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#1A1A1A]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter obligations by recipient name, task, or note..."
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-[#F5F5F0] border border-[#1A1A1A] font-serif placeholder:font-serif placeholder:italic focus:outline-none focus:bg-white transition-colors"
              />
            </div>

            {/* Quick Action button */}
            <button
              id="dashboard-new-card-btn"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] font-sans font-bold uppercase text-xs tracking-widest shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Issue New Favor Card</span>
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#1A1A1A]/60">
            <RefreshCw className="w-8 h-8 animate-spin text-[#1A1A1A] mb-3" />
            <p className="text-sm font-sans uppercase font-bold tracking-wider">Synchronizing Favor Ledger...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 border border-[#1A1A1A] bg-[#F5F5F0] text-[#1A1A1A] flex items-center justify-center mx-auto mb-4 font-serif text-xl font-bold italic">
              Ø
            </div>
            <h3 className="text-xl font-serif font-black text-[#1A1A1A] mb-1">No Favor Cards Found</h3>
            <p className="text-xs font-serif italic text-[#1A1A1A]/70 mb-6">
              {searchQuery
                ? `No obligations match "${searchQuery}". Reset search to show all.`
                : selectedStatus !== 'all'
                ? `You have zero cards in '${selectedStatus}' state.`
                : "No favor obligations recorded yet. Issue your first favor card to commence the exchange."}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setIsCreateOpen(true);
              }}
              className="px-6 py-2.5 bg-[#1A1A1A] text-white font-sans text-xs font-bold uppercase tracking-widest hover:bg-[#333] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-colors cursor-pointer"
            >
              + Create Favor Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                onOpenLoadFavor={(c) => setLoadFavorCard(c)}
                onOpenShareQR={(c) => setShareQRCard(c)}
                onOpenPrint={(c) => setPrintCard(c)}
                onOpenSimulator={(id) => handleOpenSimulatorForCard(id)}
                onConfirmDone={handleConfirmDone}
                onRevoke={handleRevoke}
                onReissue={handleReissue}
              />
            ))}
          </div>
        )}

        {/* Quick Access & Disclaimer Banner */}
        <div className="mt-12 p-6 sm:p-8 border-2 border-[#1A1A1A] bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 border border-[#1A1A1A] p-2 bg-[#F5F5F0] flex items-center justify-center shrink-0">
              <div className="w-full h-full border border-[#1A1A1A] grid grid-cols-3 gap-0.5 p-1">
                <div className="bg-[#1A1A1A]"></div>
                <div className="bg-[#1A1A1A]"></div>
                <div className="bg-transparent"></div>
                <div className="bg-[#1A1A1A]"></div>
                <div className="bg-transparent"></div>
                <div className="bg-[#1A1A1A]"></div>
                <div className="bg-[#1A1A1A]"></div>
                <div className="bg-[#1A1A1A]"></div>
                <div className="bg-transparent"></div>
              </div>
            </div>
            <div>
              <p className="font-sans text-xs font-bold uppercase tracking-wider mb-1">
                Share Quick Access
              </p>
              <p className="font-serif italic text-sm text-[#1A1A1A]/70 max-w-xl">
                Print universal dashboard cards or share individual QR links to let recipients verify and accept their assigned obligations instantly.
              </p>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-l border-[#1A1A1A] pt-4 md:pt-0 md:pl-6 max-w-sm">
            <p className="text-[10px] uppercase font-sans font-bold text-[#1A1A1A]/40 leading-tight">
              Legal Disclaimer
            </p>
            <p className="text-[11px] font-serif italic text-[#1A1A1A]/70 leading-relaxed mt-0.5">
              This application is legally non-binding but socially absolute. Use responsibly when calling in significant life favors.
            </p>
          </div>
        </div>
      </main>

      {/* Editorial Masthead Footer */}
      <footer className="px-6 sm:px-10 py-5 border-t border-[#1A1A1A] bg-[#1A1A1A] text-white flex flex-col sm:flex-row justify-between items-center gap-4 mt-12">
        <div className="flex flex-wrap items-center gap-6 sm:gap-10 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
          <span>Protocol v4.0</span>
          <span>Server Status: Nominal</span>
          <span>Authenticated: {currentUser?.displayName || 'Creator'}</span>
        </div>
        <div className="font-serif italic text-sm text-white/90">
          "The favor is a debt that never rots."
        </div>
      </footer>

      {/* Modals */}
      <CreateCardModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateCard={handleCreateCard}
        onOpenPrintView={(id) => {
          const c = cards.find((x) => x.id === id);
          if (c) setPrintCard(c);
        }}
        onOpenSimulatorForCard={handleOpenSimulatorForCard}
      />

      <LoadFavorModal
        card={loadFavorCard}
        isOpen={!!loadFavorCard}
        onClose={() => setLoadFavorCard(null)}
        onLoadFavor={handleLoadFavor}
      />

      <ShareQRModal
        card={shareQRCard}
        isOpen={!!shareQRCard}
        onClose={() => setShareQRCard(null)}
        onOpenPrintView={(id) => {
          const c = cards.find((x) => x.id === id);
          if (c) setPrintCard(c);
        }}
        onOpenSimulatorForCard={handleOpenSimulatorForCard}
      />

      <RecipientSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        cards={cards}
        activeCardId={activeSimulatorCardId}
        onSelectCard={(id) => setActiveSimulatorCardId(id)}
      />

      <CreatorSwitchModal
        isOpen={isNewCreatorOpen}
        onClose={() => setIsNewCreatorOpen(false)}
        onCreate={handleCreateCreator}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          // Handled reactively by onAuthStateChanged
        }}
      />

      <VercelDeployModal
        isOpen={isVercelOpen}
        onClose={() => setIsVercelOpen(false)}
      />
    </div>
  );
}

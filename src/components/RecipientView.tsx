import { useState, useEffect, FormEvent } from 'react';
import confetti from 'canvas-confetti';
import { Card, PublicCard } from '../types.ts';
import { fetchPublicCard, cashInFavor, completeFavor, acceptFavor } from '../api.ts';
import { db, doc, onSnapshot } from '../lib/firebase.ts';
import { playAcceptChime, playStampSound } from '../utils/audio.ts';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Gift,
  HelpCircle,
  Send,
  Check,
} from 'lucide-react';

interface RecipientViewProps {
  cardId: string;
  isStandalone?: boolean;
  onCloseSimulator?: () => void;
}

const QUICK_DEMAND_IDEAS = [
  'Cook dinner for me and clean up',
  'Airport chauffeur ride at early hour',
  'Help me move heavy boxes/furniture',
  'Wash and interior vacuum my car',
  'One afternoon of yard/chore work',
  'Cover one weekend task for me',
];

export function RecipientView({ cardId, isStandalone = false, onCloseSimulator }: RecipientViewProps) {
  const [card, setCard] = useState<PublicCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashingIn, setCashingIn] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  // Cash in form state
  const [taskDemand, setTaskDemand] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');

  const loadCard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPublicCard(cardId);
      setCard(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load card');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCard();

    // Subscribe to real-time document updates via Firestore
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onSnapshot(
        doc(db, 'cards', cardId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Card;
            const isExpired = data.taskDeadline ? new Date(data.taskDeadline).getTime() < Date.now() : false;
            setCard({
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
            });
            setLoading(false);
          }
        },
        (snapErr) => {
          console.warn('Firestore snapshot notice:', snapErr);
        }
      );
    } catch (e) {
      console.warn('Could not establish Firestore snapshot listener:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [cardId]);

  const handleCashIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!card || !taskDemand.trim() || cashingIn) return;

    setCashingIn(true);
    setError(null);
    try {
      playAcceptChime();
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#1A1A1A'],
      });

      await cashInFavor(
        card.id,
        taskDemand.trim(),
        taskDeadline ? new Date(taskDeadline).toISOString() : null
      );
      playStampSound();
      await loadCard();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cashing in favor card');
    } finally {
      setCashingIn(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!card || completing) return;
    setCompleting(true);
    try {
      playStampSound();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.5 },
      });
      await completeFavor(card.id);
      await loadCard();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to complete favor');
    } finally {
      setCompleting(false);
    }
  };

  if (loading && !card) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center p-8 bg-white border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] text-[#1A1A1A]">
        <RefreshCw className="w-8 h-8 text-[#1A1A1A] animate-spin mb-4" />
        <p className="text-xs font-sans uppercase font-bold tracking-widest text-[#1A1A1A]/60">
          Retrieving Favor Ledger...
        </p>
      </div>
    );
  }

  if (error && !card) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center p-8 bg-white border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] text-[#1A1A1A] text-center font-serif">
        <ShieldAlert className="w-12 h-12 text-[#1A1A1A] mb-3" />
        <h3 className="text-xl font-bold font-serif text-[#1A1A1A] mb-1">Obligation Not Found</h3>
        <p className="text-xs italic text-[#1A1A1A]/70 max-w-sm mb-6">
          {error || 'This favor card link may be invalid or expired.'}
        </p>
        <button
          onClick={loadCard}
          className="px-5 py-2 bg-[#1A1A1A] text-white font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div
      className="relative w-full max-w-md mx-auto bg-white text-[#1A1A1A] p-6 sm:p-8 border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between font-serif"
    >
      {/* Top Header / Masthead */}
      <div>
        <div className="border-b-2 border-dashed border-[#1A1A1A] pb-4 mb-5 text-center relative">
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans text-[9px] uppercase font-bold tracking-[0.2em] text-[#1A1A1A]/50">
              Protocol Document
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadCard}
                title="Refresh status"
                className="p-1 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {onCloseSimulator && (
                <button
                  onClick={onCloseSimulator}
                  className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] px-2 py-0.5 border border-[#1A1A1A] bg-[#EAE9E4] hover:bg-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
          <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#1A1A1A] tracking-tighter leading-none">
            CSN • CAN'T SAY NO
          </h3>
          <p className="text-[9px] uppercase tracking-[0.25em] font-sans font-bold text-[#1A1A1A]/60 mt-1">
            Official Favor Exchange Protocol
          </p>
        </div>

        {/* Recipient & Creator Info */}
        <div className="mt-2">
          <p className="font-sans text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/40 mb-1">
            Beneficiary / Card Holder:
          </p>
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#1A1A1A] border-b border-[#1A1A1A] pb-2 mb-2 leading-tight">
            {card.recipientName}
          </h2>
          <p className="text-xs font-sans uppercase tracking-wider text-[#1A1A1A]/60">
            Promised by: <span className="font-bold text-[#1A1A1A]">{card.creatorName}</span>
          </p>
          {card.recipientNote && (
            <div className="mt-3 bg-[#F5F5F0] border-l-2 border-[#1A1A1A] p-3 text-xs italic font-serif text-[#1A1A1A]/80">
              "{card.recipientNote}"
            </div>
          )}
        </div>
      </div>

      {/* Center Body: State Specific Views */}
      <div className="my-5">
        {/* CASE 1: UNASSIGNED - THE RECIPIENT ENTERS THE TASK TO CASH IT IN! */}
        {card.status === 'unassigned' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#F5F5F0] border-2 border-[#1A1A1A]">
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="w-5 h-5 text-[#1A1A1A]" />
                <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                  You Hold The Power
                </span>
              </div>
              <p className="text-xs font-serif italic text-[#1A1A1A]/80 leading-relaxed">
                <strong className="font-bold text-[#1A1A1A] not-italic">{card.creatorName}</strong> gave you this card and pledged they <span className="underline font-bold">cannot say no</span>. When you decide to cash it in, simply input the task you want them to do!
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-serif italic">
                {error}
              </div>
            )}

            <form onSubmit={handleCashIn} className="space-y-3 font-sans">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#1A1A1A] mb-1.5">
                  Input The Task You Want {card.creatorName} To Do: <span className="text-red-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={taskDemand}
                  onChange={(e) => setTaskDemand(e.target.value)}
                  placeholder={`What favor do you want ${card.creatorName} to do for you? (e.g. Cook dinner for me, help assemble my desk, give me a ride to the airport, detail my car...)`}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F0] border border-[#1A1A1A] text-sm text-[#1A1A1A] font-serif placeholder:font-serif placeholder:italic focus:outline-none focus:bg-white transition-colors"
                />
              </div>

              {/* Quick Idea Chips */}
              <div>
                <span className="font-sans text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/50 block mb-1">
                  Quick Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_DEMAND_IDEAS.map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setTaskDemand(idea)}
                      className="px-2 py-1 bg-white border border-[#1A1A1A]/40 text-[#1A1A1A] text-[10px] font-sans hover:bg-[#EAE9E4] hover:border-[#1A1A1A] transition-colors cursor-pointer"
                    >
                      + {idea}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#1A1A1A] mb-1.5">
                  Completion Deadline <span className="text-[#1A1A1A]/40 normal-case">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F5F0] border border-[#1A1A1A] text-xs text-[#1A1A1A] font-serif focus:outline-none focus:bg-white transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={cashingIn || !taskDemand.trim()}
                  className="w-full bg-[#1A1A1A] text-white py-4 px-6 font-sans font-bold uppercase text-xs sm:text-sm tracking-[0.2em] hover:bg-[#333] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4 text-white" />
                    <span>{cashingIn ? 'Cashing In Card...' : 'CASH IN VOUCHER — DEMAND FAVOR'}</span>
                  </div>
                  <span className="text-[9px] font-sans font-normal opacity-70 tracking-wider mt-1">
                    * {card.creatorName} cannot say no.
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CASE 2: CASHED IN / AWAITING CONFIRMATION OR FULFILLMENT */}
        {(card.status === 'awaiting_confirmation' || card.status === 'pending_redemption') && (
          <div className="space-y-4">
            <div className="relative p-5 bg-[#F5F5F0] border-2 border-[#1A1A1A]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/50">
                  Task Demanded by You:
                </span>
                {card.taskDeadline && (
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#1A1A1A]" />
                    Due {new Date(card.taskDeadline).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="bg-white border border-[#1A1A1A] p-4 text-base sm:text-lg font-serif italic text-[#1A1A1A] leading-snug my-2">
                "{card.task}"
              </div>

              {card.taskDeadline && (
                <div className="font-sans text-[10px] uppercase tracking-wider text-[#1A1A1A]/70 flex items-center gap-1.5 mt-2 pt-2 border-t border-[#1A1A1A]/20">
                  <Clock className="w-3 h-3 text-[#1A1A1A]" />
                  <span>
                    Deadline: {new Date(card.taskDeadline).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Contract status */}
            <div className="text-center py-2 px-3 bg-amber-50 border border-amber-300 text-amber-950 text-xs font-serif">
              <p className="font-sans text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Voucher Cashed In
              </p>
              <p className="italic">
                <span className="font-bold text-[#1A1A1A]">{card.creatorName}</span> has received your demand. Under the rules of Can't Say No, they must fulfill this favor!
              </p>
            </div>

            {/* Recipient can also confirm completion once creator does it */}
            <div className="pt-2">
              <button
                onClick={handleMarkComplete}
                disabled={completing}
                className="w-full bg-[#1A1A1A] text-white py-3.5 px-5 font-sans font-bold uppercase text-xs tracking-wider hover:bg-[#333] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>{completing ? 'Sealing Card...' : `Confirm ${card.creatorName} Completed This Favor`}</span>
              </button>
              <p className="text-[10px] font-serif italic text-[#1A1A1A]/60 text-center mt-2">
                Or {card.creatorName} can mark it completed from their ledger dashboard.
              </p>
            </div>
          </div>
        )}

        {/* CASE 3: PERMANENTLY USED & SEALED */}
        {card.status === 'used' && (
          <div className="relative text-center py-8 px-4 bg-[#F5F5F0] border-2 border-[#1A1A1A] overflow-hidden">
            {/* Rubber Stamp graphic */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
              <div className="border-4 border-[#1A1A1A] text-[#1A1A1A] font-serif font-black text-2xl tracking-widest px-6 py-2 -rotate-12 uppercase">
                Redeemed & Done
              </div>
            </div>

            <div className="w-12 h-12 mx-auto border border-[#1A1A1A] bg-white text-[#1A1A1A] flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <span className="inline-block px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-widest bg-[#1A1A1A] text-white rounded-full mb-2">
              Permanently Sealed
            </span>
            <h3 className="font-serif font-bold text-xl text-[#1A1A1A] mb-1">
              Favor Completed!
            </h3>
            {card.task && (
              <div className="bg-white border border-[#1A1A1A] p-3 text-sm font-serif italic text-[#1A1A1A] my-3 max-w-xs mx-auto">
                "{card.task}"
              </div>
            )}
            <p className="text-xs font-serif italic text-[#1A1A1A]/70 max-w-xs mx-auto mb-3">
              This favor was honored and confirmed complete on{' '}
              {card.confirmedAt ? new Date(card.confirmedAt).toLocaleDateString() : 'earlier date'}.
            </p>
            <div className="p-3 bg-white border border-[#1A1A1A] text-[11px] font-serif italic text-[#1A1A1A]/70 max-w-xs mx-auto">
              As per the one-time use guarantee, this card is sealed and cannot be reused or redeemed again.
            </div>
          </div>
        )}

        {/* CASE 4: REVOKED */}
        {card.status === 'revoked' && (
          <div className="text-center py-6 px-4 bg-stone-100 border-2 border-[#1A1A1A]">
            <div className="w-12 h-12 mx-auto border border-[#1A1A1A] bg-white text-[#1A1A1A] flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#1A1A1A] mb-1">
              Card Revoked
            </h3>
            <p className="text-xs font-serif italic text-[#1A1A1A]/70 max-w-xs mx-auto">
              This favor card was canceled by the creator and is no longer valid.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="pt-4 border-t border-[#1A1A1A] flex items-center justify-between font-sans text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A]/50">
        <span>ID: {card.id.slice(0, 8)}</span>
        <span>Issued: {new Date(card.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

import { Card } from '../types.ts';
import { CardBadge } from './CardBadge.tsx';
import {
  Sparkles,
  QrCode,
  CheckCircle2,
  Lock,
  RefreshCw,
  ExternalLink,
  Printer,
  Ban,
  Calendar,
  Clock,
  User,
} from 'lucide-react';

interface CardItemProps {
  key?: string;
  card: Card;
  onOpenLoadFavor: (card: Card) => void;
  onOpenShareQR: (card: Card) => void;
  onOpenPrint: (card: Card) => void;
  onOpenSimulator: (cardId: string) => void;
  onConfirmDone: (cardId: string) => void;
  onRevoke: (cardId: string) => void;
  onReissue: (cardId: string) => void;
}

export function CardItem({
  card,
  onOpenLoadFavor,
  onOpenShareQR,
  onOpenPrint,
  onOpenSimulator,
  onConfirmDone,
  onRevoke,
  onReissue,
}: CardItemProps) {
  // Check if expired while pending
  const isExpired =
    card.status === 'pending_redemption' &&
    !!card.taskDeadline &&
    new Date(card.taskDeadline).getTime() < Date.now();

  return (
    <div
      id={`card-item-${card.id}`}
      className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] transition-all p-6 flex flex-col justify-between"
    >
      {/* Top section: Recipient & Badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3 border-b border-[#1A1A1A] pb-3">
          <div>
            <p className="font-sans text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/40 mb-1">
              Recipient
            </p>
            <h3 className="font-serif font-black text-[#1A1A1A] text-xl sm:text-2xl leading-none">
              {card.recipientName}
            </h3>
          </div>
          <CardBadge status={card.status} isExpired={isExpired} />
        </div>

        {card.recipientNote && (
          <div className="bg-[#F5F5F0] border-l-2 border-[#1A1A1A] p-3 mb-4 text-xs font-serif italic text-[#1A1A1A]/80">
            "{card.recipientNote}"
          </div>
        )}

        {/* Task display when loaded */}
        {card.task ? (
          <div className="my-3">
            <div className="flex items-center justify-between font-sans text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/50 mb-1">
              <span>{card.recipientName}'s Demanded Task</span>
              {card.taskDeadline && (
                <span className="flex items-center gap-1 font-sans text-[10px] font-bold text-[#1A1A1A]">
                  <Calendar className="w-3 h-3 text-[#1A1A1A]" />
                  Due {new Date(card.taskDeadline).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="bg-[#F5F5F0] border-2 border-[#1A1A1A] p-3 text-base font-serif italic text-[#1A1A1A] leading-snug">
              "{card.task}"
            </div>
            {card.status !== 'used' && (
              <p className="text-[10px] font-serif italic text-[#1A1A1A]/70 mt-1">
                You promised {card.recipientName} you cannot say no!
              </p>
            )}
          </div>
        ) : (
          <div className="my-3 p-3 bg-[#F5F5F0]/60 border border-dashed border-[#1A1A1A]/30 text-center">
            <p className="font-sans text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/40">
              Voucher Status
            </p>
            <p className="font-serif italic text-xs text-[#1A1A1A]/70 mt-0.5">
              With {card.recipientName} • Waiting for them to cash it in & demand a task
            </p>
          </div>
        )}

        {/* Timestamps & Lifecycle trace */}
        <div className="font-sans text-[10px] uppercase tracking-wider text-[#1A1A1A]/50 space-y-0.5 my-3 pt-2 border-t border-[#1A1A1A]/10">
          <div>Minted: {new Date(card.createdAt).toLocaleDateString()}</div>
          {card.loadedAt && (
            <div>Favor Attached: {new Date(card.loadedAt).toLocaleDateString()}</div>
          )}
          {card.acceptedAt && (
            <div className="text-amber-900 font-bold">
              Accepted: {new Date(card.acceptedAt).toLocaleString()}
            </div>
          )}
          {card.confirmedAt && (
            <div className="text-[#1A1A1A] font-bold">
              Confirmed Done: {new Date(card.confirmedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-[#1A1A1A] mt-2 flex flex-wrap items-center justify-between gap-2">
        {/* State-specific primary action */}
        <div className="flex items-center flex-wrap gap-2">
          {card.status === 'unassigned' && (
            <button
              onClick={() => onOpenLoadFavor(card)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#EAE9E4] font-sans text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="Manually log task if recipient asked you in person"
            >
              <Sparkles className="w-3 h-3 text-[#1A1A1A]" />
              <span>Record Demand</span>
            </button>
          )}

          {(card.status === 'awaiting_confirmation' || card.status === 'pending_redemption') && (
            <button
              onClick={() => onConfirmDone(card.id)}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#1A1A1A] text-white hover:bg-emerald-900 border border-[#1A1A1A] font-sans text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Mark Completed</span>
            </button>
          )}

          {(card.status === 'used' || card.status === 'revoked') && (
            <button
              onClick={() => onReissue(card.id)}
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#EAE9E4] font-sans text-xs font-bold uppercase tracking-wider transition-colors"
              title="Mint a brand new card for this recipient"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reissue Card</span>
            </button>
          )}

          {/* Test recipient view directly */}
          <button
            onClick={() => onOpenSimulator(card.id)}
            className="flex items-center space-x-1 px-2.5 py-1.5 border border-[#1A1A1A] bg-[#EAE9E4] text-[#1A1A1A] hover:bg-white font-sans text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Preview what recipient sees"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Recipient View</span>
          </button>
        </div>

        {/* Secondary utilities */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onOpenShareQR(card)}
            className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] transition-colors cursor-pointer"
            title="View QR Code & Copy Link"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onOpenPrint(card)}
            className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] transition-colors cursor-pointer"
            title="Printable Voucher Sheet"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          {(card.status === 'unassigned' || card.status === 'pending_redemption') && (
            <button
              onClick={() => onRevoke(card.id)}
              className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-red-50 text-red-700 transition-colors cursor-pointer"
              title="Revoke / Cancel Card"
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

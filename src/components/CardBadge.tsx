import { CardStatus } from '../types.ts';
import { Clock, CheckCircle2, AlertCircle, Lock, Ban } from 'lucide-react';

interface CardBadgeProps {
  status: CardStatus;
  isExpired?: boolean;
}

export function CardBadge({ status, isExpired }: CardBadgeProps) {
  if (isExpired && status === 'pending_redemption') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 font-sans text-[10px] font-bold uppercase tracking-wider rounded-full">
        <AlertCircle className="w-3 h-3 text-rose-700" />
        Expired Favor
      </span>
    );
  }

  switch (status) {
    case 'unassigned':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F5F5F0] text-[#1A1A1A]/70 border border-[#1A1A1A]/30 font-sans text-[10px] font-bold uppercase tracking-wider rounded-full">
          <Clock className="w-3 h-3 text-[#1A1A1A]/60" />
          Unassigned Card
        </span>
      );
    case 'pending_redemption':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300 font-sans text-[10px] font-bold uppercase tracking-wider rounded-full">
          <AlertCircle className="w-3 h-3 text-blue-700" />
          Pending Redemption
        </span>
      );
    case 'awaiting_confirmation':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 font-sans text-[10px] font-bold uppercase tracking-wider rounded-full">
          <CheckCircle2 className="w-3 h-3 text-amber-700" />
          Awaiting Confirmation
        </span>
      );
    case 'used':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1A1A1A] text-white font-sans text-[10px] font-bold uppercase tracking-wider rounded-full">
          <Lock className="w-3 h-3 text-white/80" />
          Used & Locked
        </span>
      );
    case 'revoked':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-200 text-stone-700 border border-stone-400 font-sans text-[10px] font-bold uppercase tracking-wider rounded-full">
          <Ban className="w-3 h-3 text-stone-600" />
          Revoked
        </span>
      );
    default:
      return null;
  }
}


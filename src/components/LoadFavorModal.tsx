import { useState, FormEvent } from 'react';
import { Card } from '../types.ts';
import { X, Send, AlertTriangle, Calendar, Sparkles } from 'lucide-react';

interface LoadFavorModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onLoadFavor: (cardId: string, task: string, taskDeadline?: string | null) => Promise<void>;
}

export function LoadFavorModal({ card, isOpen, onClose, onLoadFavor }: LoadFavorModalProps) {
  const [task, setTask] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !card) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!task.trim()) {
      setError('Please specify the task or favor requested.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onLoadFavor(
        card.id,
        task.trim(),
        deadline ? new Date(deadline).toISOString() : null
      );
      setTask('');
      setDeadline('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to attach favor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 font-serif">
      <div className="bg-white max-w-lg w-full p-6 sm:p-7 border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] text-[#1A1A1A]">
        <div className="flex items-start justify-between pb-4 border-b border-[#1A1A1A]">
          <div>
            <span className="font-sans text-[10px] uppercase font-bold tracking-[0.2em] text-[#1A1A1A]/50 block mb-1">
              Manual Ledger Entry
            </span>
            <h3 className="font-serif font-black text-2xl text-[#1A1A1A] leading-tight">
              Record Recipient's Demand
            </h3>
            <p className="text-xs font-serif italic text-[#1A1A1A]/70 mt-0.5">
              Logging task demanded by <span className="font-bold underline decoration-[#1A1A1A]/40">{card.recipientName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-sans">
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-serif italic">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-[#1A1A1A] mb-1.5">
              Task Demanded by {card.recipientName} <span className="text-red-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder={`e.g. ${card.recipientName} asked me to help paint the kitchen or cook a 3-course dinner.`}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F0] border border-[#1A1A1A] text-sm text-[#1A1A1A] font-serif focus:outline-none focus:bg-white transition-colors"
            />
            <p className="text-[11px] font-serif italic text-[#1A1A1A]/60 mt-1">
              Remember: {card.recipientName} holds the card. You cannot say no!
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-[#1A1A1A] mb-1.5">
              Completion Deadline <span className="text-[#1A1A1A]/40 normal-case">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F5F5F0] border border-[#1A1A1A] text-sm text-[#1A1A1A] font-serif focus:outline-none focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="p-3.5 bg-[#F5F5F0] border border-[#1A1A1A] text-xs text-[#1A1A1A] flex items-start space-x-2.5 font-serif">
            <AlertTriangle className="w-4 h-4 text-[#1A1A1A] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider block">
                Binding Obligation Notice
              </span>
              <p className="text-[#1A1A1A]/80 italic leading-relaxed">
                Recording this demand places the card in <strong>Awaiting Confirmation</strong>. You are bound by the covenant of Can't Say No to fulfill it.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] font-sans text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Recording...' : 'Record Demand & Commit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

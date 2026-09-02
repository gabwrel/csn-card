import { useState } from 'react';
import { Card } from '../types.ts';
import { RecipientView } from './RecipientView.tsx';
import { X, Smartphone, ExternalLink, ChevronDown } from 'lucide-react';

interface RecipientSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  activeCardId: string | null;
  onSelectCard: (cardId: string) => void;
}

export function RecipientSimulatorModal({
  isOpen,
  onClose,
  cards,
  activeCardId,
  onSelectCard,
}: RecipientSimulatorModalProps) {
  if (!isOpen) return null;

  const currentCard = cards.find((c) => c.id === activeCardId) || cards[0];

  const handleOpenExternalTab = () => {
    if (currentCard) {
      window.open(`/card/${currentCard.id}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="flex flex-col items-center max-w-lg w-full">
        {/* Top bar with card selector */}
        <div className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 mb-4 flex items-center justify-between text-white shadow-xl">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold">Recipient Phone Simulator</span>
          </div>

          <div className="flex items-center space-x-2">
            {cards.length > 0 && (
              <select
                value={currentCard?.id || ''}
                onChange={(e) => onSelectCard(e.target.value)}
                className="bg-slate-800 text-xs text-slate-200 border border-slate-600 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.recipientName} ({c.status})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleOpenExternalTab}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Open full page in new browser tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Device Mockup Frame */}
        <div className="relative w-full max-w-[390px] rounded-[44px] bg-slate-950 p-3 shadow-2xl border-4 border-slate-800">
          {/* Phone Dynamic Island / Camera Notch */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20 flex items-center justify-end px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
          </div>

          {/* Screen Content */}
          <div className="w-full rounded-[34px] overflow-hidden pt-8 pb-3 bg-slate-950 min-h-[560px] flex flex-col justify-center">
            {currentCard ? (
              <RecipientView
                cardId={currentCard.id}
                onCloseSimulator={onClose}
              />
            ) : (
              <div className="text-center p-6 text-slate-400 text-xs">
                No cards created yet. Create a card from your dashboard!
              </div>
            )}
          </div>

          {/* Phone Home Indicator Bar */}
          <div className="w-32 h-1 bg-slate-600 rounded-full mx-auto mt-2"></div>
        </div>
      </div>
    </div>
  );
}

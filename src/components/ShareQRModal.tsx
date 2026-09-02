import { useState, useEffect, useRef } from 'react';
import { Card } from '../types.ts';
import { X, Copy, Check, Download, Printer, ExternalLink, QrCode, ShieldCheck } from 'lucide-react';
import { fetchQRCode } from '../api.ts';
import { CardBadge } from './CardBadge.tsx';
import { downloadCardAsPng } from '../utils/downloadCardPng.ts';

interface ShareQRModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrintView: (cardId: string) => void;
  onOpenSimulatorForCard: (cardId: string) => void;
}

export function ShareQRModal({
  card,
  isOpen,
  onClose,
  onOpenPrintView,
  onOpenSimulatorForCard,
}: ShareQRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savingPng, setSavingPng] = useState(false);
  const cardVoucherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && card) {
      setLoading(true);
      fetchQRCode(card.id)
        .then((res) => {
          setQrDataUrl(res.qrDataUrl);
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    } else {
      setQrDataUrl(null);
    }
  }, [isOpen, card]);

  if (!isOpen || !card) return null;

  const redemptionUrl = `${window.location.origin}/card/${card.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(redemptionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFullCardPng = async () => {
    if (!cardVoucherRef.current || savingPng) return;
    try {
      setSavingPng(true);
      const filename = `cant-say-no-card-${card.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      await downloadCardAsPng(cardVoucherRef.current, filename);
    } catch (e) {
      console.error('Failed to export full card PNG:', e);
    } finally {
      setSavingPng(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto font-serif">
      <div className="bg-white max-w-md w-full p-6 sm:p-7 border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] text-[#1A1A1A]">
        <div className="flex items-start justify-between pb-3 border-b border-[#1A1A1A]">
          <div>
            <span className="font-sans text-[10px] uppercase font-bold tracking-[0.2em] text-[#1A1A1A]/50 block mb-1">
              Dispatch Terminal
            </span>
            <h3 className="font-serif font-black text-2xl text-[#1A1A1A] leading-tight">Card Voucher & Link</h3>
            <p className="text-xs font-serif italic text-[#1A1A1A]/70 mt-0.5">
              Bearer: <span className="font-bold underline decoration-[#1A1A1A]/40">{card.recipientName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Entire Card Voucher Captured for PNG Download */}
        <div className="mt-4 flex flex-col items-center">
          <div
            ref={cardVoucherRef}
            className="w-full bg-white p-4 sm:p-5 border-2 border-dashed border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] my-2 relative"
          >
            {/* Header of voucher */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-[#F5F5F0] border border-[#1A1A1A] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-sm text-[#1A1A1A] tracking-tight leading-none">
                    CAN'T SAY NO
                  </h4>
                  <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-[#1A1A1A]/60">
                    Irrevocable Favor Card
                  </span>
                </div>
              </div>
              <span className="font-mono text-[9px] font-bold text-[#1A1A1A]">
                #{card.id.slice(0, 8)}
              </span>
            </div>

            {/* Recipient & Issuer */}
            <div className="pt-3 pb-2 text-center">
              <span className="font-sans text-[9px] uppercase font-bold tracking-widest text-[#1A1A1A]/50 block">
                Issued Exclusively To
              </span>
              <p className="font-serif font-black text-xl text-[#1A1A1A] tracking-tight">
                {card.recipientName}
              </p>
              <p className="text-[10px] font-serif text-[#1A1A1A]/70 mt-0.5">
                From: <strong className="font-bold text-[#1A1A1A]">{card.ownerName}</strong>
              </p>
              {card.recipientNote && (
                <p className="text-[10px] font-serif italic text-[#1A1A1A]/80 mt-1.5 px-2 py-1 bg-[#F5F5F0] border border-[#1A1A1A]/20">
                  "{card.recipientNote}"
                </p>
              )}
            </div>

            {/* Central QR Code */}
            <div className="flex flex-col items-center justify-center p-3 bg-[#F5F5F0] border border-[#1A1A1A] my-2">
              {loading ? (
                <div className="w-36 h-36 flex items-center justify-center bg-white border border-[#1A1A1A]">
                  <QrCode className="w-8 h-8 text-[#1A1A1A]/40" />
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${card.recipientName}`}
                  className="w-36 h-36 object-contain bg-white p-1 border border-[#1A1A1A]"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-xs font-serif italic text-red-600">
                  QR Error
                </div>
              )}
              <span className="font-sans text-[8px] font-bold uppercase tracking-widest text-[#1A1A1A] mt-2">
                Scan to Cash In & Demand Favor
              </span>
            </div>

            {/* Bottom terms on voucher */}
            <div className="pt-2 border-t border-[#1A1A1A]/20 flex items-center justify-between text-[9px] font-serif text-[#1A1A1A]/70">
              <span>Status: {card.status.toUpperCase()}</span>
              <span className="font-mono">{new Date(card.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Link input with copy button */}
        <div className="space-y-3 font-sans mt-3">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] mb-1">
              Direct Redemption URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={redemptionUrl}
                className="w-full px-3 py-2 text-xs bg-[#F5F5F0] border border-[#1A1A1A] text-[#1A1A1A] font-mono select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shrink-0 transition-colors shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-300" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1A1A1A]">
            <button
              type="button"
              onClick={handleDownloadFullCardPng}
              disabled={loading || savingPng}
              className="flex flex-col items-center justify-center p-2.5 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              title="Download entire card voucher as PNG image"
            >
              <Download className="w-4 h-4 mb-1" />
              <span>{savingPng ? 'Saving...' : 'Save Card PNG'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenPrintView(card.id);
                onClose();
              }}
              className="flex flex-col items-center justify-center p-2.5 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 mb-1" />
              <span>Print Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenSimulatorForCard(card.id);
                onClose();
              }}
              className="flex flex-col items-center justify-center p-2.5 border border-[#1A1A1A] bg-[#EAE9E4] text-[#1A1A1A] hover:bg-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 mb-1" />
              <span>Test View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

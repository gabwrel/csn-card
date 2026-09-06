import { useState, FormEvent, useRef } from 'react';
import { Card } from '../types.ts';
import { X, Sparkles, Copy, Check, Download, Printer, ExternalLink, QrCode, ShieldCheck } from 'lucide-react';
import { fetchQRCode } from '../api.ts';
import { downloadCardAsPng } from '../utils/downloadCardPng.ts';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCard: (data: {
    recipientName: string;
    recipientNote?: string;
    themeColor: Card['themeColor'];
  }) => Promise<Card>;
  onOpenPrintView: (cardId: string) => void;
  onOpenSimulatorForCard: (cardId: string) => void;
}

export function CreateCardModal({
  isOpen,
  onClose,
  onCreateCard,
  onOpenPrintView,
  onOpenSimulatorForCard,
}: CreateCardModalProps) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientNote, setRecipientNote] = useState('');
  const [themeColor, setThemeColor] = useState<Card['themeColor']>('amber');
  const [loading, setLoading] = useState(false);
  const [createdCard, setCreatedCard] = useState<Card | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savingPng, setSavingPng] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardVoucherRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setRecipientName('');
    setRecipientNote('');
    setThemeColor('amber');
    setCreatedCard(null);
    setQrDataUrl(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setError('Please provide a recipient name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const card = await onCreateCard({
        recipientName: recipientName.trim(),
        recipientNote: recipientNote.trim() || undefined,
        themeColor,
      });
      setCreatedCard(card);
      // Fetch QR Code
      const qrRes = await fetchQRCode(card.id);
      setQrDataUrl(qrRes.qrDataUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate card');
    } finally {
      setLoading(false);
    }
  };

  const getRedemptionUrl = (cardId: string) => {
    return `${window.location.origin}/card/${cardId}`;
  };

  const handleCopyLink = () => {
    if (!createdCard) return;
    navigator.clipboard.writeText(getRedemptionUrl(createdCard.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownloadFullCardPng = async () => {
    if (!cardVoucherRef.current || !createdCard || savingPng) return;
    try {
      setSavingPng(true);
      const filename = `cant-say-no-card-${createdCard.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      await downloadCardAsPng(cardVoucherRef.current, filename);
    } catch (err) {
      console.error('Failed to export full card PNG:', err);
    } finally {
      setSavingPng(false);
    }
  };

  const themeOptions: { color: Card['themeColor']; label: string; class: string }[] = [
    { color: 'amber', label: 'Gold Amber', class: 'bg-amber-400' },
    { color: 'indigo', label: 'Royal Indigo', class: 'bg-indigo-500' },
    { color: 'emerald', label: 'Mint Emerald', class: 'bg-emerald-500' },
    { color: 'rose', label: 'Crimson Rose', class: 'bg-rose-500' },
    { color: 'slate', label: 'Midnight Slate', class: 'bg-slate-700' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto font-serif">
      <div className="bg-white max-w-lg w-full p-6 sm:p-7 border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] my-8 text-[#1A1A1A]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1A1A1A]">
          <div>
            <span className="font-sans text-[10px] uppercase font-bold tracking-[0.2em] text-[#1A1A1A]/50 block mb-1">
              Ledger Entry
            </span>
            <h3 className="font-serif font-black text-[#1A1A1A] text-2xl leading-tight">
              {createdCard ? 'Favor Card Minted' : 'Mint New Favor Card'}
            </h3>
            <p className="text-xs font-serif italic text-[#1A1A1A]/70 mt-0.5">
              {createdCard
                ? 'Card is unassigned. Ready to gift or print immediately.'
                : 'Initializes unassigned — attach the specific favor task whenever ready.'}
            </p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Form */}
        {!createdCard ? (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-sans">
            {error && (
              <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-serif italic">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-[#1A1A1A] mb-1.5">
                Recipient Name or Alias <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. John, Sarah, Dylan"
                className="w-full px-3.5 py-2.5 bg-[#F5F5F0] border border-[#1A1A1A] text-sm text-[#1A1A1A] font-serif focus:outline-none focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-[#1A1A1A] mb-1.5">
                Personal Inscription / Note <span className="text-[#1A1A1A]/40 normal-case">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={recipientNote}
                onChange={(e) => setRecipientNote(e.target.value)}
                placeholder="e.g. Keep this QR code handy. Whenever I decide to cash it in, you can't say no."
                className="w-full px-3.5 py-2.5 bg-[#F5F5F0] border border-[#1A1A1A] text-sm text-[#1A1A1A] font-serif focus:outline-none focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-[#1A1A1A] mb-2">
                Card Palette
              </label>
              <div className="flex items-center space-x-3">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.color}
                    type="button"
                    onClick={() => setThemeColor(opt.color)}
                    className={`w-8 h-8 rounded-full ${opt.class} flex items-center justify-center transition-all ${
                      themeColor === opt.color
                        ? 'ring-3 ring-offset-2 ring-[#1A1A1A] scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={opt.label}
                  >
                    {themeColor === opt.color && (
                      <Check className="w-4 h-4 text-white drop-shadow-xs" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-[#F5F5F0] border border-[#1A1A1A] text-xs text-[#1A1A1A] font-serif">
              <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">
                Protocol Notice:
              </p>
              <p className="italic leading-relaxed text-[#1A1A1A]/80">
                This card will be minted with status <strong className="font-sans uppercase text-[10px] bg-white px-1.5 py-0.5 border border-[#1A1A1A]">unassigned</strong>.
                You can print or send the QR link now. Whenever you decide to cash in your favor later, load the task directly from your dashboard.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] font-sans text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Minting Card...' : 'Generate Card & QR'}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Generated Card & QR Display */
          <div className="mt-5 space-y-4">
            {/* The Full Card Voucher captured by Save Card PNG */}
            <div
              ref={cardVoucherRef}
              className="p-5 bg-white border-2 border-dashed border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[#1A1A1A]">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-[#F5F5F0] border border-[#1A1A1A] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-sm text-[#1A1A1A] leading-tight">
                      CAN'T SAY NO
                    </h4>
                    <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-[#1A1A1A]/60">
                      Favor Voucher
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[9px] font-bold text-[#1A1A1A]">
                  #{createdCard.id.slice(0, 8)}
                </span>
              </div>

              <div className="text-center my-3 font-serif">
                <span className="font-sans text-[8px] uppercase font-bold tracking-widest text-[#1A1A1A]/50 block">
                  Beneficiary
                </span>
                <h4 className="font-serif font-black text-[#1A1A1A] text-xl">
                  {createdCard.recipientName}
                </h4>
                <p className="text-[10px] font-serif text-[#1A1A1A]/70">
                  Pledged by: <strong className="font-bold text-[#1A1A1A]">{createdCard.ownerName}</strong>
                </p>
                {createdCard.recipientNote && (
                  <p className="text-[11px] font-serif italic text-[#1A1A1A]/80 mt-1 px-2 py-0.5 bg-[#F5F5F0] border border-[#1A1A1A]/20">
                    "{createdCard.recipientNote}"
                  </p>
                )}
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 bg-[#F5F5F0] border border-[#1A1A1A]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Redemption QR Code"
                    className="w-36 h-36 object-contain bg-white p-1 border border-[#1A1A1A]"
                  />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center bg-white border border-[#1A1A1A]">
                    <QrCode className="w-8 h-8 text-[#1A1A1A]/40" />
                  </div>
                )}
                <span className="font-sans text-[8px] font-bold uppercase tracking-widest text-[#1A1A1A] mt-2">
                  Scan to Cash In & Demand Favor
                </span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#1A1A1A]/20 flex items-center justify-between text-[8px] font-sans font-bold uppercase tracking-wider text-[#1A1A1A]/60">
                <span>Terms: Recipient Inputs Task</span>
                <span>Obligor Cannot Say No</span>
              </div>
            </div>

            {/* Share link input */}
            <div>
              <label className="block font-sans text-[10px] uppercase font-bold tracking-wider text-[#1A1A1A] mb-1">
                Universal Redemption Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={getRedemptionUrl(createdCard.id)}
                  className="w-full px-3 py-2 text-xs bg-[#F5F5F0] border border-[#1A1A1A] text-[#1A1A1A] font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] font-sans text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shrink-0 transition-colors shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] cursor-pointer"
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

            {/* Actions: Save Full Card PNG, Printable View, Test as Recipient */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#1A1A1A]">
              <button
                type="button"
                onClick={handleDownloadFullCardPng}
                disabled={savingPng || !qrDataUrl}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold font-sans uppercase tracking-wider border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] transition-colors cursor-pointer disabled:opacity-50"
                title="Download the entire favor card as a PNG"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{savingPng ? 'Saving...' : 'Save Card PNG'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenPrintView(createdCard.id);
                  handleResetAndClose();
                }}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold font-sans uppercase tracking-wider border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>

              {/* <button
                type="button"
                onClick={() => {
                  onOpenSimulatorForCard(createdCard.id);
                  handleResetAndClose();
                }}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-bold font-sans uppercase tracking-wider border border-[#1A1A1A] bg-[#EAE9E4] text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Recipient</span>
              </button> */}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] font-sans text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] transition-all cursor-pointer"
              >
                Done & Return to Ledger
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

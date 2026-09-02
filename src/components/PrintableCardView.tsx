import { useState, useEffect, useRef } from 'react';
import { Card } from '../types.ts';
import { fetchQRCode } from '../api.ts';
import { downloadCardAsPng } from '../utils/downloadCardPng.ts';
import { Printer, Download, ArrowLeft, ShieldCheck, QrCode, Check } from 'lucide-react';

interface PrintableCardViewProps {
  card: Card;
  onBack: () => void;
}

export function PrintableCardView({ card, onBack }: PrintableCardViewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPng, setSavingPng] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQRCode(card.id)
      .then((res) => {
        setQrDataUrl(res.qrDataUrl);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [card.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadEntireCardPng = async () => {
    if (!cardRef.current || savingPng) return;
    try {
      setSavingPng(true);
      const filename = `cant-say-no-card-${card.recipientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
      await downloadCardAsPng(cardRef.current, filename);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error('Error saving full card PNG:', e);
    } finally {
      setSavingPng(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-8 px-4 sm:px-6 font-serif text-[#1A1A1A]">
      {/* Print Action Bar (Hidden on actual print) */}
      <div className="max-w-xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#EAE9E4] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Ledger</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadEntireCardPng}
            disabled={loading || savingPng}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-[#1A1A1A] text-[#1A1A1A] font-sans text-xs font-bold uppercase tracking-wider hover:bg-[#EAE9E4] transition-colors cursor-pointer disabled:opacity-50"
            title="Download high-resolution image of this entire favor certificate"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Card Saved!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{savingPng ? 'Generating PNG...' : 'Save Card PNG'}</span>
              </>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#1A1A1A] text-white font-sans text-xs font-bold uppercase tracking-widest hover:bg-[#333] transition-colors shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate</span>
          </button>
        </div>
      </div>

      {/* The Physical Card Sheet for Printing / PNG export */}
      <div
        ref={cardRef}
        className="max-w-xl mx-auto bg-white p-8 sm:p-10 border-2 border-dashed border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] relative print:shadow-none print:border-2 print:border-dashed print:border-black print:p-6 print:m-0 print:max-w-none"
      >
        {/* Cut guide badge */}
        <div className="absolute -top-3 left-8 bg-[#1A1A1A] text-white font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest print:hidden no-export">
          Cut along dashed boundary ✂
        </div>

        {/* Card Header */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-[#1A1A1A]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#F5F5F0] border-2 border-[#1A1A1A] flex items-center justify-center font-black text-[#1A1A1A] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <ShieldCheck className="w-7 h-7 text-[#1A1A1A]" />
            </div>
            <div>
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60 block">
                Official Favor IOU
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#1A1A1A] tracking-tight leading-none">
                CAN'T SAY NO
              </h1>
              <p className="text-xs font-serif italic text-[#1A1A1A]/70 mt-1">One-Time Irrevocable Favor Voucher</p>
            </div>
          </div>

          <div className="text-right">
            <span className="font-sans text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 font-mono block">
              Folio Ref
            </span>
            <span className="text-xs font-mono font-bold text-[#1A1A1A]">{card.id}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 py-6 border-b-2 border-[#1A1A1A] items-center">
          {/* Left: Details */}
          <div className="sm:col-span-3 space-y-4">
            <div>
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 block">
                Beneficiary / Recipient
              </span>
              <p className="text-2xl font-serif font-black text-[#1A1A1A] tracking-tight mt-0.5">
                {card.recipientName}
              </p>
            </div>

            <div>
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/60 block">
                Pledged Obligor (Issuer)
              </span>
              <p className="text-sm font-serif font-bold text-[#1A1A1A] mt-0.5">{card.ownerName}</p>
            </div>

            {card.recipientNote && (
              <div className="p-3 bg-[#F5F5F0] border border-[#1A1A1A] text-xs font-serif italic text-[#1A1A1A]">
                "{card.recipientNote}"
              </div>
            )}

            <div className="space-y-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] block">
                Covenant Terms:
              </span>
              <ul className="text-xs font-serif text-[#1A1A1A]/80 space-y-0.5 list-disc list-inside">
                <li>Bearer ({card.recipientName}) holds the right to demand 1 task of their choice.</li>
                <li>Obligor ({card.ownerName}) acknowledges they cannot say no.</li>
                <li>Scan the QR code to cash in this card and specify your task.</li>
                <li>Permanently decommissioned once fulfilled.</li>
              </ul>
            </div>
          </div>

          {/* Right: QR Code */}
          <div className="sm:col-span-2 flex flex-col items-center justify-center p-4 bg-[#F5F5F0] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
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
                QR error
              </div>
            )}
            <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A] mt-2.5 text-center">
              Scan to Cash In
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-4 flex items-center justify-between text-xs font-serif text-[#1A1A1A]/70">
          <span>Dated: {new Date(card.createdAt).toLocaleDateString()}</span>
          <span className="font-sans font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]">
            State: {card.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

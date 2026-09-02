import { useState, FormEvent } from 'react';
import { X, UserPlus } from 'lucide-react';

interface CreatorSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (displayName: string, email: string) => Promise<void>;
}

export function CreatorSwitchModal({ isOpen, onClose, onCreate }: CreatorSwitchModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a display name');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onCreate(name.trim(), email.trim());
      setName('');
      setEmail('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create creator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 font-serif">
      <div className="bg-white max-w-md w-full p-6 sm:p-7 border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] text-[#1A1A1A]">
        <div className="flex items-start justify-between pb-4 border-b border-[#1A1A1A]">
          <div>
            <span className="font-sans text-[10px] uppercase font-bold tracking-[0.2em] text-[#1A1A1A]/50 block mb-1">
              Personnel Registry
            </span>
            <h3 className="font-serif font-black text-2xl text-[#1A1A1A] leading-tight">Enroll Issuer Account</h3>
            <p className="text-xs font-serif italic text-[#1A1A1A]/70 mt-0.5">Register a new profile to authorize favor vouchers</p>
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
            <label className="block text-xs uppercase font-bold tracking-wider text-[#1A1A1A] mb-1">
              Issuer Display Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Miller"
              className="w-full px-3.5 py-2.5 bg-[#F5F5F0] border border-[#1A1A1A] text-sm text-[#1A1A1A] font-serif focus:outline-none focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-[#1A1A1A] mb-1">
              Email Dispatch <span className="text-[#1A1A1A]/40 normal-case">(Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@example.com"
              className="w-full px-3.5 py-2.5 bg-[#F5F5F0] border border-[#1A1A1A] text-sm text-[#1A1A1A] font-serif focus:outline-none focus:bg-white transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
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
              className="px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] font-sans text-xs font-bold uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Enroll & Select'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

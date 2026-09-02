import { useState } from 'react';
import { X, Copy, Check, ExternalLink, Terminal, ShieldCheck, CheckCircle2 } from 'lucide-react';
import fallbackConfig from '../../firebase-applet-config.json';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VercelDeployModal({ isOpen, onClose }: VercelDeployModalProps) {
  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!isOpen) return null;

  const envContent = `VITE_FIREBASE_API_KEY=${fallbackConfig.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${fallbackConfig.authDomain}
VITE_FIREBASE_PROJECT_ID=${fallbackConfig.projectId}
VITE_FIREBASE_STORAGE_BUCKET=${fallbackConfig.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${fallbackConfig.messagingSenderId}
VITE_FIREBASE_APP_ID=${fallbackConfig.appId}
VITE_FIREBASE_FIRESTORE_DATABASE_ID=${fallbackConfig.firestoreDatabaseId}`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envContent);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs">
      <div className="bg-white border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1A1A1A]">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="w-5 h-5 bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] font-mono font-bold">
                ▲
              </span>
              <span className="font-sans text-[10px] uppercase font-bold tracking-[0.2em] text-[#1A1A1A]/60">
                Production Readiness
              </span>
            </div>
            <h3 className="font-serif font-black text-2xl text-[#1A1A1A] leading-tight">
              Deploy to Vercel
            </h3>
            <p className="text-xs font-serif italic text-[#1A1A1A]/70 mt-0.5">
              Deploy this full-stack React + Firebase applet to Vercel in less than 2 minutes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#1A1A1A] hover:bg-[#EAE9E4] text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Step Checklist */}
        <div className="mt-5 space-y-4">
          <div className="p-3.5 bg-[#F5F5F0] border border-[#1A1A1A] space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                Import Repository to Vercel
              </h4>
            </div>
            <p className="text-xs font-serif text-[#1A1A1A]/80 pl-7 leading-relaxed">
              Push your code to GitHub, GitLab, or Bitbucket, then import it on{' '}
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold hover:text-black"
              >
                vercel.com/new
              </a>
              . Vercel automatically detects the Vite configuration provided in <code className="font-mono bg-white px-1 border border-[#1A1A1A]/30">vercel.json</code>.
            </p>
          </div>

          <div className="p-3.5 bg-[#F5F5F0] border border-[#1A1A1A] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                  Paste Vercel Environment Variables
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCopyEnv}
                className="px-2.5 py-1 bg-[#1A1A1A] text-white hover:bg-[#333] font-sans text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
              >
                {copiedEnv ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs font-serif text-[#1A1A1A]/80 pl-7">
              Paste these into Vercel's Environment Variables panel before building:
            </p>
            <div className="pl-7">
              <pre className="bg-white p-2.5 border border-[#1A1A1A] text-[10px] font-mono text-[#1A1A1A] overflow-x-auto leading-relaxed">
                {envContent}
              </pre>
            </div>
          </div>

          <div className="p-3.5 bg-[#F5F5F0] border border-[#1A1A1A] space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#1A1A1A]">
                Authorize Vercel Domain in Firebase
              </h4>
            </div>
            <p className="text-xs font-serif text-[#1A1A1A]/80 pl-7 leading-relaxed">
              In your{' '}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold hover:text-black inline-flex items-center gap-1"
              >
                Firebase Console <ExternalLink className="w-3 h-3" />
              </a>{' '}
              go to <strong>Authentication &gt; Settings &gt; Authorized domains</strong> and add your Vercel URL (e.g.{' '}
              <code className="font-mono bg-white px-1 border border-[#1A1A1A]/30">your-app.vercel.app</code>) so Google and Facebook popups can authenticate.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-serif text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span className="font-bold">Ready for Production</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1A1A1A] text-white hover:bg-[#333] font-sans text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

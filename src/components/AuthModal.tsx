import { useState } from 'react';
import { X, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { loginWithGoogle, loginWithFacebook, loginAsGuest } from '../lib/firebase.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | 'guest' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoadingProvider('google');
      setError(null);
      await loginWithGoogle();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Google login error:', err);
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      if (msg.includes('popup-closed-by-user')) {
        setError('Sign in popup was closed. Please try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoadingProvider('facebook');
      setError(null);
      await loginWithFacebook();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Facebook login error:', err);
      const msg = err instanceof Error ? err.message : 'Facebook authentication failed';
      // If Facebook provider isn't enabled with credentials in Firebase Console yet
      if (
        msg.includes('operation-not-supported') ||
        msg.includes('configuration-not-found') ||
        msg.includes('auth/invalid-oauth-provider') ||
        msg.includes('auth/account-exists-with-different-credential')
      ) {
        setError(
          'Facebook login requires a Facebook App ID & App Secret configured in your Firebase Console (Authentication > Sign-in method > Facebook). For immediate access, use Google Sign-In or Continue as Guest.'
        );
      } else if (msg.includes('popup-closed-by-user')) {
        setError('Sign in popup was closed. Please try again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoadingProvider('guest');
      setError(null);
      await loginAsGuest();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Guest login error:', err);
      setError(err instanceof Error ? err.message : 'Guest login failed');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-xs">
      <div className="bg-white border-2 border-[#1A1A1A] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] max-w-md w-full p-6 sm:p-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1A1A1A]">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-[#1A1A1A]" />
              <span className="font-sans text-[10px] uppercase font-bold tracking-[0.2em] text-[#1A1A1A]/60">
                Identity Authentication
              </span>
            </div>
            <h3 className="font-serif font-black text-2xl text-[#1A1A1A] leading-tight">
              Sign In to Can't Say No
            </h3>
            <p className="text-xs font-serif italic text-[#1A1A1A]/70 mt-1">
              Mint, track, and guarantee your irrevocable favor commitments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#1A1A1A] hover:bg-[#EAE9E4] text-[#1A1A1A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-300 text-red-900 text-xs font-serif flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {/* Login Buttons */}
        <div className="mt-6 space-y-3 font-sans">
          {/* Google Login */}
          <button
            id="auth-google-btn"
            onClick={handleGoogleLogin}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white hover:bg-[#F5F5F0] text-[#1A1A1A] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-sm font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
          >
            {/* Official Google SVG Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>
              {loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
            </span>
          </button>

          {/* Facebook Login */}
          <button
            id="auth-facebook-btn"
            onClick={handleFacebookLogin}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-sm font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
          >
            {/* Facebook SVG Icon */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>
              {loadingProvider === 'facebook' ? 'Connecting to Facebook...' : 'Continue with Facebook'}
            </span>
          </button>

          {/* Guest / Demo Option */}
          <div className="relative flex items-center py-2">
            <div className="grow border-t border-[#1A1A1A]/30"></div>
            <span className="shrink-0 px-3 font-sans text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">
              or instant preview
            </span>
            <div className="grow border-t border-[#1A1A1A]/30"></div>
          </div>

          <button
            id="auth-guest-btn"
            onClick={handleGuestLogin}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#F5F5F0] hover:bg-[#EAE9E4] text-[#1A1A1A] border border-[#1A1A1A] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span>
              {loadingProvider === 'guest' ? 'Entering...' : 'Continue as Guest / Demo'}
            </span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#1A1A1A]/20 text-center font-serif text-[11px] text-[#1A1A1A]/60 leading-relaxed">
          Powered by Firebase Firestore & Authentication. Your favor ledger is secured under the irrevocable Can't Say No covenant.
        </div>
      </div>
    </div>
  );
}

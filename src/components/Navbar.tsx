import { useState } from 'react';
import { User } from '../types.ts';
import { ShieldCheck, Plus, Sparkles, Smartphone, UserCheck, ChevronDown, Check, LogIn, LogOut, UploadCloud } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  allUsers: User[];
  onSwitchUser: (uid: string) => void;
  onOpenCreateCard: () => void;
  onOpenSimulator: () => void;
  onOpenNewCreatorModal: () => void;
  onOpenAuthModal: () => void;
  onOpenVercelModal: () => void;
  onLogout: () => void;
  isSimulatorOpen: boolean;
}

export function Navbar({
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenCreateCard,
  onOpenSimulator,
  onOpenNewCreatorModal,
  onOpenAuthModal,
  onOpenVercelModal,
  onLogout,
  isSimulatorOpen,
}: NavbarProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const isRealAuth = currentUser && !currentUser.isAnonymous && currentUser.uid !== 'usr_default_alex';

  return (
    <header className="sticky top-0 z-30 bg-[#F5F5F0] text-[#1A1A1A] border-b border-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between py-4 sm:py-6 gap-4">
          {/* Editorial Masthead Title & Subtitle */}
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter leading-none font-serif text-[#1A1A1A]">
                CAN'T SAY NO
              </h1>

            </div>
            <p className="text-[11px] sm:text-xs uppercase tracking-widest font-sans font-bold text-[#1A1A1A]/60 mt-1.5">
              The Unavoidable Favor Exchange System
            </p>
          </div>

          {/* Actions & Creator Profile */}
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 self-start sm:self-end">


            {/* Create Card Button */}
            <button
              id="nav-create-card-btn"
              onClick={onOpenCreateCard}
              className="flex items-center space-x-1.5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-sans font-bold uppercase tracking-widest bg-[#1A1A1A] text-white hover:bg-[#333] transition-all editorial-shadow-sm active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Card</span>
            </button>

            {/* Auth / Account Profile Button */}
            {isRealAuth ? (
              <div className="relative">
                <button
                  id="nav-creator-dropdown-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 border border-[#1A1A1A] bg-white hover:bg-[#EAE9E4] text-[#1A1A1A] text-xs font-sans font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Avatar'}
                      className="w-5 h-5 rounded-full object-cover border border-[#1A1A1A]"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[10px]">
                      {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[110px] truncate">
                    {currentUser?.displayName || 'Issuer'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#1A1A1A]" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-[#1A1A1A] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2.5 border-b border-[#1A1A1A] flex items-center space-x-3">
                      {currentUser?.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Avatar"
                          className="w-9 h-9 rounded-full object-cover border border-[#1A1A1A]"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm">
                          {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-serif font-bold text-[#1A1A1A] truncate block">
                            {currentUser?.displayName}
                          </span>
                          {currentUser?.providerId?.includes('google') && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 border border-blue-300 font-bold uppercase">
                              Google
                            </span>
                          )}
                          {currentUser?.providerId?.includes('facebook') && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1 py-0.2 border border-indigo-300 font-bold uppercase">
                              FB
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#1A1A1A]/60 font-sans truncate">{currentUser?.email}</p>
                      </div>
                    </div>

                    <div className="py-1">

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenNewCreatorModal();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider text-[#1A1A1A] hover:bg-[#F5F5F0] flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Switch Local Profile</span>
                      </button>
                    </div>

                    <div className="border-t border-[#1A1A1A] pt-1 mt-1">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider text-red-700 hover:bg-red-50 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="nav-signin-btn"
                onClick={onOpenAuthModal}
                className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 border-2 border-[#1A1A1A] bg-[#EAE9E4] hover:bg-white text-[#1A1A1A] text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


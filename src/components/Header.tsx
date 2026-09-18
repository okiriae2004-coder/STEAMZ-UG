import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  MapPin,
  User,
  Package,
  LogIn,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Crown,
  Store,
} from 'lucide-react';

interface HeaderProps {
  onOpenCart?: () => void;
  onOpenSpotSelector: () => void;
  onOpenTimeSimulator: () => void;
  onOpenActiveTracker: () => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSpotSelector,
  onOpenTimeSimulator,
  onOpenActiveTracker,
  onOpenAuth,
  onOpenProfile,
}) => {
  const {
    userRole,
    setUserRole,
    dropSpots,
    selectedDropSpotId,
    universities,
    selectedUniversityId,
    orders,
    hasAdminPrivilege,
    hasOwnerPrivilege,
    isSuperAdmin,
  } = useApp();

  const { currentUser, userProfile, logout, isDemoUser } = useAuth();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const activeEmail = currentUser?.email || userProfile?.email;
  const isSuper = isSuperAdmin(activeEmail);
  const canAdmin = hasAdminPrivilege(activeEmail);
  const canOwner = hasOwnerPrivilege(activeEmail);

  const currentUniversity =
    universities.find((u) => u.id === selectedUniversityId) || universities[0];

  const currentSpot =
    dropSpots.find((s) => s.id === selectedDropSpotId) || dropSpots[0];

  const isAuthenticated = Boolean(currentUser || userProfile);

  const activeUid = currentUser?.uid || userProfile?.uid;
  const activePhone = userProfile?.whatsapp || userProfile?.phone || '';

  const cleanPhone = (s?: string) =>
    (s || '').replace(/\D/g, '').slice(-9);

  const userPhoneDigits = cleanPhone(activePhone);

  const activeOrders = orders.filter((o) => {
    if (o.status === 'collected' || o.status === 'cancelled') return false;
    if (!isAuthenticated) return false;

    if (activeUid && o.userId && o.userId === activeUid) return true;

    if (
      activeEmail &&
      o.customerEmail &&
      o.customerEmail.toLowerCase() === activeEmail.toLowerCase()
    ) {
      return true;
    }

    if (userPhoneDigits && userPhoneDigits.length >= 7) {
      if (cleanPhone(o.customerPhone) === userPhoneDigits) return true;
      if (cleanPhone(o.customerWhatsapp) === userPhoneDigits) return true;
    }

    return false;
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* STEAMZ Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setUserRole('customer')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Flame className="h-6 w-6 fill-white" />
              </div>

              <span className="text-xl font-black tracking-tight text-stone-900 font-display leading-none">
                STEAMZ
              </span>
            </button>
          </div>

          {/* Pickup Spot */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onOpenSpotSelector}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-amber-50/50 text-xs text-stone-700 transition max-w-[180px] sm:max-w-[260px] truncate"
              title="Change your campus or pickup spot"
            >
              <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />

              <div className="text-left truncate">
                <span className="text-[9px] sm:text-[10px] uppercase font-black text-amber-700 block leading-none truncate">
                  {currentUniversity.shortName}
                </span>

                <span className="font-bold text-stone-800 truncate block text-[11px] sm:text-xs">
                  {currentSpot.shortCode} · {currentSpot.name}
                </span>
              </div>
            </button>
          </div>

          {/* Right-side controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

            {/* Admin / Owner role switching remains available only to authorized users */}
            {canAdmin || canOwner ? (
              <div className="hidden md:flex items-center gap-1.5 rounded-xl bg-stone-100 p-1 border border-stone-200">

                {isSuper && (
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs"
                    title="Super Admin Master Authority"
                  >
                    <Crown className="h-3 w-3" />
                    <span>Super Admin</span>
                  </div>
                )}

                <button
                  onClick={() => setUserRole('customer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    userRole === 'customer'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Customer</span>
                </button>

                {canOwner && (
                  <button
                    onClick={() => setUserRole('owner')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      userRole === 'owner'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Store className="h-3.5 w-3.5 text-amber-600" />
                    <span>Restaurant Hub</span>
                  </button>
                )}

                {canAdmin && (
                  <button
                    onClick={() => setUserRole('admin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      userRole === 'admin'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-stone-800" />
                    <span>Admin Portal</span>
                  </button>
                )}
              </div>
            ) : null}

            {/* Active orders */}
            {activeOrders.length > 0 && (
              <button
                onClick={onOpenActiveTracker}
                className="relative p-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition flex items-center gap-1.5 text-xs font-bold shadow-xs"
                title="View active orders"
              >
                <Package className="h-4 w-4 text-amber-400" />

                <span className="hidden lg:inline">
                  Orders
                </span>

                <span className="h-5 w-5 rounded-full bg-amber-500 text-stone-900 font-black text-[11px] flex items-center justify-center">
                  {activeOrders.length}
                </span>
              </button>
            )}

            {/* Mobile owner shortcut is retained, but no longer shown to ordinary customers */}
            {canOwner && (
              <button
                onClick={() =>
                  setUserRole(userRole === 'owner' ? 'customer' : 'owner')
                }
                className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-600 text-white font-extrabold text-xs shadow-xs transition hover:bg-orange-700"
                title="Toggle Restaurant Hub"
              >
                <Store className="h-3.5 w-3.5" />
                <span>
                  {userRole === 'owner' ? 'Store' : 'Kitchen Hub'}
                </span>
              </button>
            )}

            {/* Account */}
            <div className="relative">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => {
                      if (onOpenProfile) {
                        onOpenProfile();
                      } else {
                        setIsProfileMenuOpen(!isProfileMenuOpen);
                      }
                    }}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition text-xs font-semibold text-stone-800"
                    title="View your account"
                  >
                    {userProfile?.recipientPhoto ||
                    userProfile?.photoURL ? (
                      <img
                        src={
                          userProfile.recipientPhoto ||
                          userProfile.photoURL
                        }
                        alt={userProfile.displayName}
                        className="h-6 w-6 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[11px]">
                        {userProfile?.displayName
                          ?.charAt(0)
                          .toUpperCase() || 'U'}
                      </div>
                    )}

                    <span className="max-w-[100px] truncate hidden md:inline">
                      {userProfile?.displayName || 'My Account'}
                    </span>

                    <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-3 shadow-xl border border-stone-200 z-50 animate-in fade-in zoom-in-95 duration-150">

                      <div className="pb-2 mb-2 border-b border-stone-100">
                        <div className="font-bold text-xs text-stone-900 truncate">
                          {userProfile?.displayName}
                        </div>

                        <div className="text-[11px] text-stone-500 truncate">
                          {userProfile?.whatsapp ||
                            userProfile?.email ||
                            'Authenticated User'}
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold w-fit">
                          <ShieldCheck className="h-3 w-3" />
                          <span>
                            {isDemoUser
                              ? 'Demo Session'
                              : 'Firebase Verified'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">

                        {onOpenProfile && (
                          <button
                            onClick={() => {
                              setIsProfileMenuOpen(false);
                              onOpenProfile();
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-2 font-bold mb-1"
                          >
                            <User className="h-3.5 w-3.5 text-amber-600" />
                            <span>Profile & WhatsApp Settings</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setUserRole('customer');
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50 rounded-lg flex items-center gap-2"
                        >
                          <User className="h-3.5 w-3.5 text-stone-400" />
                          <span>Customer View</span>
                        </button>

                        {canOwner && (
                          <button
                            onClick={() => {
                              setUserRole('owner');
                              setIsProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50 rounded-lg flex items-center gap-2"
                          >
                            <Store className="h-3.5 w-3.5 text-amber-600" />
                            <span>Partner Restaurant Hub</span>
                          </button>
                        )}

                        {canAdmin && (
                          <button
                            onClick={() => {
                              setUserRole('admin');
                              setIsProfileMenuOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50 rounded-lg flex items-center gap-2"
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-stone-800" />
                            <span>Admin Spot Photos Hub</span>
                          </button>
                        )}

                        <button
                          onClick={async () => {
                            setIsProfileMenuOpen(false);
                            await logout();
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 font-semibold pt-2 border-t border-stone-100 mt-1"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
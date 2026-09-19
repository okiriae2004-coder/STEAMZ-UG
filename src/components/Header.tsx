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
  } = useApp();

  const {
    currentUser,
    userProfile,
    logout,
    isDemoUser,
  } = useAuth();

  const [
    isProfileMenuOpen,
    setIsProfileMenuOpen,
  ] = useState(false);

  const activeEmail =
    currentUser?.email ||
    userProfile?.email;

  const canAdmin =
    hasAdminPrivilege(activeEmail);

  const canOwner =
    hasOwnerPrivilege(activeEmail);

  const currentUniversity =
    universities.find(
      (university) =>
        university.id === selectedUniversityId
    ) || universities[0];

  const currentSpot =
    dropSpots.find(
      (spot) =>
        spot.id === selectedDropSpotId
    ) || dropSpots[0];

  const isAuthenticated = Boolean(
    currentUser || userProfile
  );

  const activeUid =
    currentUser?.uid ||
    userProfile?.uid;

  const activePhone =
    userProfile?.whatsapp ||
    userProfile?.phone ||
    '';

  const cleanPhone = (value?: string) =>
    (value || '')
      .replace(/\D/g, '')
      .slice(-9);

  const userPhoneDigits =
    cleanPhone(activePhone);

  const activeOrders = orders.filter(
    (order) => {
      if (
        order.status === 'collected' ||
        order.status === 'cancelled'
      ) {
        return false;
      }

      if (!isAuthenticated) {
        return false;
      }

      if (
        activeUid &&
        order.userId &&
        order.userId === activeUid
      ) {
        return true;
      }

      if (
        activeEmail &&
        order.customerEmail &&
        order.customerEmail.toLowerCase() ===
          activeEmail.toLowerCase()
      ) {
        return true;
      }

      if (
        userPhoneDigits &&
        userPhoneDigits.length >= 7
      ) {
        if (
          cleanPhone(order.customerPhone) ===
          userPhoneDigits
        ) {
          return true;
        }

        if (
          cleanPhone(order.customerWhatsapp) ===
          userPhoneDigits
        ) {
          return true;
        }
      }

      return false;
    }
  );

  /*
   * Keep this prop accepted for compatibility with App.tsx.
   *
   * The simulator is intentionally NOT exposed in the
   * customer header anymore.
   */
  void onOpenTimeSimulator;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">

          {/* BRAND */}
          <button
            onClick={() => {
              setUserRole('customer');
              setIsProfileMenuOpen(false);
            }}
            className="flex items-center gap-2 shrink-0 group"
            aria-label="Go to STEAMZ home"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6 fill-white" />
            </div>

            <span className="text-lg sm:text-xl font-black tracking-tight text-stone-900 leading-none">
              STEAMZ
            </span>
          </button>

          {/* PICKUP LOCATION */}
          <button
            onClick={onOpenSpotSelector}
            className="flex items-center gap-1.5 min-w-0 max-w-[150px] sm:max-w-[240px] px-2 py-1.5 rounded-xl hover:bg-stone-50 transition"
            title="Change pickup spot"
          >
            <MapPin className="h-4 w-4 text-amber-600 shrink-0" />

            <div className="text-left min-w-0">
              <span className="block text-[9px] sm:text-[10px] uppercase font-black text-stone-400 leading-none">
                Pickup
              </span>

              <span className="block text-[11px] sm:text-xs font-bold text-stone-800 truncate">
                {currentSpot?.shortCode ||
                  currentUniversity?.shortName ||
                  'Choose spot'}
                {currentSpot?.name
                  ? ` · ${currentSpot.name}`
                  : ''}
              </span>
            </div>
          </button>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* ACTIVE ORDERS */}
            {activeOrders.length > 0 && (
              <button
                onClick={onOpenActiveTracker}
                className="relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition text-xs font-bold"
                title="Track your active order"
              >
                <Package className="h-4 w-4 text-amber-400" />

                <span className="hidden sm:inline">
                  Orders
                </span>

                <span className="h-5 min-w-5 px-1 rounded-full bg-amber-500 text-stone-900 font-black text-[10px] flex items-center justify-center">
                  {activeOrders.length}
                </span>
              </button>
            )}

            {/* ACCOUNT */}
            <div className="relative">

              {isAuthenticated ? (
                <button
                  onClick={() => {
                    if (onOpenProfile) {
                      onOpenProfile();
                    } else {
                      setIsProfileMenuOpen(
                        (open) => !open
                      );
                    }
                  }}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition"
                  title="Account"
                >
                  {userProfile?.recipientPhoto ||
                  userProfile?.photoURL ? (
                    <img
                      src={
                        userProfile.recipientPhoto ||
                        userProfile.photoURL
                      }
                      alt={
                        userProfile.displayName ||
                        'Account'
                      }
                      className="h-7 w-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                      {userProfile?.displayName
                        ?.charAt(0)
                        .toUpperCase() ||
                        'U'}
                    </div>
                  )}

                  <span className="hidden md:block max-w-[90px] truncate text-xs font-bold text-stone-700">
                    {userProfile?.displayName ||
                      'Account'}
                  </span>

                  <ChevronDown className="h-3.5 w-3.5 text-stone-400 hidden sm:block" />
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    Sign In
                  </span>
                </button>
              )}

              {/* ACCOUNT MENU
                  Administrative functionality remains available
                  without cluttering the storefront. */}
              {isAuthenticated &&
                isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white p-3 shadow-xl border border-stone-200 z-50">

                    <div className="pb-3 mb-2 border-b border-stone-100">

                      <div className="font-bold text-sm text-stone-900 truncate">
                        {userProfile?.displayName ||
                          'Account'}
                      </div>

                      <div className="text-[11px] text-stone-500 truncate mt-0.5">
                        {userProfile?.whatsapp ||
                          userProfile?.email ||
                          'Authenticated User'}
                      </div>

                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-bold">
                        <ShieldCheck className="h-3 w-3" />

                        <span>
                          {isDemoUser
                            ? 'Demo Session'
                            : 'Verified Account'}
                        </span>
                      </div>
                    </div>

                    {/* PROFILE */}
                    {onOpenProfile && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-3 py-2.5 text-xs text-stone-700 hover:bg-stone-50 rounded-xl flex items-center gap-2 font-semibold"
                      >
                        <User className="h-4 w-4 text-stone-400" />
                        <span>
                          Profile & account
                        </span>
                      </button>
                    )}

                    {/* CUSTOMER VIEW */}
                    <button
                      onClick={() => {
                        setUserRole('customer');
                        setIsProfileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs rounded-xl flex items-center gap-2 font-semibold ${
                        userRole === 'customer'
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span>
                        Customer home
                      </span>
                    </button>

                    {/* OWNER PORTAL */}
                    {canOwner && (
                      <button
                        onClick={() => {
                          setUserRole('owner');
                          setIsProfileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs rounded-xl flex items-center gap-2 font-semibold ${
                          userRole === 'owner'
                            ? 'bg-amber-50 text-amber-700'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <Store className="h-4 w-4 text-amber-600" />
                        <span>
                          Restaurant dashboard
                        </span>
                      </button>
                    )}

                    {/* ADMIN PORTAL */}
                    {canAdmin && (
                      <button
                        onClick={() => {
                          setUserRole('admin');
                          setIsProfileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-xs rounded-xl flex items-center gap-2 font-semibold ${
                          userRole === 'admin'
                            ? 'bg-stone-100 text-stone-900'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>
                          Admin dashboard
                        </span>
                      </button>
                    )}

                    {/* SIGN OUT */}
                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-3 py-2.5 mt-2 border-t border-stone-100 pt-3 text-xs text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 font-semibold"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>
                        Sign out
                      </span>
                    </button>

                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
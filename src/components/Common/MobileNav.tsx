import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

import {
  UtensilsCrossed,
  Layers,
  Settings,
  ShoppingBag,
  User,
  ArrowLeftRight,
  Shield,
} from 'lucide-react';

interface MobileNavProps {
  onOpenCart: () => void;
  onOpenActiveTracker: () => void;
  onOpenSpotSelector: () => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;

  ownerActiveTab?: 
    | 'analytics'
    | 'orders'
    | 'menu'
    | 'settings';

  setOwnerActiveTab?: (
    tab:
      | 'analytics'
      | 'orders'
      | 'menu'
      | 'settings'
  ) => void;

  onOpenAdminSpots?: () => void;
}

export const MobileNav: React.FC<
  MobileNavProps
> = ({
  onOpenCart,
  onOpenActiveTracker,
  onOpenSpotSelector,
  onOpenAuth,
  onOpenProfile,
  ownerActiveTab = 'menu',
  setOwnerActiveTab,
  onOpenAdminSpots,
}) => {
  const {
    userRole,
    setUserRole,
    cart,
    orders,
    hasOwnerPrivilege,
    hasAdminPrivilege,
  } = useApp();

  const {
    currentUser,
    userProfile,
  } = useAuth();

  const isAuthenticated = Boolean(
    currentUser || userProfile
  );

  const activeUid =
    currentUser?.uid ||
    userProfile?.uid;

  const activeEmail =
    currentUser?.email ||
    userProfile?.email;

  const canOwner =
    hasOwnerPrivilege(activeEmail);

  const canAdmin =
    hasAdminPrivilege(activeEmail);

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

  const cartItemCount =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  const activeOrdersCount =
    orders.filter((order) => {
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
          cleanPhone(
            order.customerPhone
          ) === userPhoneDigits
        ) {
          return true;
        }

        if (
          cleanPhone(
            order.customerWhatsapp
          ) === userPhoneDigits
        ) {
          return true;
        }
      }

      return false;
    }).length;

  /*
   * CUSTOMER NAVIGATION
   *
   * Intentionally only contains the three actions
   * that customers actually need after opening STEAMZ:
   *
   * 1. Cart
   * 2. Track order
   * 3. Account
   *
   * Restaurant search remains on the main page.
   * Pickup spot remains in the header/search area.
   */
  if (
    userRole === 'customer' ||
    userRole === 'spot_explorer'
  ) {
    return (
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-4 py-2 shadow-xl safe-area-bottom"
      >

        <div className="flex items-center justify-around gap-2">

          {/* CART */}

          <button
            id="mobile-nav-cart"
            onClick={onOpenCart}
            className="relative flex flex-col items-center justify-center py-2 px-5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20 active:scale-95 transition min-h-[52px]"
          >
            <div className="relative">

              <ShoppingBag className="h-5 w-5" />

              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-stone-900 text-white text-[10px] font-black flex items-center justify-center border-2 border-amber-500">
                  {cartItemCount}
                </span>
              )}

            </div>

            <span className="text-[10px] font-black mt-1">
              Cart
            </span>
          </button>

          {/* ACTIVE ORDERS */}

          <button
            id="mobile-nav-orders"
            onClick={onOpenActiveTracker}
            disabled={
              activeOrdersCount === 0
            }
            className={`relative flex flex-col items-center justify-center py-2 px-5 rounded-2xl transition min-h-[52px] ${
              activeOrdersCount > 0
                ? 'text-stone-900 hover:bg-stone-100'
                : 'text-stone-300'
            }`}
          >

            <div className="relative">

              <Layers className="h-5 w-5" />

              {activeOrdersCount > 0 && (
                <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">
                  {activeOrdersCount}
                </span>
              )}

            </div>

            <span className="text-[10px] font-bold mt-1">
              Track order
            </span>

          </button>

          {/* ACCOUNT */}

          <button
            id="mobile-nav-account"
            onClick={() => {
              if (
                isAuthenticated &&
                onOpenProfile
              ) {
                onOpenProfile();
              } else {
                onOpenAuth();
              }
            }}
            className="flex flex-col items-center justify-center py-2 px-5 rounded-2xl text-stone-600 hover:bg-stone-100 transition min-h-[52px]"
          >

            {isAuthenticated ? (
              <>
                {userProfile?.recipientPhoto ||
                userProfile?.photoURL ? (
                  <img
                    src={
                      userProfile.recipientPhoto ||
                      userProfile.photoURL
                    }
                    alt="Profile"
                    className="h-5 w-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}

                <span className="text-[10px] font-bold mt-1">
                  Account
                </span>
              </>
            ) : (
              <>
                <User className="h-5 w-5" />

                <span className="text-[10px] font-bold mt-1">
                  Sign in
                </span>
              </>
            )}

          </button>

        </div>
      </nav>
    );
  }

  /*
   * ADMIN NAVIGATION
   *
   * Admin functionality remains intact, but is completely
   * separated from the customer navigation.
   */
  if (userRole === 'admin') {
    return (
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-3 py-2 shadow-xl safe-area-bottom"
      >

        <div className="flex items-center justify-around gap-1">

          <button
            onClick={() =>
              onOpenAdminSpots?.()
            }
            className="flex flex-col items-center justify-center py-2 px-3 rounded-xl text-stone-800 min-h-[48px]"
          >
            <Shield className="h-5 w-5 text-stone-800" />

            <span className="text-[10px] mt-1 font-semibold">
              Admin
            </span>
          </button>

          <button
            onClick={() =>
              onOpenProfile?.()
            }
            className="flex flex-col items-center justify-center py-2 px-3 rounded-xl text-stone-700 min-h-[48px]"
          >
            <Settings className="h-5 w-5" />

            <span className="text-[10px] mt-1 font-semibold">
              Settings
            </span>
          </button>

          <button
            onClick={() =>
              setUserRole('customer')
            }
            className="flex flex-col items-center justify-center py-2 px-3 rounded-xl text-amber-600 min-h-[48px]"
          >
            <ArrowLeftRight className="h-5 w-5" />

            <span className="text-[10px] mt-1 font-bold">
              Storefront
            </span>
          </button>

        </div>
      </nav>
    );
  }

  /*
   * RESTAURANT OWNER NAVIGATION
   *
   * This remains separate from customer navigation.
   */
  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-3 py-2 shadow-xl safe-area-bottom"
    >

      <div className="flex items-center justify-around">

        {/* MENU */}

        <button
          id="mobile-nav-owner-menu"
          onClick={() =>
            setOwnerActiveTab?.(
              'menu'
            )
          }
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition min-h-[48px] ${
            ownerActiveTab === 'menu'
              ? 'text-amber-600 font-bold'
              : 'text-stone-500'
          }`}
        >
          <UtensilsCrossed className="h-5 w-5" />

          <span className="text-[10px] mt-1">
            Menu
          </span>
        </button>

        {/* ORDERS */}

        <button
          id="mobile-nav-owner-orders"
          onClick={() =>
            setOwnerActiveTab?.(
              'orders'
            )
          }
          className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl transition min-h-[48px] ${
            ownerActiveTab === 'orders'
              ? 'text-amber-600 font-bold'
              : 'text-stone-500'
          }`}
        >
          <Layers className="h-5 w-5" />

          <span className="text-[10px] mt-1">
            Orders
          </span>

          {orders.filter(
            (order) =>
              order.status === 'placed' ||
              order.status === 'confirmed'
          ).length > 0 && (
            <span className="absolute top-1 right-2 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>

        {/* SETTINGS */}

        <button
          id="mobile-nav-owner-settings"
          onClick={() =>
            setOwnerActiveTab?.(
              'settings'
            )
          }
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition min-h-[48px] ${
            ownerActiveTab === 'settings'
              ? 'text-amber-600 font-bold'
              : 'text-stone-500'
          }`}
        >
          <Settings className="h-5 w-5" />

          <span className="text-[10px] mt-1">
            Settings
          </span>
        </button>

        {/* CUSTOMER STOREFRONT */}

        <button
          id="mobile-nav-switch-to-customer"
          onClick={() =>
            setUserRole('customer')
          }
          className="flex flex-col items-center justify-center py-2 px-3 rounded-xl text-stone-600 min-h-[48px]"
        >
          <ArrowLeftRight className="h-5 w-5" />

          <span className="text-[10px] mt-1 font-medium">
            Storefront
          </span>
        </button>

      </div>
    </nav>
  );
};
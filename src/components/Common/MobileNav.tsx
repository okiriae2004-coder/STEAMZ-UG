import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  Store,
  UtensilsCrossed,
  Layers,
  BarChart3,
  Settings,
  ShoppingBag,
  Package,
  MapPin,
  User,
  Flame,
  ArrowLeftRight,
  Shield,
} from 'lucide-react';

interface MobileNavProps {
  onOpenCart: () => void;
  onOpenActiveTracker: () => void;
  onOpenSpotSelector: () => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  ownerActiveTab?: 'analytics' | 'orders' | 'menu' | 'settings';
  setOwnerActiveTab?: (tab: 'analytics' | 'orders' | 'menu' | 'settings') => void;
  onOpenAdminSpots?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onOpenCart,
  onOpenActiveTracker,
  onOpenSpotSelector,
  onOpenAuth,
  onOpenProfile,
  ownerActiveTab = 'menu',
  setOwnerActiveTab,
  onOpenAdminSpots,
}) => {
  const { userRole, setUserRole, cart, orders, dropSpots, selectedDropSpotId } = useApp();
  const { currentUser, userProfile } = useAuth();

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'collected' && o.status !== 'cancelled'
  ).length;

  const currentSpot = dropSpots.find((s) => s.id === selectedDropSpotId) || dropSpots[0];
  const isAuthenticated = Boolean(currentUser || userProfile);

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-3 py-1.5 shadow-xl safe-area-bottom"
    >
      {userRole === 'customer' || userRole === 'spot_explorer' ? (
        // Customer Mobile Nav Bar - Clean 4-button layout (My Orders eliminated, integrated into Cart)
        <div className="flex items-center justify-around gap-1">
          <button
            id="mobile-nav-restaurants"
            onClick={() => setUserRole('customer')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-h-[48px] ${
              userRole === 'customer'
                ? 'text-amber-600 font-bold scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Store className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Restaurants</span>
          </button>

          <button
            id="mobile-nav-spots"
            onClick={onOpenSpotSelector}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-stone-500 hover:text-stone-800 transition-all min-h-[48px]"
          >
            <MapPin className="h-5 w-5 text-amber-600" />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">
              {currentSpot.shortCode} Spot
            </span>
          </button>

          {/* Cart & Active Orders Button (Combined as requested) */}
          <button
            id="mobile-nav-cart"
            onClick={onOpenCart}
            className="relative flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30 transition-transform active:scale-95 min-h-[48px] min-w-[66px]"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-amber-500 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-bold mt-0.5">
              Cart {cartItemCount > 0 ? `(${cartItemCount})` : ''}
            </span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-stone-900 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Account Profile Icon: Displays Recipient Photo & opens Profile/WhatsApp/Location */}
          <button
            id="mobile-nav-account"
            onClick={() => {
              if (isAuthenticated && onOpenProfile) {
                onOpenProfile();
              } else {
                onOpenAuth();
              }
            }}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-stone-600 hover:text-stone-900 transition-all min-h-[48px]"
            title="Your WhatsApp, Location & Recipient Profile"
          >
            {isAuthenticated ? (
              <div className="relative flex flex-col items-center">
                <div className="relative">
                  <img
                    src={
                      userProfile?.recipientPhoto ||
                      userProfile?.photoURL ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                    }
                    alt="Recipient Profile"
                    className="h-6 w-6 rounded-full object-cover border border-amber-400 ring-1 ring-white"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
                <span className="text-[10px] mt-0.5 font-bold tracking-tight text-amber-700 max-w-[68px] truncate">
                  Profile
                </span>
              </div>
            ) : (
              <>
                <User className="h-5 w-5 text-stone-500" />
                <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Sign In</span>
              </>
            )}
          </button>
        </div>
      ) : userRole === 'admin' ? (
        // Admin Mobile Nav Bar
        <div className="flex items-center justify-around gap-1">
          <button
            onClick={() => onOpenAdminSpots?.()}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-stone-900 font-bold min-h-[48px]"
          >
            <MapPin className="h-5 w-5 text-amber-600" />
            <span className="text-[10px] mt-0.5 tracking-tight">Spot Photos</span>
          </button>

          <button
            onClick={() => onOpenProfile?.()}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-stone-700 min-h-[48px]"
          >
            <Shield className="h-5 w-5 text-stone-800" />
            <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Manage Admins</span>
          </button>

          <button
            onClick={() => setUserRole('customer')}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-amber-600 font-bold min-h-[48px]"
          >
            <ArrowLeftRight className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Customer View</span>
          </button>
        </div>
      ) : (
        // Restaurant Owner Mobile Nav Bar
        <div className="flex items-center justify-around">
          <button
            id="mobile-nav-owner-menu"
            onClick={() => setOwnerActiveTab?.('menu')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-h-[46px] min-w-[56px] ${
              ownerActiveTab === 'menu'
                ? 'text-amber-600 font-bold scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <UtensilsCrossed className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Food & Prices</span>
          </button>

          <button
            id="mobile-nav-owner-orders"
            onClick={() => setOwnerActiveTab?.('orders')}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-h-[46px] min-w-[56px] ${
              ownerActiveTab === 'orders'
                ? 'text-amber-600 font-bold scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Orders</span>
            {orders.filter((o) => o.status === 'placed' || o.status === 'confirmed').length > 0 && (
              <span className="absolute top-0 right-2 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-ping" />
            )}
          </button>

          <button
            id="mobile-nav-owner-analytics"
            onClick={() => setOwnerActiveTab?.('analytics')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-h-[46px] min-w-[56px] ${
              ownerActiveTab === 'analytics'
                ? 'text-amber-600 font-bold scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Sales</span>
          </button>

          <button
            id="mobile-nav-owner-settings"
            onClick={() => setOwnerActiveTab?.('settings')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-h-[46px] min-w-[56px] ${
              ownerActiveTab === 'settings'
                ? 'text-amber-600 font-bold scale-105'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">Settings</span>
          </button>

          <button
            id="mobile-nav-switch-to-customer"
            onClick={() => setUserRole('customer')}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-stone-600 hover:text-amber-600 transition-all min-h-[46px] min-w-[56px]"
            title="Preview Customer Storefront"
          >
            <ArrowLeftRight className="h-5 w-5 text-stone-400" />
            <span className="text-[9px] mt-0.5 tracking-tight font-medium">Customer View</span>
          </button>
        </div>
      )}
    </nav>
  );
};

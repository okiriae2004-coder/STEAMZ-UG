import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { RestaurantList } from './components/Customer/RestaurantList';
import { RestaurantDetail } from './components/Customer/RestaurantDetail';
import { CartDrawer } from './components/Customer/CartDrawer';
import { SpotSelectorModal } from './components/Common/SpotSelectorModal';
import { TimeSimulatorModal } from './components/Common/TimeSimulatorModal';
import { OrderTrackerModal } from './components/Customer/OrderTrackerModal';
import { AuthModal } from './components/Auth/AuthModal';
import { ProfileModal } from './components/Auth/ProfileModal';
import { OwnerDashboard } from './components/Owner/OwnerDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { SpotDirectory } from './components/Spots/SpotDirectory';
import { MobileNav } from './components/Common/MobileNav';
import { Restaurant } from './types';
import {
  Clock,
  MapPin,
  Flame,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Thermometer,
  Package,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { formatTime12h } from './utils/timeUtils';

function MainLayout() {
  const {
    userRole,
    setUserRole,
    orders,
    activeTrackingOrderId,
    setActiveTrackingOrderId,
    setSelectedDropSpotId,
    simulatedTime,
    resetToDefaults,
    lowDataMode,
    setLowDataMode,
  } = useApp();

  const { currentUser, userProfile } = useAuth();

  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSpotSelectorOpen, setIsSpotSelectorOpen] = useState(false);
  const [isTimeSimulatorOpen, setIsTimeSimulatorOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | null>(null);
  const [ownerActiveTab, setOwnerActiveTab] = useState<'analytics' | 'orders' | 'menu' | 'settings'>('menu');

  // Sync user role from profile if signed in
  useEffect(() => {
    if (userProfile?.role) {
      setUserRole(userProfile.role);
    }
  }, [userProfile?.role, setUserRole]);

  // If a new order was placed and set to activeTrackingOrderId, open tracker
  useEffect(() => {
    if (activeTrackingOrderId) {
      setSelectedTrackingOrderId(activeTrackingOrderId);
      setIsTrackerOpen(true);
      setActiveTrackingOrderId(null);
    }
  }, [activeTrackingOrderId, setActiveTrackingOrderId]);

  const handleOpenActiveTracker = () => {
    // Pick the most recent active order belonging to current user
    const activeUid = currentUser?.uid || userProfile?.uid;
    const activeEmail = currentUser?.email || userProfile?.email;
    const userOrders = orders.filter((o) => {
      if (activeUid && o.userId) return o.userId === activeUid;
      if (activeEmail && o.customerEmail) return o.customerEmail.toLowerCase() === activeEmail.toLowerCase();
      return false;
    });
    const active = userOrders.find((o) => o.status !== 'collected' && o.status !== 'cancelled') || userOrders[0];
    if (active) {
      setSelectedTrackingOrderId(active.id);
      setIsTrackerOpen(true);
    }
  };

  const handleSelectSpotAndShop = (spotId: string) => {
    setSelectedDropSpotId(spotId);
    setUserRole('customer');
    setSelectedRestaurant(null);
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col selection:bg-amber-200">
      {/* Top Header */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSpotSelector={() => setIsSpotSelectorOpen(true)}
        onOpenTimeSimulator={() => setIsTimeSimulatorOpen(true)}
        onOpenActiveTracker={handleOpenActiveTracker}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Low-Data / Slow Internet Mode Indicator & Toggle for Mobile & Web */}
      <div className="bg-stone-900 text-stone-300 py-1 px-4 text-[11px] flex items-center justify-between border-b border-stone-800">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            {lowDataMode ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <WifiOff className="h-3 w-3" />
                <span>Low-Data Mode Active (Lightweight assets for slow networks)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-stone-400">
                <Wifi className="h-3 w-3 text-stone-500" />
                <span className="hidden sm:inline">Optimized for spot-drop delivery</span>
                <span className="sm:hidden">STEAMZ Delivery</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setLowDataMode(!lowDataMode)}
            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] transition ${
              lowDataMode
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-stone-400 hover:text-white bg-stone-800'
            }`}
          >
            {lowDataMode ? 'Disable Low-Data' : '⚡ Enable Slow-Internet Mode'}
          </button>
        </div>
      </div>

      {/* Main Page Container with generous bottom padding so no content is hidden under lower bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32 md:pb-12">
        {userRole === 'customer' && (
          <>
            {selectedRestaurant ? (
              <RestaurantDetail
                restaurant={selectedRestaurant}
                onBack={() => setSelectedRestaurant(null)}
                onOpenSpotSelector={() => setIsSpotSelectorOpen(true)}
              />
            ) : (
              <RestaurantList
                onSelectRestaurant={(rest) => setSelectedRestaurant(rest)}
                onOpenSpotSelector={() => setIsSpotSelectorOpen(true)}
              />
            )}
          </>
        )}

        {userRole === 'owner' && (
          <OwnerDashboard
            activeTab={ownerActiveTab}
            onTabChange={setOwnerActiveTab}
          />
        )}

        {userRole === 'admin' && (
          <AdminDashboard
            onBackToCustomer={() => setUserRole('customer')}
          />
        )}

        {userRole === 'spot_explorer' && (
          <SpotDirectory onSelectSpotAndShop={handleSelectSpotAndShop} />
        )}
      </main>

      {/* Mobile Dedicated Bottom Navigation (Active on Mobile, hidden on PC) */}
      <MobileNav
        onOpenCart={() => setIsCartOpen(true)}
        onOpenActiveTracker={handleOpenActiveTracker}
        onOpenSpotSelector={() => setIsSpotSelectorOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAdminSpots={() => setUserRole('admin')}
        ownerActiveTab={ownerActiveTab}
        setOwnerActiveTab={setOwnerActiveTab}
      />

      {/* Footer with safety margin above mobile nav bar */}
      <footer className="mt-16 mb-24 md:mb-0 bg-white border-t border-stone-200 py-10 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Flame className="h-5 w-5 fill-white" />
            </div>
            <div>
              <div className="font-extrabold text-stone-900 text-sm">STEAMZ Platform</div>
              <p className="text-[11px] text-stone-400">
                Designated spot batch delivery • Timed meal order windows • Restaurant analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap text-stone-600">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              PIN-Verified Smart Lockers
            </span>
            <span className="flex items-center gap-1">
              <Thermometer className="h-3.5 w-3.5 text-amber-600" />
              Thermal Batch Integrity
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              Prompt Window Cut-offs
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition flex items-center gap-1 text-[11px]"
              title="Reset orders and restaurants to default demo state"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenSpotSelector={() => setIsSpotSelectorOpen(true)}
        onOpenOrderTracker={(orderId) => {
          setSelectedTrackingOrderId(orderId);
          setIsTrackerOpen(true);
        }}
      />

      <SpotSelectorModal
        isOpen={isSpotSelectorOpen}
        onClose={() => setIsSpotSelectorOpen(false)}
      />

      <TimeSimulatorModal
        isOpen={isTimeSimulatorOpen}
        onClose={() => setIsTimeSimulatorOpen(false)}
      />

      <OrderTrackerModal
        orderId={selectedTrackingOrderId}
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenAdminSpots={() => {
          setIsProfileModalOpen(false);
          setUserRole('admin');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthProvider>
  );
}

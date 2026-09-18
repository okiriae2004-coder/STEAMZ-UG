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
import { Flame } from 'lucide-react';

function MainLayout() {
  const {
    userRole,
    setUserRole,
    orders,
    activeTrackingOrderId,
    setActiveTrackingOrderId,
    setSelectedDropSpotId,
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
  const [ownerActiveTab, setOwnerActiveTab] = useState<
    'analytics' | 'orders' | 'menu' | 'settings'
  >('menu');

  useEffect(() => {
    if (userProfile?.role) {
      setUserRole(userProfile.role);
    }

    if (userProfile?.preferredDropSpotId) {
      setSelectedDropSpotId(userProfile.preferredDropSpotId);
    }
  }, [userProfile, setUserRole, setSelectedDropSpotId]);

  useEffect(() => {
    if (activeTrackingOrderId) {
      setSelectedTrackingOrderId(activeTrackingOrderId);
      setIsTrackerOpen(true);
      setActiveTrackingOrderId(null);
    }
  }, [activeTrackingOrderId, setActiveTrackingOrderId]);

  const handleOpenActiveTracker = () => {
    const activeUid = currentUser?.uid || userProfile?.uid;
    const activeEmail = currentUser?.email || userProfile?.email;
    const activePhone = userProfile?.whatsapp || userProfile?.phone || '';

    const cleanPhone = (s?: string) =>
      (s || '').replace(/\D/g, '').slice(-9);

    const userPhoneDigits = cleanPhone(activePhone);

    const userOrders = orders.filter((o) => {
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

    const active =
      userOrders.find(
        (o) => o.status !== 'collected' && o.status !== 'cancelled'
      ) || userOrders[0];

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
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSpotSelector={() => setIsSpotSelectorOpen(true)}
        onOpenTimeSimulator={() => setIsTimeSimulatorOpen(true)}
        onOpenActiveTracker={handleOpenActiveTracker}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

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
                onOpenAuth={() => setIsAuthModalOpen(true)}
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

      {/* Customer-facing footer intentionally kept minimal. */}
      <footer className="mt-16 mb-24 md:mb-0 bg-white border-t border-stone-200 py-6 text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Flame className="h-4 w-4 fill-white" />
            </div>
            <span className="font-bold text-stone-500">
              STEAMZ
            </span>
          </div>
        </div>
      </footer>

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
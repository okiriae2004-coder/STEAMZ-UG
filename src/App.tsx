import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import { Header } from './components/Header';
import { RestaurantList } from './components/Customer/RestaurantList';
import { RestaurantDetail } from './components/Customer/RestaurantDetail';
import { CartDrawer } from './components/Customer/CartDrawer';
import { OrderTrackerModal } from './components/Customer/OrderTrackerModal';

import { SpotSelectorModal } from './components/Common/SpotSelectorModal';
import { TimeSimulatorModal } from './components/Common/TimeSimulatorModal';
import { MobileNav } from './components/Common/MobileNav';

import { AuthModal } from './components/Auth/AuthModal';
import { ProfileModal } from './components/Auth/ProfileModal';

import { OwnerDashboard } from './components/Owner/OwnerDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { SpotDirectory } from './components/Spots/SpotDirectory';

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

  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSpotSelectorOpen, setIsSpotSelectorOpen] = useState(false);
  const [isTimeSimulatorOpen, setIsTimeSimulatorOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [selectedTrackingOrderId, setSelectedTrackingOrderId] =
    useState<string | null>(null);

  const [ownerActiveTab, setOwnerActiveTab] = useState<
    'analytics' | 'orders' | 'menu' | 'settings'
  >('menu');

  /*
   * Keep authentication/profile state synchronized with the application role.
   * This is intentionally unchanged in behaviour so existing owner/admin
   * permissions continue to work.
   */
  useEffect(() => {
    if (userProfile?.role) {
      setUserRole(userProfile.role);
    }

    if (userProfile?.preferredDropSpotId) {
      setSelectedDropSpotId(userProfile.preferredDropSpotId);
    }
  }, [
    userProfile,
    setUserRole,
    setSelectedDropSpotId,
  ]);

  /*
   * Open the order tracker when another part of the application asks
   * App.tsx to display an active order.
   */
  useEffect(() => {
    if (activeTrackingOrderId) {
      setSelectedTrackingOrderId(activeTrackingOrderId);
      setIsTrackerOpen(true);
      setActiveTrackingOrderId(null);
    }
  }, [
    activeTrackingOrderId,
    setActiveTrackingOrderId,
  ]);

  /*
   * Find the current customer's active order.
   *
   * Existing matching rules are retained:
   * - user ID
   * - email
   * - phone / WhatsApp
   */
  const handleOpenActiveTracker = () => {
    const activeUid =
      currentUser?.uid || userProfile?.uid;

    const activeEmail =
      currentUser?.email || userProfile?.email;

    const activePhone =
      userProfile?.whatsapp ||
      userProfile?.phone ||
      '';

    const cleanPhone = (value?: string) =>
      (value || '')
        .replace(/\D/g, '')
        .slice(-9);

    const userPhoneDigits = cleanPhone(activePhone);

    const userOrders = orders.filter((order) => {
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
    });

    const active =
      userOrders.find(
        (order) =>
          order.status !== 'collected' &&
          order.status !== 'cancelled'
      ) || userOrders[0];

    if (active) {
      setSelectedTrackingOrderId(active.id);
      setIsTrackerOpen(true);
    }
  };

  /*
   * Used by the existing Spot Directory.
   * Once a spot is selected, the user goes straight back
   * to the customer restaurant experience.
   */
  const handleSelectSpotAndShop = (
    spotId: string
  ) => {
    setSelectedDropSpotId(spotId);
    setUserRole('customer');
    setSelectedRestaurant(null);
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col selection:bg-amber-200">

      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSpotSelector={() =>
          setIsSpotSelectorOpen(true)
        }
        onOpenTimeSimulator={() =>
          setIsTimeSimulatorOpen(true)
        }
        onOpenActiveTracker={
          handleOpenActiveTracker
        }
        onOpenAuth={() =>
          setIsAuthModalOpen(true)
        }
        onOpenProfile={() =>
          setIsProfileModalOpen(true)
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 md:pb-10">

        {/* CUSTOMER EXPERIENCE */}
        {userRole === 'customer' && (
          <>
            {selectedRestaurant ? (
              <RestaurantDetail
                restaurant={selectedRestaurant}
                onBack={() =>
                  setSelectedRestaurant(null)
                }
                onOpenSpotSelector={() =>
                  setIsSpotSelectorOpen(true)
                }
              />
            ) : (
              <RestaurantList
                onSelectRestaurant={(restaurant) =>
                  setSelectedRestaurant(restaurant)
                }
                onOpenSpotSelector={() =>
                  setIsSpotSelectorOpen(true)
                }
                onOpenAuth={() =>
                  setIsAuthModalOpen(true)
                }
              />
            )}
          </>
        )}

        {/* RESTAURANT OWNER EXPERIENCE */}
        {userRole === 'owner' && (
          <OwnerDashboard
            activeTab={ownerActiveTab}
            onTabChange={setOwnerActiveTab}
          />
        )}

        {/* ADMIN EXPERIENCE */}
        {userRole === 'admin' && (
          <AdminDashboard
            onBackToCustomer={() =>
              setUserRole('customer')
            }
          />
        )}

        {/* EXISTING SPOT DIRECTORY */}
        {userRole === 'spot_explorer' && (
          <SpotDirectory
            onSelectSpotAndShop={
              handleSelectSpotAndShop
            }
          />
        )}
      </main>

      <MobileNav
        onOpenCart={() => setIsCartOpen(true)}
        onOpenActiveTracker={
          handleOpenActiveTracker
        }
        onOpenSpotSelector={() =>
          setIsSpotSelectorOpen(true)
        }
        onOpenAuth={() =>
          setIsAuthModalOpen(true)
        }
        onOpenProfile={() =>
          setIsProfileModalOpen(true)
        }
        onOpenAdminSpots={() =>
          setUserRole('admin')
        }
        ownerActiveTab={ownerActiveTab}
        setOwnerActiveTab={
          setOwnerActiveTab
        }
      />

      {/* Minimal footer */}
      <footer className="mt-10 mb-20 md:mb-0 bg-white border-t border-stone-200 py-5 text-xs text-stone-400">
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

      {/* CART */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() =>
          setIsCartOpen(false)
        }
        onOpenSpotSelector={() =>
          setIsSpotSelectorOpen(true)
        }
        onOpenOrderTracker={(orderId) => {
          setSelectedTrackingOrderId(
            orderId
          );
          setIsTrackerOpen(true);
        }}
      />

      {/* PICKUP SPOT */}
      <SpotSelectorModal
        isOpen={isSpotSelectorOpen}
        onClose={() =>
          setIsSpotSelectorOpen(false)
        }
      />

      {/* INTERNAL TIME SIMULATOR
          Still available to the application internally,
          but no longer exposed in the customer UI. */}
      <TimeSimulatorModal
        isOpen={isTimeSimulatorOpen}
        onClose={() =>
          setIsTimeSimulatorOpen(false)
        }
      />

      {/* ORDER TRACKER */}
      <OrderTrackerModal
        orderId={selectedTrackingOrderId}
        isOpen={isTrackerOpen}
        onClose={() =>
          setIsTrackerOpen(false)
        }
      />

      {/* AUTH */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() =>
          setIsAuthModalOpen(false)
        }
      />

      {/* PROFILE */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() =>
          setIsProfileModalOpen(false)
        }
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
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

type CustomerView =
  | 'home'
  | 'cart'
  | 'orders'
  | 'account';

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

  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [isSpotSelectorOpen, setIsSpotSelectorOpen] =
    useState(false);

  const [isTimeSimulatorOpen, setIsTimeSimulatorOpen] =
    useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] =
    useState(false);

  const [isProfileModalOpen, setIsProfileModalOpen] =
    useState(false);

  /*
   * Customer navigation.
   *
   * Bottom nav is only: Home | Cart | Profile
   *
   * home    = restaurant list / restaurant detail
   * cart    = cart page
   * orders  = order tracker (opened from cart after checkout, or header)
   * account = profile page
   */
  const [customerView, setCustomerView] =
    useState<CustomerView>('home');

  /*
   * Remembers the customer page before opening
   * Cart, Orders or Account so Back returns correctly.
   */
  const [previousCustomerView, setPreviousCustomerView] =
    useState<CustomerView>('home');

  const navigateCustomerView = (
    nextView: CustomerView
  ) => {
    setPreviousCustomerView(customerView);
    setCustomerView(nextView);
  };

  const [selectedTrackingOrderId, setSelectedTrackingOrderId] =
    useState<string | null>(null);

  const [ownerActiveTab, setOwnerActiveTab] = useState<
    'analytics' | 'orders' | 'menu' | 'settings'
  >('menu');

  useEffect(() => {
    if (userProfile?.role) {
      setUserRole(userProfile.role);
    }

    if (userProfile?.preferredDropSpotId) {
      setSelectedDropSpotId(
        userProfile.preferredDropSpotId
      );
    }
  }, [
    userProfile,
    setUserRole,
    setSelectedDropSpotId,
  ]);

  /*
   * External request to show an active order
   * (e.g. from header) — opens tracker page,
   * not a bottom-nav tab.
   */
  useEffect(() => {
    if (activeTrackingOrderId) {
      setSelectedTrackingOrderId(
        activeTrackingOrderId
      );

      setPreviousCustomerView(
        customerView
      );

      setCustomerView('orders');

      setActiveTrackingOrderId(null);
    }
  }, [
    activeTrackingOrderId,
    customerView,
    setActiveTrackingOrderId,
  ]);

  const handleOpenActiveTracker = () => {
    const activeUid =
      currentUser?.uid ||
      userProfile?.uid;

    const activeEmail =
      currentUser?.email ||
      userProfile?.email;

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
      setSelectedTrackingOrderId(
        active.id
      );
    } else {
      setSelectedTrackingOrderId(null);
    }

    setPreviousCustomerView(
      customerView
    );

    setCustomerView('orders');
  };

  const handleOpenHome = () => {
    setCustomerView('home');
    setPreviousCustomerView('home');
  };

  const handleOpenCartPage = () => {
    navigateCustomerView('cart');
  };

  const handleOpenAccountPage = () => {
    navigateCustomerView('account');
  };

  const handleCloseCustomerPage = () => {
    setCustomerView(previousCustomerView);
  };

  const handleSelectSpotAndShop = (
    spotId: string
  ) => {
    setSelectedDropSpotId(spotId);
    setUserRole('customer');
    setSelectedRestaurant(null);
    setCustomerView('home');
    setPreviousCustomerView('home');
  };

  const handleHeaderCart = () => {
    if (
      userRole === 'customer' ||
      userRole === 'spot_explorer'
    ) {
      handleOpenCartPage();
      return;
    }

    setIsCartOpen(true);
  };

  const handleHeaderProfile = () => {
    if (
      userRole === 'customer' ||
      userRole === 'spot_explorer'
    ) {
      handleOpenAccountPage();
      return;
    }

    setIsProfileModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col selection:bg-amber-200">

      <Header
        onOpenCart={handleHeaderCart}
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
        onOpenProfile={
          handleHeaderProfile
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-28 md:pb-10">

        {/* CUSTOMER EXPERIENCE */}
        {(userRole === 'customer' ||
          userRole === 'spot_explorer') && (
          <>

            {customerView === 'home' && (
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
                    onSelectRestaurant={(
                      restaurant
                    ) => {
                      setSelectedRestaurant(
                        restaurant
                      );
                      setCustomerView('home');
                    }}
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

            {customerView === 'cart' && (
              <CartDrawer
                isOpen={true}
                embedded={true}
                onClose={
                  handleCloseCustomerPage
                }
                onOpenSpotSelector={() =>
                  setIsSpotSelectorOpen(true)
                }
                onOpenOrderTracker={(
                  orderId
                ) => {
                  setSelectedTrackingOrderId(
                    orderId
                  );

                  setPreviousCustomerView(
                    'cart'
                  );

                  setCustomerView('orders');
                }}
              />
            )}

            {/* Order tracker — from cart after checkout, or header */}
            {customerView === 'orders' && (
              <OrderTrackerModal
                orderId={
                  selectedTrackingOrderId
                }
                isOpen={true}
                embedded={true}
                onClose={
                  handleCloseCustomerPage
                }
              />
            )}

            {customerView === 'account' && (
              <ProfileModal
                isOpen={true}
                embedded={true}
                onClose={
                  handleCloseCustomerPage
                }
                onOpenAdminSpots={() => {
                  setCustomerView('home');
                  setPreviousCustomerView('home');
                  setUserRole('admin');
                }}
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
            onBackToCustomer={() => {
              setUserRole('customer');
              setSelectedRestaurant(null);
              setCustomerView('home');
              setPreviousCustomerView('home');
            }}
          />
        )}

        {userRole === 'spot_explorer' && (
          <SpotDirectory
            onSelectSpotAndShop={
              handleSelectSpotAndShop
            }
          />
        )}

      </main>

      {/*
       * CUSTOMER BOTTOM NAV
       * Home | Cart | Profile
       * Order tracking is under cart (post-checkout), not a nav tab.
       */}
      <MobileNav
        onOpenHome={
          handleOpenHome
        }
        onOpenCart={
          handleOpenCartPage
        }
        onOpenActiveTracker={
          handleOpenActiveTracker
        }
        onOpenSpotSelector={() =>
          setIsSpotSelectorOpen(true)
        }
        onOpenAuth={() =>
          setIsAuthModalOpen(true)
        }
        onOpenProfile={
          handleOpenAccountPage
        }
        activeCustomerView={
          customerView
        }
        onOpenAccount={
          handleOpenAccountPage
        }
        onOpenAdminSpots={() =>
          setUserRole('admin')
        }
        ownerActiveTab={
          ownerActiveTab
        }
        setOwnerActiveTab={
          setOwnerActiveTab
        }
      />

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

      {userRole !== 'customer' &&
        userRole !== 'spot_explorer' && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() =>
              setIsCartOpen(false)
            }
            onOpenSpotSelector={() =>
              setIsSpotSelectorOpen(true)
            }
            onOpenOrderTracker={(
              orderId
            ) => {
              setSelectedTrackingOrderId(
                orderId
              );

              setIsCartOpen(false);
              setUserRole('customer');

              setPreviousCustomerView(
                'cart'
              );

              setCustomerView('orders');
            }}
          />
        )}

      <SpotSelectorModal
        isOpen={isSpotSelectorOpen}
        onClose={() =>
          setIsSpotSelectorOpen(false)
        }
      />

      <TimeSimulatorModal
        isOpen={isTimeSimulatorOpen}
        onClose={() =>
          setIsTimeSimulatorOpen(false)
        }
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() =>
          setIsAuthModalOpen(false)
        }
      />

      {userRole !== 'customer' &&
        userRole !== 'spot_explorer' &&
        isProfileModalOpen && (
          <ProfileModal
            isOpen={true}
            onClose={() =>
              setIsProfileModalOpen(false)
            }
            onOpenAdminSpots={() => {
              setIsProfileModalOpen(false);
              setUserRole('admin');
            }}
          />
        )}

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
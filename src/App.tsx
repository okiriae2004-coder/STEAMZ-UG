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
   * home    = restaurant list / restaurant detail
   * cart    = normal cart page
   * orders  = normal order tracking page
   * account = normal account/profile page
   */
  const [customerView, setCustomerView] =
    useState<CustomerView>('home');

  /*
   * Remembers the page the customer was on before
   * opening Cart, Orders or Account.
   *
   * This is what makes the Back button behave like
   * normal app navigation instead of always returning
   * to Home.
   */
  const [previousCustomerView, setPreviousCustomerView] =
    useState<CustomerView>('home');

  const [selectedTrackingOrderId, setSelectedTrackingOrderId] =
    useState<string | null>(null);

  const [ownerActiveTab, setOwnerActiveTab] = useState<
    'analytics' | 'orders' | 'menu' | 'settings'
  >('menu');

  /*
   * Navigate to another customer page while remembering
   * where the customer came from.
   */
  const navigateCustomerView = (
    nextView: CustomerView
  ) => {
    setPreviousCustomerView(customerView);
    setCustomerView(nextView);
  };

  /*
   * Keep authentication/profile state synchronized
   * with the application role.
   */
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
   * If another part of the application asks App.tsx
   * to display an active order, navigate to the normal
   * Orders page while remembering the current page.
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

  /*
   * Open the customer's active order.
   *
   * Existing matching rules are retained:
   * - user ID
   * - email
   * - phone
   * - WhatsApp
   */
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

    /*
     * Remember the page the customer was on.
     *
    
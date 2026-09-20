import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Lock,
  Sparkles,
  Package,
  ArrowLeft,
} from 'lucide-react';
import {
  formatTime12h,
  getWindowStatusBadge,
} from '../../utils/timeUtils';
import {
  formatUGX,
  DEFAULT_BATCH_FEE_UGX,
} from '../../utils/currency';
import confetti from 'canvas-confetti';
import { MealWindowType } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSpotSelector: () => void;
  onOpenOrderTracker?: (orderId: string) => void;
  embedded?: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSpotSelector,
  onOpenOrderTracker,
  embedded = false,
}) => {
  const {
    cart,
    updateCartItemQty,
    clearCart,
    cartTotal,
    restaurants,
    dropSpots,
    selectedDropSpotId,
    simulatedTime,
    placeOrder,
    orders,
  } = useApp();

  const {
    currentUser,
    userProfile,
    updateUserProfile,
  } = useAuth();

  const [activeTab, setActiveTab] =
    useState<'cart' | 'orders'>('cart');

  const [customerName, setCustomerName] =
    useState(
      userProfile?.displayName || ''
    );

  const [customerEmail, setCustomerEmail] =
    useState(
      userProfile?.email ||
        currentUser?.email ||
        ''
    );

  const [customerPhone, setCustomerPhone] =
    useState(
      userProfile?.whatsapp ||
        userProfile?.phone ||
        ''
    );

  const savedWhatsapp =
    userProfile?.whatsapp ||
    (typeof window !== 'undefined'
      ? localStorage.getItem(
          'steamz_saved_whatsapp'
        )
      : null) ||
    '';

  const [customerWhatsapp, setCustomerWhatsapp] =
    useState(savedWhatsapp);

  const [isEditingWhatsapp, setIsEditingWhatsapp] =
    useState(!savedWhatsapp);

  const [selectedMealWindow, setSelectedMealWindow] =
    useState<MealWindowType>('lunch');

  const [notes, setNotes] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.displayName) {
        setCustomerName(
          userProfile.displayName
        );
      }

      if (userProfile.email) {
        setCustomerEmail(
          userProfile.email
        );
      }

      if (userProfile.whatsapp) {
        setCustomerWhatsapp(
          userProfile.whatsapp
        );

        setCustomerPhone(
          userProfile.whatsapp
        );

        setIsEditingWhatsapp(false);
      }
    }
  }, [userProfile]);

  const activeUid =
    userProfile?.uid ||
    currentUser?.uid;

  const activeEmail =
    userProfile?.email?.toLowerCase() ||
    currentUser?.email?.toLowerCase() ||
    '';

  const activePhone =
    userProfile?.whatsapp ||
    userProfile?.phone ||
    '';

  const isAuthenticated =
    Boolean(
      currentUser || userProfile
    );

  const cleanPhone = (s?: string) =>
    (s || '')
      .replace(/\D/g, '')
      .slice(-9);

  const userPhoneDigits =
    cleanPhone(activePhone);

  const myOrders = orders.filter((o) => {
    if (!isAuthenticated) {
      return false;
    }

    if (
      activeUid &&
      o.userId &&
      o.userId === activeUid
    ) {
      return true;
    }

    if (
      activeEmail &&
      o.customerEmail &&
      o.customerEmail.toLowerCase() ===
        activeEmail
    ) {
      return true;
    }

    if (
      userPhoneDigits &&
      userPhoneDigits.length >= 7
    ) {
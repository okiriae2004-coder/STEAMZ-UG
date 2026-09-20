import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderStatus } from '../../types';

import {
  MapPin,
  Clock,
  KeyRound,
  CheckCircle2,
  Truck,
  PackageCheck,
  Star,
  Copy,
  Check,
  ShieldCheck,
  Thermometer,
  MessageSquare,
  GraduationCap,
  Package,
  ArrowLeft,
  X,
} from 'lucide-react';

import { FeedbackModal } from './FeedbackModal';
import {
  formatUGX,
  DEFAULT_BATCH_FEE_UGX,
} from '../../utils/currency';

interface OrderTrackerModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

const STATUS_STEPS: {
  key: OrderStatus;
  label: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}[] = [
  {
    key: 'placed',
    label: 'Order Placed',
    icon: Clock,
  },
  {
    key: 'confirmed',
    label: 'Batch Confirmed',
    icon: CheckCircle2,
  },
  {
    key: 'preparing',
    label: 'Packing Ready Food',
    icon: Package,
  },
  {
    key: 'in_transit',
    label: 'Batch In Transit',
    icon: Truck,
  },
  {
    key: 'at_spot',
    label: 'Arrived at Spot',
    icon: PackageCheck,
  },
  {
    key: 'collected',
    label: 'Collected',
    icon: ShieldCheck,
  },
];

export const OrderTrackerModal: React.FC<
  OrderTrackerModalProps
> = ({
  orderId,
  isOpen,
  onClose,
  embedded = false,
}) => {
  const {
    orders,
    dropSpots,
    universities,
    updateOrderStatus,
  } = useApp();

  const [copiedPin, setCopiedPin] =
    useState(false);

  const [showFeedbackModal, setShowFeedbackModal] =
    useState(false);

  if (!isOpen && !embedded) {
    return null;
  }

  /*
   * NO ORDER
   */

  if (!orderId) {
    if (!embedded) {
      return null;
    }

    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="rounded-3xl bg-white border border-stone-200 shadow-sm overflow-hidden">

          <div className="flex items-center gap-3 p-5 sm:p-6 border-b border-stone-100 bg-stone-50/50">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition shrink-0 flex items-center gap-1.5"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />

              <span>
                Back
              </span>
            </button>

            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Your Orders
              </h2>

              <p className="text-sm text-stone-500 mt-1">
                Track your current and recent STEAMZ orders here.
              </p>
            </div>

          </div>

          <div className="p-8 sm:p-12 text-center">

            <Package className="h-10 w-10 mx-auto text-stone-300" />

            <h3 className="mt-3 text-lg font-bold text-stone-800">
              No order to track yet
            </h3>

            <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
              Place an order and it will appear here for live tracking.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition"
            >
              Browse restaurants
            </button>

          </div>
        </div>
      </div>
    );
  }

  const order = orders.find(
    (o) => o.id === orderId
  );

  /*
   * ORDER NOT FOUND
   */

  if (!order) {
    if (!embedded) {
      return null;
    }

    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="rounded-3xl bg-white border border-stone-200 shadow-sm p-8 sm:p-12 text-center">

          <button
            type="button"
            onClick={onClose}
            className="mx-auto mb-5 rounded-xl px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition flex items-center gap-1.5"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />

            <span>
              Back
            </span>
          </button>

          <h2 className="text-xl font-bold text-stone-900">
            Order not found
          </h2>

          <p className="mt-2 text-sm text-stone-500">
            This order is no longer available on this device.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition"
          >
            Back to restaurants
          </button>

        </div>
      </div>
    );
  }

  const spot = dropSpots.find(
    (s) =>
      s.id === order.dropSpotId
  );

  const university =
    universities.find(
      (u) =>
        u.id === order.universityId
    ) || universities[0];

  const getStepIndex = (
    status: OrderStatus
  ) => {
    return STATUS_STEPS.findIndex(
      (s) => s.key === status
    );
  };

  const currentStepIndex =
    getStepIndex(order.status);

  const handleCopyPin = () => {
    navigator.clipboard?.writeText(
      order.pickupPin
    );

    setCopiedPin(true);

    setTimeout(
      () => setCopiedPin(false),
      2000
    );
  };

  /*
   * Existing development status simulator retained.
   */
  const handleNextStatusSimulation = () => {
    const nextIdx =
      currentStepIndex + 1;

    if (
      nextIdx < STATUS_STEPS.length
    ) {
      const nextStatus =
        STATUS_STEPS[nextIdx].key;

      updateOrderStatus(
        order.id,
        nextStatus
      );
    }
  };

  const whatsappNumber =
    order.customerWhatsapp ||
    order.customerPhone ||
    '';

  const whatsappText =
    encodeURIComponent(
      `Hello! Here is my STEAMZ Order #${order.orderNumber} for ${order.dropSpotName} (Locker ${order.dropSpotLockerCode}). Pickup PIN: ${order.pickupPin}. Status: ${order.status}`
    );

  const cleanPhone =
    whatsappNumber.replace(
      /[^0-9]/g,
      ''
    );

  const whatsappUrl =
    `https://wa.me/${cleanPhone}?text=${whatsappText}`;

  const trackerContent = (
    <div
      className={
        embedded
          ? 'w-full rounded-3xl bg-white border border-stone-200 shadow-sm overflow-hidden'
          : 'w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200'
      }
    >

      {/* HEADER */}

      <div className="flex items-center gap-3 p-5 sm:p-6 border-b border-stone-100 bg-stone-50/50">

        {embedded ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition shrink-0 flex items-center gap-1.5"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />

            <span>
              Back
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="min-w-0 flex-1">

          <div className="flex items-center gap-2 flex-wrap">

            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-900 text-white">
              {order.orderNumber}
            </span>

            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md capitalize">
              {order.mealWindowType} Window
            </span>

            <span className="text-[11px] font-medium text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-amber-600" />

              {university?.shortName ||
                'KIU Western'}
            </span>

          </div>

          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Live Order Tracker
          </h2>

        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">

        {/* SECURE PICKUP */}

        <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">

          <div className="absolute right-0 top-0 -mt-8 -mr-8
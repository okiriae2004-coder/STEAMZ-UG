import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import {
  X,
  MapPin,
  Clock,
  KeyRound,
  CheckCircle2,
  Truck,
  ChefHat,
  PackageCheck,
  Star,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Thermometer,
  MessageSquare,
  GraduationCap,
  Package,
} from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { formatUGX, DEFAULT_BATCH_FEE_UGX } from '../../utils/currency';

interface OrderTrackerModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'placed', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Batch Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Packing Ready Food', icon: Package },
  { key: 'in_transit', label: 'Batch In Transit', icon: Truck },
  { key: 'at_spot', label: 'Arrived at Spot', icon: PackageCheck },
  { key: 'collected', label: 'Collected', icon: ShieldCheck },
];

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  orderId,
  isOpen,
  onClose,
}) => {
  const { orders, dropSpots, universities, updateOrderStatus } = useApp();
  const [copiedPin, setCopiedPin] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  if (!isOpen || !orderId) return null;

  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;

  const spot = dropSpots.find((s) => s.id === order.dropSpotId);
  const university = universities.find((u) => u.id === order.universityId) || universities[0];

  const getStepIndex = (status: OrderStatus) => {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIndex = getStepIndex(order.status);

  const handleCopyPin = () => {
    navigator.clipboard?.writeText(order.pickupPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleNextStatusSimulation = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < STATUS_STEPS.length) {
      const nextStatus = STATUS_STEPS[nextIdx].key;
      updateOrderStatus(order.id, nextStatus);
    }
  };

  const whatsappNumber = order.customerWhatsapp || order.customerPhone;
  const whatsappText = encodeURIComponent(
    `Hello! Here is my STEAMZ Order #${order.orderNumber} for ${order.dropSpotName} (Locker ${order.dropSpotLockerCode}). Pickup PIN: ${order.pickupPin}. Status: ${order.status}`
  );
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappText}`;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4">
        <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-stone-100 bg-stone-50/50">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-900 text-white">
                  {order.orderNumber}
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md capitalize">
                  {order.mealWindowType} Window
                </span>
                <span className="text-[11px] font-medium text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <GraduationCap className="h-3 w-3 text-amber-600" />
                  {university?.shortName || 'KIU Western'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mt-1">Live Order Tracker</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Locker PIN & Drop Spot Hero Card */}
            <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4" />
                    Secure Pickup Credentials
                  </span>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black tracking-widest font-mono text-amber-400 bg-black/40 px-4 py-1.5 rounded-2xl border border-amber-500/30">
                      {order.pickupPin}
                    </span>
                    <button
                      onClick={handleCopyPin}
                      className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-stone-200 flex items-center gap-1 transition"
                    >
                      {copiedPin ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedPin ? 'Copied' : 'Copy PIN'}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-stone-300">
                    Locker Box: <strong className="text-white font-mono">{order.dropSpotLockerCode}</strong>
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6">
                  <div className="text-xs text-stone-400 uppercase tracking-wider">Scheduled Batch Drop</div>
                  <div className="text-2xl font-black text-white mt-0.5">{order.batchDropTime}</div>
                  <div className="text-xs text-amber-300 flex items-center sm:justify-end gap-1 mt-1">
                    <Thermometer className="h-3 w-3" />
                    <span>Insulated Pod</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-300">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>{order.dropSpotName}</strong> • {spot?.instructions || order.pickupInstructions}
                  </span>
                </div>

                {whatsappNumber && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-xs shrink-0"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>WhatsApp Alert ({whatsappNumber})</span>
                  </a>
                )}
              </div>
            </div>

            {/* Step Progress Tracker */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                  Batch Status Pipeline
                </h3>
                <button
                  onClick={handleNextStatusSimulation}
                  disabled={order.status === 'collected'}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 transition disabled:opacity-40 self-start sm:self-auto"
                >
                  {order.status === 'collected' ? 'Completed' : '⚡ Advance Next Status Step'}
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {STATUS_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center text-center p-2 rounded-xl border transition ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs'
                          : isDone
                          ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900 font-medium'
                          : 'border-stone-200 bg-white text-stone-400 opacity-60'
                      }`}
                    >
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center mb-1.5 ${
                          isCurrent
                            ? 'bg-amber-500 text-white animate-pulse'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] leading-tight">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status History Logs */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Tracking Updates & Courier Log
              </h3>
              <div className="rounded-2xl border border-stone-200 divide-y divide-stone-100 bg-white">
                {order.statusHistory.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-start gap-3 text-xs">
                    <span className="font-mono text-stone-400 shrink-0 font-medium">{item.timestamp}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-stone-800 capitalize">
                        {item.status.replace('_', ' ')}
                      </div>
                      <p className="text-stone-500 mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Items from {order.restaurantName}
              </h3>
              <div className="rounded-2xl border border-stone-200 p-4 space-y-2 bg-stone-50/30">
                {order.items.map((item) => (
                  <div key={item.cartItemId} className="py-1">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-600">{item.quantity}x</span>
                        <span className="text-stone-800 font-medium">{item.menuItem.name}</span>
                      </div>
                      <span className="font-semibold text-stone-900">{formatUGX(item.totalPrice)}</span>
                    </div>
                    {Object.keys(item.selectedOptions).length > 0 && (
                      <div className="text-[11px] text-stone-500 pl-6 mt-0.5">
                        {Object.entries(item.selectedOptions).map(([k, v]) => (
                          <span key={k} className="mr-2 inline-block">
                            {k}: <strong>{Array.isArray(v) ? v.join(', ') : v}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-sm text-stone-900">
                  <span>Total Paid (incl. {formatUGX(order.serviceFee || DEFAULT_BATCH_FEE_UGX)} batch drop)</span>
                  <span className="text-amber-600 font-extrabold">{formatUGX(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Feedback Trigger / Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              {order.status === 'at_spot' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'collected', 'Picked up using PIN')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>I Picked Up My Meal</span>
                </button>
              )}

              {order.status === 'collected' && !order.feedbackGiven && (
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Star className="h-4 w-4 fill-white" />
                  <span>Leave Feedback & Rate Spot Drop</span>
                </button>
              )}

              {order.feedbackGiven && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Thank you! Your feedback has been shared with {order.restaurantName}.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          order={order}
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </>
  );
};


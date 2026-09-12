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
  UserCheck,
  Package,
} from 'lucide-react';
import { formatTime12h, getWindowStatusBadge, getMinutesUntilCutoff } from '../../utils/timeUtils';
import { formatUGX, DEFAULT_BATCH_FEE_UGX } from '../../utils/currency';
import confetti from 'canvas-confetti';
import { MealWindowType } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSpotSelector: () => void;
  onOpenOrderTracker?: (orderId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSpotSelector,
  onOpenOrderTracker,
}) => {
  const {
    cart,
    updateCartItemQty,
    removeFromCart,
    clearCart,
    cartTotal,
    restaurants,
    dropSpots,
    selectedDropSpotId,
    simulatedTime,
    placeOrder,
    orders,
  } = useApp();

  const { currentUser, userProfile, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [customerName, setCustomerName] = useState(userProfile?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(userProfile?.email || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.whatsapp || userProfile?.phone || '');
  
  // Read saved WhatsApp from profile or localStorage
  const savedWhatsapp =
    userProfile?.whatsapp ||
    (typeof window !== 'undefined' ? localStorage.getItem('steamz_saved_whatsapp') : null) ||
    '';
  const [customerWhatsapp, setCustomerWhatsapp] = useState(savedWhatsapp);
  const [isEditingWhatsapp, setIsEditingWhatsapp] = useState(!savedWhatsapp);

  const [selectedMealWindow, setSelectedMealWindow] = useState<MealWindowType>('lunch');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile) {
      if (userProfile.displayName) setCustomerName(userProfile.displayName);
      if (userProfile.email) setCustomerEmail(userProfile.email);
      if (userProfile.whatsapp) {
        setCustomerWhatsapp(userProfile.whatsapp);
        setCustomerPhone(userProfile.whatsapp);
        setIsEditingWhatsapp(false);
      }
    }
  }, [userProfile]);

  // Filter orders strictly to active user. If not logged in, show no orders.
  const activeUid = userProfile?.uid || currentUser?.uid;
  const activeEmail = userProfile?.email?.toLowerCase() || currentUser?.email?.toLowerCase() || '';
  const isAuthenticated = Boolean(currentUser || userProfile);
  const myOrders = orders.filter((o) => {
    if (!isAuthenticated) return false;
    if (activeUid && o.userId) {
      return o.userId === activeUid;
    }
    if (activeEmail && o.customerEmail) {
      return o.customerEmail.toLowerCase() === activeEmail;
    }
    return false;
  });

  if (!isOpen) return null;

  const currentRest = restaurants.find((r) => r.id === (cart[0]?.menuItem.restaurantId));
  const currentSpot = dropSpots.find((s) => s.id === selectedDropSpotId) || dropSpots[0];

  // Find window config for restaurant
  const windowConfig = currentRest?.mealWindows.find((w) => w.type === selectedMealWindow);
  const windowStatus = windowConfig ? getWindowStatusBadge(windowConfig, simulatedTime) : null;
  const isCutoffPassed = windowStatus ? !windowStatus.isOpen : false;

  const subtotal = cartTotal;
  const batchDeliveryFee = DEFAULT_BATCH_FEE_UGX; // Flat UGX 1,500 batch drop fee
  const finalTotal = subtotal + batchDeliveryFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpot || cart.length === 0) return;

    setIsSubmitting(true);

    // Save WhatsApp forever
    const phoneToSave = customerWhatsapp || customerPhone;
    try {
      localStorage.setItem('steamz_saved_whatsapp', phoneToSave);
      await updateUserProfile({ whatsapp: phoneToSave });
    } catch {
      // ignore
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      placeOrder({
        customerName,
        customerEmail,
        customerPhone,
        customerWhatsapp: phoneToSave,
        universityId: userProfile?.universityId || currentSpot.universityId,
        dropSpotId: currentSpot.id,
        mealWindowType: selectedMealWindow,
        specialInstructions: notes,
        userId: userProfile?.uid || currentUser?.uid,
      });

      setIsSubmitting(false);
      setActiveTab('orders');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
          {/* Header & Mode Switcher */}
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  {activeTab === 'cart' ? 'Your Batch Order' : 'My Orders & Locker PINs'}
                </h2>
                <p className="text-xs text-stone-500">
                  {activeTab === 'cart'
                    ? (currentRest ? currentRest.name : 'STEAMZ Food Delivery')
                    : 'Track your deliveries and retrieve locker PINs'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs: Cart Items vs My Orders */}
            <div className="flex p-1 bg-stone-200/70 rounded-xl">
              <button
                onClick={() => setActiveTab('cart')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'cart'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'orders'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Package className="h-3.5 w-3.5 text-amber-600" />
                <span>My Orders ({myOrders.length})</span>
              </button>
            </div>
          </div>

          {activeTab === 'orders' ? (
            /* Orders View inside Cart Drawer */
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {myOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                    <Package className="h-8 w-8" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900">
                    {!isAuthenticated ? 'Sign in to view your orders' : 'No orders placed yet'}
                  </h4>
                  <p className="text-xs text-stone-500 max-w-xs mt-1">
                    {!isAuthenticated
                      ? 'Your active deliveries and locker pickup PINs are private and linked to your account.'
                      : 'Once you submit an order, your live batch delivery status and pickup locker PIN will appear right here.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('cart')}
                    className="mt-4 px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-600 transition"
                  >
                    Return to Cart
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map((ord) => {
                    const pinToDisplay = ord.pickupPin || (ord as any).lockerPin;
                    return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-stone-200 bg-white shadow-2xs hover:border-amber-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-stone-900">
                          Order #{ord.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            ord.status === 'arrived'
                              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                              : ord.status === 'dispatched'
                              ? 'bg-amber-100 text-amber-800'
                              : ord.status === 'collected'
                              ? 'bg-stone-100 text-stone-600'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-stone-600">
                        <div className="font-semibold text-stone-800">
                          {ord.items.map((i) => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-stone-500 text-[11px]">
                          <MapPin className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>
                            {dropSpots.find((s) => s.id === ord.dropSpotId)?.name || 'Drop Spot'}
                          </span>
                        </div>
                      </div>

                      {pinToDisplay && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-800 block">
                              Pickup Locker PIN
                            </span>
                            <span className="text-base font-black font-mono tracking-widest text-stone-900">
                              {pinToDisplay}
                            </span>
                          </div>
                          {onOpenOrderTracker && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenOrderTracker(ord.id);
                              }}
                              className="px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition"
                            >
                              Track Live
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          ) : cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-4 border border-amber-200">
                <Clock className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Your cart is empty</h3>
              <p className="text-xs text-stone-500 max-w-xs mt-1">
                Browse ready-cooked meals from partnered restaurants and order before the upcoming window cut-off!
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-5 py-2.5 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition"
              >
                Explore Restaurants
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Delivery Spot Banner */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-600" />
                    Designated Drop Spot
                  </span>
                  <button
                    type="button"
                    onClick={onOpenSpotSelector}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
                  >
                    Change Spot
                  </button>
                </div>
                <h4 className="text-sm font-bold text-stone-900">{currentSpot.name}</h4>
                <p className="text-xs text-stone-600 mt-0.5">{currentSpot.address}</p>
                <div className="mt-2 text-[11px] text-amber-800 bg-amber-100/70 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Lock className="h-3 w-3 shrink-0" />
                  <span>Your locker PIN will be issued upon order confirmation.</span>
                </div>
              </div>

              {/* Meal Window & Cut-off Warning */}
              {windowConfig && (
                <div
                  className={`rounded-2xl border p-4 transition ${
                    isCutoffPassed
                      ? 'border-red-300 bg-red-50 text-red-950'
                      : 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {windowConfig.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isCutoffPassed
                          ? 'bg-red-200 text-red-800'
                          : 'bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {isCutoffPassed ? 'CUT-OFF PASSED' : 'WINDOW ACTIVE'}
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <div className="text-xs text-stone-700">
                      Order Cut-off: <strong>{formatTime12h(windowConfig.orderCutoffTime)}</strong>
                    </div>
                    <div className="text-xs text-stone-700">
                      Batch Drop: <strong>{formatTime12h(windowConfig.dropOffTime)}</strong>
                    </div>
                  </div>

                  {isCutoffPassed ? (
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-red-700 bg-red-100/70 p-2 rounded-lg">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        The cut-off time for {windowConfig.label} ({formatTime12h(windowConfig.orderCutoffTime)}) has passed for simulated time ({simulatedTime}). You can use the Time Simulator in the header to test open windows!
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-emerald-800">
                      {windowStatus?.minutesLeft && windowStatus.minutesLeft <= 30
                        ? `⚡ Hurry! Order within ${windowStatus.minutesLeft} minutes to catch the ${formatTime12h(windowConfig.dropOffTime)} drop!`
                        : `Order now to receive your hot meal at ${formatTime12h(windowConfig.dropOffTime)} at ${currentSpot.shortCode}.`}
                    </p>
                  )}
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Order Items ({cart.length})
                  </h3>
                  <button
                    onClick={clearCart}
                    className="text-xs text-stone-400 hover:text-red-500 flex items-center gap-1 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </button>
                </div>

                {cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-stone-200 bg-stone-50/50"
                  >
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="h-16 w-16 rounded-xl object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-stone-900 truncate">
                        {item.menuItem.name}
                      </h4>
                      <div className="text-xs font-semibold text-amber-600">
                        {formatUGX(item.unitPrice)}
                      </div>

                      {/* Selected options */}
                      {Object.keys(item.selectedOptions).length > 0 && (
                        <div className="mt-1 text-[11px] text-stone-500">
                          {Object.entries(item.selectedOptions).map(([key, val]) => (
                            <span key={key} className="mr-2">
                              • {key}:{' '}
                              <strong>{Array.isArray(val) ? val.join(', ') : val}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      {item.specialInstructions && (
                        <p className="text-[11px] text-stone-500 italic mt-0.5">
                          Note: "{item.specialInstructions}"
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-stone-300 bg-white">
                          <button
                            onClick={() => updateCartItemQty(item.cartItemId, -1)}
                            className="p-1 text-stone-600 hover:bg-stone-100 rounded-l-lg"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQty(item.cartItemId, 1)}
                            className="p-1 text-stone-600 hover:bg-stone-100 rounded-r-lg"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-stone-900">
                          {formatUGX(item.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Recipient Details (for Locker PIN)
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (!customerWhatsapp || customerWhatsapp === customerPhone) {
                          setCustomerWhatsapp(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* WhatsApp One-Time Ask & Forever Use */}
                <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>WhatsApp Number (One-Time Setup)</span>
                    </label>
                    {savedWhatsapp && !isEditingWhatsapp && (
                      <button
                        type="button"
                        onClick={() => setIsEditingWhatsapp(true)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                      >
                        Change Number
                      </button>
                    )}
                  </div>

                  {savedWhatsapp && !isEditingWhatsapp ? (
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs">
                      <div>
                        <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                          Verified & Saved Forever
                        </span>
                        <span className="text-sm font-black text-stone-900 font-mono">
                          {customerWhatsapp}
                        </span>
                      </div>
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                        Ready
                      </span>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="+256 700 123456"
                        value={customerWhatsapp}
                        onChange={(e) => setCustomerWhatsapp(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-bold"
                      />
                      {savedWhatsapp && isEditingWhatsapp && (
                        <button
                          type="button"
                          onClick={() => {
                            if (customerWhatsapp) {
                              localStorage.setItem('steamz_saved_whatsapp', customerWhatsapp);
                              updateUserProfile({ whatsapp: customerWhatsapp });
                              setIsEditingWhatsapp(false);
                            }
                          }}
                          className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                        >
                          Confirm & Save
                        </button>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-emerald-800 mt-2">
                    📲 Your 4-digit locker PIN and order delivery status will be sent straight to this WhatsApp number upon batch arrival. Asked once and used forever until you change it.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Drop-off / Dietary Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Leave in lower locker shelf please"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </form>

              {/* Price Breakdown */}
              <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200 space-y-2 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-stone-900">{formatUGX(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span className="flex items-center gap-1">
                    <span>Batch Drop & Delivery Spot Fee</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded-sm">
                      Flat {formatUGX(batchDeliveryFee)}
                    </span>
                  </span>
                  <span className="font-semibold text-stone-900">{formatUGX(batchDeliveryFee)}</span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between font-extrabold text-stone-900 text-base">
                  <span>Total Due</span>
                  <span className="text-amber-600">{formatUGX(finalTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer CTA */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-stone-100 bg-white">
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-4 px-6 font-bold text-white shadow-lg hover:bg-amber-600 transition active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Securing Batch Spot...</span>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Place Spot-Drop Order • {formatUGX(finalTotal)}</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Encrypted Locker PIN • 100% Thermal Drop Guarantee</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

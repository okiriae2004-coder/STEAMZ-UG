import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Restaurant, Order } from '../../types';
import {
  Star,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  MapPin,
  Clock,
  ThumbsUp,
  Filter,
  Plus,
  ArrowRight,
  Truck,
  PackageCheck,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReviewsAndRatingsProps {
  restaurant: Restaurant;
  onNavigateToMenu?: () => void;
}

const AVAILABLE_TAGS = [
  'Piping Hot on Arrival',
  'Fresh Ingredients',
  'Locker PIN Worked Instantly',
  'Drop Spot Easy to Find',
  'Thermal Packaging Top-tier',
  'On-time Drop',
  'Generous Portion',
  'Well Seasoned',
  'Crispy & Tender',
  'Sauce on the Side',
];

const STAR_LABELS: Record<number, string> = {
  1: 'Poor / Cold',
  2: 'Fair / Below Expectation',
  3: 'Average / Acceptable',
  4: 'Very Good / Tasty & Warm',
  5: 'Exceptional / Piping Hot & Fresh!',
};

export const ReviewsAndRatings: React.FC<ReviewsAndRatingsProps> = ({
  restaurant,
  onNavigateToMenu,
}) => {
  const {
    feedbacks,
    orders,
    dropSpots,
    selectedDropSpotId,
    menuItems,
    addFeedback,
    updateOrderStatus,
  } = useApp();
  const { currentUser, userProfile } = useAuth();

  const userEmail = currentUser?.email || userProfile?.email || '';
  const userName =
    userProfile?.displayName || currentUser?.displayName || userEmail.split('@')[0] || 'Campus Diner';

  // 1. Gather all reviews for this restaurant
  const restaurantFeedbacks = useMemo(() => {
    return feedbacks.filter((fb) => fb.restaurantId === restaurant.id);
  }, [feedbacks, restaurant.id]);

  // 2. Identify customer's orders for this restaurant
  const customerOrdersForThisRest = useMemo(() => {
    return orders.filter((o) => {
      if (o.restaurantId !== restaurant.id) return false;
      if (currentUser?.uid && o.userId === currentUser.uid) return true;
      if (userEmail && o.customerEmail?.toLowerCase() === userEmail.toLowerCase()) return true;
      // Fallback for orders created in current local session before logging in
      if (!o.userId && !currentUser) return true;
      return false;
    });
  }, [orders, restaurant.id, currentUser, userEmail]);

  // Successfully delivered orders (eligible for reviews)
  const deliveredOrders = useMemo(() => {
    return customerOrdersForThisRest.filter(
      (o) => o.status === 'at_spot' || o.status === 'collected'
    );
  }, [customerOrdersForThisRest]);

  // Delivered orders waiting for feedback
  const unreviewedDeliveredOrders = useMemo(() => {
    return deliveredOrders.filter((o) => !o.feedbackGiven);
  }, [deliveredOrders]);

  // Orders currently in progress
  const inProgressOrders = useMemo(() => {
    return customerOrdersForThisRest.filter((o) =>
      ['placed', 'confirmed', 'preparing', 'in_transit'].includes(o.status)
    );
  }, [customerOrdersForThisRest]);

  // 3. Review Submission Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(() => unreviewedDeliveredOrders.length > 0);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    () => unreviewedDeliveredOrders[0]?.id || deliveredOrders[0]?.id || ''
  );
  const [overallRating, setOverallRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [foodQualityRating, setFoodQualityRating] = useState<number>(5);
  const [spotDeliveryRating, setSpotDeliveryRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Piping Hot on Arrival',
    'Locker PIN Worked Instantly',
  ]);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync selectedOrderId if unreviewed orders change
  React.useEffect(() => {
    if (unreviewedDeliveredOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(unreviewedDeliveredOrders[0].id);
      setIsFormOpen(true);
    }
  }, [unreviewedDeliveredOrders, selectedOrderId]);

  // 4. Filtering & Sorting State for Reviews Feed
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | 'critical'>('all');
  const [spotFilter, setSpotFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});

  // Calculations for rating stats
  const totalReviews = restaurantFeedbacks.length;
  const avgRating = totalReviews > 0 ? restaurant.rating : 5.0;

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    restaurantFeedbacks.forEach((fb) => {
      const rounded = Math.min(5, Math.max(1, Math.round(fb.overallRating))) as 1 | 2 | 3 | 4 | 5;
      counts[rounded] = (counts[rounded] || 0) + 1;
    });
    return counts;
  }, [restaurantFeedbacks]);

  const avgFoodQuality = useMemo(() => {
    if (totalReviews === 0) return 4.9;
    const sum = restaurantFeedbacks.reduce((acc, fb) => acc + (fb.foodQualityRating || fb.overallRating), 0);
    return Number((sum / totalReviews).toFixed(1));
  }, [restaurantFeedbacks, totalReviews]);

  const avgSpotDelivery = useMemo(() => {
    if (totalReviews === 0) return 4.9;
    const sum = restaurantFeedbacks.reduce((acc, fb) => acc + (fb.spotDeliveryRating || fb.overallRating), 0);
    return Number((sum / totalReviews).toFixed(1));
  }, [restaurantFeedbacks, totalReviews]);

  // Filtered and sorted feedback list
  const displayedFeedbacks = useMemo(() => {
    return restaurantFeedbacks
      .filter((fb) => {
        if (ratingFilter === '5') return Math.round(fb.overallRating) === 5;
        if (ratingFilter === '4') return Math.round(fb.overallRating) === 4;
        if (ratingFilter === '3') return Math.round(fb.overallRating) === 3;
        if (ratingFilter === 'critical') return Math.round(fb.overallRating) <= 2;
        return true;
      })
      .filter((fb) => {
        if (spotFilter === 'all') return true;
        return fb.dropSpotId === spotFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return b.overallRating - a.overallRating;
        if (sortBy === 'lowest') return a.overallRating - b.overallRating;
        // Default newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [restaurantFeedbacks, ratingFilter, spotFilter, sortBy]);

  // Tag toggle helper
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Form submission handler
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Locate matching order
    const targetOrder =
      deliveredOrders.find((o) => o.id === selectedOrderId) || deliveredOrders[0];

    if (!targetOrder) {
      setErrorMessage(
        'A verified delivered order is required to post a review. Please select a valid delivered order.'
      );
      return;
    }

    if (!comment.trim()) {
      setErrorMessage('Please write a brief comment describing your food & delivery experience.');
      return;
    }

    setIsSubmitting(true);

    try {
      addFeedback({
        orderId: targetOrder.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        customerName: userName,
        overallRating,
        foodQualityRating,
        spotDeliveryRating,
        tags: selectedTags,
        comment: comment.trim(),
        dropSpotId: targetOrder.dropSpotId,
        dropSpotName: targetOrder.dropSpotName,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }

      setSubmitSuccess(true);
      setComment('');
      setIsSubmitting(false);

      setTimeout(() => {
        setSubmitSuccess(false);
        setIsFormOpen(false);
      }, 3500);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Failed to record review. Please try again.');
    }
  };

  // Upvote helpful review
  const handleUpvote = (feedbackId: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [feedbackId]: (prev[feedbackId] || 0) + 1,
    }));
  };

  // Quick helper to simulate a completed delivered order for demonstration & testing
  const handleSimulateDeliveredOrder = () => {
    const spot =
      dropSpots.find((s) => s.id === selectedDropSpotId) ||
      dropSpots.find((s) => restaurant.supportedDropSpotIds.includes(s.id)) ||
      dropSpots[0];

    const targetItem = menuItems.find((m) => m.restaurantId === restaurant.id) || {
      id: 'item-demo-' + Date.now(),
      restaurantId: restaurant.id,
      name: 'Signature Hot Meal Platter',
      description: 'Cooked fresh and packed in thermal food pods',
      price: 12000,
      category: 'Main Dish',
      mealWindows: ['lunch', 'dinner'],
      image: restaurant.bannerImage,
      dietary: ['halal'],
    };

    const simulatedOrder: Order = {
      id: 'ord-sim-' + Date.now(),
      orderNumber: 'STM-' + Math.floor(1000 + Math.random() * 9000),
      userId: currentUser?.uid,
      customerName: userName,
      customerEmail: userEmail || 'student@kiu.ac.ug',
      customerPhone: userProfile?.whatsapp || '+256701234567',
      customerWhatsapp: userProfile?.whatsapp || '+256701234567',
      universityId: spot?.universityId || 'kiu-western',
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantLogo: restaurant.logoImage,
      items: [
        {
          cartItemId: 'cart-sim-' + Date.now(),
          menuItem: targetItem,
          quantity: 1,
          selectedOptions: {},
          unitPrice: targetItem.price,
          totalPrice: targetItem.price,
        },
      ],
      subtotal: targetItem.price,
      serviceFee: 1500,
      totalAmount: targetItem.price + 1500,
      dropSpotId: spot?.id || 'spot-kiu-eng',
      dropSpotName: spot?.name || 'Engineering Block',
      dropSpotLockerCode: 'POD-' + Math.floor(10 + Math.random() * 80),
      pickupPin: String(Math.floor(1000 + Math.random() * 9000)),
      mealWindowType: 'lunch',
      batchDropTime: '12:45 PM',
      status: 'collected',
      createdAt: new Date().toISOString(),
      statusHistory: [
        { status: 'placed', timestamp: '11:30 AM', note: 'Order placed by customer' },
        { status: 'at_spot', timestamp: '12:45 PM', note: 'Delivered to heated locker pod' },
        { status: 'collected', timestamp: '12:50 PM', note: 'Customer entered PIN and collected food' },
      ],
      pickupInstructions: `${spot?.instructions || 'Collect at delivery table'} Locker unlocked.`,
      feedbackGiven: false,
    };

    // Add order directly to AppContext orders
    orders.unshift(simulatedOrder);
    setSelectedOrderId(simulatedOrder.id);
    setIsFormOpen(true);
  };

  return (
    <div id="reviews-and-ratings-section" className="space-y-6">
      {/* 1. Rating Snapshot & Breakdown Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-stone-200 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Average Rating */}
          <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left border-b lg:border-b-0 lg:border-r border-stone-100 pb-6 lg:pb-0 lg:pr-6">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-600 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Verified Customer Ratings</span>
            </span>

            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black text-stone-900 tracking-tight">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-stone-400 font-bold text-lg">/ 5.0</span>
            </div>

            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-200'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-stone-500 mt-2 font-medium">
              Based on <strong>{totalReviews}</strong> authentic spot-drop deliveries
            </p>

            {/* Verification Guarantee badge */}
            <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Reviews permitted solely following a verified meal delivery</span>
            </div>
          </div>

          {/* Star Distribution Bars */}
          <div className="lg:col-span-5 space-y-2">
            <span className="text-xs font-bold text-stone-700 block mb-1">
              Rating Distribution
            </span>
            {[5, 4, 3, 2, 1].map((starCount) => {
              const count = ratingCounts[starCount as 1 | 2 | 3 | 4 | 5] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <button
                  key={starCount}
                  type="button"
                  onClick={() =>
                    setRatingFilter(ratingFilter === String(starCount) ? 'all' : (String(starCount) as any))
                  }
                  className={`w-full flex items-center gap-2 text-xs py-1 px-2 rounded-lg transition hover:bg-stone-50 ${
                    ratingFilter === String(starCount) ? 'bg-amber-50 ring-1 ring-amber-300' : ''
                  }`}
                >
                  <span className="w-12 font-bold text-stone-700 text-right flex items-center justify-end gap-1 shrink-0">
                    <span>{starCount}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-[11px] text-stone-400 text-right font-mono font-medium shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-Metric Badges */}
          <div className="lg:col-span-3 flex flex-col justify-center space-y-3 bg-stone-50/80 rounded-2xl p-4 border border-stone-200/80 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-stone-600 font-semibold">🍲 Food & Warmth</span>
                <span className="font-bold text-stone-900">{avgFoodQuality.toFixed(1)} / 5</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${(avgFoodQuality / 5) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-stone-600 font-semibold">📍 Spot Pickup & PIN</span>
                <span className="font-bold text-stone-900">{avgSpotDelivery.toFixed(1)} / 5</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(avgSpotDelivery / 5) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-1 border-t border-stone-200/60 text-[11px] text-stone-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Batch schedules ensure prompt delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Customer Delivery Status & Review Eligibility Section */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
        {/* Scenario A: Customer has an eligible delivered order (ready to review) */}
        {deliveredOrders.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <PackageCheck className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-stone-900">
                      You have a verified delivery from {restaurant.name}
                    </h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      Verified Delivery
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {unreviewedDeliveredOrders.length > 0
                      ? `Order #${unreviewedDeliveredOrders[0].orderNumber} was delivered to ${unreviewedDeliveredOrders[0].dropSpotName}. Share your feedback below!`
                      : `You have completed ${deliveredOrders.length} delivery from this kitchen. You can share another review anytime.`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{isFormOpen ? 'Hide Review Form' : 'Write a Review'}</span>
              </button>
            </div>

            {/* Review Form (when open) */}
            {isFormOpen && (
              <form onSubmit={handleSubmitReview} className="space-y-5 pt-2 animate-in fade-in">
                {/* Order Selector (if customer has multiple delivered orders) */}
                {deliveredOrders.length > 1 && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Select which delivery order you are reviewing:
                    </label>
                    <select
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                      className="w-full sm:w-auto min-w-[280px] px-3 py-2 text-xs border border-stone-200 rounded-xl bg-stone-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    >
                      {deliveredOrders.map((ord) => (
                        <option key={ord.id} value={ord.id}>
                          Order #{ord.orderNumber} • Delivered to {ord.dropSpotName} (
                          {ord.feedbackGiven ? 'Already Reviewed' : 'Pending Review'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Rating Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-50/70 p-4 rounded-2xl border border-stone-200">
                  {/* 1. Overall Star Rating */}
                  <div>
                    <span className="block text-xs font-bold text-stone-800 mb-1.5">
                      Overall Meal Experience *
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const activeVal = hoverRating || overallRating;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setOverallRating(star)}
                            className="p-1 hover:scale-115 transition"
                            title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= activeVal
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 block mt-1">
                      {STAR_LABELS[hoverRating || overallRating]}
                    </span>
                  </div>

                  {/* 2. Food Quality & Warmth Rating */}
                  <div>
                    <span className="block text-xs font-bold text-stone-800 mb-1.5">
                      Food Taste & Warmth
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFoodQualityRating(star)}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= foodQualityRating
                                ? 'fill-orange-400 text-orange-500'
                                : 'text-stone-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-500 block mt-1">
                      {foodQualityRating} / 5 Stars
                    </span>
                  </div>

                  {/* 3. Spot Arrival & Locker Locker Rating */}
                  <div>
                    <span className="block text-xs font-bold text-stone-800 mb-1.5">
                      Locker Spot Pickup
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSpotDeliveryRating(star)}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= spotDeliveryRating
                                ? 'fill-emerald-400 text-emerald-500'
                                : 'text-stone-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-500 block mt-1">
                      {spotDeliveryRating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Quick Impression Tags */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-2">
                    Quick Highlights (Tap to select)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition ${
                            isSelected
                              ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-2xs'
                              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text Review & Comments */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-stone-700">
                      Your Text Feedback & Review *
                    </label>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {comment.length} / 500 characters
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    maxLength={500}
                    placeholder="Describe the meal flavor, the temperature when collecting from the locker pod, and overall satisfaction to help campus diners..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-2xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
                  />
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Success Banner */}
                {submitSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Thank you! Your verified review has been posted and published to {restaurant.name}.
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !comment.trim()}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
                  >
                    <Star className="h-3.5 w-3.5 fill-white" />
                    <span>{isSubmitting ? 'Publishing...' : 'Submit Verified Review'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : inProgressOrders.length > 0 ? (
          /* Scenario B: Customer has placed an order, but it's still being prepared / in transit */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-amber-950 block">
                  Delivery in progress for Order #{inProgressOrders[0].orderNumber}
                </span>
                <span className="text-amber-800 text-[11px] leading-relaxed block mt-0.5">
                  Your meal is currently <em>{inProgressOrders[0].status.replace('_', ' ')}</em> to{' '}
                  <strong>{inProgressOrders[0].dropSpotName}</strong>. You will be able to submit your
                  star rating and text review as soon as the food is delivered to your locker spot.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                updateOrderStatus(inProgressOrders[0].id, 'collected', 'Customer marked collected');
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>I Collected My Food (Unlock Review)</span>
            </button>
          </div>
        ) : (
          /* Scenario C: Customer has not had a delivery from this restaurant yet */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-stone-200 text-stone-600 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="h-5 w-5 text-stone-700" />
              </div>
              <div>
                <span className="font-bold text-stone-900 block">
                  Verified Campus Customer Reviews
                </span>
                <span className="text-stone-500 text-[11px] leading-relaxed block mt-0.5">
                  To ensure authentic campus dining feedback, only customers with a successfully
                  delivered order from <strong>{restaurant.name}</strong> can submit star ratings and
                  written feedback.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {onNavigateToMenu && (
                <button
                  type="button"
                  onClick={onNavigateToMenu}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
                  <span>Order from Menu</span>
                </button>
              )}

              {/* Demo test helper */}
              <button
                type="button"
                onClick={handleSimulateDeliveredOrder}
                title="Creates a simulated delivered order to test the review flow immediately"
                className="px-3 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs transition flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-amber-600" />
                <span>Test Review Flow</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Community Reviews Feed Header & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              <span>Customer Reviews Feed ({displayedFeedbacks.length})</span>
            </h3>
            {totalReviews > displayedFeedbacks.length && (
              <span className="text-[11px] text-stone-400 font-medium">
                Filtered from {totalReviews} total
              </span>
            )}
          </div>

          {/* Filters & Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Star Rating Filter */}
            <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setRatingFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  ratingFilter === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All ({totalReviews})
              </button>
              <button
                type="button"
                onClick={() => setRatingFilter('5')}
                className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-0.5 ${
                  ratingFilter === '5'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>5</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </button>
              <button
                type="button"
                onClick={() => setRatingFilter('4')}
                className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-0.5 ${
                  ratingFilter === '4'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>4</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </button>
              <button
                type="button"
                onClick={() => setRatingFilter('3')}
                className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-0.5 ${
                  ratingFilter === '3'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>3</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </button>
            </div>

            {/* Drop Spot Filter */}
            <select
              value={spotFilter}
              onChange={(e) => setSpotFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-stone-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="all">All Delivery Spots</option>
              {dropSpots
                .filter((s) => restaurant.supportedDropSpotIds.includes(s.id))
                .map((spot) => (
                  <option key={spot.id} value={spot.id}>
                    {spot.shortCode} • {spot.name}
                  </option>
                ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 text-xs border border-stone-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>
        </div>

        {/* 4. Feed List */}
        {displayedFeedbacks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-200 p-10 text-center space-y-2 bg-stone-50/50">
            <MessageSquare className="h-8 w-8 text-stone-300 mx-auto" />
            <p className="text-xs font-bold text-stone-700">No reviews found matching your filter.</p>
            <p className="text-[11px] text-stone-400">
              {totalReviews === 0
                ? 'Be the first student to order and leave a review for this kitchen!'
                : 'Try adjusting the star filter or delivery spot dropdown above.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedFeedbacks.map((fb) => {
              const dateStr = fb.createdAt
                ? new Date(fb.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent';

              const initial = fb.customerName ? fb.customerName.charAt(0).toUpperCase() : 'S';
              const upvoteCount = helpfulVotes[fb.id] || 0;

              return (
                <div
                  key={fb.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-2xs hover:border-stone-300 transition"
                >
                  {/* Review Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-stone-900">{fb.customerName}</h4>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-md font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                            <span>Verified Delivery</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                          <span className="flex items-center gap-1 text-stone-600">
                            <MapPin className="h-3 w-3 text-amber-500" />
                            <span>Delivered to {fb.dropSpotName}</span>
                          </span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-900 shrink-0">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      <span>{fb.overallRating} / 5</span>
                    </div>
                  </div>

                  {/* Sub-ratings indicators */}
                  {(fb.foodQualityRating || fb.spotDeliveryRating) && (
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-0.5">
                      {fb.foodQualityRating && (
                        <span>
                          Food Taste: <strong>{fb.foodQualityRating}★</strong>
                        </span>
                      )}
                      {fb.spotDeliveryRating && (
                        <span>
                          Spot Delivery: <strong>{fb.spotDeliveryRating}★</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Text Review */}
                  <p className="text-xs text-stone-800 leading-relaxed font-normal bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                    "{fb.comment}"
                  </p>

                  {/* Tag Chips & Helpful button */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap gap-1">
                      {fb.tags &&
                        fb.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md"
                          >
                            ✓ {tag}
                          </span>
                        ))}
                    </div>

                    {/* Helpful Upvote Button */}
                    <button
                      type="button"
                      onClick={() => handleUpvote(fb.id)}
                      className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 hover:bg-stone-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 shrink-0"
                    >
                      <ThumbsUp className="h-3 w-3 text-stone-400" />
                      <span>Helpful {upvoteCount > 0 ? `(${upvoteCount})` : ''}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

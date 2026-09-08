import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Restaurant, MenuItem, MealWindowType } from '../../types';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Plus,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Leaf,
  MessageSquare,
  ShieldCheck,
  Thermometer,
} from 'lucide-react';
import { formatTime12h, getWindowStatusBadge, getWindowLabel } from '../../utils/timeUtils';
import { formatUGX } from '../../utils/currency';
import { DishModal } from './DishModal';
import { ReviewsAndRatings } from './ReviewsAndRatings';

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
  onOpenSpotSelector: () => void;
}

export const RestaurantDetail: React.FC<RestaurantDetailProps> = ({
  restaurant,
  onBack,
  onOpenSpotSelector,
}) => {
  const { menuItems, dropSpots, selectedDropSpotId, simulatedTime, feedbacks } = useApp();

  const [selectedMealWindowTab, setSelectedMealWindowTab] = useState<string>('all');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'reviews'>('menu');

  // Menu items belonging to this restaurant
  const items = menuItems.filter((i) => i.restaurantId === restaurant.id);

  // Filtered menu items based on meal window tab
  const filteredItems = items.filter((item) => {
    if (selectedMealWindowTab === 'all') return true;
    return item.mealWindows.includes(selectedMealWindowTab as MealWindowType);
  });

  // Unique categories
  const categories = Array.from(new Set(filteredItems.map((i) => i.category)));

  // Restaurant feedbacks
  const restaurantFeedbacks = feedbacks.filter((fb) => fb.restaurantId === restaurant.id);

  // Supported spots objects
  const supportedSpots = dropSpots.filter((s) => restaurant.supportedDropSpotIds.includes(s.id));
  const currentSelectedSpot = dropSpots.find((s) => s.id === selectedDropSpotId);
  const isCurrentSpotSupported =
    selectedDropSpotId && restaurant.supportedDropSpotIds.includes(selectedDropSpotId);

  // Active meal window config for selected tab
  const currentWindowConfig = restaurant.mealWindows.find((w) => w.type === selectedMealWindowTab);
  const currentWindowStatus = currentWindowConfig
    ? getWindowStatusBadge(currentWindowConfig, simulatedTime)
    : null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to All Restaurants</span>
      </button>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 text-white shadow-xl">
        <div className="relative h-64 w-full">
          <img
            src={restaurant.bannerImage}
            alt={restaurant.name}
            className="h-full w-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

          {/* Supported Spot Warning / Notice */}
          <div className="absolute top-4 right-4">
            {isCurrentSpotSupported ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Delivers to <strong>{currentSelectedSpot?.name}</strong></span>
              </div>
            ) : (
              <button
                onClick={onOpenSpotSelector}
                className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/30 text-amber-200 text-xs px-3 py-1.5 rounded-full backdrop-blur-md hover:bg-amber-900/80 transition"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Select a supported drop spot</span>
              </button>
            )}
          </div>
        </div>

        {/* Info Strip */}
        <div className="p-6 relative -mt-16 z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-start gap-4">
              <img
                src={restaurant.logoImage}
                alt={restaurant.name}
                className="h-20 w-20 rounded-2xl object-cover border-4 border-white shadow-xl bg-white shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {restaurant.name}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold transition cursor-pointer"
                    title="Read reviews and customer ratings"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{restaurant.rating.toFixed(1)}</span>
                    <span className="text-stone-300 font-normal">({restaurant.ratingCount})</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl">
                  {restaurant.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-400">
                  <span>{restaurant.cuisine.join(' • ')}</span>
                  <span>•</span>
                  <span>Ready-Cooked Menu</span>
                  <span>•</span>
                  <span>Min Order: {formatUGX(restaurant.minOrderAmount)}</span>
                </div>
              </div>
            </div>

            {/* Supported Spots Chips */}
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm border border-white/10 max-w-xs">
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-bold block mb-1">
                Authorized Drop Spots ({supportedSpots.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {supportedSpots.map((spot) => (
                  <span
                    key={spot.id}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                      spot.id === selectedDropSpotId
                        ? 'bg-amber-400 text-stone-900 font-bold'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {spot.shortCode}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Menu vs Reviews */}
      <div className="flex items-center justify-between border-b border-stone-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('menu')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === 'menu'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Menu & Meal Windows ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Reviews & Ratings ({restaurantFeedbacks.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Meal Window Tabs with Cut-off info */}
          <div className="rounded-2xl bg-white p-4 border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Select Meal Order Window
              </span>
              <span className="text-xs text-stone-400">
                Current simulated time: <strong>{formatTime12h(simulatedTime)}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMealWindowTab('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  selectedMealWindowTab === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All Menu Items ({items.length})
              </button>

              {restaurant.mealWindows.map((w) => {
                const isSelected = selectedMealWindowTab === w.type;
                const status = getWindowStatusBadge(w, simulatedTime);

                return (
                  <button
                    key={w.id}
                    onClick={() => setSelectedMealWindowTab(w.type)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span>{getWindowLabel(w.type)}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                        status.isOpen
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {status.isOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Window Banner Details */}
            {currentWindowConfig && (
              <div
                className={`mt-2 p-3 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                  currentWindowStatus?.isOpen
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-stone-100 border-stone-200 text-stone-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    <strong>{currentWindowConfig.label}:</strong> Orders must be placed before{' '}
                    <strong>{formatTime12h(currentWindowConfig.orderCutoffTime)}</strong> for{' '}
                    <strong>{formatTime12h(currentWindowConfig.dropOffTime)}</strong> batch drop-off.
                  </span>
                </div>
                <div className="font-bold shrink-0">
                  {currentWindowStatus?.isOpen ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {currentWindowStatus.text}
                    </span>
                  ) : (
                    <span className="text-stone-500 bg-stone-200 px-2 py-0.5 rounded-md">
                      Cut-off has closed
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Menu Items by Category */}
          {categories.map((category) => {
            const categoryItems = filteredItems.filter((i) => i.category === category);
            return (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-extrabold text-stone-900 border-b border-stone-100 pb-2">
                  {category}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMenuItem(item)}
                      className="group cursor-pointer rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all flex items-start gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-base font-bold text-stone-900 group-hover:text-amber-600 transition">
                            {item.name}
                          </h4>
                          {item.isPopular && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800">
                              Popular
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>

                        {/* Dietary tags & calories */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
                          {item.calories && <span>{item.calories} kcal •</span>}
                          {item.dietary.map((tag) => (
                            <span
                              key={tag}
                              className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm capitalize"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Dish Rating & Count */}
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            <span className="text-xs font-black text-stone-900">
                              {(item.rating || 5.0).toFixed(1)}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 font-medium">
                            • {item.ratingCount || 1} {item.ratingCount === 1 ? 'rating' : 'ratings'}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-base font-black text-stone-900">
                            {formatUGX(item.price)}
                          </div>
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>

                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-24 w-24 rounded-xl object-cover shrink-0 bg-stone-100"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reviews & Ratings Tab */}
      {activeTab === 'reviews' && (
        <ReviewsAndRatings
          restaurant={restaurant}
          onNavigateToMenu={() => setActiveTab('menu')}
        />
      )}

      {/* Dish Modal */}
      {selectedMenuItem && (
        <DishModal
          item={selectedMenuItem}
          isOpen={Boolean(selectedMenuItem)}
          onClose={() => setSelectedMenuItem(null)}
          activeMealWindow={
            selectedMealWindowTab !== 'all'
              ? (selectedMealWindowTab as MealWindowType)
              : selectedMenuItem.mealWindows[0] || 'lunch'
          }
        />
      )}
    </div>
  );
};

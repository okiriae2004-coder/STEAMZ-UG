import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Restaurant, MenuItem, MealWindowType } from '../../types';
import {
  ArrowLeft,
  Star,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
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
  const supportedSpots = dropSpots.filter(
    (s) =>
      !restaurant.supportedDropSpotIds ||
      restaurant.supportedDropSpotIds.length === 0 ||
      restaurant.supportedDropSpotIds.includes(s.id)
  );
  const currentSelectedSpot = dropSpots.find((s) => s.id === selectedDropSpotId);
  const isCurrentSpotSupported =
    !selectedDropSpotId ||
    !restaurant.supportedDropSpotIds ||
    restaurant.supportedDropSpotIds.length === 0 ||
    restaurant.supportedDropSpotIds.includes(selectedDropSpotId);

  // Active meal window config for selected tab
  const currentWindowConfig = restaurant.mealWindows.find((w) => w.type === selectedMealWindowTab);
  const currentWindowStatus = currentWindowConfig
    ? getWindowStatusBadge(currentWindowConfig, simulatedTime)
    : null;

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to All Restaurants</span>
      </button>

      {/* Compact Hero Header */}
      <div className="relative rounded-2xl overflow-hidden bg-stone-900 text-white shadow-lg">
        <div className="relative h-32 sm:h-44 w-full">
          <img
            src={restaurant.bannerImage}
            alt={restaurant.name}
            className="h-full w-full object-cover opacity-75"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent" />

          {/* Spot status badge — top right, compact */}
          <div className="absolute top-3 right-3">
            {isCurrentSpotSupported ? (
              <div className="flex items-center gap-1.5 bg-emerald-950/85 border border-emerald-500/30 text-emerald-100 text-[11px] px-2.5 py-1 rounded-full backdrop-blur-md">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[160px]">
                  To <strong>{currentSelectedSpot?.name || 'your spot'}</strong>
                </span>
              </div>
            ) : (
              <button
                onClick={onOpenSpotSelector}
                className="flex items-center gap-1.5 bg-amber-950/85 border border-amber-500/30 text-amber-100 text-[11px] px-2.5 py-1 rounded-full backdrop-blur-md hover:bg-amber-900/85 transition"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Pick supported spot</span>
              </button>
            )}
          </div>

          {/* Name overlay on hero for mobile — identity stays visible */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
            <img
              src={restaurant.logoImage}
              alt={restaurant.name}
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover border-2 border-white shadow-lg bg-white shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white truncate">
                {restaurant.name}
              </h1>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-stone-300 mt-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="flex items-center gap-1 bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold transition"
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{restaurant.rating.toFixed(1)}</span>
                  <span className="text-stone-300 font-normal">({restaurant.ratingCount})</span>
                </button>
                <span className="truncate">{restaurant.cuisine.join(' • ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact info strip below hero */}
        <div className="px-4 py-3 bg-stone-900/95 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-stone-300 line-clamp-2 flex-1">
              {restaurant.description}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-stone-400 shrink-0">
              <span>Min: <strong className="text-stone-200">{formatUGX(restaurant.minOrderAmount)}</strong></span>
            </div>
          </div>

          {/* Supported spots — compact chips */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
              Drops to ({supportedSpots.length}):
            </span>
            {supportedSpots.map((spot) => (
              <span
                key={spot.id}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                  spot.id === selectedDropSpotId
                    ? 'bg-amber-400 text-stone-900 font-bold'
                    : 'bg-white/10 text-stone-300'
                }`}
              >
                {spot.shortCode}
              </span>
            ))}
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
            Menu ({items.length})
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
            <span>Reviews ({restaurantFeedbacks.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'menu' && (
        <div className="space-y-5">
          {/* Meal Window Tabs with Cut-off info */}
          <div className="rounded-2xl bg-white p-3 sm:p-4 border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Meal Window
              </span>
              <span className="text-[10px] text-stone-400">
                {formatTime12h(simulatedTime)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMealWindowTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedMealWindowTab === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                All ({items.length})
              </button>

              {restaurant.mealWindows.map((w) => {
                const isSelected = selectedMealWindowTab === w.type;
                const status = getWindowStatusBadge(w, simulatedTime);

                return (
                  <button
                    key={w.id}
                    onClick={() => setSelectedMealWindowTab(w.type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
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

            {/* Selected Window Banner — PROMOTED, big and unmissable */}
            {currentWindowConfig && (
              <div
                className={`mt-1 p-3 rounded-xl border-l-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                  currentWindowStatus?.isOpen
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                    : 'bg-stone-100 border-stone-400 text-stone-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Clock
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      currentWindowStatus?.isOpen ? 'text-emerald-600' : 'text-stone-500'
                    }`}
                  />
                  <div className="text-xs leading-snug">
                    <div className="font-bold text-sm">
                      {currentWindowConfig.label}
                    </div>
                    <div className="text-[11px] opacity-90">
                      Order by <strong>{formatTime12h(currentWindowConfig.orderCutoffTime)}</strong> for{' '}
                      <strong>{formatTime12h(currentWindowConfig.dropOffTime)}</strong> drop
                    </div>
                  </div>
                </div>
                <div className="font-bold shrink-0 text-xs">
                  {currentWindowStatus?.isOpen ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      {currentWindowStatus.text}
                    </span>
                  ) : (
                    <span className="text-stone-600 bg-stone-200 px-2.5 py-1 rounded-lg">
                      Closed
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
                <h3 className="text-base font-extrabold text-stone-900 border-b border-stone-100 pb-1.5">
                  {category}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMenuItem(item)}
                      className="group cursor-pointer rounded-2xl border border-stone-200 bg-white p-3 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all flex items-start gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-600 transition leading-tight">
                            {item.name}
                          </h4>
                          {item.isPopular && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 uppercase tracking-wide">
                              Popular
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>

                        {/* Meta row: rating + calories + dietary */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="flex items-center gap-0.5 text-stone-700 font-bold">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                            {(item.rating || 5.0).toFixed(1)}
                            <span className="text-stone-400 font-normal ml-0.5">
                              ({item.ratingCount || 1})
                            </span>
                          </span>
                          {item.calories && (
                            <>
                              <span className="text-stone-300">•</span>
                              <span className="text-stone-400">{item.calories} kcal</span>
                            </>
                          )}
                          {item.dietary.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm capitalize"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-sm font-black text-stone-900">
                            {formatUGX(item.price)}
                          </div>
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 text-xs font-bold transition shadow-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>

                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl object-cover shrink-0 bg-stone-100"
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
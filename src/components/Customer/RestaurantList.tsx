import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Restaurant, DropSpot } from '../../types';
import {
  Search,
  Star,
  MapPin,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Thermometer,
  Sparkles,
} from 'lucide-react';
import { formatTime12h, getWindowStatusBadge, getWindowLabel } from '../../utils/timeUtils';

interface RestaurantListProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenSpotSelector: () => void;
}

export const RestaurantList: React.FC<RestaurantListProps> = ({
  onSelectRestaurant,
  onOpenSpotSelector,
}) => {
  const {
    restaurants,
    dropSpots,
    selectedDropSpotId,
    simulatedTime,
    setUserRole,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);

  // Collect unique cuisines
  const allCuisines = ['All', ...Array.from(new Set(restaurants.flatMap((r) => r.cuisine)))];

  const currentSpot = dropSpots.find((s) => s.id === selectedDropSpotId) || dropSpots[0];

  // Filter restaurants
  const filteredRestaurants = restaurants.filter((restaurant) => {
    // Search query
    const matchesSearch =
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      restaurant.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Cuisine filter
    const matchesCuisine =
      selectedCuisine === 'All' || restaurant.cuisine.includes(selectedCuisine);

    // Filter by selected drop spot: does this restaurant support this spot?
    const supportsSpot =
      !selectedDropSpotId ||
      !restaurant.supportedDropSpotIds ||
      restaurant.supportedDropSpotIds.length === 0 ||
      restaurant.supportedDropSpotIds.includes(selectedDropSpotId);

    // Open now filter
    const hasAnyOpenWindow =
      restaurant.isOpen !== false &&
      (!restaurant.mealWindows ||
        restaurant.mealWindows.length === 0 ||
        restaurant.mealWindows.some((w) => getWindowStatusBadge(w, simulatedTime).isOpen));
    const matchesOpen = !onlyOpenNow || hasAnyOpenWindow;

    return matchesSearch && matchesCuisine && supportsSpot && matchesOpen;
  });

  return (
    <div className="space-y-6">
      {/* Active Spot & Meal Window Hero Bar */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/25 text-amber-100 backdrop-blur-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-300" />
                Spot-Drop Delivery Network
              </span>
              <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
                Simulated: {formatTime12h(simulatedTime)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              Order meals directly to your designated pickup spot
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 mt-1 max-w-xl">
              Fresh hot batch drops with timed order windows (e.g. Lunch cut-off at 12:00 midday for 12:45 PM drop-off).
            </p>
          </div>

          {/* Current Drop Spot Selector Card */}
          <div className="rounded-2xl bg-white/15 backdrop-blur-md p-3.5 border border-white/25 sm:min-w-[260px]">
            <div className="text-[11px] uppercase tracking-wider text-amber-200 font-semibold flex items-center justify-between">
              <span>Your Pickup Spot</span>
              <button
                onClick={onOpenSpotSelector}
                className="text-white hover:underline text-xs font-bold"
              >
                Change
              </button>
            </div>
            <div className="font-bold text-white text-sm mt-1 flex items-center gap-1.5 truncate">
              <MapPin className="h-4 w-4 text-amber-300 shrink-0" />
              <span className="truncate">{currentSpot.name}</span>
            </div>
            <div className="text-[11px] text-amber-100/80 mt-0.5 flex items-center gap-1">
              <span className="bg-amber-400/30 px-1.5 py-0.5 rounded-sm font-mono font-bold text-white">
                {currentSpot.shortCode}
              </span>
              <span>{currentSpot.zone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search restaurants, dishes, cuisines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-stone-200 rounded-2xl shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        {/* Cuisines Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {allCuisines.slice(0, 6).map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCuisine === cuisine
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {cuisine}
            </button>
          ))}

          {/* Toggle: Only Open Now */}
          <button
            onClick={() => setOnlyOpenNow(!onlyOpenNow)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition ${
              onlyOpenNow
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Open Windows Only</span>
          </button>
        </div>
      </div>

      {/* Restaurant Grid */}
      {restaurants.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-8 sm:p-12 text-center shadow-xs">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-stone-900">Welcome to STEAMZ Spot-Drop!</h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mt-2 leading-relaxed">
            All old demo restaurants have been erased. Restaurant owners can now register their restaurant, upload photos, and add each cooked food item and UGX price to their menu!
          </p>
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={() => setUserRole('owner')}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>👨‍🍳 Go to Restaurant Owner Portal</span>
            </button>
          </div>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-8 sm:p-12 text-center">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Filter className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            {restaurants.length > 0
              ? `No restaurants delivering to ${currentSpot.name}`
              : 'No restaurants found'}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1 leading-relaxed">
            {restaurants.length > 0 ? (
              <>
                You have {restaurants.length} active registered restaurant{restaurants.length > 1 ? 's' : ''}, but none are currently configured to drop at <strong>{currentSpot.name}</strong>. You can switch your pickup spot or reset your filters.
              </>
            ) : (
              'Try adjusting your search keywords or clearing cuisine filters.'
            )}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={onOpenSpotSelector}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Change Pickup Spot</span>
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCuisine('All');
                setOnlyOpenNow(false);
              }}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => {
            // Find active windows for this restaurant
            const activeWindows = restaurant.mealWindows.map((w) => ({
              window: w,
              status: getWindowStatusBadge(w, simulatedTime),
            }));

            const hasOpenWindow = activeWindows.some((aw) => aw.status.isOpen);
            const openWindowObj = activeWindows.find((aw) => aw.status.isOpen);

            return (
              <div
                key={restaurant.id}
                onClick={() => onSelectRestaurant(restaurant)}
                className="group cursor-pointer rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:shadow-lg hover:border-amber-300 transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Banner Image */}
                <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                  <img
                    src={restaurant.bannerImage}
                    alt={restaurant.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-stone-900 shadow-sm backdrop-blur-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    <span>{restaurant.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-stone-500 font-normal">
                      ({restaurant.ratingCount})
                    </span>
                  </div>

                  {/* Window Status Pill */}
                  <div className="absolute top-3 left-3">
                    {hasOpenWindow && openWindowObj ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 text-white px-3 py-1 text-xs font-bold shadow-sm backdrop-blur-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{getWindowLabel(openWindowObj.window.type)} Open</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-900/80 text-white px-3 py-1 text-xs font-medium backdrop-blur-xs">
                        <Clock className="h-3 w-3 text-amber-400" />
                        <span>Next Drop Window Soon</span>
                      </span>
                    )}
                  </div>

                  {/* Restaurant Logo & Name overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                    <img
                      src={restaurant.logoImage}
                      alt={restaurant.name}
                      className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-md shrink-0 bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 text-white">
                      <h3 className="text-lg font-black truncate drop-shadow-sm group-hover:text-amber-300 transition">
                        {restaurant.name}
                      </h3>
                      <p className="text-xs text-stone-200 truncate">
                        {restaurant.cuisine.join(' • ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-stone-600 line-clamp-2">
                    {restaurant.tagline || restaurant.description}
                  </p>

                  {/* Meal Windows Schedule Strip */}
                  <div className="rounded-xl bg-stone-50 p-2.5 border border-stone-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      <span>Meal Windows & Cut-offs</span>
                      <span className="text-amber-600 lowercase font-medium">batch drops</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {restaurant.mealWindows.map((w) => {
                        const status = getWindowStatusBadge(w, simulatedTime);
                        return (
                          <div
                            key={w.id}
                            className={`p-1.5 rounded-lg border text-[11px] flex flex-col ${
                              status.isOpen
                                ? 'border-amber-300 bg-amber-50/80 text-amber-950 font-medium'
                                : 'border-stone-200/70 bg-white text-stone-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold">{getWindowLabel(w.type)}</span>
                              <span
                                className={`text-[9px] px-1 rounded-sm font-bold ${
                                  status.isOpen
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {status.isOpen ? 'OPEN' : 'CLOSED'}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500 mt-0.5">
                              Cut-off: <strong>{formatTime12h(w.orderCutoffTime)}</strong>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Info: Supported spots & action */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-stone-500">
                      <MapPin className="h-3.5 w-3.5 text-stone-400" />
                      <span>
                        Delivers to <strong>{restaurant.supportedDropSpotIds.length} spots</strong>
                      </span>
                    </div>
                    <span className="font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      View Menu <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

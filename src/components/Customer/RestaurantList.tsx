import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Restaurant } from '../../types';
import {
  Search,
  Star,
  MapPin,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
  Sparkles,
  Lock,
  Store,
  Utensils,
} from 'lucide-react';
import { formatTime12h, getWindowStatusBadge, getWindowLabel } from '../../utils/timeUtils';

interface RestaurantListProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onOpenSpotSelector: () => void;
  onOpenAuth?: () => void;
}

const CATEGORY_CHIPS = [
  { id: 'All', label: 'All', emoji: '🍽️' },
  { id: 'Chicken', label: 'Chicken', emoji: '🍗' },
  { id: 'Chips', label: 'Chips', emoji: '🍟' },
  { id: 'Rice', label: 'Rice', emoji: '🍚' },
  { id: 'Burgers', label: 'Burgers', emoji: '🍔' },
  { id: 'Drinks', label: 'Drinks', emoji: '🥤' },
];

export const RestaurantList: React.FC<RestaurantListProps> = ({
  onSelectRestaurant,
  onOpenSpotSelector,
  onOpenAuth,
}) => {
  const {
    restaurants,
    dropSpots,
    selectedDropSpotId,
    simulatedTime,
    setUserRole,
    hasOwnerPrivilege,
    isSuperAdmin,
  } = useApp();

  const { currentUser, userProfile } = useAuth();
  const activeEmail = currentUser?.email || userProfile?.email;
  const canOwner = hasOwnerPrivilege(activeEmail);
  const isSuper = isSuperAdmin(activeEmail);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);

  const currentSpot = dropSpots.find((s) => s.id === selectedDropSpotId) || dropSpots[0];

  // Build unique cuisine list from real data + our friendly chips
  const allCuisines = useMemo(() => {
    const fromData = Array.from(new Set(restaurants.flatMap((r) => r.cuisine)));
    return ['All', ...fromData];
  }, [restaurants]);

  // Filter restaurants (same logic as before – safe)
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch =
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (restaurant.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCuisine =
      selectedCuisine === 'All' ||
      restaurant.cuisine.some((c) =>
        c.toLowerCase().includes(selectedCuisine.toLowerCase())
      );

    const supportsSpot =
      !selectedDropSpotId ||
      !restaurant.supportedDropSpotIds ||
      restaurant.supportedDropSpotIds.length === 0 ||
      restaurant.supportedDropSpotIds.includes(selectedDropSpotId);

    const hasAnyOpenWindow =
      restaurant.isOpen !== false &&
      (!restaurant.mealWindows ||
        restaurant.mealWindows.length === 0 ||
        restaurant.mealWindows.some((w) => getWindowStatusBadge(w, simulatedTime).isOpen));

    const matchesOpen = !onlyOpenNow || hasAnyOpenWindow;

    return matchesSearch && matchesCuisine && supportsSpot && matchesOpen;
  });

  // Find the soonest open window across restaurants for the quiet status bar
  const nextOpenInfo = useMemo(() => {
    for (const r of restaurants) {
      if (!r.mealWindows) continue;
      for (const w of r.mealWindows) {
        const status = getWindowStatusBadge(w, simulatedTime);
        if (status.isOpen) {
          return {
            label: getWindowLabel(w.type),
            cutoff: formatTime12h(w.orderCutoffTime),
            drop: formatTime12h(w.dropOffTime),
          };
        }
      }
    }
    return null;
  }, [restaurants, simulatedTime]);

  return (
    <div className="space-y-5 pb-4">
      {/* ===== CLEAN HERO (familiar food-app style) ===== */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
          What are you{' '}
          <span className="text-amber-500">craving</span> today?
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Great food. Fast. Right to your spot.
        </p>
      </div>

      {/* Quiet status line – no jargon */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={onOpenSpotSelector}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-amber-50 border border-stone-200 text-stone-700 font-medium transition"
        >
          <MapPin className="h-3.5 w-3.5 text-amber-600" />
          <span className="truncate max-w-[160px]">
            {currentSpot?.shortCode} · {currentSpot?.name}
          </span>
        </button>

        {nextOpenInfo ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
            <Clock className="h-3.5 w-3.5" />
            {nextOpenInfo.label} closes {nextOpenInfo.cutoff} · Ready {nextOpenInfo.drop}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 font-medium">
            <Clock className="h-3.5 w-3.5" />
            Next window soon
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search for a restaurant or dish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-stone-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
        />
      </div>

      {/* Category chips (friendly & visual) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_CHIPS.map((chip) => {
          const isActive = selectedCuisine === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setSelectedCuisine(chip.id)}
              className={`flex flex-col items-center gap-1 min-w-[64px] px-2 py-2 rounded-2xl transition ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span className="text-xl leading-none">{chip.emoji}</span>
              <span className="text-[11px] font-semibold">{chip.label}</span>
            </button>
          );
        })}

        {/* Open windows toggle */}
        <button
          onClick={() => setOnlyOpenNow(!onlyOpenNow)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border transition ${
            onlyOpenNow
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          Open now
        </button>
      </div>

      {/* Section title */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="text-lg font-bold text-stone-900">Popular near you</h2>
        {filteredRestaurants.length > 0 && (
          <span className="text-xs text-stone-400">
            {filteredRestaurants.length} place{filteredRestaurants.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Empty / No results states (kept safe) */}
      {restaurants.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-black text-stone-900">Welcome to STEAMZ</h3>
          <p className="text-sm text-stone-600 max-w-md mx-auto mt-2">
            Restaurant owners can register and start receiving orders for campus drop spots.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {canOwner ? (
              <button
                onClick={() => setUserRole('owner')}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
              >
                <Store className="h-4 w-4" />
                Enter Restaurant Portal
              </button>
            ) : (
              <button
                onClick={() => (onOpenAuth ? onOpenAuth() : setUserRole('owner'))}
                className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4 text-amber-400" />
                Sign in as Owner
              </button>
            )}
          </div>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Filter className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            No restaurants for {currentSpot?.name || 'this spot'}
          </h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Try another pickup spot or clear your filters.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              onClick={onOpenSpotSelector}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm flex items-center gap-1.5"
            >
              <MapPin className="h-4 w-4" />
              Change spot
            </button>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCuisine('All');
                setOnlyOpenNow(false);
              }}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-semibold"
            >
              Reset filters
            </button>
          </div>
        </div>
      ) : (
        /* ===== Restaurant cards (clean, modern) ===== */
        <div className="space-y-4">
          {filteredRestaurants.map((restaurant) => {
            const activeWindows = (restaurant.mealWindows || []).map((w) => ({
              window: w,
              status: getWindowStatusBadge(w, simulatedTime),
            }));
            const openWindow = activeWindows.find((aw) => aw.status.isOpen);
            const hasOpen = Boolean(openWindow);

            // Simple ready-time text
            let readyText = 'Check menu';
            if (openWindow) {
              readyText = `Ready by ${formatTime12h(openWindow.window.dropOffTime)}`;
            } else if (activeWindows.length > 0) {
              const next = activeWindows[0];
              readyText = `Next: ${formatTime12h(next.window.dropOffTime)}`;
            }

            return (
              <div
                key={restaurant.id}
                onClick={() => onSelectRestaurant(restaurant)}
                className="group cursor-pointer rounded-2xl bg-white border border-stone-200/80 shadow-sm hover:shadow-md hover:border-amber-300 transition-all overflow-hidden flex"
              >
                {/* Image */}
                <div className="relative w-28 sm:w-36 shrink-0 bg-stone-100">
                  <img
                    src={restaurant.bannerImage || restaurant.logoImage}
                    alt={restaurant.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {hasOpen && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold shadow">
                      <CheckCircle2 className="h-3 w-3" />
                      Open
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-stone-900 text-base leading-tight truncate">
                        {restaurant.name}
                      </h3>
                      <div className="flex items-center gap-0.5 text-xs font-bold text-stone-800 shrink-0">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        <span>{(restaurant.rating || 4.5).toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 mt-0.5 truncate">
                      {restaurant.cuisine?.slice(0, 3).join(' · ') || 'Local favourites'}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-xs text-stone-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-stone-400" />
                        {readyText}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-stone-900">
                      From UGX {(restaurant.minOrderAmount || 8000).toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 group-hover:gap-1.5 transition-all">
                      View menu
                      <ChevronRight className="h-4 w-4" />
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
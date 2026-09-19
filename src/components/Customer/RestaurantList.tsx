import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Restaurant } from '../../types';

import {
  Search,
  Star,
  MapPin,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';

import {
  formatTime12h,
  getWindowStatusBadge,
} from '../../utils/timeUtils';

interface RestaurantListProps {
  onSelectRestaurant: (
    restaurant: Restaurant
  ) => void;

  onOpenSpotSelector: () => void;

  onOpenAuth?: () => void;
}

export const RestaurantList: React.FC<
  RestaurantListProps
> = ({
  onSelectRestaurant,
  onOpenSpotSelector,
  onOpenAuth,
}) => {
  const {
    restaurants,
    dropSpots,
    selectedDropSpotId,
    simulatedTime,
  } = useApp();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('');

  const [
    onlyOpenNow,
    setOnlyOpenNow,
  ] = useState(false);

  const currentSpot =
    dropSpots.find(
      (spot) =>
        spot.id === selectedDropSpotId
    ) || dropSpots[0];

  /*
   * Restaurant filtering is deliberately simple.
   *
   * Customers can search:
   * - restaurant name
   * - cuisine
   * - dish/description text
   *
   * Spot compatibility is still respected.
   */
  const filteredRestaurants =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return restaurants.filter(
        (restaurant) => {
          const matchesSearch =
            !query ||
            restaurant.name
              .toLowerCase()
              .includes(query) ||
            restaurant.cuisine.some(
              (cuisine) =>
                cuisine
                  .toLowerCase()
                  .includes(query)
            ) ||
            (
              restaurant.description ||
              ''
            )
              .toLowerCase()
              .includes(query);

          const supportsSpot =
            !selectedDropSpotId ||
            !restaurant.supportedDropSpotIds ||
            restaurant
              .supportedDropSpotIds
              .length === 0 ||
            restaurant.supportedDropSpotIds.includes(
              selectedDropSpotId
            );

          const hasAnyOpenWindow =
            restaurant.isOpen !== false &&
            (
              !restaurant.mealWindows ||
              restaurant.mealWindows.length ===
                0 ||
              restaurant.mealWindows.some(
                (window) =>
                  getWindowStatusBadge(
                    window,
                    simulatedTime
                  ).isOpen
              )
            );

          const matchesOpen =
            !onlyOpenNow ||
            hasAnyOpenWindow;

          return (
            matchesSearch &&
            supportsSpot &&
            matchesOpen
          );
        }
      );
    }, [
      restaurants,
      searchQuery,
      selectedDropSpotId,
      onlyOpenNow,
      simulatedTime,
    ]);

  /*
   * No restaurant data.
   *
   * Do not turn this into a restaurant-owner marketing
   * page. The customer should simply understand that
   * there is currently nothing to order.
   */
  if (restaurants.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pt-8">

        <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">

          <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
            <Search className="h-7 w-7" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-stone-900">
            No restaurants available yet
          </h1>

          <p className="text-sm text-stone-500 max-w-md mx-auto mt-2">
            Check another pickup spot or come back later.
          </p>

          <button
            onClick={onOpenSpotSelector}
            className="mt-5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm inline-flex items-center gap-2 transition"
          >
            <MapPin className="h-4 w-4" />
            Change pickup spot
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">

      {/* SEARCH + LOCATION */}

      <section className="max-w-3xl mx-auto pt-2">

        <div className="mb-3">
          <h1 className="text-xl sm:text-2xl font-black text-stone-900">
            Find something to eat
          </h1>

          <p className="text-sm text-stone-500 mt-1">
            Search for a restaurant or dish.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">

          {/* SEARCH */}
          <div className="relative flex-1">

            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 pointer-events-none" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search restaurant or food..."
              className="w-full pl-12 pr-4 py-3.5 text-sm bg-white border border-stone-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none"
              aria-label="Search restaurants or food"
            />

          </div>

          {/* LOCATION */}
          <button
            onClick={onOpenSpotSelector}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-stone-200 rounded-2xl shadow-sm hover:border-amber-400 hover:bg-amber-50/40 transition text-left min-w-0 sm:max-w-[220px]"
            title="Change pickup spot"
          >
            <MapPin className="h-4 w-4 text-amber-600 shrink-0" />

            <span className="text-xs font-bold text-stone-700 truncate">
              {currentSpot
                ? `${currentSpot.shortCode} · ${currentSpot.name}`
                : 'Choose pickup spot'}
            </span>
          </button>

        </div>

        {/* SMALL FILTER — deliberately secondary */}
        <div className="flex items-center justify-between mt-3">

          <span className="text-xs text-stone-400">
            {filteredRestaurants.length}{' '}
            {filteredRestaurants.length === 1
              ? 'restaurant'
              : 'restaurants'}
          </span>

          <button
            onClick={() =>
              setOnlyOpenNow(
                (current) => !current
              )
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
              onlyOpenNow
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Open now
          </button>

        </div>

      </section>

      {/* RESTAURANT RESULTS */}

      <section>

        <div className="flex items-center justify-between mb-3">

          <h2 className="text-lg font-black text-stone-900">
            Available restaurants
          </h2>

        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center">

            <div className="h-12 w-12 mx-auto rounded-2xl bg-stone-100 text-stone-500 flex items-center justify-center mb-3">
              <Search className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-stone-900">
              Nothing found
            </h3>

            <p className="text-sm text-stone-500 mt-1">
              Try another restaurant, food name, or pickup spot.
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">

              {searchQuery && (
                <button
                  onClick={() =>
                    setSearchQuery('')
                  }
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-semibold"
                >
                  Clear search
                </button>
              )}

              {onlyOpenNow && (
                <button
                  onClick={() =>
                    setOnlyOpenNow(false)
                  }
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-semibold"
                >
                  Show all restaurants
                </button>
              )}

              <button
                onClick={onOpenSpotSelector}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-sm font-bold inline-flex items-center gap-1.5"
              >
                <MapPin className="h-4 w-4" />
                Change spot
              </button>

            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

            {filteredRestaurants.map(
              (restaurant) => {
                const windows =
                  (
                    restaurant.mealWindows ||
                    []
                  ).map((window) => ({
                    window,
                    status:
                      getWindowStatusBadge(
                        window,
                        simulatedTime
                      ),
                  }));

                const openWindow =
                  windows.find(
                    (item) =>
                      item.status.isOpen
                  );

                const hasOpen =
                  Boolean(openWindow);

                let readyText =
                  'View menu';

                if (openWindow) {
                  readyText = `Ready by ${formatTime12h(
                    openWindow.window
                      .dropOffTime
                  )}`;
                }

                return (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() =>
                      onSelectRestaurant(
                        restaurant
                      )
                    }
                    className="group w-full text-left rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all overflow-hidden"
                  >

                    {/* IMAGE */}

                    <div className="relative h-40 sm:h-44 bg-stone-100 overflow-hidden">

                      <img
                        src={
                          restaurant.bannerImage ||
                          restaurant.logoImage
                        }
                        alt={
                          restaurant.name
                        }
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />

                      {/* OPEN BADGE */}

                      {hasOpen && (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[10px] font-bold shadow">
                          <CheckCircle2 className="h-3 w-3" />
                          Open
                        </span>
                      )}

                    </div>

                    {/* CONTENT */}

                    <div className="p-4">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h3 className="font-black text-stone-900 text-base sm:text-lg leading-tight truncate">
                            {restaurant.name}
                          </h3>

                          <p className="text-xs text-stone-500 mt-1 truncate">
                            {restaurant.cuisine
                              ?.slice(0, 3)
                              .join(' · ') ||
                              'Local food'}
                          </p>

                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-stone-800 shrink-0">

                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />

                          <span>
                            {(
                              restaurant.rating ||
                              0
                            ).toFixed(1)}
                          </span>

                        </div>

                      </div>

                      {/* AVAILABILITY */}

                      <div className="flex items-center gap-1.5 mt-3 text-xs text-stone-600">

                        <Clock className="h-3.5 w-3.5 text-stone-400" />

                        <span>
                          {readyText}
                        </span>

                      </div>

                      {/* ACTION */}

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">

                        <span className="text-xs text-stone-400">
                          Tap to view menu
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-black text-amber-600 group-hover:gap-1.5 transition-all">
                          View menu
                          <ChevronRight className="h-4 w-4" />
                        </span>

                      </div>

                    </div>

                  </button>
                );
              }
            )}

          </div>
        )}

      </section>

    </div>
  );
};
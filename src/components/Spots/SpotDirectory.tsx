import React from 'react';
import { useApp } from '../../context/AppContext';
import { DropSpot } from '../../types';
import {
  MapPin,
  Thermometer,
  ShieldCheck,
  Clock,
  Store,
  Check,
  Sparkles,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { formatTime12h } from '../../utils/timeUtils';

interface SpotDirectoryProps {
  onSelectSpotAndShop: (spotId: string) => void;
}

export const SpotDirectory: React.FC<SpotDirectoryProps> = ({ onSelectSpotAndShop }) => {
  const { dropSpots, restaurants, selectedDropSpotId, setSelectedDropSpotId, simulatedTime } =
    useApp();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Smart Spot Network
            </span>
            <span className="text-xs text-stone-300">
              {dropSpots.length} Active Hubs on Campus & Tech Parks
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Designated Meal Pickup Spots & Smart Lockers
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            STEAMZ couriers deliver hot meals in synchronized batch drops directly to these secure, insulated smart pods. Pick up seamlessly using your 4-digit order PIN!
          </p>
        </div>
      </div>

      {/* Spots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dropSpots.map((spot) => {
          const isCurrent = selectedDropSpotId === spot.id;
          const deliveringRestaurants = restaurants.filter((r) =>
            r.supportedDropSpotIds.includes(spot.id)
          );

          return (
            <div
              key={spot.id}
              className={`rounded-3xl bg-white border p-5 shadow-2xs hover:shadow-lg transition flex flex-col justify-between ${
                isCurrent
                  ? 'border-amber-500 ring-2 ring-amber-400 bg-amber-50/20'
                  : 'border-stone-200'
              }`}
            >
              <div>
                {/* Photo & Badge */}
                <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-stone-100">
                  <img
                    src={spot.image}
                    alt={spot.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="text-xs font-mono font-black uppercase px-2.5 py-1 rounded-lg bg-stone-900 text-white shadow-sm">
                      {spot.shortCode}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500 text-white shadow-sm">
                      {spot.zone}
                    </span>
                  </div>

                  {spot.hasHeatedLocker && (
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-md flex items-center gap-1 border border-white/20">
                        <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                        <span>Heated & Climate-Controlled Pods</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Spot Info */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-stone-900">{spot.name}</h3>
                    {isCurrent && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                        Active Selection
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>{spot.address}</span>
                  </p>

                  <div className="rounded-xl bg-stone-50 p-3 border border-stone-200 text-xs text-stone-700 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-stone-900">
                      <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                      <span>Pickup Directions:</span>
                    </div>
                    <p className="text-stone-600">{spot.instructions}</p>
                    <div className="text-[11px] text-stone-400 pt-1 border-t border-stone-200/60">
                      Pod Capacity: {spot.capacity} insulated lockers
                    </div>
                  </div>

                  {/* Partner Kitchens serving this spot */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                      Partner Kitchens Serving This Spot ({deliveringRestaurants.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {deliveringRestaurants.map((r) => (
                        <span
                          key={r.id}
                          className="text-[11px] font-medium bg-stone-100 text-stone-800 px-2 py-0.5 rounded-md"
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedDropSpotId(spot.id)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{isCurrent ? 'Current Selection' : 'Set as My Spot'}</span>
                </button>

                <button
                  onClick={() => onSelectSpotAndShop(spot.id)}
                  className="text-xs font-bold px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Browse Menus for {spot.shortCode}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

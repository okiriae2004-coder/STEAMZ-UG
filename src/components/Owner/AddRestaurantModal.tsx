import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DropSpot, MealWindowConfig, MealWindowType } from '../../types';
import { DEFAULT_MEAL_WINDOWS } from '../../data/mockData';
import { X, Store, MapPin, Clock, Plus, Sparkles } from 'lucide-react';

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (restaurantId: string) => void;
}

const PRESET_BANNERS = [
  {
    name: 'Artisan Asian Wok',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fresh Salad Bar',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Wood-Fired Pizza & Grill',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Artisan Cafe & Bakery',
    url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gourmet Burger & Smokehouse',
    url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1000&auto=format&fit=crop&q=80',
  },
];

export const AddRestaurantModal: React.FC<AddRestaurantModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { dropSpots, addRestaurant } = useApp();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineInput, setCuisineInput] = useState('Fusion, Bowls, Asian');
  const [bannerImage, setBannerImage] = useState(PRESET_BANNERS[0].url);
  const [logoImage, setLogoImage] = useState(
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80'
  );
  const [supportedDropSpotIds, setSupportedDropSpotIds] = useState<string[]>([
    'spot-1',
    'spot-2',
    'spot-3',
  ]);
  const [prepTimeAvgMinutes, setPrepTimeAvgMinutes] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(10000);
  const [ownerName, setOwnerName] = useState('Partner Chef');
  const [ownerEmail, setOwnerEmail] = useState('partner@steamz.delivery');

  // Meal window cutoff settings
  const [lunchCutoff, setLunchCutoff] = useState('12:00');
  const [lunchDrop, setLunchDrop] = useState('12:45');
  const [dinnerCutoff, setDinnerCutoff] = useState('18:30');
  const [dinnerDrop, setDinnerDrop] = useState('19:15');

  if (!isOpen) return null;

  const toggleSpot = (spotId: string) => {
    setSupportedDropSpotIds((prev) =>
      prev.includes(spotId) ? prev.filter((id) => id !== spotId) : [...prev, spotId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cuisines = cuisineInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const configuredMealWindows: MealWindowConfig[] = [
      {
        id: 'mw-lunch',
        type: 'lunch',
        label: 'Lunch Window',
        orderStartTime: '09:30',
        orderCutoffTime: lunchCutoff,
        dropOffTime: lunchDrop,
        description: `Order before ${lunchCutoff} for ${lunchDrop} batch drop.`,
      },
      {
        id: 'mw-dinner',
        type: 'dinner',
        label: 'Evening Dinner',
        orderStartTime: '16:00',
        orderCutoffTime: dinnerCutoff,
        dropOffTime: dinnerDrop,
        description: `Order before ${dinnerCutoff} for ${dinnerDrop} batch drop.`,
      },
    ];

    const newRest = addRestaurant({
      name,
      tagline,
      description,
      cuisine: cuisines.length > 0 ? cuisines : ['Eclectic', 'Comfort Food'],
      bannerImage,
      logoImage,
      supportedDropSpotIds,
      mealWindows: configuredMealWindows,
      prepTimeAvgMinutes,
      minOrderAmount,
      ownerName,
      ownerEmail,
      isOpen: true,
    });

    onCreated(newRest.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Add New Partner Restaurant</h3>
              <p className="text-xs text-stone-500">
                Join STEAMZ network, configure designated drop spots & meal windows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Basic Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Restaurant Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sol & Spice Grill"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sizzling charcoal kebabs & pita"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Description & Thermal Packaging Note
              </label>
              <textarea
                rows={2}
                placeholder="Explain cuisine and how food is packed for thermal locker drop..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cuisines (comma separated)
              </label>
              <input
                type="text"
                placeholder="Mediterranean, Bowls, Halal, Grilled"
                value={cuisineInput}
                onChange={(e) => setCuisineInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Banner Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Select Cover Photo
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRESET_BANNERS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setBannerImage(preset.url)}
                  className={`relative h-16 rounded-xl overflow-hidden border-2 transition ${
                    bannerImage === preset.url
                      ? 'border-amber-500 ring-2 ring-amber-400'
                      : 'border-transparent hover:opacity-80'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-end p-1">
                    <span className="text-[9px] text-white font-bold truncate">
                      {preset.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Supported Drop Spots */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Select Authorized Delivery Spots ({supportedDropSpotIds.length} Selected)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dropSpots.map((spot) => {
                const isSelected = supportedDropSpotIds.includes(spot.id);
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => toggleSpot(spot.id)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs truncate">{spot.name}</div>
                      <div className="text-[11px] text-stone-400 font-normal">
                        {spot.shortCode} • {spot.zone}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                        isSelected ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isSelected ? 'ACTIVE' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal Windows Config */}
          <div className="rounded-2xl bg-stone-50 p-4 border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-600" />
              Meal Order Windows & Cut-offs
            </h4>

            {/* Lunch Window Config */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-stone-200">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Lunch Order Cut-off (e.g. 12:00)
                </label>
                <input
                  type="time"
                  value={lunchCutoff}
                  onChange={(e) => setLunchCutoff(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Lunch Drop-off Time (e.g. 12:45)
                </label>
                <input
                  type="time"
                  value={lunchDrop}
                  onChange={(e) => setLunchDrop(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg"
                />
              </div>
            </div>

            {/* Dinner Window Config */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-stone-200">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Dinner Order Cut-off (e.g. 18:30)
                </label>
                <input
                  type="time"
                  value={dinnerCutoff}
                  onChange={(e) => setDinnerCutoff(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Dinner Drop-off Time (e.g. 19:15)
                </label>
                <input
                  type="time"
                  value={dinnerDrop}
                  onChange={(e) => setDinnerDrop(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-stone-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 text-sm font-medium hover:bg-stone-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Create Restaurant Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

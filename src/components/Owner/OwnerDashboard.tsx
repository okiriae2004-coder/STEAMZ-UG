import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RestaurantAnalytics } from './RestaurantAnalytics';
import { LiveOrdersBoard } from './LiveOrdersBoard';
import { MenuManager } from './MenuManager';
import { AddRestaurantModal } from './AddRestaurantModal';
import {
  Store,
  BarChart3,
  Layers,
  UtensilsCrossed,
  Settings,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatTime12h } from '../../utils/timeUtils';

interface OwnerDashboardProps {
  activeTab?: 'analytics' | 'orders' | 'menu' | 'settings';
  onTabChange?: (tab: 'analytics' | 'orders' | 'menu' | 'settings') => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  activeTab: controlledTab,
  onTabChange,
}) => {
  const {
    restaurants,
    selectedOwnerRestaurantId,
    setSelectedOwnerRestaurantId,
    dropSpots,
    updateRestaurant,
    addRestaurant,
    addMenuItem,
  } = useApp();

  const [internalTab, setInternalTab] = useState<'analytics' | 'orders' | 'menu' | 'settings'>(
    'menu'
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeTab = controlledTab || internalTab;
  const handleTabSelect = (tab: 'analytics' | 'orders' | 'menu' | 'settings') => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  // Active restaurant
  const currentRestaurant =
    restaurants.find((r) => r.id === selectedOwnerRestaurantId) || restaurants[0];

  const handleQuickSeedDemoKitchen = () => {
    const created = addRestaurant({
      name: 'Mama Bisi Kampala Grills & Pilau',
      tagline: 'Smoky firewood pilau, spiced chicken & tender plantains',
      description:
        'Cooked fresh daily, kept piping hot in thermal insulation, and delivered ready-to-eat to campus locker spots.',
      cuisine: ['Ugandan', 'Grills & BBQ', 'Pilau', 'Halal'],
      bannerImage:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
      logoImage:
        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop&q=80',
      supportedDropSpotIds: ['spot-1', 'spot-2', 'spot-3', 'spot-4', 'spot-5'],
      mealWindows: [
        {
          id: 'mw-lunch',
          type: 'lunch',
          label: 'Lunch Window',
          orderStartTime: '09:30',
          orderCutoffTime: '12:00',
          dropOffTime: '12:45',
          description: 'Fresh lunch batch drop by 12:45 PM. Order before 12:00.',
        },
        {
          id: 'mw-dinner',
          type: 'dinner',
          label: 'Evening Dinner',
          orderStartTime: '16:00',
          orderCutoffTime: '18:30',
          dropOffTime: '19:15',
          description: 'Hot dinner batch drop by 7:15 PM. Order before 6:30 PM.',
        },
      ],
      prepTimeAvgMinutes: 10,
      minOrderAmount: 10000,
      ownerName: 'Chef Bisi Kampala',
      ownerEmail: 'bisi@mamabisi.ug',
      isOpen: true,
    });

    addMenuItem({
      restaurantId: created.id,
      name: 'Smoky Firewood Pilau & Grilled Quarter Chicken',
      description:
        'Ready-cooked aromatic spiced pilau rice with golden fried plantains (gonja) and flame-roasted chicken quarter.',
      price: 15000,
      category: 'Signature Dishes',
      mealWindows: ['lunch', 'dinner'],
      image:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      calories: 740,
      portionSize: 'Hearty Bowl (480g)',
      prepTimeMinutes: 5,
      dietary: ['halal'],
      allergens: [],
      isPopular: true,
      isChefSpecial: true,
      options: [
        {
          name: 'Extra Side',
          required: false,
          choices: [
            { name: 'Extra Fried Gonja (Plantain)', price: 3000 },
            { name: 'Fresh Kachumbari Salad', price: 2000 },
          ],
        },
      ],
    });

    setSelectedOwnerRestaurantId(created.id);
    handleTabSelect('menu');
  };

  if (!currentRestaurant) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 sm:p-12 border border-stone-200 text-center max-w-2xl mx-auto shadow-sm">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-2xs">
            <Store className="h-8 w-8" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Restaurant Owner Portal
          </span>
          <h2 className="text-2xl font-black text-stone-900 mt-3">Register Your Restaurant</h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-md mx-auto leading-relaxed">
            All previous mock restaurants have been removed as requested. You can now create your restaurant, upload photos of your place and dishes, set your Ugandan Shilling (UGX) prices, and receive scheduled batch orders for smart drop spots.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-2xl text-xs font-black transition shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Create Restaurant From Scratch</span>
            </button>
            <button
              onClick={handleQuickSeedDemoKitchen}
              className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
              title="1-click sample starter restaurant"
            >
              <span>⚡ 1-Tap Quick Start</span>
            </button>
          </div>
        </div>

        {/* Modal rendered in empty state as well! */}
        <AddRestaurantModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={(newId) => {
            setSelectedOwnerRestaurantId(newId);
            setIsAddModalOpen(false);
            handleTabSelect('menu');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Partner Bar: Restaurant Switcher + Add button */}
      <div className="rounded-3xl bg-white p-5 border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={currentRestaurant.logoImage}
            alt={currentRestaurant.name}
            className="h-12 w-12 rounded-xl object-cover border border-stone-200 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Partner Portal
              </span>
              <span className="text-xs text-stone-400">Owner: {currentRestaurant.ownerName}</span>
            </div>
            <h2 className="text-lg font-black text-stone-900 mt-0.5">{currentRestaurant.name}</h2>
          </div>
        </div>

        {/* Restaurant selector & Add button */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={currentRestaurant.id}
            onChange={(e) => setSelectedOwnerRestaurantId(e.target.value)}
            className="text-xs font-bold bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:ring-2 focus:ring-amber-500"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-bold px-3.5 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-xl flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Restaurant</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-stone-200 pb-2">
        {[
          { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
          { id: 'orders', label: 'Live Orders & Batch Board', icon: Layers },
          { id: 'menu', label: 'Menu & Meal Windows', icon: UtensilsCrossed },
          { id: 'settings', label: 'Drop Spots & Window Times', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'analytics' && <RestaurantAnalytics restaurant={currentRestaurant} />}

      {activeTab === 'orders' && <LiveOrdersBoard restaurant={currentRestaurant} />}

      {activeTab === 'menu' && <MenuManager restaurant={currentRestaurant} />}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Supported Drop Spots Configuration */}
          <div className="rounded-3xl bg-white p-6 border border-stone-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Designated Delivery Drop Spots
              </h3>
              <p className="text-xs text-stone-500">
                Toggle authorized spots your delivery courier services with batch drops
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dropSpots.map((spot) => {
                const isSupported = currentRestaurant.supportedDropSpotIds.includes(spot.id);
                return (
                  <div
                    key={spot.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                      isSupported
                        ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950'
                        : 'border-stone-200 bg-stone-50 text-stone-500'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{spot.name}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {spot.shortCode} • {spot.zone}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newIds = isSupported
                          ? currentRestaurant.supportedDropSpotIds.filter((id) => id !== spot.id)
                          : [...currentRestaurant.supportedDropSpotIds, spot.id];
                        updateRestaurant({
                          ...currentRestaurant,
                          supportedDropSpotIds: newIds,
                        });
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${
                        isSupported
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {isSupported ? 'Active Spot' : 'Enable'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configured Meal Windows */}
          <div className="rounded-3xl bg-white p-6 border border-stone-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Meal Windows & Order Cut-off Times
              </h3>
              <p className="text-xs text-stone-500">
                Configure when customers must place orders for batch drops (e.g. Lunch cut-off at 12:00 midday)
              </p>
            </div>

            <div className="space-y-3">
              {currentRestaurant.mealWindows.map((win, idx) => (
                <div
                  key={win.id}
                  className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm text-stone-900">{win.label}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{win.description}</div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">
                        Order Cut-off
                      </span>
                      <strong className="text-stone-900">{formatTime12h(win.orderCutoffTime)}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold">
                        Batch Drop
                      </span>
                      <strong className="text-stone-900">{formatTime12h(win.dropOffTime)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Restaurant Modal */}
      {isAddModalOpen && (
        <AddRestaurantModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onCreated={(newId) => {
            setSelectedOwnerRestaurantId(newId);
            handleTabSelect('menu');
          }}
        />
      )}
    </div>
  );
};

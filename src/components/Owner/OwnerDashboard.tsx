import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { LiveOrdersBoard } from './LiveOrdersBoard';
import { MenuManager } from './MenuManager';
import { AddRestaurantModal } from './AddRestaurantModal';
import {
  Store,
  Layers,
  UtensilsCrossed,
  Settings,
  Plus,
  ChevronDown,
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
    roleAssignments,
    isSuperAdmin,
    hasAdminPrivilege,
  } = useApp();

  const { currentUser, userProfile } = useAuth();

  const [internalTab, setInternalTab] = useState<
    'analytics' | 'orders' | 'menu' | 'settings'
  >('orders');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement | null>(null);

  const activeTab = controlledTab || internalTab;
  const handleTabSelect = (
    tab: 'analytics' | 'orders' | 'menu' | 'settings'
  ) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  // Close switcher on outside click
  useEffect(() => {
    if (!isSwitcherOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(e.target as Node)
      ) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isSwitcherOpen]);

  const currentEmail = (
    currentUser?.email ||
    userProfile?.email ||
    ''
  )
    .trim()
    .toLowerCase();

  const isAdminUser =
    isSuperAdmin(currentEmail) || hasAdminPrivilege(currentEmail);

  const myRestaurants = useMemo(() => {
    if (isAdminUser) return restaurants;

    if (!currentEmail) return [];

    const assignedRestaurantIds = new Set(
      roleAssignments
        .filter(
          (r) =>
            r.role === 'owner' &&
            r.email.toLowerCase() === currentEmail &&
            r.restaurantId
        )
        .map((r) => r.restaurantId as string)
    );

    return restaurants.filter((r) => {
      const ownerEmailMatch =
        r.ownerEmail && r.ownerEmail.trim().toLowerCase() === currentEmail;
      const assignmentMatch = assignedRestaurantIds.has(r.id);
      return ownerEmailMatch || assignmentMatch;
    });
  }, [restaurants, roleAssignments, currentEmail, isAdminUser]);

  useEffect(() => {
    if (myRestaurants.length === 0) return;
    const stillValid = myRestaurants.some(
      (r) => r.id === selectedOwnerRestaurantId
    );
    if (!stillValid) {
      setSelectedOwnerRestaurantId(myRestaurants[0].id);
    }
  }, [myRestaurants, selectedOwnerRestaurantId, setSelectedOwnerRestaurantId]);

  const currentRestaurant =
    myRestaurants.find((r) => r.id === selectedOwnerRestaurantId) ||
    myRestaurants[0];

  const handleQuickSeedDemoKitchen = () => {
    const ownerDisplayName =
      userProfile?.displayName || currentUser?.displayName || 'Partner Chef';
    const ownerEmailToUse = currentEmail || 'partner@steamz.delivery';

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
      supportedDropSpotIds: dropSpots.map((s) => s.id),
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
      ownerName: ownerDisplayName,
      ownerEmail: ownerEmailToUse,
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

  // Empty state
  if (!currentRestaurant) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 sm:p-10 border border-stone-200 text-center max-w-xl mx-auto shadow-sm">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 shadow-2xs">
            <Store className="h-7 w-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            Set up your restaurant
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-md mx-auto leading-relaxed">
            Create your restaurant, set UGX prices, and start receiving batch
            orders.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black transition shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Create Restaurant</span>
            </button>
            <button
              onClick={handleQuickSeedDemoKitchen}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              title="1-click sample starter restaurant"
            >
              <span>⚡ Quick Start</span>
            </button>
          </div>
        </div>

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
    <div className="space-y-4">
      {/* Thin header strip with restaurant switcher */}
      <div className="relative" ref={switcherRef}>
        <button
          onClick={() => setIsSwitcherOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5 border border-stone-200 shadow-2xs hover:bg-stone-50 transition"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentRestaurant.logoImage}
              alt={currentRestaurant.name}
              className="h-8 w-8 rounded-lg object-cover border border-stone-200 shrink-0"
              referrerPolicy="no-referrer"
            />
            <span className="text-sm font-black text-stone-900 truncate">
              {currentRestaurant.name}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-stone-500 shrink-0 transition-transform ${
              isSwitcherOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Switcher dropdown */}
        {isSwitcherOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-30 rounded-2xl bg-white border border-stone-200 shadow-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {myRestaurants.map((r) => {
                const isCurrent = r.id === currentRestaurant.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedOwnerRestaurantId(r.id);
                      setIsSwitcherOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition ${
                      isCurrent ? 'bg-amber-50' : 'hover:bg-stone-50'
                    }`}
                  >
                    <img
                      src={r.logoImage}
                      alt={r.name}
                      className="h-7 w-7 rounded-md object-cover border border-stone-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`text-xs font-bold truncate ${
                        isCurrent ? 'text-amber-800' : 'text-stone-800'
                      }`}
                    >
                      {r.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setIsSwitcherOpen(false);
                setIsAddModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 border-t border-stone-100 text-amber-700 hover:bg-amber-50 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">Add restaurant</span>
            </button>
          </div>
        )}
      </div>

      {/* 3-tab bar — desktop/tablet only. On mobile the bottom bar drives tabs. */}
      <div className="hidden md:grid grid-cols-3 gap-1.5">
        {[
          { id: 'orders', label: 'Orders', icon: Layers },
          { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id as any)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-bold transition ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'orders' && <LiveOrdersBoard restaurant={currentRestaurant} />}

      {activeTab === 'menu' && <MenuManager restaurant={currentRestaurant} />}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Drop Spots */}
          <div className="rounded-2xl bg-white p-4 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                Drop Spots{' '}
                <span className="text-stone-400 font-normal">
                  ({currentRestaurant.supportedDropSpotIds.length}/
                  {dropSpots.length})
                </span>
              </h3>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    updateRestaurant({
                      ...currentRestaurant,
                      supportedDropSpotIds: dropSpots.map((s) => s.id),
                    })
                  }
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold transition border border-amber-200"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateRestaurant({
                      ...currentRestaurant,
                      supportedDropSpotIds: [],
                    })
                  }
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg font-medium transition"
                >
                  None
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {dropSpots.map((spot) => {
                const isSupported =
                  currentRestaurant.supportedDropSpotIds.includes(spot.id);
                return (
                  <button
                    key={spot.id}
                    onClick={() => {
                      const newIds = isSupported
                        ? currentRestaurant.supportedDropSpotIds.filter(
                            (id) => id !== spot.id
                          )
                        : [
                            ...currentRestaurant.supportedDropSpotIds,
                            spot.id,
                          ];
                      updateRestaurant({
                        ...currentRestaurant,
                        supportedDropSpotIds: newIds,
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                      isSupported
                        ? 'border-emerald-300 bg-emerald-50/60'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                    }`}
                  >
                    <div className="min-w-0">
                      <div
                        className={`font-bold text-xs truncate ${
                          isSupported ? 'text-emerald-950' : 'text-stone-700'
                        }`}
                      >
                        {spot.name}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">
                        {spot.shortCode}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-black shrink-0 ${
                        isSupported
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isSupported ? 'ON' : 'OFF'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal Windows */}
          <div className="rounded-2xl bg-white p-4 border border-stone-200 space-y-3">
            <h3 className="text-sm font-bold text-stone-900">Meal Windows</h3>

            <div className="space-y-2">
              {currentRestaurant.mealWindows.map((win) => (
                <div
                  key={win.id}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-stone-900 truncate">
                      {win.label}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] shrink-0">
                    <div className="text-right">
                      <div className="text-stone-400 text-[9px] uppercase font-bold">
                        Cut-off
                      </div>
                      <strong className="text-stone-900">
                        {formatTime12h(win.orderCutoffTime)}
                      </strong>
                    </div>
                    <div className="text-right">
                      <div className="text-stone-400 text-[9px] uppercase font-bold">
                        Drop
                      </div>
                      <strong className="text-stone-900">
                        {formatTime12h(win.dropOffTime)}
                      </strong>
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
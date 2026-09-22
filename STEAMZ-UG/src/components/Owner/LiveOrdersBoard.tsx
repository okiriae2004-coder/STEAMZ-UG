import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Restaurant, Order, OrderStatus } from '../../types';
import {
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  ChefHat,
  Truck,
  Layers,
  KeyRound,
  Filter,
  Check,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { getWindowLabel } from '../../utils/timeUtils';

interface LiveOrdersBoardProps {
  restaurant: Restaurant;
}

export const LiveOrdersBoard: React.FC<LiveOrdersBoardProps> = ({ restaurant }) => {
  const { orders, dropSpots, updateOrderStatus, batchUpdateOrdersStatus } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('active');

  const restOrders = orders.filter((o) => o.restaurantId === restaurant.id);

  const filteredOrders = restOrders.filter((ord) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') {
      return ord.status !== 'collected' && ord.status !== 'cancelled';
    }
    return ord.status === filterStatus;
  });

  // Group orders by Meal Window and Drop Spot
  interface BatchGroup {
    key: string;
    mealWindow: string;
    dropSpotId: string;
    dropSpotName: string;
    batchDropTime: string;
    orders: Order[];
  }

  const batchGroupsMap: Record<string, BatchGroup> = {};

  filteredOrders.forEach((ord) => {
    const key = `${ord.mealWindowType}_${ord.dropSpotId}`;
    if (!batchGroupsMap[key]) {
      batchGroupsMap[key] = {
        key,
        mealWindow: ord.mealWindowType,
        dropSpotId: ord.dropSpotId,
        dropSpotName: ord.dropSpotName,
        batchDropTime: ord.batchDropTime,
        orders: [],
      };
    }
    batchGroupsMap[key].orders.push(ord);
  });

  const batchGroups = Object.values(batchGroupsMap);

  return (
    <div className="space-y-6">
      {/* Header info & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200">
        <div>
          <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-amber-500" />
            <span>Spot-Drop Kitchen & Batch Dispatch Board</span>
          </h3>
          <p className="text-xs text-stone-500">
            Orders grouped by designated pickup spot and scheduled delivery window
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'active', label: 'Active Batches' },
            { id: 'preparing', label: 'In Kitchen' },
            { id: 'in_transit', label: 'On Route' },
            { id: 'at_spot', label: 'At Spot Lockers' },
            { id: 'all', label: 'All Orders' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batches View */}
      {batchGroups.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Package className="h-8 w-8" />
          </div>
          <h4 className="text-base font-bold text-stone-900">No batch orders in this view</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            New orders placed by customers before the meal window cut-off will automatically appear here grouped by spot.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {batchGroups.map((batch) => {
            const spot = dropSpots.find((s) => s.id === batch.dropSpotId);
            const orderIds = batch.orders.map((o) => o.id);

            // Determine batch progress state
            const allPreparing = batch.orders.every((o) => o.status === 'preparing');
            const allInTransit = batch.orders.every((o) => o.status === 'in_transit');
            const allAtSpot = batch.orders.every((o) => o.status === 'at_spot');

            return (
              <div
                key={batch.key}
                className="rounded-3xl border border-stone-200 bg-white shadow-xs overflow-hidden"
              >
                {/* Batch Header */}
                <div className="bg-stone-900 text-white p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                      {spot?.shortCode || 'SPOT'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          {getWindowLabel(batch.mealWindow as any)} Window
                        </span>
                        <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                          Target Drop: {batch.batchDropTime}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-0.5">{batch.dropSpotName}</h4>
                    </div>
                  </div>

                  {/* Batch Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() =>
                        batchUpdateOrdersStatus(
                          orderIds,
                          'preparing',
                          'Kitchen confirmed batch. Chef packing thermal containers.'
                        )
                      }
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                        allPreparing
                          ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                          : 'bg-white/10 hover:bg-white/20 text-stone-200'
                      }`}
                    >
                      <ChefHat className="h-3.5 w-3.5" />
                      <span>Start Cooking All</span>
                    </button>

                    <button
                      onClick={() =>
                        batchUpdateOrdersStatus(
                          orderIds,
                          'in_transit',
                          `Batch en route to ${batch.dropSpotName}. ETA on time.`
                        )
                      }
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                        allInTransit
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                          : 'bg-white/10 hover:bg-white/20 text-stone-200'
                      }`}
                    >
                      <Truck className="h-3.5 w-3.5" />
                      <span>Dispatch Batch</span>
                    </button>

                    <button
                      onClick={() =>
                        batchUpdateOrdersStatus(
                          orderIds,
                          'at_spot',
                          `Loaded into designated locker at ${batch.dropSpotName}. Customers notified.`
                        )
                      }
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                        allAtSpot
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                          : 'bg-white/10 hover:bg-white/20 text-stone-200'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Drop at Locker</span>
                    </button>
                  </div>
                </div>

                {/* Orders inside this Batch */}
                <div className="p-4 sm:p-6 divide-y divide-stone-100">
                  {batch.orders.map((order) => {
                    const statusColors: Record<OrderStatus, string> = {
                      placed: 'bg-stone-100 text-stone-700',
                      confirmed: 'bg-blue-100 text-blue-800',
                      preparing: 'bg-amber-100 text-amber-800',
                      in_transit: 'bg-purple-100 text-purple-800',
                      at_spot: 'bg-emerald-100 text-emerald-800',
                      collected: 'bg-stone-200 text-stone-600',
                      cancelled: 'bg-red-100 text-red-800',
                    };

                    return (
                      <div
                        key={order.id}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider font-mono text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                              {order.orderNumber}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                                statusColors[order.status]
                              }`}
                            >
                              {order.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-semibold text-stone-800">
                              {order.customerName}
                            </span>
                            <span className="text-xs text-stone-400">({order.customerPhone})</span>
                          </div>

                          {/* Items summary */}
                          <div className="text-xs text-stone-700 font-medium">
                            {order.items.map((it) => (
                              <span key={it.cartItemId} className="mr-3 inline-block">
                                <strong className="text-amber-600">{it.quantity}x</strong>{' '}
                                {it.menuItem.name}
                                {Object.keys(it.selectedOptions).length > 0 && (
                                  <span className="text-stone-400 text-[11px]">
                                    {' '}
                                    ({Object.values(it.selectedOptions)
                                      .map((val) => (Array.isArray(val) ? val.join(', ') : val))
                                      .join(', ')})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>

                          {order.pickupInstructions && (
                            <p className="text-[11px] text-stone-500 italic">
                              Special Note: "{order.pickupInstructions}"
                            </p>
                          )}
                        </div>

                        {/* Locker info & Individual Status dropdown */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-stone-400">
                              Locker Assigned
                            </div>
                            <div className="text-xs font-mono font-bold text-stone-800">
                              {order.dropSpotLockerCode}
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono">
                              PIN: {order.pickupPin}
                            </div>
                          </div>

                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateOrderStatus(order.id, e.target.value as OrderStatus)
                            }
                            className="text-xs font-bold border border-stone-300 rounded-xl px-2.5 py-1.5 bg-white text-stone-800 focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="placed">Order Placed</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Cooking</option>
                            <option value="in_transit">In Transit</option>
                            <option value="at_spot">At Spot</option>
                            <option value="collected">Collected</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

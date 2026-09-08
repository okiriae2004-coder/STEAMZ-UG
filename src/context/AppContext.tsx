import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  University,
  Restaurant,
  MenuItem,
  DropSpot,
  Order,
  Feedback,
  CartItem,
  UserRole,
  OrderStatus,
  MealWindowType,
  RoleAssignment,
  SUPER_ADMIN_EMAIL,
} from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  UNIVERSITIES,
  INITIAL_RESTAURANTS,
  INITIAL_MENU_ITEMS,
  INITIAL_DROP_SPOTS,
  INITIAL_ORDERS,
  INITIAL_FEEDBACKS,
} from '../data/mockData';
import { DEFAULT_BATCH_FEE_UGX } from '../utils/currency';

interface AppContextType {
  universities: University[];
  selectedUniversityId: string;
  setSelectedUniversityId: (id: string) => void;
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  dropSpots: DropSpot[];
  admins: string[];
  roleAssignments: RoleAssignment[];
  superAdminEmail: string;
  isSuperAdmin: (email?: string | null) => boolean;
  hasAdminPrivilege: (email?: string | null) => boolean;
  hasOwnerPrivilege: (email?: string | null) => boolean;
  grantPrivilege: (
    targetEmail: string,
    role: 'admin' | 'owner',
    restaurantId?: string,
    restaurantName?: string
  ) => Promise<{ success: boolean; message: string }>;
  revokePrivilege: (targetEmail: string) => Promise<{ success: boolean; message: string }>;
  orders: Order[];
  feedbacks: Feedback[];
  cart: CartItem[];
  selectedDropSpotId: string | null;
  simulatedTime: string; // "HH:mm"
  isRealTime: boolean;
  userRole: UserRole;
  selectedOwnerRestaurantId: string;
  activeTrackingOrderId: string | null;

  // Actions
  setUserRole: (role: UserRole) => void;
  setSelectedDropSpotId: (id: string | null) => void;
  setSelectedOwnerRestaurantId: (id: string) => void;
  setSimulatedTime: (time: string) => void;
  setIsRealTime: (real: boolean) => void;
  setActiveTrackingOrderId: (id: string | null) => void;

  // Cart
  addToCart: (
    item: MenuItem,
    quantity: number,
    options: Record<string, string | string[]>,
    specialInstructions?: string
  ) => void;
  updateCartItemQty: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartRestaurantId: string | null;

  // Orders
  placeOrder: (details: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerWhatsapp?: string;
    universityId?: string;
    dropSpotId: string;
    mealWindowType: MealWindowType;
    specialInstructions?: string;
    userId?: string;
  }) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  batchUpdateOrdersStatus: (orderIds: string[], status: OrderStatus, note?: string) => void;

  // Feedback & Dish Rating
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'> & { userId?: string }) => void;
  rateMenuItem: (menuItemId: string, stars: number) => void;

  // Low data mode for slow internet
  lowDataMode: boolean;
  setLowDataMode: (enabled: boolean) => void;

  // Management (Admins, Spots, Restaurants, Menu)
  addAdmin: (email: string) => void;
  updateDropSpot: (updated: DropSpot) => void;
  updateDropSpotImage: (spotId: string, image: string) => void;
  addRestaurant: (newRest: Omit<Restaurant, 'id' | 'rating' | 'ratingCount'>) => Restaurant;
  updateRestaurant: (updated: Restaurant) => void;
  updateRestaurantCover: (restaurantId: string, bannerImage: string, logoImage?: string) => void;
  addMenuItem: (newItem: Omit<MenuItem, 'id'>) => MenuItem;
  updateMenuItem: (updated: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'steamz_v4_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    const loaded = loadFromStorage('restaurants', INITIAL_RESTAURANTS);
    // Clear out any old mock restaurants
    return (loaded || []).filter(
      (r: Restaurant) => !['rest-1', 'rest-2', 'rest-3', 'rest-4', 'rest-5'].includes(r.id)
    );
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const loaded = loadFromStorage('menu_items', INITIAL_MENU_ITEMS);
    // Clear out any old mock menu items
    return (loaded || []).filter(
      (m: MenuItem) => !['rest-1', 'rest-2', 'rest-3', 'rest-4', 'rest-5'].includes(m.restaurantId)
    );
  });
  const [universities] = useState<University[]>(UNIVERSITIES);
  const [selectedUniversityId, setSelectedUniversityIdState] = useState<string>(() =>
    loadFromStorage('selected_university', 'kiu-western')
  );

  const [dropSpots, setDropSpots] = useState<DropSpot[]>(() => {
    const loaded = loadFromStorage<DropSpot[]>('drop_spots', INITIAL_DROP_SPOTS);
    // If loaded has old spots (like 'spot-1'), replace with new KIU Western Campus spots
    if (!loaded || loaded.length === 0 || loaded.some((s) => s.id === 'spot-1')) {
      return INITIAL_DROP_SPOTS;
    }
    return loaded;
  });

  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>(() => {
    const loaded = loadFromStorage<RoleAssignment[]>('role_assignments', [
      {
        email: SUPER_ADMIN_EMAIL,
        role: 'admin',
        assignedAt: '2026-01-01T00:00:00.000Z',
        assignedBy: 'system',
      },
    ]);
    if (!loaded || !loaded.some((r) => r.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())) {
      return [
        {
          email: SUPER_ADMIN_EMAIL,
          role: 'admin',
          assignedAt: new Date().toISOString(),
          assignedBy: 'system',
        },
        ...(loaded || []).filter((r) => r.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()),
      ];
    }
    return loaded;
  });

  // Keep admins list derived from roleAssignments (always includes okiriae2004@gmail.com)
  const admins = [
    SUPER_ADMIN_EMAIL,
    ...roleAssignments
      .filter((r) => r.role === 'admin' && r.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase())
      .map((r) => r.email.toLowerCase()),
  ];

  const [orders, setOrders] = useState<Order[]>(() => {
    const loaded = loadFromStorage('orders', INITIAL_ORDERS);
    return (loaded || []).filter(
      (o: Order) => !['ord-101', 'ord-102', 'ord-103'].includes(o.id)
    );
  });
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() =>
    loadFromStorage('feedbacks', INITIAL_FEEDBACKS)
  );

  const [cart, setCart] = useState<CartItem[]>(() =>
    loadFromStorage('cart', [])
  );
  const [selectedDropSpotId, setSelectedDropSpotId] = useState<string | null>(() => {
    const saved = loadFromStorage<string>('selected_spot', 'spot-kiu-eng');
    if (saved === 'spot-1' || !saved) return 'spot-kiu-eng';
    return saved;
  });

  const setSelectedUniversityId = (uniId: string) => {
    setSelectedUniversityIdState(uniId);
    saveToStorage('selected_university', uniId);
    // Find first spot belonging to this university
    const firstSpot = dropSpots.find((s) => s.universityId === uniId);
    if (firstSpot) {
      setSelectedDropSpotId(firstSpot.id);
    }
  };

  // Default simulated time is 11:30 AM (Peak Lunch ordering before 12:00 midday cut-off!)
  const [simulatedTime, setSimulatedTime] = useState<string>('11:30');
  const [isRealTime, setIsRealTime] = useState<boolean>(false);
  const [userRole, setUserRoleState] = useState<UserRole>('customer');
  const [selectedOwnerRestaurantId, setSelectedOwnerRestaurantId] = useState<string>('');
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  const [lowDataMode, setLowDataMode] = useState<boolean>(() =>
    loadFromStorage('low_data_mode', false)
  );

  // Sync permissions from Firestore /system/permissions on boot
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const snap = await getDoc(doc(db, 'system', 'permissions'));
        if (snap.exists()) {
          const data = snap.data();
          if (data?.roleAssignments && Array.isArray(data.roleAssignments)) {
            setRoleAssignments((prev) => {
              const merged = [...data.roleAssignments];
              if (!merged.some((r: RoleAssignment) => r.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())) {
                merged.unshift({
                  email: SUPER_ADMIN_EMAIL,
                  role: 'admin',
                  assignedAt: new Date().toISOString(),
                  assignedBy: 'system',
                });
              }
              saveToStorage('role_assignments', merged);
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('Could not load remote permissions from Firestore:', err);
      }
    };
    fetchPermissions();
  }, []);

  const isSuperAdmin = useCallback((email?: string | null): boolean => {
    if (!email) return false;
    return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  }, []);

  const hasAdminPrivilege = useCallback(
    (email?: string | null): boolean => {
      if (!email) return false;
      const lower = email.trim().toLowerCase();
      if (lower === SUPER_ADMIN_EMAIL.toLowerCase()) return true;
      return roleAssignments.some((r) => r.role === 'admin' && r.email.toLowerCase() === lower);
    },
    [roleAssignments]
  );

  const hasOwnerPrivilege = useCallback(
    (email?: string | null): boolean => {
      if (!email) return false;
      const lower = email.trim().toLowerCase();
      if (lower === SUPER_ADMIN_EMAIL.toLowerCase()) return true; // Super admin has master privileges
      return roleAssignments.some((r) => r.role === 'owner' && r.email.toLowerCase() === lower);
    },
    [roleAssignments]
  );

  // Secure setUserRole: Prevents arbitrary promotion by non-authorized users
  const setUserRole = useCallback(
    (role: UserRole) => {
      const currentEmail = auth.currentUser?.email?.trim().toLowerCase();
      if (role === 'admin') {
        if (!hasAdminPrivilege(currentEmail)) {
          console.warn(`Unauthorized attempt to activate admin role by ${currentEmail || 'guest'}`);
          setUserRoleState('customer');
          return;
        }
      } else if (role === 'owner') {
        if (!hasOwnerPrivilege(currentEmail)) {
          console.warn(`Unauthorized attempt to activate owner role by ${currentEmail || 'guest'}`);
          setUserRoleState('customer');
          return;
        }
      }
      setUserRoleState(role);
    },
    [hasAdminPrivilege, hasOwnerPrivilege]
  );

  // Re-check role when auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const email = user?.email?.toLowerCase();
      if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
        setUserRoleState('admin');
      } else if (email && hasAdminPrivilege(email)) {
        // authorized admin
      } else if (email && hasOwnerPrivilege(email)) {
        // authorized owner
      } else {
        // Demote if trying to view admin/owner without authorization
        setUserRoleState((prev) => (prev === 'admin' || prev === 'owner' ? 'customer' : prev));
      }
    });
    return () => unsub();
  }, [hasAdminPrivilege, hasOwnerPrivilege]);

  // Privilege Granting: ONLY okiriae2004@gmail.com is authorized to call this
  const grantPrivilege = async (
    targetEmail: string,
    role: 'admin' | 'owner',
    restaurantId?: string,
    restaurantName?: string
  ): Promise<{ success: boolean; message: string }> => {
    const currentEmail = auth.currentUser?.email?.trim().toLowerCase();
    if (currentEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return {
        success: false,
        message: `Access Denied: Only ${SUPER_ADMIN_EMAIL} has the authority to grant Admin or Restaurant Owner tags.`,
      };
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const newAssignment: RoleAssignment = {
      email: cleanEmail,
      role,
      restaurantId,
      restaurantName,
      assignedAt: new Date().toISOString(),
      assignedBy: SUPER_ADMIN_EMAIL,
    };

    const updatedAssignments = [
      ...roleAssignments.filter((r) => r.email.toLowerCase() !== cleanEmail),
      newAssignment,
    ];

    setRoleAssignments(updatedAssignments);
    saveToStorage('role_assignments', updatedAssignments);

    try {
      await setDoc(doc(db, 'system', 'permissions'), {
        roleAssignments: updatedAssignments,
        admins: [
          SUPER_ADMIN_EMAIL,
          ...updatedAssignments.filter((r) => r.role === 'admin').map((r) => r.email),
        ],
        restaurantOwners: updatedAssignments.filter((r) => r.role === 'owner').map((r) => r.email),
        updatedAt: new Date().toISOString(),
        updatedBy: SUPER_ADMIN_EMAIL,
      }, { merge: true });
    } catch (err) {
      console.warn('Could not sync permissions to Firestore:', err);
    }

    return {
      success: true,
      message: `Successfully granted ${role === 'admin' ? 'Administrator' : 'Restaurant Owner'} tag to ${cleanEmail}.`,
    };
  };

  // Privilege Revocation: ONLY okiriae2004@gmail.com is authorized to call this
  const revokePrivilege = async (targetEmail: string): Promise<{ success: boolean; message: string }> => {
    const currentEmail = auth.currentUser?.email?.trim().toLowerCase();
    if (currentEmail !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      return {
        success: false,
        message: `Access Denied: Only ${SUPER_ADMIN_EMAIL} has the authority to revoke tags.`,
      };
    }

    const cleanEmail = targetEmail.trim().toLowerCase();
    if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, message: 'The Super-Administrator account cannot be revoked.' };
    }

    const updatedAssignments = roleAssignments.filter((r) => r.email.toLowerCase() !== cleanEmail);
    setRoleAssignments(updatedAssignments);
    saveToStorage('role_assignments', updatedAssignments);

    try {
      await setDoc(doc(db, 'system', 'permissions'), {
        roleAssignments: updatedAssignments,
        admins: [
          SUPER_ADMIN_EMAIL,
          ...updatedAssignments.filter((r) => r.role === 'admin').map((r) => r.email),
        ],
        restaurantOwners: updatedAssignments.filter((r) => r.role === 'owner').map((r) => r.email),
        updatedAt: new Date().toISOString(),
        updatedBy: SUPER_ADMIN_EMAIL,
      }, { merge: true });
    } catch (err) {
      console.warn('Could not sync revoked permission to Firestore:', err);
    }

    return {
      success: true,
      message: `Successfully revoked privileges for ${cleanEmail}. Account reverted to Customer.`,
    };
  };

  // Sync selectedOwnerRestaurantId with available restaurants
  useEffect(() => {
    if (restaurants.length > 0 && (!selectedOwnerRestaurantId || !restaurants.some(r => r.id === selectedOwnerRestaurantId))) {
      setSelectedOwnerRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedOwnerRestaurantId]);

  // Save changes
  useEffect(() => saveToStorage('restaurants', restaurants), [restaurants]);
  useEffect(() => saveToStorage('menu_items', menuItems), [menuItems]);
  useEffect(() => saveToStorage('drop_spots', dropSpots), [dropSpots]);
  useEffect(() => saveToStorage('admins', admins), [admins]);
  useEffect(() => saveToStorage('orders', orders), [orders]);
  useEffect(() => saveToStorage('feedbacks', feedbacks), [feedbacks]);
  useEffect(() => saveToStorage('cart', cart), [cart]);
  useEffect(() => saveToStorage('selected_spot', selectedDropSpotId), [selectedDropSpotId]);
  useEffect(() => saveToStorage('low_data_mode', lowDataMode), [lowDataMode]);

  // Real-time clock updater if real time is enabled
  useEffect(() => {
    if (!isRealTime) return;

    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setSimulatedTime(`${h}:${m}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, [isRealTime]);

  // Cart operations
  const cartRestaurantId = cart.length > 0 ? cart[0].menuItem.restaurantId : null;

  const addToCart = (
    item: MenuItem,
    quantity: number,
    options: Record<string, string | string[]>,
    specialInstructions?: string
  ) => {
    // Check if adding from different restaurant; if so, prompt or reset
    setCart((prev) => {
      const isDifferentRestaurant = prev.length > 0 && prev[0].menuItem.restaurantId !== item.restaurantId;
      const baseCart = isDifferentRestaurant ? [] : [...prev];

      // calculate unit price including options (single or multi choice)
      let addedOptionCost = 0;
      if (item.options) {
        item.options.forEach((opt) => {
          const selected = options[opt.name];
          if (Array.isArray(selected)) {
            selected.forEach((selName) => {
              const choice = opt.choices.find((c) => c.name === selName);
              if (choice) addedOptionCost += choice.price;
            });
          } else if (typeof selected === 'string') {
            const choice = opt.choices.find((c) => c.name === selected);
            if (choice) addedOptionCost += choice.price;
          }
        });
      }

      const unitPrice = item.price + addedOptionCost;
      const optionsKey = JSON.stringify(options);

      const existingIndex = baseCart.findIndex(
        (ci) =>
          ci.menuItem.id === item.id &&
          JSON.stringify(ci.selectedOptions) === optionsKey &&
          ci.specialInstructions === specialInstructions
      );

      if (existingIndex > -1) {
        const updated = [...baseCart];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: newQty * unitPrice,
        };
        return updated;
      }

      const newItem: CartItem = {
        cartItemId: 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        menuItem: item,
        quantity,
        selectedOptions: options,
        specialInstructions,
        unitPrice,
        totalPrice: unitPrice * quantity,
      };

      return [...baseCart, newItem];
    });
  };

  const updateCartItemQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Place Order
  const placeOrder = (details: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerWhatsapp?: string;
    universityId?: string;
    dropSpotId: string;
    mealWindowType: MealWindowType;
    specialInstructions?: string;
    userId?: string;
  }): Order | null => {
    if (cart.length === 0) return null;

    const rest = restaurants.find((r) => r.id === cartRestaurantId);
    const spot = dropSpots.find((s) => s.id === details.dropSpotId);
    if (!rest || !spot) return null;

    const subtotal = cartTotal;
    const serviceFee = DEFAULT_BATCH_FEE_UGX; // Flat UGX 1,500 batch drop fee
    const totalAmount = subtotal + serviceFee;

    // Generate random 4-digit pickup pin and locker code
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const lockerNum = Math.floor(1 + Math.random() * spot.capacity);
    const lockerCode = `POD-${spot.shortCode} #${lockerNum < 10 ? '0' + lockerNum : lockerNum}`;

    const windowConfig = rest.mealWindows.find((w) => w.type === details.mealWindowType);
    const dropTime = windowConfig ? windowConfig.dropOffTime : '12:45';

    const [dh, dm] = dropTime.split(':').map(Number);
    const ampm = dh >= 12 ? 'PM' : 'AM';
    const dh12 = dh % 12 || 12;
    const formattedDropTime = `${dh12}:${dm < 10 ? '0' + dm : dm} ${ampm}`;

    const orderNum = 'STM-' + Math.floor(1000 + Math.random() * 9000);

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: orderNum,
      userId: details.userId,
      customerName: details.customerName,
      customerEmail: details.customerEmail,
      customerPhone: details.customerPhone,
      customerWhatsapp: details.customerWhatsapp || details.customerPhone,
      universityId: details.universityId || selectedUniversityId,
      restaurantId: rest.id,
      restaurantName: rest.name,
      restaurantLogo: rest.logoImage,
      items: [...cart],
      subtotal,
      serviceFee,
      totalAmount,
      dropSpotId: spot.id,
      dropSpotName: spot.name,
      dropSpotLockerCode: lockerCode,
      pickupPin: pin,
      mealWindowType: details.mealWindowType,
      batchDropTime: formattedDropTime,
      status: 'placed',
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'placed',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: `Order submitted within ${details.mealWindowType} window. Delivery batch scheduled for ${formattedDropTime}.`,
        },
      ],
      pickupInstructions: `${spot.instructions} Locker ${lockerCode}, enter PIN ${pin}.`,
      feedbackGiven: false,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setActiveTrackingOrderId(newOrder.id);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const defaultNotes: Record<OrderStatus, string> = {
          placed: 'Order placed by customer',
          confirmed: 'Order confirmed by restaurant batch schedule',
          preparing: 'Ready-cooked meals packed in thermal containers',
          in_transit: 'Batch courier is en route to drop spot',
          at_spot: `Batch safely loaded into locker at ${order.dropSpotName}. Ready for pickup!`,
          collected: 'Customer entered PIN and picked up order',
          cancelled: 'Order cancelled',
        };

        const newEvent = {
          status,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: note || defaultNotes[status],
        };

        return {
          ...order,
          status,
          statusHistory: [...order.statusHistory, newEvent],
        };
      })
    );
  };

  const batchUpdateOrdersStatus = (orderIds: string[], status: OrderStatus, note?: string) => {
    orderIds.forEach((id) => updateOrderStatus(id, status, note));
  };

  const addFeedback = (feedbackData: Omit<Feedback, 'id' | 'createdAt'>) => {
    const newFeedback: Feedback = {
      ...feedbackData,
      id: 'fb-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    setFeedbacks((prev) => [newFeedback, ...prev]);

    // Mark order as feedbackGiven
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === feedbackData.orderId ? { ...ord, feedbackGiven: true } : ord
      )
    );

    // Save to Firestore if signed in
    if (auth.currentUser) {
      setDoc(doc(db, 'feedback', newFeedback.id), {
        ...newFeedback,
        userId: auth.currentUser.uid,
      }).catch((err) => {
        console.warn('Could not sync feedback to Firestore:', err);
      });
    }

    // Update restaurant rating
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id !== feedbackData.restaurantId) return r;
        const newCount = r.ratingCount + 1;
        const newRating = Number(
          ((r.rating * r.ratingCount + feedbackData.overallRating) / newCount).toFixed(2)
        );
        return {
          ...r,
          rating: newRating,
          ratingCount: newCount,
        };
      })
    );
  };

  const rateMenuItem = (menuItemId: string, stars: number) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id !== menuItemId) return item;
        const currentCount = item.ratingCount || 0;
        const currentRating = item.rating || 5.0;
        const newCount = currentCount + 1;
        const newRating = Number(((currentRating * currentCount + stars) / newCount).toFixed(1));
        return {
          ...item,
          rating: newRating,
          ratingCount: newCount,
        };
      })
    );
  };

  const addAdmin = (email: string) => {
    grantPrivilege(email, 'admin');
  };

  const updateDropSpot = (updated: DropSpot) => {
    setDropSpots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const updateDropSpotImage = (spotId: string, image: string) => {
    setDropSpots((prev) =>
      prev.map((s) => (s.id === spotId ? { ...s, image } : s))
    );
  };

  const updateRestaurantCover = (restaurantId: string, bannerImage: string, logoImage?: string) => {
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id !== restaurantId) return r;
        return {
          ...r,
          bannerImage,
          ...(logoImage ? { logoImage } : {}),
        };
      })
    );
  };

  const addRestaurant = (newRestData: Omit<Restaurant, 'id' | 'rating' | 'ratingCount'>): Restaurant => {
    const id = 'rest-' + Date.now();
    const createdRest: Restaurant = {
      ...newRestData,
      id,
      rating: 5.0,
      ratingCount: 1,
    };
    setRestaurants((prev) => [createdRest, ...prev]);
    setSelectedOwnerRestaurantId(id);
    return createdRest;
  };

  const updateRestaurant = (updated: Restaurant) => {
    setRestaurants((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const addMenuItem = (newItemData: Omit<MenuItem, 'id'>): MenuItem => {
    const id = 'menu-' + Date.now();
    const item: MenuItem = {
      ...newItemData,
      id,
    };
    setMenuItems((prev) => [...prev, item]);
    return item;
  };

  const updateMenuItem = (updated: MenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const deleteMenuItem = (itemId: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const resetToDefaults = () => {
    localStorage.clear();
    setRestaurants(INITIAL_RESTAURANTS);
    setMenuItems(INITIAL_MENU_ITEMS);
    setOrders(INITIAL_ORDERS);
    setFeedbacks(INITIAL_FEEDBACKS);
    setCart([]);
    setSelectedDropSpotId('spot-1');
    setSimulatedTime('11:30');
    setIsRealTime(false);
  };

  return (
    <AppContext.Provider
      value={{
        universities,
        selectedUniversityId,
        setSelectedUniversityId,
        restaurants,
        menuItems,
        dropSpots,
        admins,
        roleAssignments,
        superAdminEmail: SUPER_ADMIN_EMAIL,
        isSuperAdmin,
        hasAdminPrivilege,
        hasOwnerPrivilege,
        grantPrivilege,
        revokePrivilege,
        orders,
        feedbacks,
        cart,
        selectedDropSpotId,
        simulatedTime,
        isRealTime,
        userRole,
        selectedOwnerRestaurantId,
        activeTrackingOrderId,
        lowDataMode,
        setLowDataMode,

        setUserRole,
        setSelectedDropSpotId,
        setSelectedOwnerRestaurantId,
        setSimulatedTime,
        setIsRealTime,
        setActiveTrackingOrderId,

        addToCart,
        updateCartItemQty,
        removeFromCart,
        clearCart,
        cartTotal,
        cartRestaurantId,

        placeOrder,
        updateOrderStatus,
        batchUpdateOrdersStatus,

        addFeedback,
        rateMenuItem,

        addAdmin,
        updateDropSpot,
        updateDropSpotImage,
        addRestaurant,
        updateRestaurant,
        updateRestaurantCover,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

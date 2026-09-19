import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
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
import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
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
import { getUgandaTimeString } from '../utils/timeUtils';

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
  revokePrivilege: (
    targetEmail: string
  ) => Promise<{ success: boolean; message: string }>;
  orders: Order[];
  feedbacks: Feedback[];
  cart: CartItem[];
  selectedDropSpotId: string | null;
  simulatedTime: string;
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
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    note?: string
  ) => void;
  batchUpdateOrdersStatus: (
    orderIds: string[],
    status: OrderStatus,
    note?: string
  ) => void;

  // Feedback & Dish Rating
  addFeedback: (
    feedback: Omit<Feedback, 'id' | 'createdAt'> & { userId?: string }
  ) => void;
  rateMenuItem: (menuItemId: string, stars: number) => void;

  // Low data mode
  lowDataMode: boolean;
  setLowDataMode: (enabled: boolean) => void;

  // Management
  addAdmin: (email: string) => void;
  updateDropSpot: (updated: DropSpot) => void;
  updateDropSpotImage: (spotId: string, image: string) => void;
  addRestaurant: (
    newRest: Omit<Restaurant, 'id' | 'rating' | 'ratingCount'>
  ) => Restaurant;
  updateRestaurant: (updated: Restaurant) => void;
  updateRestaurantCover: (
    restaurantId: string,
    bannerImage: string,
    logoImage?: string
  ) => void;
  addMenuItem: (newItem: Omit<MenuItem, 'id'>) => MenuItem;
  updateMenuItem: (updated: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'steamz_v4_';

// Helper to determine current active user ID
function getActiveUserId(): string | null {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }

  try {
    const savedSession = localStorage.getItem('steamz_local_session');

    if (savedSession) {
      const parsed = JSON.parse(savedSession);

      if (parsed?.uid) {
        return parsed.uid;
      }
    }
  } catch (e) {}

  return null;
}

function loadFromStorage<T>(
  key: string,
  fallback: T,
  scopedUserId?: string | null
): T {
  try {
    const fullKey = scopedUserId
      ? `${LOCAL_STORAGE_KEY_PREFIX}user_${scopedUserId}_${key}`
      : `${LOCAL_STORAGE_KEY_PREFIX}${key}`;

    const saved = localStorage.getItem(fullKey);

    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
  }

  return fallback;
}

function saveToStorage<T>(
  key: string,
  value: T,
  scopedUserId?: string | null
) {
  try {
    const fullKey = scopedUserId
      ? `${LOCAL_STORAGE_KEY_PREFIX}user_${scopedUserId}_${key}`
      : `${LOCAL_STORAGE_KEY_PREFIX}${key}`;

    localStorage.setItem(fullKey, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

// Helper to remove undefined properties before saving to Firestore
const cleanForFirestore = <T extends Record<string, any>>(obj: T): T => {
  const cleaned: Record<string, any> = {};

  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (
        val !== null &&
        typeof val === 'object' &&
        !Array.isArray(val)
      ) {
        cleaned[key] = cleanForFirestore(val);
      } else {
        cleaned[key] = val;
      }
    }
  }

  return cleaned as T;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => {
    const loaded = loadFromStorage<Restaurant[]>('restaurants', []);

    const valid = (loaded || []).filter(
      (r: Restaurant) =>
        !['rest-1', 'rest-2', 'rest-3', 'rest-4', 'rest-5'].includes(r.id)
    );

    return valid;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const loaded = loadFromStorage<MenuItem[]>('menu_items', []);

    const valid = (loaded || []).filter(
      (m: MenuItem) =>
        !['rest-1', 'rest-2', 'rest-3', 'rest-4', 'rest-5'].includes(
          m.restaurantId
        )
    );

    return valid;
  });

  const [universities] = useState<University[]>(UNIVERSITIES);

  const [selectedUniversityId, setSelectedUniversityIdState] =
    useState<string>(() =>
      loadFromStorage('selected_university', 'kiu-western')
    );

  const [dropSpots, setDropSpots] = useState<DropSpot[]>(() => {
    const loaded = loadFromStorage<DropSpot[]>(
      'drop_spots',
      INITIAL_DROP_SPOTS
    );

    if (
      !loaded ||
      loaded.length === 0 ||
      loaded.some((s) => s.id === 'spot-1')
    ) {
      return INITIAL_DROP_SPOTS;
    }

    return loaded;
  });

  const [roleAssignments, setRoleAssignments] = useState<
    RoleAssignment[]
  >(() => {
    const loaded = loadFromStorage<RoleAssignment[]>(
      'role_assignments',
      [
        {
          email: SUPER_ADMIN_EMAIL,
          role: 'admin',
          assignedAt: '2026-01-01T00:00:00.000Z',
          assignedBy: 'system',
        },
      ]
    );

    if (
      !loaded ||
      !loaded.some(
        (r) =>
          r.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
      )
    ) {
      return [
        {
          email: SUPER_ADMIN_EMAIL,
          role: 'admin',
          assignedAt: new Date().toISOString(),
          assignedBy: 'system',
        },
        ...(loaded || []).filter(
          (r) =>
            r.email.toLowerCase() !==
            SUPER_ADMIN_EMAIL.toLowerCase()
        ),
      ];
    }

    return loaded;
  });

  const admins = [
    SUPER_ADMIN_EMAIL,
    ...roleAssignments
      .filter(
        (r) =>
          r.role === 'admin' &&
          r.email.toLowerCase() !==
            SUPER_ADMIN_EMAIL.toLowerCase()
      )
      .map((r) => r.email.toLowerCase()),
  ];

  const [activeUserId, setActiveUserId] = useState<string | null>(
    () => getActiveUserId()
  );

  const [orders, setOrders] = useState<Order[]>(() => {
    const currentUid = getActiveUserId();

    const loadedGlobal = loadFromStorage<Order[]>('orders', []);

    const loadedUser = currentUid
      ? loadFromStorage<Order[]>('orders', [], currentUid)
      : [];

    const combined = [...loadedGlobal, ...loadedUser];

    const seen = new Set<string>();
    const valid: Order[] = [];

    for (const o of combined) {
      if (
        o &&
        o.id &&
        !seen.has(o.id) &&
        !['ord-101', 'ord-102', 'ord-103'].includes(o.id)
      ) {
        seen.add(o.id);
        valid.push(o);
      }
    }

    return valid;
  });

  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() =>
    loadFromStorage('feedbacks', INITIAL_FEEDBACKS)
  );

  const [cart, setCart] = useState<CartItem[]>(() => {
    const currentUid = getActiveUserId();

    return loadFromStorage('cart', [], currentUid);
  });

  const [selectedDropSpotId, setSelectedDropSpotId] = useState<
    string | null
  >(() => {
    const saved = loadFromStorage<string>(
      'selected_spot',
      'spot-kiu-eng'
    );

    if (saved === 'spot-1' || !saved) {
      return 'spot-kiu-eng';
    }

    return saved;
  });

  const setSelectedUniversityId = (uniId: string) => {
    setSelectedUniversityIdState(uniId);

    saveToStorage('selected_university', uniId);

    const firstSpot = dropSpots.find(
      (s) => s.universityId === uniId
    );

    if (firstSpot) {
      setSelectedDropSpotId(firstSpot.id);
    }
  };

  /*
   * IMPORTANT:
   * STEAMZ now uses real Uganda time by default.
   *
   * The simulator still exists because it is useful for testing
   * meal windows, but normal customers are no longer placed at
   * a fake 11:30 AM.
   */
  const [simulatedTime, setSimulatedTime] = useState<string>(() =>
    getUgandaTimeString()
  );

  const [isRealTime, setIsRealTime] = useState<boolean>(true);

  const [userRole, setUserRoleState] =
    useState<UserRole>('customer');

  const [
    selectedOwnerRestaurantId,
    setSelectedOwnerRestaurantId,
  ] = useState<string>('');

  const [
    activeTrackingOrderId,
    setActiveTrackingOrderId,
  ] = useState<string | null>(null);

  const [lowDataMode, setLowDataMode] = useState<boolean>(() =>
    loadFromStorage('low_data_mode', false)
  );

  // Helper to get active user email
  const getActiveUserEmail = useCallback((): string | null => {
    if (auth.currentUser?.email) {
      return auth.currentUser.email.trim().toLowerCase();
    }

    try {
      const savedSession = localStorage.getItem(
        'steamz_local_session'
      );

      if (savedSession) {
        const parsed = JSON.parse(savedSession);

        if (parsed?.email) {
          return parsed.email.trim().toLowerCase();
        }
      }
    } catch (e) {}

    return null;
  }, []);

  // Sync permissions from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'system', 'permissions'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();

            if (
              data?.roleAssignments &&
              Array.isArray(data.roleAssignments)
            ) {
              setRoleAssignments((prev) => {
                const merged = [...data.roleAssignments];

                if (
                  !merged.some(
                    (r: RoleAssignment) =>
                      r.email.toLowerCase() ===
                      SUPER_ADMIN_EMAIL.toLowerCase()
                  )
                ) {
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

              const activeEmail = getActiveUserEmail();

              if (activeEmail) {
                const isOwner =
                  data.roleAssignments.some(
                    (r: RoleAssignment) =>
                      r.role === 'owner' &&
                      r.email.toLowerCase() ===
                        activeEmail.toLowerCase()
                  );

                if (isOwner) {
                  setUserRoleState((prev) =>
                    prev === 'customer' ? 'owner' : prev
                  );
                }
              }
            }
          }
        },
        (err) => {
          console.warn(
            'Could not listen to remote permissions from Firestore:',
            err
          );
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn(
        'Error setting up permissions onSnapshot:',
        err
      );
    }
  }, [getActiveUserEmail]);

  // Sync restaurants from Firestore
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'restaurants'),
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreRestaurants: Restaurant[] = [];

            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Restaurant;

              if (data && data.name) {
                firestoreRestaurants.push({
                  ...data,
                  id: docSnap.id,
                });
              }
            });

            if (firestoreRestaurants.length > 0) {
              setRestaurants(() => {
                const cleaned = firestoreRestaurants.filter(
                  (r) =>
                    ![
                      'rest-1',
                      'rest-2',
                      'rest-3',
                      'rest-4',
                      'rest-5',
                    ].includes(r.id)
                );

                saveToStorage('restaurants', cleaned);

                return cleaned;
              });
            }
          } else {
            setRestaurants([]);
            saveToStorage('restaurants', []);
          }
        },
        (error) => {
          console.warn(
            'Could not listen to Firestore restaurants collection:',
            error
          );
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn(
        'Failed setting up restaurants onSnapshot:',
        e
      );
    }
  }, []);

  // Sync menu items from Firestore
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'menuItems'),
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreItems: MenuItem[] = [];

            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as MenuItem;

              if (data && data.name) {
                firestoreItems.push({
                  ...data,
                  id: docSnap.id,
                });
              }
            });

            if (firestoreItems.length > 0) {
              setMenuItems(() => {
                const cleaned = firestoreItems.filter(
                  (m) =>
                    ![
                      'rest-1',
                      'rest-2',
                      'rest-3',
                      'rest-4',
                      'rest-5',
                    ].includes(m.restaurantId)
                );

                saveToStorage('menu_items', cleaned);

                return cleaned;
              });
            }
          } else {
            setMenuItems([]);
            saveToStorage('menu_items', []);
          }
        },
        (error) => {
          console.warn(
            'Could not listen to Firestore menuItems collection:',
            error
          );
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn(
        'Failed setting up menuItems onSnapshot:',
        e
      );
    }
  }, []);

  // Sync drop spots from Firestore
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'dropSpots'),
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreSpots: DropSpot[] = [];

            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as DropSpot;

              if (data && data.name) {
                firestoreSpots.push({
                  ...data,
                  id: docSnap.id,
                });
              }
            });

            if (firestoreSpots.length > 0) {
              setDropSpots((prev) => {
                const map = new Map<string, DropSpot>();

                (
                  prev.length > 0
                    ? prev
                    : INITIAL_DROP_SPOTS
                ).forEach((s) => map.set(s.id, s));

                firestoreSpots.forEach((s) => {
                  const existing = map.get(s.id);

                  map.set(s.id, {
                    ...(existing || {}),
                    ...s,
                  });
                });

                const merged = Array.from(map.values());

                saveToStorage('drop_spots', merged);

                return merged;
              });
            }
          }
        },
        (error) => {
          console.warn(
            'Could not listen to Firestore dropSpots collection:',
            error
          );
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn(
        'Failed setting up dropSpots onSnapshot:',
        e
      );
    }
  }, []);

  // Sync orders from Cloud Firestore
  useEffect(() => {
    try {
      // Upload local orders that are not yet in Firestore
      try {
        const localFoundOrders: Order[] = [];
        const seenIds = new Set<string>();

        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);

          if (
            k &&
            (
              k.includes('orders') ||
              k.includes('steamz_v4_orders') ||
              k.includes('_orders')
            )
          ) {
            try {
              const raw = localStorage.getItem(k);

              if (raw) {
                const parsed = JSON.parse(raw);

                if (Array.isArray(parsed)) {
                  parsed.forEach((item) => {
                    if (
                      item &&
                      item.id &&
                      typeof item.id === 'string' &&
                      item.id.startsWith('ord-') &&
                      ![
                        'ord-101',
                        'ord-102',
                        'ord-103',
                      ].includes(item.id) &&
                      item.orderNumber &&
                      !seenIds.has(item.id)
                    ) {
                      seenIds.add(item.id);
                      localFoundOrders.push(item);
                    }
                  });
                }
              }
            } catch (e) {}
          }
        }

        if (localFoundOrders.length > 0) {
          localFoundOrders.forEach((localOrder) => {
            setDoc(
              doc(db, 'orders', localOrder.id),
              localOrder,
              { merge: true }
            ).catch((err) => {
              console.warn(
                '[STEAMZ Orders] Could not sync local order to Firestore:',
                err
              );
            });
          });
        }
      } catch (e) {}

      const unsubscribe = onSnapshot(
        collection(db, 'orders'),
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreOrders: Order[] = [];

            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Order;

              if (
                data &&
                data.id &&
                ![
                  'ord-101',
                  'ord-102',
                  'ord-103',
                ].includes(data.id)
              ) {
                firestoreOrders.push(data);
              }
            });

            firestoreOrders.sort((a, b) => {
              const tA = new Date(
                a.createdAt || 0
              ).getTime();

              const tB = new Date(
                b.createdAt || 0
              ).getTime();

              return tB - tA;
            });

            setOrders(firestoreOrders);
            saveToStorage('orders', firestoreOrders);
          } else {
            setOrders((prev) =>
              prev.filter(
                (o) =>
                  ![
                    'ord-101',
                    'ord-102',
                    'ord-103',
                  ].includes(o.id)
              )
            );
          }
        },
        (error) => {
          console.warn(
            'Could not listen to Firestore orders collection:',
            error
          );
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn(
        'Failed setting up orders onSnapshot:',
        e
      );
    }
  }, []);

  const isSuperAdmin = useCallback(
    (email?: string | null): boolean => {
      if (!email) return false;

      return (
        email.trim().toLowerCase() ===
        SUPER_ADMIN_EMAIL.toLowerCase()
      );
    },
    []
  );

  const hasAdminPrivilege = useCallback(
    (email?: string | null): boolean => {
      if (!email) return false;

      const lower = email.trim().toLowerCase();

      if (
        lower === SUPER_ADMIN_EMAIL.toLowerCase()
      ) {
        return true;
      }

      return roleAssignments.some(
        (r) =>
          r.role === 'admin' &&
          r.email.toLowerCase() === lower
      );
    },
    [roleAssignments]
  );

  const hasOwnerPrivilege = useCallback(
    (email?: string | null): boolean => {
      if (!email) return false;

      const lower = email.trim().toLowerCase();

      if (
        lower === SUPER_ADMIN_EMAIL.toLowerCase()
      ) {
        return true;
      }

      return roleAssignments.some(
        (r) =>
          r.role === 'owner' &&
          r.email.toLowerCase() === lower
      );
    },
    [roleAssignments]
  );

  const setUserRole = useCallback(
    (role: UserRole) => {
      const currentEmail = getActiveUserEmail();

      if (role === 'admin') {
        if (!hasAdminPrivilege(currentEmail)) {
          console.warn(
            `Unauthorized attempt to activate admin role by ${
              currentEmail || 'guest'
            }`
          );

          setUserRoleState('customer');
          return;
        }
      } else if (role === 'owner') {
        if (!hasOwnerPrivilege(currentEmail)) {
          console.warn(
            `Unauthorized attempt to activate owner role by ${
              currentEmail || 'guest'
            }`
          );

          setUserRoleState('customer');
          return;
        }
      }

      setUserRoleState(role);
    },
    [
      getActiveUserEmail,
      hasAdminPrivilege,
      hasOwnerPrivilege,
    ]
  );

  // Track active user ID changes
  useEffect(() => {
    const handleUserSwitch = (
      newUid: string | null
    ) => {
      setActiveUserId((prevUid) => {
        if (prevUid !== newUid) {
          const newCart = newUid
            ? loadFromStorage('cart', [], newUid)
            : [];

          setCart(newCart);

          return newUid;
        }

        return prevUid;
      });
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      const currentUid =
        user?.uid || getActiveUserId();

      handleUserSwitch(currentUid);

      const email =
        user?.email?.toLowerCase() ||
        getActiveUserEmail();

      if (
        email ===
        SUPER_ADMIN_EMAIL.toLowerCase()
      ) {
        setUserRoleState('admin');
      } else if (
        email &&
        hasAdminPrivilege(email)
      ) {
        setUserRoleState('admin');
      } else if (
        email &&
        hasOwnerPrivilege(email)
      ) {
        setUserRoleState('owner');
      } else {
        setUserRoleState((prev) =>
          prev === 'admin' ||
          prev === 'owner'
            ? 'customer'
            : prev
        );
      }
    });

    const localUid = getActiveUserId();
    handleUserSwitch(localUid);

    const localEmail = getActiveUserEmail();

    if (
      localEmail ===
      SUPER_ADMIN_EMAIL.toLowerCase()
    ) {
      setUserRoleState('admin');
    } else if (
      localEmail &&
      hasAdminPrivilege(localEmail)
    ) {
      setUserRoleState('admin');
    } else if (
      localEmail &&
      hasOwnerPrivilege(localEmail)
    ) {
      setUserRoleState('owner');
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'steamz_local_session') {
        const nextUid = getActiveUserId();
        handleUserSwitch(nextUid);
      }
    };

    window.addEventListener(
      'storage',
      onStorage
    );

    return () => {
      unsub();
      window.removeEventListener(
        'storage',
        onStorage
      );
    };
  }, [
    getActiveUserEmail,
    hasAdminPrivilege,
    hasOwnerPrivilege,
  ]);

  // Grant privilege
  const grantPrivilege = async (
    targetEmail: string,
    role: 'admin' | 'owner',
    restaurantId?: string,
    restaurantName?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const currentEmail =
      getActiveUserEmail();

    if (
      currentEmail !==
      SUPER_ADMIN_EMAIL.toLowerCase()
    ) {
      return {
        success: false,
        message: `Access Denied: Only ${SUPER_ADMIN_EMAIL} has the authority to grant Admin or Restaurant Owner tags.`,
      };
    }

    const cleanEmail =
      targetEmail.trim().toLowerCase();

    if (
      !cleanEmail ||
      !cleanEmail.includes('@')
    ) {
      return {
        success: false,
        message:
          'Please enter a valid email address.',
      };
    }

    const newAssignment: RoleAssignment = {
      email: cleanEmail,
      role,
      restaurantId,
      restaurantName,
      assignedAt:
        new Date().toISOString(),
      assignedBy: SUPER_ADMIN_EMAIL,
    };

    const updatedAssignments = [
      ...roleAssignments.filter(
        (r) =>
          r.email.toLowerCase() !==
          cleanEmail
      ),
      newAssignment,
    ];

    setRoleAssignments(
      updatedAssignments
    );

    saveToStorage(
      'role_assignments',
      updatedAssignments
    );

    try {
      await setDoc(
        doc(
          db,
          'system',
          'permissions'
        ),
        {
          roleAssignments:
            updatedAssignments,
          admins: [
            SUPER_ADMIN_EMAIL,
            ...updatedAssignments
              .filter(
                (r) =>
                  r.role === 'admin'
              )
              .map(
                (r) => r.email
              ),
          ],
          restaurantOwners:
            updatedAssignments
              .filter(
                (r) =>
                  r.role === 'owner'
              )
              .map(
                (r) => r.email
              ),
          updatedAt:
            new Date().toISOString(),
          updatedBy:
            SUPER_ADMIN_EMAIL,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn(
        'Could not sync permissions to Firestore:',
        err
      );
    }

    return {
      success: true,
      message: `Successfully granted ${
        role === 'admin'
          ? 'Administrator'
          : 'Restaurant Owner'
      } tag to ${cleanEmail}.`,
    };
  };

  // Revoke privilege
  const revokePrivilege = async (
    targetEmail: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const currentEmail =
      auth.currentUser?.email
        ?.trim()
        .toLowerCase();

    if (
      currentEmail !==
      SUPER_ADMIN_EMAIL.toLowerCase()
    ) {
      return {
        success: false,
        message: `Access Denied: Only ${SUPER_ADMIN_EMAIL} has the authority to revoke tags.`,
      };
    }

    const cleanEmail =
      targetEmail.trim().toLowerCase();

    if (
      cleanEmail ===
      SUPER_ADMIN_EMAIL.toLowerCase()
    ) {
      return {
        success: false,
        message:
          'The Super-Administrator account cannot be revoked.',
      };
    }

    const updatedAssignments =
      roleAssignments.filter(
        (r) =>
          r.email.toLowerCase() !==
          cleanEmail
      );

    setRoleAssignments(
      updatedAssignments
    );

    saveToStorage(
      'role_assignments',
      updatedAssignments
    );

    try {
      await setDoc(
        doc(
          db,
          'system',
          'permissions'
        ),
        {
          roleAssignments:
            updatedAssignments,
          admins: [
            SUPER_ADMIN_EMAIL,
            ...updatedAssignments
              .filter(
                (r) =>
                  r.role === 'admin'
              )
              .map(
                (r) => r.email
              ),
          ],
          restaurantOwners:
            updatedAssignments
              .filter(
                (r) =>
                  r.role === 'owner'
              )
              .map(
                (r) => r.email
              ),
          updatedAt:
            new Date().toISOString(),
          updatedBy:
            SUPER_ADMIN_EMAIL,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn(
        'Could not sync revoked permission to Firestore:',
        err
      );
    }

    return {
      success: true,
      message: `Successfully revoked privileges for ${cleanEmail}. Account reverted to Customer.`,
    };
  };

  // Sync selected owner restaurant
  useEffect(() => {
    if (
      restaurants.length > 0 &&
      (
        !selectedOwnerRestaurantId ||
        !restaurants.some(
          (r) =>
            r.id ===
            selectedOwnerRestaurantId
        )
      )
    ) {
      setSelectedOwnerRestaurantId(
        restaurants[0].id
      );
    }
  }, [
    restaurants,
    selectedOwnerRestaurantId,
  ]);

  // Save changes
  useEffect(
    () =>
      saveToStorage(
        'restaurants',
        restaurants
      ),
    [restaurants]
  );

  useEffect(
    () =>
      saveToStorage(
        'menu_items',
        menuItems
      ),
    [menuItems]
  );

  useEffect(
    () =>
      saveToStorage(
        'drop_spots',
        dropSpots
      ),
    [dropSpots]
  );

  useEffect(
    () =>
      saveToStorage(
        'admins',
        admins
      ),
    [admins]
  );

  useEffect(() => {
    saveToStorage(
      'orders',
      orders
    );

    if (activeUserId) {
      saveToStorage(
        'orders',
        orders,
        activeUserId
      );
    }
  }, [orders, activeUserId]);

  useEffect(
    () =>
      saveToStorage(
        'feedbacks',
        feedbacks
      ),
    [feedbacks]
  );

  useEffect(
    () =>
      saveToStorage(
        'cart',
        cart,
        activeUserId
      ),
    [cart, activeUserId]
  );

  useEffect(
    () =>
      saveToStorage(
        'selected_spot',
        selectedDropSpotId
      ),
    [selectedDropSpotId]
  );

  useEffect(
    () =>
      saveToStorage(
        'low_data_mode',
        lowDataMode
      ),
    [lowDataMode]
  );

  /*
   * REAL-TIME UGANDA CLOCK
   *
   * This is the main fix.
   *
   * We explicitly request Africa/Kampala so the app does not
   * depend on the browser/device/server timezone.
   */
  useEffect(() => {
    if (!isRealTime) return;

    const updateClock = () => {
      setSimulatedTime(
        getUgandaTimeString()
      );
    };

    updateClock();

    const interval = window.setInterval(
      updateClock,
      30000
    );

    return () =>
      window.clearInterval(
        interval
      );
  }, [isRealTime]);

  // Cart operations
  const cartRestaurantId =
    cart.length > 0
      ? cart[0].menuItem.restaurantId
      : null;

  const addToCart = (
    item: MenuItem,
    quantity: number,
    options: Record<
      string,
      string | string[]
    >,
    specialInstructions?: string
  ) => {
    setCart((prev) => {
      const isDifferentRestaurant =
        prev.length > 0 &&
        prev[0].menuItem.restaurantId !==
          item.restaurantId;

      const baseCart =
        isDifferentRestaurant
          ? []
          : [...prev];

      let addedOptionCost = 0;

      if (item.options) {
        item.options.forEach(
          (opt) => {
            const selected =
              options[opt.name];

            if (
              Array.isArray(selected)
            ) {
              selected.forEach(
                (selName) => {
                  const choice =
                    opt.choices.find(
                      (c) =>
                        c.name ===
                        selName
                    );

                  if (choice) {
                    addedOptionCost +=
                      choice.price;
                  }
                }
              );
            } else if (
              typeof selected ===
              'string'
            ) {
              const choice =
                opt.choices.find(
                  (c) =>
                    c.name ===
                    selected
                );

              if (choice) {
                addedOptionCost +=
                  choice.price;
              }
            }
          }
        );
      }

      const unitPrice =
        item.price +
        addedOptionCost;

      const optionsKey =
        JSON.stringify(
          options
        );

      const existingIndex =
        baseCart.findIndex(
          (ci) =>
            ci.menuItem.id ===
              item.id &&
            JSON.stringify(
              ci.selectedOptions
            ) === optionsKey &&
            ci.specialInstructions ===
              specialInstructions
        );

      if (existingIndex > -1) {
        const updated = [
          ...baseCart,
        ];

        const newQty =
          updated[existingIndex]
            .quantity + quantity;

        updated[
          existingIndex
        ] = {
          ...updated[
            existingIndex
          ],
          quantity:
            newQty,
          totalPrice:
            newQty *
            unitPrice,
        };

        return updated;
      }

      const newItem: CartItem = {
        cartItemId:
          'c-' +
          Date.now() +
          '-' +
          Math.random()
            .toString(36)
            .substr(2, 4),
        menuItem: item,
        quantity,
        selectedOptions:
          options,
        specialInstructions,
        unitPrice,
        totalPrice:
          unitPrice *
          quantity,
      };

      return [
        ...baseCart,
        newItem,
      ];
    });
  };

  const updateCartItemQty = (
    cartItemId: string,
    delta: number
  ) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (
            item.cartItemId ===
            cartItemId
          ) {
            const newQty =
              item.quantity +
              delta;

            if (newQty <= 0) {
              return null;
            }

            return {
              ...item,
              quantity:
                newQty,
              totalPrice:
                item.unitPrice *
                newQty,
            };
          }

          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (
    cartItemId: string
  ) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          item.cartItemId !==
          cartItemId
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum + item.totalPrice,
    0
  );

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
    if (cart.length === 0) {
      return null;
    }

    const rest = restaurants.find(
      (r) =>
        r.id === cartRestaurantId
    );

    const spot = dropSpots.find(
      (s) =>
        s.id ===
        details.dropSpotId
    );

    if (!rest || !spot) {
      return null;
    }

    const subtotal = cartTotal;

    const serviceFee =
      DEFAULT_BATCH_FEE_UGX;

    const totalAmount =
      subtotal +
      serviceFee;

    const pin = Math.floor(
      1000 +
        Math.random() *
          9000
    ).toString();

    const lockerNum =
      Math.floor(
        1 +
          Math.random() *
            spot.capacity
      );

    const lockerCode =
      `POD-${spot.shortCode} #${
        lockerNum < 10
          ? '0' + lockerNum
          : lockerNum
      }`;

    const windowConfig =
      rest.mealWindows.find(
        (w) =>
          w.type ===
          details.mealWindowType
      );

    const dropTime =
      windowConfig
        ? windowConfig.dropOffTime
        : '12:45';

    const [
      dh,
      dm,
    ] = dropTime
      .split(':')
      .map(Number);

    const ampm =
      dh >= 12
        ? 'PM'
        : 'AM';

    const dh12 =
      dh % 12 || 12;

    const formattedDropTime =
      `${dh12}:${dm < 10 ? '0' + dm : dm} ${ampm}`;

    const orderNum =
      'STM-' +
      Math.floor(
        1000 +
          Math.random() *
            9000
      );

    /*
     * createdAt remains UTC for reliable database sorting.
     *
     * Human-facing timestamps use Uganda time.
     */
    const createdAt =
      new Date().toISOString();

    const ugandaTime =
      getUgandaTimeString();

    const newOrder: Order = {
      id:
        'ord-' +
        Date.now(),

      orderNumber:
        orderNum,

      userId:
        details.userId,

      customerName:
        details.customerName,

      customerEmail:
        details.customerEmail,

      customerPhone:
        details.customerPhone,

      customerWhatsapp:
        details.customerWhatsapp ||
        details.customerPhone,

      universityId:
        details.universityId ||
        selectedUniversityId,

      restaurantId:
        rest.id,

      restaurantName:
        rest.name,

      restaurantLogo:
        rest.logoImage,

      items:
        [...cart],

      subtotal,

      serviceFee,

      totalAmount,

      dropSpotId:
        spot.id,

      dropSpotName:
        spot.name,

      dropSpotLockerCode:
        lockerCode,

      pickupPin:
        pin,

      mealWindowType:
        details.mealWindowType,

      batchDropTime:
        formattedDropTime,

      status:
        'placed',

      createdAt,

      statusHistory: [
        {
          status:
            'placed',

          timestamp:
            ugandaTime,

          note:
            `Order submitted within ${details.mealWindowType} window. Delivery batch scheduled for ${formattedDropTime}.`,
        },
      ],

      pickupInstructions:
        `${spot.instructions} Locker ${lockerCode}, enter PIN ${pin}.`,

      feedbackGiven:
        false,
    };

    setOrders((prev) => [
      newOrder,
      ...prev.filter(
        (o) =>
          o.id !==
          newOrder.id
      ),
    ]);

    clearCart();

    setActiveTrackingOrderId(
      newOrder.id
    );

    setDoc(
      doc(
        db,
        'orders',
        newOrder.id
      ),
      newOrder
    ).catch((err) => {
      console.error(
        '[STEAMZ] Failed to persist order to Cloud Firestore:',
        err
      );
    });

    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    note?: string
  ) => {
    let updatedOrder:
      | Order
      | null = null;

    setOrders((prev) =>
      prev.map((order) => {
        if (
          order.id !==
          orderId
        ) {
          return order;
        }

        const defaultNotes: Record<
          OrderStatus,
          string
        > = {
          placed:
            'Order placed by customer',

          confirmed:
            'Order confirmed by restaurant batch schedule',

          preparing:
            'Ready-cooked meals packed in thermal containers',

          in_transit:
            'Batch courier is en route to drop spot',

          at_spot:
            `Batch safely loaded into locker at ${order.dropSpotName}. Ready for pickup!`,

          collected:
            'Customer entered PIN and picked up order',

          cancelled:
            'Order cancelled',
        };

        const newEvent = {
          status,

          timestamp:
            getUgandaTimeString(),

          note:
            note ||
            defaultNotes[
              status
            ],
        };

        const updated = {
          ...order,
          status,

          statusHistory: [
            ...order.statusHistory,
            newEvent,
          ],
        };

        updatedOrder =
          updated;

        return updated;
      })
    );

    if (updatedOrder) {
      setDoc(
        doc(
          db,
          'orders',
          orderId
        ),
        updatedOrder,
        { merge: true }
      ).catch((err) => {
        console.warn(
          '[STEAMZ] Could not sync updated order status to Firestore:',
          err
        );
      });
    }
  };

  const batchUpdateOrdersStatus = (
    orderIds: string[],
    status: OrderStatus,
    note?: string
  ) => {
    orderIds.forEach(
      (id) =>
        updateOrderStatus(
          id,
          status,
          note
        )
    );
  };

  const addFeedback = (
    feedbackData: Omit<
      Feedback,
      'id' | 'createdAt'
    >
  ) => {
    const newFeedback:
      Feedback = {
      ...feedbackData,
      id:
        'fb-' +
        Date.now(),
      createdAt:
        new Date().toISOString(),
    };

    setFeedbacks((prev) => [
      newFeedback,
      ...prev,
    ]);

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id ===
        feedbackData.orderId
          ? {
              ...ord,
              feedbackGiven:
                true,
            }
          : ord
      )
    );

    setDoc(
      doc(
        db,
        'feedback',
        newFeedback.id
      ),
      newFeedback
    ).catch(() => {});

    if (feedbackData.orderId) {
      setDoc(
        doc(
          db,
          'orders',
          feedbackData.orderId
        ),
        {
          feedbackGiven:
            true,
        },
        {
          merge: true,
        }
      ).catch(() => {});
    }

    setRestaurants((prev) =>
      prev.map((r) => {
        if (
          r.id !==
          feedbackData.restaurantId
        ) {
          return r;
        }

        const newCount =
          r.ratingCount +
          1;

        const newRating =
          Number(
            (
              (
                r.rating *
                  r.ratingCount +
                feedbackData.overallRating
              ) /
              newCount
            ).toFixed(2)
          );

        return {
          ...r,
          rating:
            newRating,
          ratingCount:
            newCount,
        };
      })
    );
  };

  const rateMenuItem = (
    menuItemId: string,
    stars: number
  ) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (
          item.id !==
          menuItemId
        ) {
          return item;
        }

        const currentCount =
          item.ratingCount ||
          0;

        const currentRating =
          item.rating ||
          5.0;

        const newCount =
          currentCount +
          1;

        const newRating =
          Number(
            (
              (
                currentRating *
                  currentCount +
                stars
              ) /
              newCount
            ).toFixed(1)
          );

        return {
          ...item,
          rating:
            newRating,
          ratingCount:
            newCount,
        };
      })
    );
  };

  const addAdmin = (
    email: string
  ) => {
    grantPrivilege(
      email,
      'admin'
    );
  };

  const updateDropSpot = (
    updated: DropSpot
  ) => {
    setDropSpots((prev) =>
      prev.map((s) =>
        s.id === updated.id
          ? updated
          : s
      )
    );

    try {
      setDoc(
        doc(
          db,
          'dropSpots',
          updated.id
        ),
        cleanForFirestore(
          updated
        ),
        { merge: true }
      ).catch((err) => {
        console.warn(
          'Could not sync dropSpot update to Firestore:',
          err
        );
      });
    } catch (e) {
      console.warn(
        'Failed to call setDoc for dropSpot:',
        e
      );
    }
  };

  const updateDropSpotImage = (
    spotId: string,
    image: string
  ) => {
    setDropSpots((prev) =>
      prev.map((s) =>
        s.id === spotId
          ? {
              ...s,
              image,
            }
          : s
      )
    );

    try {
      setDoc(
        doc(
          db,
          'dropSpots',
          spotId
        ),
        cleanForFirestore({
          image,
          updatedAt:
            new Date().toISOString(),
        }),
        { merge: true }
      ).catch((err) => {
        console.warn(
          'Could not sync dropSpot image to Firestore:',
          err
        );
      });
    } catch (e) {
      console.warn(
        'Failed to call setDoc for dropSpot image:',
        e
      );
    }
  };

  const updateRestaurantCover = (
    restaurantId: string,
    bannerImage: string,
    logoImage?: string
  ) => {
    setRestaurants((prev) =>
      prev.map((r) => {
        if (
          r.id !==
          restaurantId
        ) {
          return r;
        }

        const updated = {
          ...r,
          bannerImage,
          ...(logoImage
            ? { logoImage }
            : {}),
        };

        try {
          setDoc(
            doc(
              db,
              'restaurants',
              restaurantId
            ),
            updated,
            { merge: true }
          ).catch((err) => {
            console.warn(
              'Could not sync restaurant cover to Firestore:',
              err
            );
          });
        } catch (e) {}

        return updated;
      })
    );
  };

  const addRestaurant = (
    newRestData: Omit<
      Restaurant,
      'id' | 'rating' | 'ratingCount'
    >
  ): Restaurant => {
    const id =
      'rest-' +
      Date.now();

    const createdRest:
      Restaurant = {
      ...newRestData,
      id,
      rating: 5.0,
      ratingCount: 1,
    };

    setRestaurants((prev) => [
      createdRest,
      ...prev,
    ]);

    setSelectedOwnerRestaurantId(
      id
    );

    try {
      setDoc(
        doc(
          db,
          'restaurants',
          id
        ),
        createdRest
      ).catch((err) => {
        console.warn(
          'Could not save restaurant to Firestore:',
          err
        );
      });
    } catch (e) {
      console.warn(
        'Error initiating restaurant save to Firestore:',
        e
      );
    }

    return createdRest;
  };

  const updateRestaurant = (
    updated: Restaurant
  ) => {
    setRestaurants((prev) => {
      const next = prev.map(
        (r) =>
          r.id === updated.id
            ? updated
            : r
      );

      saveToStorage(
        'restaurants',
        next
      );

      return next;
    });

    try {
      const sanitized =
        cleanForFirestore(
          updated
        );

      setDoc(
        doc(
          db,
          'restaurants',
          updated.id
        ),
        sanitized,
        { merge: true }
      ).catch((err) => {
        console.warn(
          'Could not sync restaurant update to Firestore:',
          err
        );
      });
    } catch (e) {
      console.warn(
        'Error updating restaurant in Firestore:',
        e
      );
    }
  };

  const addMenuItem = (
    newItemData: Omit<
      MenuItem,
      'id'
    >
  ): MenuItem => {
    const id =
      'menu-' +
      Date.now();

    const item: MenuItem = {
      ...newItemData,
      id,
    };

    setMenuItems((prev) => {
      const next = [
        ...prev,
        item,
      ];

      saveToStorage(
        'menu_items',
        next
      );

      return next;
    });

    try {
      const sanitized =
        cleanForFirestore(
          item
        );

      setDoc(
        doc(
          db,
          'menuItems',
          id
        ),
        sanitized
      ).catch((err) => {
        console.warn(
          'Could not sync menu item to Firestore:',
          err
        );
      });
    } catch (e) {
      console.warn(
        'Error saving menu item to Firestore:',
        e
      );
    }

    return item;
  };

  const updateMenuItem = (
    updated: MenuItem
  ) => {
    setMenuItems((prev) => {
      const next = prev.map(
        (item) =>
          item.id === updated.id
            ? updated
            : item
      );

      saveToStorage(
        'menu_items',
        next
      );

      return next;
    });

    try {
      const sanitized =
        cleanForFirestore(
          updated
        );

      setDoc(
        doc(
          db,
          'menuItems',
          updated.id
        ),
        sanitized,
        { merge: true }
      ).catch((err) => {
        console.warn(
          'Could not sync updated menu item to Firestore:',
          err
        );
      });
    } catch (e) {
      console.warn(
        'Error updating menu item to Firestore:',
        e
      );
    }
  };

  const deleteMenuItem = (
    itemId: string
  ) => {
    setMenuItems((prev) => {
      const next =
        prev.filter(
          (item) =>
            item.id !==
            itemId
        );

      saveToStorage(
        'menu_items',
        next
      );

      return next;
    });

    try {
      deleteDoc(
        doc(
          db,
          'menuItems',
          itemId
        )
      ).catch((err) => {
        console.warn(
          'Could not delete menu item from Firestore:',
          err
        );
      });
    } catch (e) {
      console.warn(
        'Error deleting menu item from Firestore:',
        e
      );
    }
  };

  const resetToDefaults = () => {
    localStorage.clear();

    setRestaurants(
      INITIAL_RESTAURANTS
    );

    setMenuItems(
      INITIAL_MENU_ITEMS
    );

    setOrders(
      INITIAL_ORDERS
    );

    setFeedbacks(
      INITIAL_FEEDBACKS
    );

    setCart([]);

    /*
     * Use the current valid default drop spot.
     * The previous code used the obsolete spot-1.
     */
    setSelectedDropSpotId(
      'spot-kiu-eng'
    );

    /*
     * Reset the clock to the actual current
     * Uganda time rather than the old fake 11:30.
     */
    setSimulatedTime(
      getUgandaTimeString()
    );

    /*
     * Real-time mode should remain enabled
     * for normal STEAMZ operation.
     */
    setIsRealTime(true);
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

        superAdminEmail:
          SUPER_ADMIN_EMAIL,

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
  const context =
    useContext(AppContext);

  if (!context) {
    throw new Error(
      'useApp must be used within an AppProvider'
    );
  }

  return context;
};
export type MealWindowType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'latenight';

export interface University {
  id: string;
  name: string;
  shortName: string;
  campus: string;
  location: string;
  country: string;
  description: string;
  badge?: string;
  isPrimary?: boolean;
}

export interface MealWindowConfig {
  id: string;
  type: MealWindowType;
  label: string;
  orderStartTime: string; // "07:00"
  orderCutoffTime: string; // "12:00" (e.g. Lunch ordered before 12 midday)
  dropOffTime: string; // "12:45"
  description: string;
}

export interface DropSpot {
  id: string;
  universityId: string;
  name: string;
  shortCode: string;
  zone: string;
  isCampusCompound: boolean; // true for inside campus (e.g. Engineering block), false for outside campus (e.g. Lagos, Abuja)
  address: string;
  instructions: string;
  capacity: number;
  hasHeatedLocker: boolean;
  image: string;
  badge: string;
}

export interface MenuItemOptionChoice {
  id?: string;
  name: string;
  price: number;
  isDefault?: boolean;
  calories?: number;
}

export interface MenuItemOption {
  id?: string;
  name: string;
  required?: boolean;
  multiSelect?: boolean;
  maxSelect?: number;
  minSelect?: number;
  choices: MenuItemOptionChoice[];
}

export type DietaryType =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'halal'
  | 'kosher'
  | 'dairy-free'
  | 'nut-free'
  | 'spicy'
  | 'low-carb';

export interface NutritionalInfo {
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  mealWindows: MealWindowType[];
  image: string;
  calories?: number;
  nutritionalInfo?: NutritionalInfo;
  allergens?: string[];
  dietary: DietaryType[];
  isPopular?: boolean;
  isChefSpecial?: boolean;
  prepTimeMinutes?: number;
  portionSize?: string;
  options?: MenuItemOption[];
  rating?: number;
  ratingCount?: number;
}

export interface Restaurant {
  id: string;
  universityId?: string; // Attached university campus (e.g. 'kiu-western')
  name: string;
  tagline: string;
  description: string;
  cuisine: string[];
  bannerImage: string;
  logoImage: string;
  rating: number;
  ratingCount: number;
  supportedDropSpotIds: string[];
  mealWindows: MealWindowConfig[];
  prepTimeAvgMinutes: number;
  minOrderAmount: number;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string; // WhatsApp / phone contact for kitchen
  isOpen: boolean;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  quantity: number;
  selectedOptions: Record<string, string | string[]>;
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'in_transit'
  | 'at_spot'
  | 'collected'
  | 'cancelled';

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsapp?: string; // WhatsApp number for instant locker PIN & batch drop alerts
  universityId?: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogo?: string;
  items: CartItem[];
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
  dropSpotId: string;
  dropSpotName: string;
  dropSpotLockerCode: string;
  pickupPin: string;
  mealWindowType: MealWindowType;
  batchDropTime: string;
  status: OrderStatus;
  createdAt: string;
  statusHistory: OrderStatusEvent[];
  pickupInstructions: string;
  feedbackGiven?: boolean;
}

export interface Feedback {
  id: string;
  orderId: string;
  userId?: string;
  restaurantId: string;
  restaurantName: string;
  customerName: string;
  createdAt: string;
  overallRating: number;
  foodQualityRating: number;
  spotDeliveryRating: number;
  tags: string[];
  comment: string;
  dropSpotId: string;
  dropSpotName: string;
}

export type UserRole = 'customer' | 'owner' | 'admin' | 'spot_explorer';

export const SUPER_ADMIN_EMAIL = 'okiriae2004@gmail.com';

export interface RoleAssignment {
  email: string;
  role: 'admin' | 'owner';
  restaurantId?: string;
  restaurantName?: string;
  assignedAt: string;
  assignedBy: string; // must be 'okiriae2004@gmail.com'
}

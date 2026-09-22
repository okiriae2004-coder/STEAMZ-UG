// Helper for low-bandwidth and offline environments
// Allows the app to render quickly with zero network lag

export const FOOD_CATEGORY_ICONS: Record<string, { emoji: string; color: string; bg: string }> = {
  'Signature Bowls': { emoji: '🍲', color: 'text-amber-600', bg: 'bg-amber-100' },
  'Rice Bowls': { emoji: '🍚', color: 'text-amber-700', bg: 'bg-amber-50' },
  'Plant-Based': { emoji: '🥗', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  'Superfood Bowls': { emoji: '🥑', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  'Greens & Salads': { emoji: '🥬', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  'Dim Sum & Sides': { emoji: '🥟', color: 'text-orange-600', bg: 'bg-orange-100' },
  'Artisan Paninis': { emoji: '🥪', color: 'text-amber-600', bg: 'bg-amber-100' },
  'Wood-Fired Pockets': { emoji: '🍕', color: 'text-red-600', bg: 'bg-red-100' },
  'Sides & Breads': { emoji: '🥖', color: 'text-amber-700', bg: 'bg-amber-100' },
  'Handi Biryani Pots': { emoji: '🥘', color: 'text-amber-600', bg: 'bg-amber-100' },
  'Curry Bowls': { emoji: '🍛', color: 'text-orange-600', bg: 'bg-orange-100' },
  'Breakfast Bagels': { emoji: '🥯', color: 'text-amber-600', bg: 'bg-amber-100' },
  'Beverages': { emoji: '🥤', color: 'text-sky-600', bg: 'bg-sky-100' },
  'Desserts & Sweets': { emoji: '🍰', color: 'text-pink-600', bg: 'bg-pink-100' },
  'Mains': { emoji: '🍲', color: 'text-amber-700', bg: 'bg-amber-100' },
  'Snacks': { emoji: '🍿', color: 'text-amber-600', bg: 'bg-amber-100' },
  'Default': { emoji: '🍽️', color: 'text-stone-700', bg: 'bg-stone-100' },
};

export function getFoodCategoryIcon(category?: string) {
  if (!category) return FOOD_CATEGORY_ICONS.Default;
  return FOOD_CATEGORY_ICONS[category] || FOOD_CATEGORY_ICONS.Default;
}

export const QUICK_MENU_PRESETS = [
  {
    name: 'Smoky Jollof Rice with Grilled Chicken',
    category: 'Mains',
    price: 9.50,
    description: 'Fire-roasted parboiled rice in seasoned tomato-pepper reduction, fried sweet plantain, and tender spiced grilled chicken quarter.',
    calories: 720,
    dietary: ['halal'],
    mealWindows: ['lunch', 'dinner'] as const,
  },
  {
    name: 'Steamed Rice & Tender Stewed Beef',
    category: 'Mains',
    price: 8.50,
    description: 'Aromatic white long-grain rice topped with rich savory stewed beef chunks, carrots, and sweet bell peppers.',
    calories: 640,
    dietary: ['halal'],
    mealWindows: ['lunch', 'dinner'] as const,
  },
  {
    name: 'Crispy Fried Chicken & Potato Fries',
    category: 'Mains',
    price: 7.99,
    description: 'Golden buttermilk battered chicken drumsticks with seasoned rustic potato wedges and garlic herb dipping sauce.',
    calories: 780,
    dietary: ['halal'],
    mealWindows: ['lunch', 'dinner', 'snack'] as const,
  },
  {
    name: 'Loaded Signature Angus Cheese Burger',
    category: 'Mains',
    price: 8.90,
    description: 'Quarter-pound smash patty, melted cheddar, crisp lettuce, pickles, and house secret burger sauce on toasted brioche.',
    calories: 690,
    dietary: [],
    mealWindows: ['lunch', 'dinner'] as const,
  },
  {
    name: 'Farm Fresh Garden Salad Bowl',
    category: 'Greens & Salads',
    price: 6.50,
    description: 'Crisp romaine, cherry tomatoes, cucumbers, shredded carrots, toasted seeds, and tangy honey mustard vinaigrette.',
    calories: 320,
    dietary: ['vegetarian', 'gluten-free'],
    mealWindows: ['breakfast', 'lunch', 'dinner'] as const,
  },
  {
    name: 'Warm Fresh Milk Pastry & Coffee',
    category: 'Breakfast Bagels',
    price: 4.80,
    description: 'Flaky freshly baked golden butter croissant with fresh brewed hot coffee or iced brew.',
    calories: 380,
    dietary: ['vegetarian'],
    mealWindows: ['breakfast', 'snack'] as const,
  },
  {
    name: 'Chilled Citrus Hibiscus Splash (Zobo/Juice)',
    category: 'Beverages',
    price: 2.50,
    description: 'Refreshing cold-brewed hibiscus herbal infusion with ginger, cloves, and natural sweet orange zest.',
    calories: 90,
    dietary: ['vegan', 'gluten-free'],
    mealWindows: ['breakfast', 'lunch', 'snack', 'dinner'] as const,
  },
];

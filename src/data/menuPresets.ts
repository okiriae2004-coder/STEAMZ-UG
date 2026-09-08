import { DietaryType, MenuItemOption } from '../types';

export interface FoodPhotoPreset {
  name: string;
  category: string;
  url: string;
}

export const CURATED_FOOD_PHOTOS: FoodPhotoPreset[] = [
  // Bowls & Asian
  {
    name: 'Teriyaki Chicken Bowl',
    category: 'Bowls & Asian',
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Salmon Poke & Edamame',
    category: 'Bowls & Asian',
    url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Steaming Ramen Noodles',
    category: 'Bowls & Asian',
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Crispy Dumplings & Gyoza',
    category: 'Bowls & Asian',
    url: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&auto=format&fit=crop&q=80',
  },
  // Salads & Plant-Based
  {
    name: 'Warm Harvest Quinoa Bowl',
    category: 'Salads & Plant-Based',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Avocado Green Goddess Salad',
    category: 'Salads & Plant-Based',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Mediterranean Mezze Bowl',
    category: 'Salads & Plant-Based',
    url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop&q=80',
  },
  // Pizza, Pasta & Italian
  {
    name: 'Truffle Mushroom Rigatoni',
    category: 'Pasta & Italian',
    url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Artisan Neapolitan Pizza',
    category: 'Pasta & Italian',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Crispy Bruschetta & Antipasti',
    category: 'Pasta & Italian',
    url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&auto=format&fit=crop&q=80',
  },
  // Sandwiches & Burgers
  {
    name: 'Gourmet Brioche Smashburger',
    category: 'Burgers & Sandwiches',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Artisanal NY Bagel Sandwich',
    category: 'Burgers & Sandwiches',
    url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Spicy Crispy Chicken Sando',
    category: 'Burgers & Sandwiches',
    url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
  },
  // Curries & Indian
  {
    name: 'Aromatic Chicken Dum Biryani',
    category: 'Curries & Biryani',
    url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Creamy Butter Chicken & Naan',
    category: 'Curries & Biryani',
    url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
  },
  // Drinks & Bakery
  {
    name: 'Single-Origin Cold Brew & Latte',
    category: 'Beverages & Treats',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fresh Lychee Iced Jasmine Tea',
    category: 'Beverages & Treats',
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Warm Chocolate Lava Cake',
    category: 'Beverages & Treats',
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
  },
];

export const ALL_DIETARY_OPTIONS: { id: DietaryType; label: string; icon: string; description: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🌱', description: 'No meat, poultry, or seafood' },
  { id: 'vegan', label: 'Vegan', icon: '🌿', description: '100% plant-based, no animal products' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾', description: 'Made without gluten or wheat' },
  { id: 'halal', label: 'Halal Certified', icon: '☪️', description: 'Prepared according to Islamic dietary laws' },
  { id: 'kosher', label: 'Kosher Friendly', icon: '✡️', description: 'Adheres to Jewish dietary standards' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: '🥛', description: 'Zero lactose or milk byproducts' },
  { id: 'nut-free', label: 'Nut-Free', icon: '🥜', description: 'Safe for peanut & tree nut allergies' },
  { id: 'spicy', label: 'Spicy Kick', icon: '🌶️', description: 'Contains hot chili peppers or spicy heat' },
  { id: 'low-carb', label: 'Low Carb / Keto', icon: '🥑', description: 'Under 15g net carbs per portion' },
];

export const COMMON_ALLERGENS: string[] = [
  'Peanuts',
  'Tree Nuts',
  'Dairy & Milk',
  'Gluten & Wheat',
  'Eggs',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Mustard',
];

export const COMMON_CATEGORIES: string[] = [
  'Signature Bowls',
  'Plant-Powered',
  'Warm Entrees',
  'Handhelds & Sandwiches',
  'Artisan Pizza & Pasta',
  'Sides & Starters',
  'Beverages & Coffee',
  'Desserts & Treats',
];

export const MODIFIER_PRESET_TEMPLATES: {
  title: string;
  description: string;
  template: MenuItemOption;
}[] = [
  {
    title: 'Protein Selection',
    description: 'Choice of chicken, beef, fish, or beans',
    template: {
      name: 'Choose Your Protein',
      required: true,
      multiSelect: false,
      choices: [
        { name: 'Spiced Steamed Beans / Lentils', price: 0, isDefault: true },
        { name: 'Pan-Roasted Chicken Breast', price: 3000 },
        { name: 'Pan-Fried Tilapia / Fish', price: 5000 },
        { name: 'Charcoal Grilled Beef Ribs', price: 6000 },
      ],
    },
  },
  {
    title: 'Base & Grains',
    description: 'Steamed rice, matooke, pilau, or posho',
    template: {
      name: 'Grain & Base Selection',
      required: true,
      multiSelect: false,
      choices: [
        { name: 'Steamed White Rice', price: 0, isDefault: true },
        { name: 'Steamed Matooke (Plantain Mash)', price: 1000 },
        { name: 'Spiced Pilau Rice', price: 2000 },
        { name: 'Fresh Steamed Posho', price: 500 },
      ],
    },
  },
  {
    title: 'Spice Level',
    description: 'Mild, Medium, Spicy, or Extra Hot Chilli',
    template: {
      name: 'Spice Level',
      required: true,
      multiSelect: false,
      choices: [
        { name: 'Mild (No chilli)', price: 0, isDefault: true },
        { name: 'Medium Spice (Aromatic)', price: 0 },
        { name: 'Hot Bird-Eye Chilli (Spicy)', price: 500 },
        { name: 'Extra Fiery Pepper Relish', price: 1000 },
      ],
    },
  },
  {
    title: 'Extra Add-on Toppings',
    description: 'Avocado, egg, gonja plantain, kachumbari',
    template: {
      name: 'Add Extra Sides & Toppings',
      required: false,
      multiSelect: true,
      maxSelect: 4,
      choices: [
        { name: 'Fresh Avocado Slices', price: 2000 },
        { name: 'Fried Sweet Gonja (Plantains)', price: 2500 },
        { name: 'Crisp Kachumbari Salad', price: 1500 },
        { name: 'Boiled Farm Egg', price: 1000 },
        { name: 'Extra Groundnut (G-Nut) Sauce', price: 2000 },
      ],
    },
  },
  {
    title: 'Sauces & Dressings',
    description: 'G-Nut dip, chilli dip, or gravy cup',
    template: {
      name: 'Extra Sauce / Gravy',
      required: false,
      multiSelect: false,
      choices: [
        { name: 'Gravy on Food', price: 0, isDefault: true },
        { name: 'Gravy Packed on the Side', price: 0 },
        { name: 'Extra Rich G-Nut Sauce Cup', price: 1500 },
        { name: 'Homemade Pili-Pili Chilli Dip', price: 1000 },
      ],
    },
  },
  {
    title: 'Portion Size Upgrade',
    description: 'Standard vs Hungry Jumbo portion',
    template: {
      name: 'Portion Size Upgrade',
      required: true,
      multiSelect: false,
      choices: [
        { name: 'Standard Meal Portion', price: 0, isDefault: true },
        { name: 'Hungry Jumbo Portion (+40% more protein & base)', price: 5000 },
      ],
    },
  },
];

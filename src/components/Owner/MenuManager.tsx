import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Restaurant, MenuItem, MealWindowType, DietaryType, MenuItemOption } from '../../types';
import { DishModal } from '../Customer/DishModal';
import { ModifierGroupEditor } from './ModifierGroupEditor';
import {
  CURATED_FOOD_PHOTOS,
  ALL_DIETARY_OPTIONS,
  COMMON_ALLERGENS,
  COMMON_CATEGORIES,
} from '../../data/menuPresets';
import {
  Plus,
  Trash2,
  Edit3,
  X,
  Clock,
  Check,
  Leaf,
  Layers,
  Search,
  Sparkles,
  Eye,
  Copy,
  Image as ImageIcon,
  Flame,
  ShieldAlert,
  Info,
  DollarSign,
  Utensils,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { getWindowLabel } from '../../utils/timeUtils';
import { formatUGX } from '../../utils/currency';

interface MenuManagerProps {
  restaurant: Restaurant;
}

const ALL_MEAL_WINDOWS: MealWindowType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

type ModalTab = 'details' | 'media' | 'dietary' | 'modifiers';

export const MenuManager: React.FC<MenuManagerProps> = ({ restaurant }) => {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('details');

  // Customer Preview Modal state
  const [previewItem, setPreviewItem] = useState<MenuItem | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedWindowFilter, setSelectedWindowFilter] = useState<string>('all');

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('15000');
  const [category, setCategory] = useState('Signature Bowls');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [portionSize, setPortionSize] = useState('Regular Bowl (450g)');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('20');
  const [isPopular, setIsPopular] = useState(false);
  const [isChefSpecial, setIsChefSpecial] = useState(false);
  const [selectedWindows, setSelectedWindows] = useState<MealWindowType[]>(['lunch', 'dinner']);
  const [image, setImage] = useState(
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
  );
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>('all');
  const [dietary, setDietary] = useState<DietaryType[]>(['halal']);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [calories, setCalories] = useState('650');
  const [protein, setProtein] = useState('32');
  const [carbs, setCarbs] = useState('68');
  const [fat, setFat] = useState('18');
  const [options, setOptions] = useState<MenuItemOption[]>([]);

  // Filter items for this restaurant
  const restItems = menuItems.filter((i) => i.restaurantId === restaurant.id);

  // Available categories in restaurant's menu
  const availableCategories = Array.from(new Set(restItems.map((i) => i.category)));

  // Filtered items
  const filteredItems = restItems.filter((item) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;

    const matchesWindow =
      selectedWindowFilter === 'all' ||
      item.mealWindows.includes(selectedWindowFilter as MealWindowType);

    return matchesSearch && matchesCategory && matchesWindow;
  });

  // Calculate statistics
  const customizableCount = restItems.filter((i) => i.options && i.options.length > 0).length;
  const avgPrice =
    restItems.length > 0
      ? restItems.reduce((sum, it) => sum + it.price, 0) / restItems.length
      : 0;

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice('15000');
    setCategory('Signature Bowls');
    setCustomCategoryInput('');
    setPortionSize('Regular Bowl (450g)');
    setPrepTimeMinutes('10');
    setIsPopular(false);
    setIsChefSpecial(false);
    setSelectedWindows(['lunch', 'dinner']);
    setImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80');
    setDietary(['halal']);
    setAllergens([]);
    setCalories('650');
    setProtein('28');
    setCarbs('60');
    setFat('16');
    setOptions([]);
    setActiveModalTab('details');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.price.toString());
    setCategory(item.category);
    setCustomCategoryInput('');
    setPortionSize(item.portionSize || 'Regular Bowl (450g)');
    setPrepTimeMinutes(item.prepTimeMinutes ? item.prepTimeMinutes.toString() : '20');
    setIsPopular(Boolean(item.isPopular));
    setIsChefSpecial(Boolean(item.isChefSpecial));
    setSelectedWindows(item.mealWindows);
    setImage(item.image);
    setDietary(item.dietary || []);
    setAllergens(item.allergens || []);
    setCalories(item.calories ? item.calories.toString() : '');
    setProtein(item.nutritionalInfo?.proteinGrams ? item.nutritionalInfo.proteinGrams.toString() : '');
    setCarbs(item.nutritionalInfo?.carbsGrams ? item.nutritionalInfo.carbsGrams.toString() : '');
    setFat(item.nutritionalInfo?.fatGrams ? item.nutritionalInfo.fatGrams.toString() : '');
    setOptions(item.options ? JSON.parse(JSON.stringify(item.options)) : []);
    setActiveModalTab('details');
    setIsModalOpen(true);
  };

  const handleDuplicate = (item: MenuItem) => {
    const duplicated: Omit<MenuItem, 'id'> = {
      ...JSON.parse(JSON.stringify(item)),
      name: `${item.name} (Copy)`,
      restaurantId: restaurant.id,
    };
    addMenuItem(duplicated);
  };

  const toggleWindow = (win: MealWindowType) => {
    setSelectedWindows((prev) =>
      prev.includes(win) ? prev.filter((w) => w !== win) : [...prev, win]
    );
  };

  const toggleDietary = (tag: DietaryType) => {
    setDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleAllergen = (allergen: string) => {
    setAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a dish name.');
      return;
    }

    const finalCategory = customCategoryInput.trim() !== '' ? customCategoryInput.trim() : category;
    const parsedPrice = parseFloat(price) || 12.0;
    const parsedCal = calories ? parseInt(calories, 10) : undefined;
    const parsedPrep = prepTimeMinutes ? parseInt(prepTimeMinutes, 10) : undefined;

    const nutritionalInfo = {
      calories: parsedCal,
      proteinGrams: protein ? parseInt(protein, 10) : undefined,
      carbsGrams: carbs ? parseInt(carbs, 10) : undefined,
      fatGrams: fat ? parseInt(fat, 10) : undefined,
    };

    const itemData: Omit<MenuItem, 'id'> = {
      restaurantId: restaurant.id,
      name,
      description,
      price: parsedPrice,
      category: finalCategory,
      portionSize,
      prepTimeMinutes: parsedPrep,
      isPopular,
      isChefSpecial,
      mealWindows: selectedWindows.length > 0 ? selectedWindows : ['lunch'],
      dietary,
      allergens,
      image,
      calories: parsedCal,
      nutritionalInfo,
      options: options.length > 0 ? options : undefined,
    };

    if (editingItem) {
      updateMenuItem({
        ...itemData,
        id: editingItem.id,
      });
    } else {
      addMenuItem(itemData);
    }

    setIsModalOpen(false);
  };

  const QUICK_DISH_TEMPLATES = [
    {
      name: 'Smoky Firewood Pilau Rice & Spiced Beef',
      description: 'Slow-cooked spiced pilau rice served with tender braised beef chunks and fresh kachumbari.',
      price: 16000,
      category: 'Signature Rice Bowls',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      mealWindows: ['lunch', 'dinner'] as MealWindowType[],
      calories: 680,
      portionSize: 'Bowl (450g)',
      prepTimeMinutes: 5,
      dietary: ['halal'] as DietaryType[],
    },
    {
      name: 'Crispy Flame-Roasted Quarter Chicken & Gonja',
      description: 'Golden herb-marinated chicken quarter served with sweet fried plantain slices (gonja) and mild dip.',
      price: 15000,
      category: 'Grills & Combos',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
      mealWindows: ['lunch', 'dinner'] as MealWindowType[],
      calories: 720,
      portionSize: '1 Box',
      prepTimeMinutes: 5,
      dietary: ['halal'] as DietaryType[],
    },
    {
      name: 'Artisan Beef Burger & Seasoned Wedges',
      description: 'Seared beef patty, aged cheddar, pickles, grilled onions and house special burger sauce.',
      price: 14000,
      category: 'Burgers & Sandwiches',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      mealWindows: ['lunch', 'dinner', 'snack'] as MealWindowType[],
      calories: 610,
      portionSize: 'Single Burger',
      prepTimeMinutes: 10,
      dietary: ['halal'] as DietaryType[],
    },
    {
      name: 'Fresh Farm Avocado Green Salad Bowl',
      description: 'Crisp lettuce, garden cucumbers, cherry tomatoes, Haas avocado slices and lemon-herb vinaigrette.',
      price: 9000,
      category: 'Salads & Healthy',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
      mealWindows: ['breakfast', 'lunch', 'snack'] as MealWindowType[],
      calories: 340,
      portionSize: 'Bowl (350g)',
      prepTimeMinutes: 5,
      dietary: ['vegan', 'gluten-free'] as DietaryType[],
    },
  ];

  const handleQuickAddTemplate = (tmpl: (typeof QUICK_DISH_TEMPLATES)[0]) => {
    addMenuItem({
      restaurantId: restaurant.id,
      name: tmpl.name,
      description: tmpl.description,
      price: tmpl.price,
      category: tmpl.category,
      image: tmpl.image,
      mealWindows: tmpl.mealWindows,
      calories: tmpl.calories,
      portionSize: tmpl.portionSize,
      prepTimeMinutes: tmpl.prepTimeMinutes,
      dietary: tmpl.dietary,
      allergens: [],
      isPopular: true,
    });
  };

  // Filtered photo presets
  const photoCategories = ['all', ...Array.from(new Set(CURATED_FOOD_PHOTOS.map((p) => p.category)))];
  const displayedPhotos =
    selectedPhotoCategory === 'all'
      ? CURATED_FOOD_PHOTOS
      : CURATED_FOOD_PHOTOS.filter((p) => p.category === selectedPhotoCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="rounded-3xl bg-white p-6 border border-stone-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Menu Management
              </span>
              <span className="text-xs text-stone-500">• {restaurant.name}</span>
            </div>
            <h3 className="text-xl font-black text-stone-900 mt-1">
              Dishes, Prices, Modifiers & Dietary Controls
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Customize prices, detailed culinary notes, high-resolution photography, allergens, and multi-tier option modifiers.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-amber-500 text-stone-950 rounded-2xl text-xs font-black hover:bg-amber-400 transition flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-[0.99]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add New Dish</span>
          </button>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-100">
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
            <span className="text-[10px] uppercase font-bold text-stone-400">Total Dishes</span>
            <div className="text-lg font-black text-stone-900 mt-0.5">{restItems.length}</div>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
            <span className="text-[10px] uppercase font-bold text-stone-400">With Modifiers</span>
            <div className="text-lg font-black text-amber-600 mt-0.5">{customizableCount}</div>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
            <span className="text-[10px] uppercase font-bold text-stone-400">Average Price</span>
            <div className="text-lg font-black text-stone-900 mt-0.5">{formatUGX(avgPrice)}</div>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
            <span className="text-[10px] uppercase font-bold text-stone-400">Active Windows</span>
            <div className="text-lg font-black text-emerald-600 mt-0.5">4 Slots</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-stone-200">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search dishes, descriptions, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="flex-1 sm:flex-none text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Categories ({restItems.length})</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Window Filter */}
          <select
            value={selectedWindowFilter}
            onChange={(e) => setSelectedWindowFilter(e.target.value)}
            className="flex-1 sm:flex-none text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Meal Windows</option>
            {ALL_MEAL_WINDOWS.map((win) => (
              <option key={win} value={win}>
                {getWindowLabel(win)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Menu Cards Grid */}
      {restItems.length === 0 ? (
        <div className="space-y-6">
          <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-stone-200 shadow-xs">
            <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Utensils className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-black text-stone-900">Your Menu is Empty</h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-md mx-auto leading-relaxed">
              Add your food items and set their prices. Customers will be able to order them for delivery to designated spot drop-off points.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={openAddModal}
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 text-stone-950 rounded-2xl text-xs font-black hover:bg-amber-400 transition shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>+ Add Food Item & Price</span>
              </button>
            </div>
          </div>

          {/* 1-Tap Quick Food Presets for rapid setup even on slow connections */}
          <div className="rounded-3xl bg-white p-6 border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>1-Tap Quick-Add Popular Dishes</span>
                </h4>
                <p className="text-xs text-stone-500">
                  Tap to instantly add a common dish with preconfigured photo, description, and price (you can edit anytime).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_DISH_TEMPLATES.map((tmpl, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 flex flex-col justify-between hover:border-amber-400 hover:bg-white transition group"
                >
                  <div>
                    <div className="h-28 w-full rounded-xl overflow-hidden bg-stone-200 mb-2.5">
                      <img
                        src={tmpl.image}
                        alt={tmpl.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-bold text-amber-600">
                        {tmpl.category}
                      </span>
                      <span className="text-xs font-black text-stone-900">
                        {formatUGX(tmpl.price)}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-stone-900 mt-0.5 line-clamp-1">
                      {tmpl.name}
                    </h5>
                    <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-tight">
                      {tmpl.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleQuickAddTemplate(tmpl)}
                    className="mt-3 w-full py-1.5 bg-stone-900 hover:bg-amber-500 hover:text-stone-950 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Menu</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
          <Utensils className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No dishes match your filters</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or category filters, or add a new dish to this restaurant's menu.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 bg-amber-500 text-stone-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition"
          >
            Add New Dish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const hasModifiers = item.options && item.options.length > 0;

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-stone-200 bg-white p-5 shadow-2xs hover:shadow-sm transition flex flex-col justify-between space-y-4 group"
              >
                <div className="flex items-start gap-4">
                  {/* Dish Image */}
                  <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {item.isPopular && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                        ★
                      </span>
                    )}
                  </div>

                  {/* Dish Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                          {item.category}
                        </span>
                        <h4 className="text-base font-black text-stone-900 leading-tight">
                          {item.name}
                        </h4>
                      </div>
                      <span className="text-base font-black text-stone-900 shrink-0">
                        {formatUGX(item.price)}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Meta details: Calories, Portion, Prep */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                      {item.calories && (
                        <span className="font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                          {item.calories} kcal
                        </span>
                      )}
                      {item.portionSize && (
                        <span className="text-stone-500">{item.portionSize}</span>
                      )}
                      {item.prepTimeMinutes && (
                        <span className="text-stone-400">~{item.prepTimeMinutes}m prep</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dietary and Allergen Pills */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Dietary */}
                    {item.dietary &&
                      item.dietary.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize flex items-center gap-1"
                        >
                          <Leaf className="h-2.5 w-2.5 text-emerald-600" />
                          {tag}
                        </span>
                      ))}

                    {/* Meal Windows */}
                    {item.mealWindows.map((win) => (
                      <span
                        key={win}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600"
                      >
                        {getWindowLabel(win)}
                      </span>
                    ))}
                  </div>

                  {/* Modifiers Summary Badge */}
                  <div className="flex items-center justify-between pt-1">
                    {hasModifiers ? (
                      <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-200/80">
                        <Layers className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span className="font-bold text-[11px]">
                          {item.options!.length}{' '}
                          {item.options!.length === 1 ? 'Modifier Group' : 'Modifier Groups'}
                        </span>
                        <span className="text-stone-400 text-[10px]">
                          ({item.options!.map((o) => o.name).join(', ')})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-400 italic">No modifiers attached</span>
                    )}

                    {/* Actions: Preview, Edit, Duplicate, Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition"
                        title="Preview Customer View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(item)}
                        className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition"
                        title="Duplicate Dish"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                        title="Edit Dish"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.name}" from your menu?`)) {
                            deleteMenuItem(item.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Dish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Experience Interactive Preview Modal */}
      <DishModal
        item={previewItem}
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        activeMealWindow="lunch"
      />

      {/* Complete Dish Editor & Modifier Management Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  {restaurant.name}
                </span>
                <h3 className="text-lg font-black text-stone-900">
                  {editingItem ? `Edit: ${name || 'Dish'}` : 'Create New Menu Item'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-1 px-6 border-b border-stone-200 bg-stone-50/30 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveModalTab('details')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  activeModalTab === 'details'
                    ? 'border-amber-500 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Utensils className="h-3.5 w-3.5" />
                <span>1. Dish & Pricing</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('media')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  activeModalTab === 'media'
                    ? 'border-amber-500 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>2. Imagery & Photos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('dietary')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  activeModalTab === 'dietary'
                    ? 'border-amber-500 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Leaf className="h-3.5 w-3.5" />
                <span>3. Dietary & Nutrition</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('modifiers')}
                className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap ${
                  activeModalTab === 'modifiers'
                    ? 'border-amber-500 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>4. Modifiers & Options ({options.length})</span>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: DETAILS & PRICING */}
              {activeModalTab === 'details' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Dish Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Wok-Glazed Crispy Chicken Bowl"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Base Price (UGX) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500">
                          UGX
                        </span>
                        <input
                          type="number"
                          step="500"
                          min="0"
                          required
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full pl-14 pr-3.5 py-2.5 text-sm font-black border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-stone-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          if (e.target.value !== 'custom') setCustomCategoryInput('');
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-semibold border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white"
                      >
                        {COMMON_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="custom">+ Type custom category...</option>
                      </select>
                    </div>

                    {category === 'custom' && (
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Custom Category Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chef's Daily Specials"
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Detailed Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-stone-700">
                        Detailed Culinary Description
                      </label>
                      <span className="text-[11px] text-stone-400">
                        {description.length} characters
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Highlight fresh ingredients, flavor profile, cooking method, and texture notes (e.g. 'Crisp tempura chicken thigh tossed in ginger sweet glaze over warm jasmine rice with pickled carrots and edamame.')"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 leading-relaxed"
                    />
                  </div>

                  {/* Portion Size & Prep Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Portion Size / Yield
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Regular Bowl (450g), 12-inch, 24oz"
                        value={portionSize}
                        onChange={(e) => setPortionSize(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Avg Kitchen Prep Time (Minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        placeholder="20"
                        value={prepTimeMinutes}
                        onChange={(e) => setPrepTimeMinutes(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Feature Badges Toggles */}
                  <div className="flex items-center gap-6 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                      <input
                        type="checkbox"
                        checked={isPopular}
                        onChange={(e) => setIsPopular(e.target.checked)}
                        className="h-4 w-4 rounded-md text-amber-500 focus:ring-amber-400"
                      />
                      <span>Mark as "Popular" (Display star badge)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                      <input
                        type="checkbox"
                        checked={isChefSpecial}
                        onChange={(e) => setIsChefSpecial(e.target.checked)}
                        className="h-4 w-4 rounded-md text-rose-500 focus:ring-rose-400"
                      />
                      <span>Mark as "Chef's Special"</span>
                    </label>
                  </div>

                  {/* Available Meal Windows */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      Order Windows When This Dish is Available
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ALL_MEAL_WINDOWS.map((win) => {
                        const isSelected = selectedWindows.includes(win);
                        return (
                          <button
                            key={win}
                            type="button"
                            onClick={() => toggleWindow(win)}
                            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50 text-amber-950 ring-1 ring-amber-400'
                                : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600'
                            }`}
                          >
                            <span>{getWindowLabel(win)}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-amber-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: IMAGERY & PHOTOS */}
              {activeModalTab === 'media' && (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Direct Photo URL
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-mono border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Live Image Preview */}
                  <div className="rounded-2xl border border-stone-200 p-4 bg-stone-50/50 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={image}
                      alt="Preview"
                      className="h-36 w-48 rounded-xl object-cover border border-stone-200 shadow-2xs shrink-0"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-stone-900 block">Live Photo Preview</span>
                      <p className="text-stone-500 text-[11px] leading-relaxed">
                        High-resolution food imagery increases customer batch conversion by over 40%. You can paste any image URL or choose from our curated library below.
                      </p>
                    </div>
                  </div>

                  {/* Curated Food Photos Gallery */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        Curated Food Photo Library (1-Click Selection)
                      </label>

                      {/* Photo category tabs */}
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {photoCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedPhotoCategory(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition capitalize ${
                              selectedPhotoCategory === cat
                                ? 'bg-amber-500 text-stone-950'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                      {displayedPhotos.map((preset) => {
                        const isChosen = image === preset.url;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setImage(preset.url)}
                            className={`group relative rounded-xl overflow-hidden border text-left transition ${
                              isChosen
                                ? 'border-amber-500 ring-2 ring-amber-400 shadow-md'
                                : 'border-stone-200 hover:border-amber-300'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="h-20 w-full object-cover group-hover:scale-105 transition"
                              referrerPolicy="no-referrer"
                            />
                            <div className="p-1.5 bg-white text-[10px] font-bold text-stone-800 truncate">
                              {preset.name}
                            </div>
                            {isChosen && (
                              <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-md">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DIETARY & NUTRITION */}
              {activeModalTab === 'dietary' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Dietary Flags */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                      Dietary Classifications
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {ALL_DIETARY_OPTIONS.map((opt) => {
                        const isSelected = dietary.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleDietary(opt.id)}
                            className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-400'
                                : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <span className="text-base">{opt.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold flex items-center justify-between">
                                <span>{opt.label}</span>
                                {isSelected && <Check className="h-3 w-3 text-emerald-700" />}
                              </div>
                              <div className="text-[10px] text-stone-500 mt-0.5">
                                {opt.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Allergen Declarations */}
                  <div className="rounded-2xl border border-stone-200 p-4 bg-stone-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
                        Contains Major Allergens
                      </label>
                    </div>
                    <p className="text-[11px] text-stone-500 mb-3">
                      Select all common allergens present in this recipe for consumer safety.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {COMMON_ALLERGENS.map((allergen) => {
                        const isSelected = allergens.includes(allergen);
                        return (
                          <button
                            key={allergen}
                            type="button"
                            onClick={() => toggleAllergen(allergen)}
                            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-400'
                                : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                            }`}
                          >
                            {allergen} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nutritional Facts & Macros */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-stone-500" />
                      Nutritional Profile per Serving
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Total Energy (kcal)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 650"
                          value={calories}
                          onChange={(e) => setCalories(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Protein (g)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 32"
                          value={protein}
                          onChange={(e) => setProtein(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Carbohydrates (g)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 68"
                          value={carbs}
                          onChange={(e) => setCarbs(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          Fats & Oils (g)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 18"
                          value={fat}
                          onChange={(e) => setFat(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: MODIFIERS & CUSTOMIZATION BUILDER */}
              {activeModalTab === 'modifiers' && (
                <div className="space-y-4 animate-in fade-in">
                  <ModifierGroupEditor options={options} onChange={setOptions} />
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-stone-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>
                    Ready to save {name ? `"${name}"` : 'dish'} (${parseFloat(price || '0').toFixed(2)})
                  </span>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-stone-600 text-xs font-bold hover:bg-stone-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 text-stone-950 text-xs font-black rounded-xl hover:bg-amber-400 transition shadow-sm active:scale-[0.99]"
                  >
                    {editingItem ? 'Save Changes' : 'Publish Dish to Menu'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

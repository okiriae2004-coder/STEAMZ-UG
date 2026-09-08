import React, { useState, useEffect } from 'react';
import { MenuItem, MealWindowType } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plus,
  Minus,
  Flame,
  Leaf,
  Check,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Sparkles,
  Info,
  Scale,
  ShieldAlert,
  Star,
} from 'lucide-react';
import { getWindowLabel } from '../../utils/timeUtils';
import { formatUGX } from '../../utils/currency';

interface DishModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  activeMealWindow: MealWindowType;
}

export const DishModal: React.FC<DishModalProps> = ({
  item,
  isOpen,
  onClose,
  activeMealWindow,
}) => {
  const { addToCart, rateMenuItem } = useApp();

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [userStars, setUserStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [hasRated, setHasRated] = useState<boolean>(false);

  // Initialize options when item changes
  useEffect(() => {
    if (!item) return;

    const initial: Record<string, string | string[]> = {};
    if (item.options && item.options.length > 0) {
      item.options.forEach((opt) => {
        if (opt.multiSelect) {
          const defaultChoices = opt.choices.filter((c) => c.isDefault).map((c) => c.name);
          initial[opt.name] = defaultChoices;
        } else {
          const defaultChoice = opt.choices.find((c) => c.isDefault) || (opt.required ? opt.choices[0] : undefined);
          if (defaultChoice) {
            initial[opt.name] = defaultChoice.name;
          }
        }
      });
    }

    setSelectedOptions(initial);
    setQuantity(1);
    setSpecialInstructions('');
    setValidationError(null);
    setUserStars(0);
    setHoverStars(0);
    setHasRated(false);
  }, [item]);

  if (!isOpen || !item) return null;

  // Calculate dynamic price
  let additionalCost = 0;
  if (item.options) {
    item.options.forEach((opt) => {
      const selected = selectedOptions[opt.name];
      if (Array.isArray(selected)) {
        selected.forEach((selName) => {
          const choice = opt.choices.find((c) => c.name === selName);
          if (choice) additionalCost += choice.price;
        });
      } else if (typeof selected === 'string') {
        const choice = opt.choices.find((c) => c.name === selected);
        if (choice) additionalCost += choice.price;
      }
    });
  }

  const unitPrice = item.price + additionalCost;
  const totalPrice = unitPrice * quantity;

  // Toggle single option choice
  const handleSelectSingleChoice = (optionName: string, choiceName: string) => {
    setValidationError(null);
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: choiceName,
    }));
  };

  // Toggle multi-select choice
  const handleToggleMultiChoice = (
    optionName: string,
    choiceName: string,
    maxSelect?: number
  ) => {
    setValidationError(null);
    setSelectedOptions((prev) => {
      const currentList = Array.isArray(prev[optionName])
        ? (prev[optionName] as string[])
        : [];

      if (currentList.includes(choiceName)) {
        return {
          ...prev,
          [optionName]: currentList.filter((c) => c !== choiceName),
        };
      } else {
        if (maxSelect && currentList.length >= maxSelect) {
          setValidationError(`You can only select up to ${maxSelect} choices for "${optionName}"`);
          return prev;
        }
        return {
          ...prev,
          [optionName]: [...currentList, choiceName],
        };
      }
    });
  };

  const handleAddToCart = () => {
    // Validate required options
    if (item.options) {
      for (const opt of item.options) {
        if (opt.required) {
          const selected = selectedOptions[opt.name];
          if (
            !selected ||
            (Array.isArray(selected) && selected.length === 0) ||
            (typeof selected === 'string' && selected.trim() === '')
          ) {
            setValidationError(`Please make a selection for "${opt.name}" before proceeding.`);
            return;
          }
        }
      }
    }

    addToCart(item, quantity, selectedOptions, specialInstructions);
    onClose();
  };

  const dietaryIcons: Record<string, string> = {
    vegetarian: '🌱',
    vegan: '🌿',
    'gluten-free': '🌾',
    halal: '☪️',
    kosher: '✡️',
    'dairy-free': '🥛',
    'nut-free': '🥜',
    spicy: '🌶️',
    'low-carb': '🥑',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header Image with Badges */}
        <div className="relative h-56 sm:h-64 w-full shrink-0 overflow-hidden bg-stone-100">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-stone-900/70 p-2 text-white hover:bg-stone-900 transition backdrop-blur-md shadow-md z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Feature Badges Top-Left */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
            {item.isPopular && (
              <span className="rounded-full bg-amber-500 text-stone-950 font-black text-[11px] px-2.5 py-1 shadow-md flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Popular
              </span>
            )}
            {item.isChefSpecial && (
              <span className="rounded-full bg-rose-600 text-white font-bold text-[11px] px-2.5 py-1 shadow-md">
                Chef's Special
              </span>
            )}
          </div>

          {/* Bottom Bar Badges */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-stone-900/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 border border-white/10">
                <Clock className="h-3 w-3 text-amber-400" />
                {item.mealWindows.map((w) => getWindowLabel(w)).join(' • ')}
              </span>
              {item.prepTimeMinutes && (
                <span className="rounded-full bg-stone-900/80 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-stone-200 border border-white/10">
                  ~{item.prepTimeMinutes}m prep
                </span>
              )}
            </div>

            {item.portionSize && (
              <span className="rounded-full bg-stone-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-stone-300 border border-white/10 flex items-center gap-1">
                <Scale className="h-3 w-3 text-amber-400" />
                {item.portionSize}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Title & Price Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                {item.category}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5 leading-tight">
                {item.name}
              </h3>
              <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">{item.description}</p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xl sm:text-2xl font-black text-stone-900">
                {formatUGX(unitPrice)}
              </div>
              <div className="text-[11px] font-medium text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                <span>Batch Drop Ready</span>
              </div>
            </div>
          </div>

          {/* Dietary Badges */}
          {item.dietary && item.dietary.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.dietary.map((tag) => (
                <span
                  key={tag}
                  className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 border border-emerald-200 capitalize flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{dietaryIcons[tag] || '🌱'}</span>
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          {/* Customer Rating Display & Interactive Star Rating */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className={`h-4 w-4 ${
                        starIdx <= Math.round(item.rating || 5.0)
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-black text-stone-900">
                  {(item.rating || 5.0).toFixed(1)}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  ({item.ratingCount || 1} {item.ratingCount === 1 ? 'person rated' : 'people rated'})
                </span>
              </div>
            </div>

            {/* Interactive Rating Option */}
            <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">
                {hasRated ? 'Your rating submitted:' : 'Rate this dish:'}
              </span>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= (hoverStars || userStars);
                  return (
                    <button
                      key={starVal}
                      type="button"
                      disabled={hasRated}
                      onMouseEnter={() => !hasRated && setHoverStars(starVal)}
                      onMouseLeave={() => !hasRated && setHoverStars(0)}
                      onClick={() => {
                        setUserStars(starVal);
                        setHasRated(true);
                        rateMenuItem(item.id, starVal);
                      }}
                      className="p-1 rounded-md hover:bg-amber-100 transition focus:outline-hidden disabled:cursor-default"
                      title={`Rate ${starVal} ${starVal === 1 ? 'Star' : 'Stars'}`}
                    >
                      <Star
                        className={`h-5 w-5 transition ${
                          isFilled
                            ? 'fill-amber-400 text-amber-500 scale-110'
                            : 'text-stone-300 hover:text-amber-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            {hasRated && (
              <p className="text-[11px] text-emerald-700 font-bold mt-1 text-right">
                ✓ Thank you for rating this dish!
              </p>
            )}
          </div>

          {/* Nutritional Facts / Macros Strip */}
          {(item.nutritionalInfo || item.calories) && (
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-stone-500" />
                  Nutritional Highlights
                </span>
                {item.calories && (
                  <span className="text-xs font-bold text-stone-900">
                    {item.calories} Calories (kcal)
                  </span>
                )}
              </div>
              {item.nutritionalInfo && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-stone-200/70">
                    <div className="text-stone-400 text-[10px] uppercase font-bold">Protein</div>
                    <div className="font-extrabold text-stone-900 mt-0.5">
                      {item.nutritionalInfo.proteinGrams ?? '--'}g
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-stone-200/70">
                    <div className="text-stone-400 text-[10px] uppercase font-bold">Carbs</div>
                    <div className="font-extrabold text-stone-900 mt-0.5">
                      {item.nutritionalInfo.carbsGrams ?? '--'}g
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-stone-200/70">
                    <div className="text-stone-400 text-[10px] uppercase font-bold">Fat</div>
                    <div className="font-extrabold text-stone-900 mt-0.5">
                      {item.nutritionalInfo.fatGrams ?? '--'}g
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Allergen Notice Banner */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-3 flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-950">Contains Allergens: </span>
                <span className="text-amber-800">{item.allergens.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Validation Error Alert */}
          {validationError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-xs font-semibold text-rose-800 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Modifiers & Customization Groups */}
          {item.options && item.options.length > 0 && (
            <div className="space-y-5 pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Customizations & Add-ons
                </h4>
                <span className="text-[11px] text-stone-400 font-medium">
                  {item.options.length} {item.options.length === 1 ? 'choice' : 'choices'} available
                </span>
              </div>

              {item.options.map((option, groupIdx) => {
                const isMulti = option.multiSelect;
                const currentSelection = selectedOptions[option.name];
                const selectedCount = Array.isArray(currentSelection) ? currentSelection.length : (currentSelection ? 1 : 0);

                return (
                  <div
                    key={option.name + '-' + groupIdx}
                    className="rounded-2xl border border-stone-200 p-4 bg-stone-50/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-stone-900">{option.name}</span>
                        <div className="text-[11px] text-stone-500">
                          {isMulti
                            ? option.maxSelect
                              ? `Select up to ${option.maxSelect} (Selected ${selectedCount})`
                              : `Select any that apply (Selected ${selectedCount})`
                            : 'Choose 1 option'}
                        </div>
                      </div>

                      {option.required ? (
                        <span className="rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-amber-200">
                          Required
                        </span>
                      ) : (
                        <span className="rounded-md bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                          Optional
                        </span>
                      )}
                    </div>

                    {/* Choices List */}
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {option.choices.map((choice) => {
                        const isSelected = isMulti
                          ? Array.isArray(currentSelection) && currentSelection.includes(choice.name)
                          : currentSelection === choice.name;

                        return (
                          <button
                            key={choice.name}
                            type="button"
                            onClick={() => {
                              if (isMulti) {
                                handleToggleMultiChoice(option.name, choice.name, option.maxSelect);
                              } else {
                                handleSelectSingleChoice(option.name, choice.name);
                              }
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition text-left ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-400/30'
                                : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Selection Indicator */}
                              {isMulti ? (
                                <div
                                  className={`h-4 w-4 rounded-md border flex items-center justify-center transition ${
                                    isSelected
                                      ? 'border-amber-600 bg-amber-600 text-white'
                                      : 'border-stone-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                              ) : (
                                <div
                                  className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${
                                    isSelected
                                      ? 'border-amber-600 bg-amber-600'
                                      : 'border-stone-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </div>
                              )}
                              <span className="text-xs font-semibold">{choice.name}</span>
                            </div>

                            <span className="text-xs font-bold text-stone-500">
                              {choice.price > 0 ? `+${formatUGX(choice.price)}` : 'Included'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Packaging & Dietary Instructions */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
              Special Packaging / Dietary Notes
            </label>
            <input
              type="text"
              placeholder="e.g. sauce on side, extra napkins, cutlery requested"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
            />
          </div>
        </div>

        {/* Footer Fixed Action Bar */}
        <div className="p-4 sm:p-5 border-t border-stone-100 bg-white flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center rounded-2xl border border-stone-200 bg-stone-50 p-1 shrink-0">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-stone-600 hover:bg-white hover:shadow-xs transition"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-black text-stone-900 text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-stone-600 hover:bg-white hover:shadow-xs transition"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Batch Order Button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 px-4 font-black text-stone-950 shadow-md hover:bg-amber-400 transition active:scale-[0.99]"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Add to Batch Order • {formatUGX(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

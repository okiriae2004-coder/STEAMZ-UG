import React, { useState, useEffect } from 'react';
import { MenuItem, MealWindowType } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Sparkles,
  Scale,
  ShieldAlert,
  Star,
  MessageSquarePlus,
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
  const [showNotes, setShowNotes] = useState<boolean>(false);

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
    setShowNotes(false);
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
        {/* Compact Header Image */}
        <div className="relative h-40 sm:h-52 w-full shrink-0 overflow-hidden bg-stone-100">
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
            className="absolute top-3 right-3 rounded-full bg-stone-900/70 p-2 text-white hover:bg-stone-900 transition backdrop-blur-md shadow-md z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Feature Badges Top-Left */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {item.isPopular && (
              <span className="rounded-full bg-amber-500 text-stone-950 font-black text-[10px] px-2 py-0.5 shadow-md flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Popular
              </span>
            )}
            {item.isChefSpecial && (
              <span className="rounded-full bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 shadow-md">
                Chef's Special
              </span>
            )}
          </div>

          {/* Bottom Bar Badges */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 z-10">
            <div className="flex flex-wrap gap-1.5 min-w-0">
              <span className="rounded-full bg-stone-900/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-sm flex items-center gap-1.5 border border-white/10 truncate">
                <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                <span className="truncate">{item.mealWindows.map((w) => getWindowLabel(w)).join(' • ')}</span>
              </span>
              {item.prepTimeMinutes && (
                <span className="rounded-full bg-stone-900/80 backdrop-blur-md px-2 py-1 text-[11px] font-medium text-stone-200 border border-white/10 shrink-0">
                  ~{item.prepTimeMinutes}m
                </span>
              )}
            </div>

            {item.portionSize && (
              <span className="rounded-full bg-stone-900/80 backdrop-blur-md px-2 py-1 text-[10px] font-medium text-stone-300 border border-white/10 flex items-center gap-1 shrink-0">
                <Scale className="h-3 w-3 text-amber-400" />
                {item.portionSize}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Title & Price Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                {item.category}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-stone-900 mt-0.5 leading-tight">
                {item.name}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-snug line-clamp-2">
                {item.description}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-lg sm:text-xl font-black text-stone-900 leading-none">
                {formatUGX(unitPrice)}
              </div>
              <div className="text-[10px] font-medium text-emerald-600 mt-1">
                Batch Drop Ready
              </div>
            </div>
          </div>

          {/* Dietary Badges */}
          {item.dietary && item.dietary.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.dietary.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 border border-emerald-200 capitalize flex items-center gap-1"
                >
                  <span>{dietaryIcons[tag] || '🌱'}</span>
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          {/* Compact Rating Row — display + interactive on one line */}
          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              <span className="text-sm font-black text-stone-900">
                {(item.rating || 5.0).toFixed(1)}
              </span>
              <span className="text-[11px] text-stone-500 font-medium">
                ({item.ratingCount || 1})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-600">
                {hasRated ? '✓ Rated' : 'Rate:'}
              </span>
              <div className="flex items-center gap-0.5">
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
                      className="p-0.5 rounded transition focus:outline-hidden disabled:cursor-default"
                      title={`Rate ${starVal} ${starVal === 1 ? 'Star' : 'Stars'}`}
                    >
                      <Star
                        className={`h-4 w-4 transition ${
                          isFilled
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-stone-300 hover:text-amber-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Allergen Notice */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 px-3 py-2 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="text-[11px]">
                <span className="font-bold text-amber-950">Contains: </span>
                <span className="text-amber-800">{item.allergens.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 flex items-center gap-2 text-xs font-semibold text-rose-800">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Modifiers */}
          {item.options && item.options.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-900">
                  Customize
                </h4>
                <span className="text-[10px] text-stone-400 font-medium">
                  {item.options.length} {item.options.length === 1 ? 'group' : 'groups'}
                </span>
              </div>

              {item.options.map((option, groupIdx) => {
                const isMulti = option.multiSelect;
                const currentSelection = selectedOptions[option.name];
                const selectedCount = Array.isArray(currentSelection)
                  ? currentSelection.length
                  : currentSelection
                  ? 1
                  : 0;

                return (
                  <div
                    key={option.name + '-' + groupIdx}
                    className="rounded-2xl border border-stone-200 p-3 bg-stone-50/40 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-black text-stone-900">{option.name}</span>
                        <div className="text-[10px] text-stone-500">
                          {isMulti
                            ? option.maxSelect
                              ? `Max ${option.maxSelect} (${selectedCount} selected)`
                              : `Pick any (${selectedCount} selected)`
                            : 'Choose 1'}
                        </div>
                      </div>

                      {option.required ? (
                        <span className="rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-amber-200 shrink-0">
                          Required
                        </span>
                      ) : (
                        <span className="rounded-md bg-stone-100 text-stone-500 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 shrink-0">
                          Optional
                        </span>
                      )}
                    </div>

                    {/* Choices — 2 cols on wider screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition text-left ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50/80 text-amber-950 ring-1 ring-amber-400/40'
                                : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isMulti ? (
                                <div
                                  className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                                    isSelected
                                      ? 'border-amber-600 bg-amber-600 text-white'
                                      : 'border-stone-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                              ) : (
                                <div
                                  className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                                    isSelected
                                      ? 'border-amber-600 bg-amber-600'
                                      : 'border-stone-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </div>
                              )}
                              <span className="font-semibold truncate">{choice.name}</span>
                            </div>

                            <span className="text-[11px] font-bold text-stone-500 shrink-0 ml-2">
                              {choice.price > 0 ? `+${formatUGX(choice.price)}` : 'Free'}
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

          {/* Special Notes — collapsed by default */}
          <div className="pt-1">
            {!showNotes ? (
              <button
                type="button"
                onClick={() => setShowNotes(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-stone-300 text-[11px] font-bold text-stone-500 hover:text-stone-800 hover:border-stone-400 transition"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Add a note (sauce on side, extra napkins…)
              </button>
            ) : (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Special Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. sauce on side, extra napkins, cutlery requested"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Fixed Action Bar */}
        <div className="p-3 sm:p-4 border-t border-stone-100 bg-white flex items-center gap-2.5">
          {/* Quantity */}
          <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50 p-0.5 shrink-0">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-stone-600 hover:bg-white hover:shadow-xs transition"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-black text-stone-900 text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-stone-600 hover:bg-white hover:shadow-xs transition"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 px-3 font-black text-stone-950 shadow-md hover:bg-amber-400 transition active:scale-[0.99] text-sm"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span className="truncate">Add · {formatUGX(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
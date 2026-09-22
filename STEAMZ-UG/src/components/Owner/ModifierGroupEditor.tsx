import React, { useState } from 'react';
import { MenuItemOption, MenuItemOptionChoice } from '../../types';
import { MODIFIER_PRESET_TEMPLATES } from '../../data/menuPresets';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ModifierGroupEditorProps {
  options: MenuItemOption[];
  onChange: (options: MenuItemOption[]) => void;
}

export const ModifierGroupEditor: React.FC<ModifierGroupEditorProps> = ({
  options,
  onChange,
}) => {
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);

  // Add blank modifier group
  const handleAddBlankGroup = () => {
    const newGroup: MenuItemOption = {
      name: 'Custom Options',
      required: false,
      multiSelect: false,
      choices: [
        { name: 'Standard / Regular', price: 0, isDefault: true },
        { name: 'Special Upgrade', price: 2000 },
      ],
    };
    onChange([...options, newGroup]);
  };

  // Add preset template
  const handleAddPreset = (template: MenuItemOption) => {
    // Clone template so edits don't mutate preset
    const cloned: MenuItemOption = JSON.parse(JSON.stringify(template));
    onChange([...options, cloned]);
  };

  // Delete group
  const handleDeleteGroup = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  // Duplicate group
  const handleDuplicateGroup = (index: number) => {
    const groupToCopy = options[index];
    const duplicated: MenuItemOption = {
      ...JSON.parse(JSON.stringify(groupToCopy)),
      name: `${groupToCopy.name} (Copy)`,
    };
    const newOptions = [...options];
    newOptions.splice(index + 1, 0, duplicated);
    onChange(newOptions);
  };

  // Move group up/down
  const handleMoveGroup = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= options.length) return;
    const newOptions = [...options];
    const [moved] = newOptions.splice(index, 1);
    newOptions.splice(targetIndex, 0, moved);
    onChange(newOptions);
  };

  // Update group property
  const handleUpdateGroup = (index: number, updates: Partial<MenuItemOption>) => {
    const newOptions = options.map((opt, i) => (i === index ? { ...opt, ...updates } : opt));
    onChange(newOptions);
  };

  // Add choice to group
  const handleAddChoice = (groupIndex: number) => {
    const group = options[groupIndex];
    const newChoice: MenuItemOptionChoice = {
      name: '',
      price: 0,
    };
    handleUpdateGroup(groupIndex, {
      choices: [...group.choices, newChoice],
    });
  };

  // Update choice in group
  const handleUpdateChoice = (
    groupIndex: number,
    choiceIndex: number,
    updates: Partial<MenuItemOptionChoice>
  ) => {
    const group = options[groupIndex];
    const newChoices = group.choices.map((c, i) =>
      i === choiceIndex ? { ...c, ...updates } : c
    );
    handleUpdateGroup(groupIndex, { choices: newChoices });
  };

  // Delete choice from group
  const handleDeleteChoice = (groupIndex: number, choiceIndex: number) => {
    const group = options[groupIndex];
    if (group.choices.length <= 1) {
      alert('A modifier group must have at least one choice. Delete the group instead if not needed.');
      return;
    }
    const newChoices = group.choices.filter((_, i) => i !== choiceIndex);
    handleUpdateGroup(groupIndex, { choices: newChoices });
  };

  return (
    <div className="space-y-6">
      {/* Quick Template Presets Bar */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/50 p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            1-Click Modifier Templates
          </span>
          <span className="text-[11px] text-amber-700 font-medium">
            Quickly add common restaurant options
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MODIFIER_PRESET_TEMPLATES.map((preset, idx) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => handleAddPreset(preset.template)}
              className="px-3 py-2 bg-white/90 hover:bg-white border border-amber-200/70 hover:border-amber-400 rounded-xl text-left shadow-2xs transition group"
            >
              <div className="text-xs font-bold text-stone-900 group-hover:text-amber-800 flex items-center justify-between">
                <span>{preset.title}</span>
                <Plus className="h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <div className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modifier Groups Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-500" />
            Configured Modifier Groups ({options.length})
          </h4>
          <p className="text-xs text-stone-500">
            Customers will configure these options when ordering this dish.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddBlankGroup}
          className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition flex items-center gap-1.5 shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Custom Group</span>
        </button>
      </div>

      {/* Empty State */}
      {options.length === 0 && (
        <div className="p-8 text-center bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
          <Layers className="h-8 w-8 text-stone-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-stone-700">No modifiers configured for this dish</p>
          <p className="text-[11px] text-stone-400 max-w-sm mx-auto mt-1">
            Click any template button above (e.g. Protein, Spice Level, Extra Toppings) or create a custom group.
          </p>
          <button
            type="button"
            onClick={handleAddBlankGroup}
            className="mt-3 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition"
          >
            Create First Modifier Group
          </button>
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-4">
        {options.map((group, groupIdx) => (
          <div
            key={groupIdx}
            className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4"
          >
            {/* Group Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 flex-1">
                <span className="h-6 w-6 rounded-lg bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center shrink-0 border border-amber-200">
                  {groupIdx + 1}
                </span>
                <input
                  type="text"
                  placeholder="e.g. Choose Your Protein, Base Grain, Spice Level"
                  value={group.name}
                  onChange={(e) => handleUpdateGroup(groupIdx, { name: e.target.value })}
                  className="font-bold text-sm text-stone-900 border-b border-dashed border-stone-300 hover:border-amber-500 focus:border-amber-500 focus:outline-hidden px-1 py-0.5 w-full max-w-md"
                />
              </div>

              {/* Action buttons (Reorder, Duplicate, Delete) */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={groupIdx === 0}
                  onClick={() => handleMoveGroup(groupIdx, 'up')}
                  className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded-lg hover:bg-stone-100"
                  title="Move Up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={groupIdx === options.length - 1}
                  onClick={() => handleMoveGroup(groupIdx, 'down')}
                  className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded-lg hover:bg-stone-100"
                  title="Move Down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateGroup(groupIdx)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                  title="Duplicate Group"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(groupIdx)}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="Delete Group"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Group Configuration Controls (Required vs Optional, Single vs Multi) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50/70 p-3 rounded-xl border border-stone-100">
              {/* Requirement Rule */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                  Enforcement
                </label>
                <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateGroup(groupIdx, { required: true })}
                    className={`flex-1 py-1 text-xs font-bold rounded-md transition ${
                      group.required
                        ? 'bg-amber-500 text-stone-950 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Required
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateGroup(groupIdx, { required: false })}
                    className={`flex-1 py-1 text-xs font-bold rounded-md transition ${
                      !group.required
                        ? 'bg-stone-200 text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Optional
                  </button>
                </div>
              </div>

              {/* Selection Mode */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                  Selection Type
                </label>
                <div className="flex items-center rounded-lg border border-stone-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateGroup(groupIdx, { multiSelect: false })}
                    className={`flex-1 py-1 text-xs font-bold rounded-md transition ${
                      !group.multiSelect
                        ? 'bg-amber-500 text-stone-950 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Single (Radio)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateGroup(groupIdx, { multiSelect: true })}
                    className={`flex-1 py-1 text-xs font-bold rounded-md transition ${
                      group.multiSelect
                        ? 'bg-amber-500 text-stone-950 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Multi (Checkboxes)
                  </button>
                </div>
              </div>

              {/* Max Select Limit (if multi-select) */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
                  {group.multiSelect ? 'Max Choices (Optional)' : 'Default Selection'}
                </label>
                {group.multiSelect ? (
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="No limit"
                    value={group.maxSelect || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                      handleUpdateGroup(groupIdx, { maxSelect: val });
                    }}
                    className="w-full text-xs font-medium bg-white border border-stone-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-amber-500"
                  />
                ) : (
                  <div className="text-[11px] text-stone-500 py-1">
                    First choice is selected by default
                  </div>
                )}
              </div>
            </div>

            {/* Choices Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-500 px-1">
                <span>Option Choices</span>
                <span className="w-32 text-right pr-6">Extra Price (UGX)</span>
              </div>

              <div className="space-y-2">
                {group.choices.map((choice, choiceIdx) => (
                  <div
                    key={choiceIdx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-stone-50/50 border border-stone-200/80"
                  >
                    {/* Default Radio indicator */}
                    <button
                      type="button"
                      onClick={() => {
                        const newChoices = group.choices.map((c, i) => ({
                          ...c,
                          isDefault: i === choiceIdx,
                        }));
                        handleUpdateGroup(groupIdx, { choices: newChoices });
                      }}
                      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                        choice.isDefault
                          ? 'border-amber-600 bg-amber-500 text-white'
                          : 'border-stone-300 hover:border-stone-400 bg-white'
                      }`}
                      title={choice.isDefault ? 'Default Choice' : 'Set as Default'}
                    >
                      {choice.isDefault && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </button>

                    {/* Choice Name */}
                    <input
                      type="text"
                      required
                      placeholder="e.g. Extra Gonja, Kachumbari, Avocado"
                      value={choice.name}
                      onChange={(e) =>
                        handleUpdateChoice(groupIdx, choiceIdx, { name: e.target.value })
                      }
                      className="flex-1 text-xs font-medium bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />

                    {/* Choice Price */}
                    <div className="relative w-32 shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">
                        +UGX
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder="0"
                        value={choice.price === 0 ? '' : choice.price}
                        onChange={(e) => {
                          const p = parseFloat(e.target.value) || 0;
                          handleUpdateChoice(groupIdx, choiceIdx, { price: p });
                        }}
                        className="w-full text-xs font-bold pl-12 pr-2 py-1.5 bg-white border border-stone-200 rounded-lg text-right focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Delete choice */}
                    <button
                      type="button"
                      onClick={() => handleDeleteChoice(groupIdx, choiceIdx)}
                      className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 shrink-0"
                      title="Remove Choice"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleAddChoice(groupIdx)}
                className="w-full py-2 border border-dashed border-stone-300 hover:border-amber-400 text-stone-600 hover:text-amber-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition bg-white"
              >
                <Plus className="h-3.5 w-3.5 text-amber-600" />
                <span>Add Choice to "{group.name || 'Group'}"</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

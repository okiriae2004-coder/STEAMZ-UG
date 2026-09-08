import React from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Sun, Sunrise, Sunset, Moon, Check, X, RotateCcw } from 'lucide-react';
import { formatTime12h } from '../../utils/timeUtils';

interface TimeSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimeSimulatorModal: React.FC<TimeSimulatorModalProps> = ({ isOpen, onClose }) => {
  const { simulatedTime, setSimulatedTime, isRealTime, setIsRealTime } = useApp();

  if (!isOpen) return null;

  const presets = [
    {
      label: 'Morning Breakfast',
      time: '08:00',
      tag: 'Breakfast Window Open (Cutoff 8:45 AM)',
      icon: Sunrise,
      color: 'text-amber-500 bg-amber-50 border-amber-200',
    },
    {
      label: 'Peak Lunch Rush',
      time: '11:30',
      tag: 'Lunch Window Open (Cutoff 12:00 Midday)',
      icon: Sun,
      color: 'text-orange-500 bg-orange-50 border-orange-200',
    },
    {
      label: 'Lunch Cut-off Passed',
      time: '12:15',
      tag: 'Lunch Closed, Prepping 12:45 Drop',
      icon: Clock,
      color: 'text-stone-500 bg-stone-50 border-stone-200',
    },
    {
      label: 'Afternoon Tea / Bites',
      time: '14:30',
      tag: 'Snack Window Open (Cutoff 3:15 PM)',
      icon: Sun,
      color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Dinner Window',
      time: '17:45',
      tag: 'Dinner Window Open (Cutoff 6:30 PM)',
      icon: Sunset,
      color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
    },
    {
      label: 'Late Night (Closed)',
      time: '23:00',
      tag: 'All Standard Kitchens Closed',
      icon: Moon,
      color: 'text-purple-500 bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">STEAMZ Time Simulator</h3>
              <p className="text-xs text-stone-500">
                Simulate time of day to test order window cut-offs & batch deliveries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active Time Display */}
        <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Current Platform Time
            </span>
            <div className="text-2xl font-black text-stone-900 flex items-center gap-2">
              {formatTime12h(simulatedTime)}
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-stone-200 text-stone-700">
                24h: {simulatedTime}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsRealTime(!isRealTime);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition ${
                isRealTime
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {isRealTime ? 'Synced to Real Clock' : 'Sync Device Time'}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-4">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-2">
            Instant Test Presets (Meal Windows)
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {presets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = simulatedTime === preset.time && !isRealTime;
              return (
                <button
                  key={preset.time}
                  onClick={() => {
                    setIsRealTime(false);
                    setSimulatedTime(preset.time);
                  }}
                  className={`flex items-start gap-3 p-3 text-left rounded-xl border transition ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${preset.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-900">{preset.label}</span>
                      {isSelected && <Check className="h-4 w-4 text-amber-600 shrink-0" />}
                    </div>
                    <div className="text-xs font-semibold text-amber-700">
                      {formatTime12h(preset.time)}
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">{preset.tag}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Time Input */}
        <div className="mt-4 pt-4 border-t border-stone-100">
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">
            Or pick a custom simulated time:
          </label>
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={simulatedTime}
              onChange={(e) => {
                if (e.target.value) {
                  setIsRealTime(false);
                  setSimulatedTime(e.target.value);
                }
              }}
              className="px-4 py-2 border border-stone-300 rounded-xl font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-xs text-stone-500">
              Notice how menus and order badges update immediately based on this time!
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-semibold hover:bg-stone-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

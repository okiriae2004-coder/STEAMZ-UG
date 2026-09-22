import React from 'react';
import { MealWindowConfig } from '../../types';
import { getWindowStatusBadge, formatTime12h, getWindowLabel } from '../../utils/timeUtils';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface MealWindowBadgeProps {
  window: MealWindowConfig;
  currentTimeStr: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const MealWindowBadge: React.FC<MealWindowBadgeProps> = ({
  window,
  currentTimeStr,
  size = 'md',
  showDetails = false,
}) => {
  const status = getWindowStatusBadge(window, currentTimeStr);

  return (
    <div
      className={`inline-flex flex-col rounded-xl border p-2.5 transition-all ${
        status.isOpen
          ? 'border-amber-200 bg-amber-50/70 text-amber-950'
          : 'border-stone-200 bg-stone-50 text-stone-600 opacity-80'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold">
          {status.isOpen ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-stone-400" />
          )}
          <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>
            {getWindowLabel(window.type)}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            status.isOpen
              ? status.minutesLeft && status.minutesLeft <= 30
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-emerald-600 text-white'
              : 'bg-stone-200 text-stone-600'
          }`}
        >
          {status.isOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>

      <div className="mt-1 flex items-center gap-1 text-xs text-stone-600">
        <Clock className="h-3 w-3 text-stone-400" />
        <span>Cut-off: <strong>{formatTime12h(window.orderCutoffTime)}</strong></span>
        <span className="text-stone-300">•</span>
        <span>Drop: <strong>{formatTime12h(window.dropOffTime)}</strong></span>
      </div>

      {showDetails && (
        <p className="mt-1.5 text-xs text-stone-500 border-t border-stone-200/60 pt-1">
          {window.description}
        </p>
      )}
    </div>
  );
};

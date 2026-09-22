import { MealWindowConfig, MealWindowType } from '../types';

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  const paddedM = m < 10 ? `0${m}` : `${m}`;
  return `${h}:${paddedM} ${ampm}`;
}

export function parseTimeToMinutes(time24: string): number {
  if (!time24) return 0;
  const [h, m] = time24.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function getCurrentTimeMinutes(timeStr: string): number {
  return parseTimeToMinutes(timeStr);
}

export function isWindowOpen(window: MealWindowConfig, currentTimeStr: string): boolean {
  const current = parseTimeToMinutes(currentTimeStr);
  const start = parseTimeToMinutes(window.orderStartTime);
  const cutoff = parseTimeToMinutes(window.orderCutoffTime);

  if (start <= cutoff) {
    return current >= start && current <= cutoff;
  } else {
    // Over midnight window
    return current >= start || current <= cutoff;
  }
}

export function getMinutesUntilCutoff(window: MealWindowConfig, currentTimeStr: string): number {
  const current = parseTimeToMinutes(currentTimeStr);
  const cutoff = parseTimeToMinutes(window.orderCutoffTime);

  if (cutoff >= current) {
    return cutoff - current;
  } else {
    return 24 * 60 - current + cutoff;
  }
}

export function getWindowStatusBadge(window: MealWindowConfig, currentTimeStr: string): {
  isOpen: boolean;
  text: string;
  badgeClass: string;
  minutesLeft?: number;
} {
  const open = isWindowOpen(window, currentTimeStr);
  if (open) {
    const mins = getMinutesUntilCutoff(window, currentTimeStr);
    if (mins <= 30) {
      return {
        isOpen: true,
        text: `Closing soon: ${mins}m left!`,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-300 font-medium',
        minutesLeft: mins,
      };
    }
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    const timeDisplay = hours > 0 ? `${hours}h ${m}m left` : `${mins}m left`;
    return {
      isOpen: true,
      text: `Open now (${timeDisplay})`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
      minutesLeft: mins,
    };
  }

  // Window closed
  return {
    isOpen: false,
    text: `Cut-off passed (${formatTime12h(window.orderCutoffTime)})`,
    badgeClass: 'bg-stone-100 text-stone-500 border-stone-200',
  };
}

export function getWindowLabel(type: MealWindowType): string {
  switch (type) {
    case 'breakfast':
      return 'Breakfast';
    case 'lunch':
      return 'Lunch';
    case 'snack':
      return 'Afternoon Bites';
    case 'dinner':
      return 'Dinner';
    case 'latenight':
      return 'Late Night';
    default:
      return type;
  }
}

import { MealWindowConfig, MealWindowType } from '../types';

const UGANDA_TIME_ZONE = 'Africa/Kampala';
const MINUTES_PER_DAY = 24 * 60;

export function formatTime12h(time24: string): string {
  if (!time24) return '';

  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);

  if (Number.isNaN(h) || Number.isNaN(m)) return '';

  const ampm = h >= 12 ? 'PM' : 'AM';

  h = h % 12;
  h = h || 12;

  const paddedM = m < 10 ? `0${m}` : `${m}`;

  return `${h}:${paddedM} ${ampm}`;
}

export function parseTimeToMinutes(time24: string): number {
  if (!time24) return 0;

  const [hStr, mStr] = time24.split(':');

  const h = Number(hStr);
  const m = Number(mStr || 0);

  if (
    !Number.isFinite(h) ||
    !Number.isFinite(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return 0;
  }

  return h * 60 + m;
}

/**
 * Returns the current Uganda time as HH:mm.
 *
 * Africa/Kampala is UTC+3 and does not use daylight saving time.
 * Using Intl here means the application does not depend on the
 * device/browser being configured to Uganda time.
 */
export function getUgandaTimeString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UGANDA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function getUgandaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: UGANDA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getCurrentTimeMinutes(timeStr: string): number {
  return parseTimeToMinutes(timeStr);
}

/**
 * Determines whether a meal-ordering window is currently open.
 *
 * Normal window:
 *   09:00 -> 12:00
 *
 * Overnight window:
 *   22:00 -> 02:00
 */
export function isWindowOpen(
  window: MealWindowConfig,
  currentTimeStr: string
): boolean {
  const current = parseTimeToMinutes(currentTimeStr);
  const start = parseTimeToMinutes(window.orderStartTime);
  const cutoff = parseTimeToMinutes(window.orderCutoffTime);

  if (start === cutoff) {
    return true;
  }

  if (start < cutoff) {
    return current >= start && current <= cutoff;
  }

  // Window crosses midnight.
  return current >= start || current <= cutoff;
}

/**
 * Returns minutes remaining until the ordering cutoff.
 *
 * Handles windows that cross midnight correctly.
 */
export function getMinutesUntilCutoff(
  window: MealWindowConfig,
  currentTimeStr: string
): number {
  const current = parseTimeToMinutes(currentTimeStr);
  const start = parseTimeToMinutes(window.orderStartTime);
  const cutoff = parseTimeToMinutes(window.orderCutoffTime);

  if (start === cutoff) {
    return MINUTES_PER_DAY;
  }

  if (start < cutoff) {
    return Math.max(0, cutoff - current);
  }

  // Overnight window, e.g. 22:00 -> 02:00.
  if (current >= start) {
    return cutoff + MINUTES_PER_DAY - current;
  }

  if (current <= cutoff) {
    return cutoff - current;
  }

  return 0;
}

export function getWindowStatusBadge(
  window: MealWindowConfig,
  currentTimeStr: string
): {
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
        badgeClass:
          'bg-amber-50 text-amber-700 border-amber-300 font-medium',
        minutesLeft: mins,
      };
    }

    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;

    const timeDisplay =
      hours > 0
        ? `${hours}h ${minutes}m left`
        : `${mins}m left`;

    return {
      isOpen: true,
      text: `Open now (${timeDisplay})`,
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-300 font-medium',
      minutesLeft: mins,
    };
  }

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
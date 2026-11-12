/**
 * Querétaro time and working hours for the about dial. Pure, so a fixed clock can test it.
 * Querétaro follows America/Mexico_City: UTC−6 all year (no DST since 2022).
 */
export const HOURS = { start: 9, end: 18 } as const; // Monday to Friday

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const format = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Mexico_City',
  hourCycle: 'h23',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export interface LocalTime {
  h: number;
  m: number;
  /** 0 = Sunday … 6 = Saturday. */
  day: number;
}

export function queretaroTime(date: Date): LocalTime {
  const parts = Object.fromEntries(format.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    h: Number(parts['hour']) % 24,
    m: Number(parts['minute']),
    day: WEEKDAYS.indexOf(parts['weekday'] ?? ''),
  };
}

/** "on" within working hours; otherwise when work resumes. */
export type Availability = 'on' | 'today' | 'tomorrow' | 'monday';

export function availability({ h, m, day }: LocalTime): Availability {
  const minutes = h * 60 + m;
  const weekend = day === 0 || day === 6;
  if (!weekend && minutes >= HOURS.start * 60 && minutes < HOURS.end * 60) return 'on';
  if (weekend || (day === 5 && minutes >= HOURS.end * 60)) return 'monday';
  return minutes < HOURS.start * 60 ? 'today' : 'tomorrow';
}

/** Degrees clockwise from the top of a 24-hour dial: noon at the top, midnight at the bottom. */
export function dialAngle(h: number, m = 0): number {
  return 180 + ((h * 60 + m) / 1440) * 360;
}

/** Point at hour `h` and radius `r` on a dial drawn in a 400 × 400 viewBox. */
export function dialPoint(h: number, r: number): [number, number] {
  const a = (dialAngle(h) * Math.PI) / 180;
  return [200 + r * Math.sin(a), 200 - r * Math.cos(a)];
}

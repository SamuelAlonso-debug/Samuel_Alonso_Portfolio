import { describe, expect, it } from 'vitest';
import { availability, dialAngle, dialPoint, queretaroTime } from '../../src/lib/availability';

/** Querétaro is UTC−6: 15:00Z is 09:00 there. 2026-11-11 is a Wednesday. */
const at = (iso: string) => availability(queretaroTime(new Date(iso)));

describe('availability (Querétaro, Mon–Fri 9:00–18:00)', () => {
  it('reads the local time and weekday', () => {
    expect(queretaroTime(new Date('2026-11-11T15:07:00Z'))).toEqual({ h: 9, m: 7, day: 3 });
  });

  it('is on from 9:00 up to, not including, 18:00 on weekdays', () => {
    expect(at('2026-11-11T15:00:00Z')).toBe('on'); // Wed 09:00
    expect(at('2026-11-11T23:59:00Z')).toBe('on'); // Wed 17:59
  });

  it('says when work resumes', () => {
    expect(at('2026-11-11T14:59:00Z')).toBe('today'); // Wed 08:59
    expect(at('2026-11-12T00:00:00Z')).toBe('tomorrow'); // Wed 18:00
    expect(at('2026-11-14T00:00:00Z')).toBe('monday'); // Fri 18:00
    expect(at('2026-11-14T18:00:00Z')).toBe('monday'); // Sat 12:00
    expect(at('2026-11-15T14:00:00Z')).toBe('monday'); // Sun 08:00
    expect(at('2026-11-16T14:00:00Z')).toBe('today'); // Mon 08:00
  });
});

describe('dial geometry', () => {
  it('puts noon at the top and midnight at the bottom', () => {
    expect(dialAngle(12)).toBe(360);
    expect(dialAngle(0)).toBe(180);
    expect(dialAngle(18)).toBe(450);
  });

  it('places 9:00 up-left and 18:00 on the right', () => {
    const [x9, y9] = dialPoint(9, 146);
    const [x18, y18] = dialPoint(18, 146);
    expect([x9, y9].map((v) => v.toFixed(2))).toEqual(['96.76', '96.76']);
    expect([x18, y18].map((v) => v.toFixed(2))).toEqual(['346.00', '200.00']);
  });
});

import { dayRange, dayStatus, ymd } from './day';

describe('day utils', () => {
  it('dayStatus: bo\'sh -> NONE', () => {
    expect(dayStatus([])).toBe('NONE');
  });
  it('dayStatus: faqat tashqarida -> OUTSIDE_ONLY', () => {
    expect(dayStatus([{ withinZone: false }, { withinZone: false }])).toBe('OUTSIDE_ONLY');
  });
  it('dayStatus: kamida bitta ichkarida -> INSIDE', () => {
    expect(dayStatus([{ withinZone: false }, { withinZone: true }])).toBe('INSIDE');
  });
  it('dayRange: bir sutka, ymd bilan mos', () => {
    const { start, end } = dayRange('2026-10-05');
    expect(end.getTime() - start.getTime()).toBe(24 * 3600 * 1000);
    expect(ymd(start)).toBe('2026-10-05');
    expect(ymd(end)).toBe('2026-10-06');
  });
  it('dayRange: oy chegarasi', () => {
    expect(ymd(dayRange('2026-10-31').end)).toBe('2026-11-01');
  });
});

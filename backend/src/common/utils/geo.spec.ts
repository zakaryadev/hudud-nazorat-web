import { haversineMeters } from './geo';

// TZ 5-bo'lim: namuna jadvali (hudud markazi Nukus, radius 150 m)
const CENTER = { lat: 42.4531, lon: 59.6103 };
const R = 150;
const M_PER_DEG_LAT = (6371000 * Math.PI) / 180;
const north = (m: number) => haversineMeters(CENTER.lat, CENTER.lon, CENTER.lat + m / M_PER_DEG_LAT, CENTER.lon);

describe('haversineMeters', () => {
  it('aynan markazda 0 m', () => {
    expect(haversineMeters(CENTER.lat, CENTER.lon, CENTER.lat, CENTER.lon)).toBe(0);
  });

  it.each([
    [120, true],
    [149, true],
    [151, false],
    [180, false],
    [1500, false],
  ])('%i m masofada ichkarida=%s (radius 150)', (m, inside) => {
    const d = north(m);
    expect(d).toBeCloseTo(m, 0);
    expect(d <= R).toBe(inside);
  });

  it('simmetrik', () => {
    const a = haversineMeters(41.3111, 69.2797, 42.4531, 59.6103);
    const b = haversineMeters(42.4531, 59.6103, 41.3111, 69.2797);
    expect(a).toBeCloseTo(b, 6);
  });

  it('Toshkent–Nukus ≈ 900-1000 km', () => {
    const km = haversineMeters(41.3111, 69.2797, 42.4531, 59.6103) / 1000;
    expect(km).toBeGreaterThan(800);
    expect(km).toBeLessThan(1000);
  });
});

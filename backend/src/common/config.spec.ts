import { corsOrigin, jwtSecret, maxUploadBytes } from './config';

const ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ENV };
});

describe('config', () => {
  it('JWT_SECRET yo\'q yoki qisqa bo\'lsa xato', () => {
    delete process.env.JWT_SECRET;
    expect(() => jwtSecret()).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = 'qisqa';
    expect(() => jwtSecret()).toThrow(/JWT_SECRET/);
  });
  it('JWT_SECRET yetarli uzunlikda qaytadi', () => {
    process.env.JWT_SECRET = '0123456789abcdef';
    expect(jwtSecret()).toBe('0123456789abcdef');
  });
  it('CORS_ORIGIN vergul bilan ajratiladi, bo\'sh = true', () => {
    process.env.CORS_ORIGIN = ' https://a.uz , https://b.uz ';
    expect(corsOrigin()).toEqual(['https://a.uz', 'https://b.uz']);
    process.env.CORS_ORIGIN = '';
    expect(corsOrigin()).toBe(true);
  });
  it('MAX_UPLOAD_MB standart 10', () => {
    delete process.env.MAX_UPLOAD_MB;
    expect(maxUploadBytes()).toBe(10 * 1024 * 1024);
    process.env.MAX_UPLOAD_MB = '3';
    expect(maxUploadBytes()).toBe(3 * 1024 * 1024);
    process.env.MAX_UPLOAD_MB = 'abc';
    expect(maxUploadBytes()).toBe(10 * 1024 * 1024);
  });
});

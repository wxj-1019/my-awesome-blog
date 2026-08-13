/** reading-settings 持久化单测：sanitize 脏数据 / load / save。 */
import {
  DEFAULT_READING_SETTINGS,
  READING_SETTINGS_KEY,
  loadReadingSettings,
  sanitizeSettings,
  saveReadingSettings,
  type ReadingSettings,
} from '@/lib/reading-settings';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
    clear: () => { data.clear(); },
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    get length() { return data.size; },
  } as Storage;
}

const valid: ReadingSettings = {
  fontSize: 'large',
  lineHeight: 'relaxed',
  letterSpacing: 'wide',
  fontFamily: 'sans',
};

describe('sanitizeSettings', () => {
  it('合法数据原样保留', () => {
    expect(sanitizeSettings(valid)).toEqual(valid);
  });

  it('非对象回默认', () => {
    expect(sanitizeSettings('bad')).toEqual(DEFAULT_READING_SETTINGS);
    expect(sanitizeSettings(null)).toEqual(DEFAULT_READING_SETTINGS);
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_READING_SETTINGS);
  });

  it('非法字段值逐项回落默认，合法字段保留', () => {
    const result = sanitizeSettings({ fontSize: 'huge', lineHeight: 'compact', fontFamily: 'serif' });
    expect(result.fontSize).toBe(DEFAULT_READING_SETTINGS.fontSize);
    expect(result.lineHeight).toBe('compact');
    expect(result.letterSpacing).toBe(DEFAULT_READING_SETTINGS.letterSpacing);
    expect(result.fontFamily).toBe('serif');
  });

  it('缺字段回落默认', () => {
    expect(sanitizeSettings({})).toEqual(DEFAULT_READING_SETTINGS);
  });
});

describe('load/saveReadingSettings', () => {
  it('无存储数据返回默认', () => {
    const storage = memoryStorage();
    expect(loadReadingSettings(storage)).toEqual(DEFAULT_READING_SETTINGS);
  });

  it('保存后能读回', () => {
    const storage = memoryStorage();
    saveReadingSettings(valid, storage);
    expect(storage.getItem(READING_SETTINGS_KEY)).toBe(JSON.stringify(valid));
    expect(loadReadingSettings(storage)).toEqual(valid);
  });

  it('存储内容为坏 JSON 时回默认', () => {
    const storage = memoryStorage({ [READING_SETTINGS_KEY]: 'not-json{' });
    expect(loadReadingSettings(storage)).toEqual(DEFAULT_READING_SETTINGS);
  });

  it('存储内容字段脏时 sanitize 生效', () => {
    const storage = memoryStorage({
      [READING_SETTINGS_KEY]: JSON.stringify({ fontSize: 99, fontFamily: 'mono' }),
    });
    expect(loadReadingSettings(storage)).toEqual(DEFAULT_READING_SETTINGS);
  });
});

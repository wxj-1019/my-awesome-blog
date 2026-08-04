import { parseFavorites, toggleFavorite, FAVORITES_MAX } from '@/lib/tarot-favorites';
import { tarotDeck } from '@/mock/tarot';

describe('parseFavorites · 收藏解析', () => {
  it('空值/非法 JSON/非数组返回空', () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites('')).toEqual([]);
    expect(parseFavorites('{bad')).toEqual([]);
    expect(parseFavorites('"str"')).toEqual([]);
  });

  it('过滤不存在的牌 id', () => {
    const raw = JSON.stringify(['moon', 'ghost-card', 'sun']);
    expect(parseFavorites(raw)).toEqual(['moon', 'sun']);
  });

  it('去重', () => {
    const raw = JSON.stringify(['moon', 'moon', 'sun']);
    expect(parseFavorites(raw)).toEqual(['moon', 'sun']);
  });
});

describe('toggleFavorite · 切换收藏', () => {
  it('未收藏 → 加入', () => {
    expect(toggleFavorite([], 'moon')).toEqual(['moon']);
    expect(toggleFavorite(['sun'], 'moon')).toEqual(['sun', 'moon']);
  });

  it('已收藏 → 移除', () => {
    expect(toggleFavorite(['moon', 'sun'], 'moon')).toEqual(['sun']);
  });

  it('非法 id 不操作', () => {
    expect(toggleFavorite([], 'ghost')).toEqual([]);
  });

  it('达到上限后不再加入', () => {
    const full = tarotDeck.map((c) => c.id);
    // full 已是 78 张（上限），再 toggle 一张已存在的应移除、未存在的不加
    expect(toggleFavorite(full, full[0])).not.toContain(full[0]);
    // full 减一后再加新 id（这里用已移除的）可以
    const almost = full.slice(0, FAVORITES_MAX - 1);
    const newId = full[FAVORITES_MAX - 1];
    expect(toggleFavorite(almost, newId)).toHaveLength(FAVORITES_MAX);
  });
});

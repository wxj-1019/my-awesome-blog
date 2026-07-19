import {
  REACTION_CATALOG,
  COMPOSER_EMOJI_CATALOG,
  getReactionIcon,
  getReactionLabel,
  getComposerEntry,
} from './emoji-icon-map';
import { Heart, Meh, ThumbsUp } from 'lucide-react';

describe('emoji-icon-map', () => {
  it('maps known reaction keys to lucide icons', () => {
    expect(getReactionIcon('❤️')).toBe(Heart);
    expect(getReactionIcon('👍')).toBe(ThumbsUp);
  });

  it('returns Chinese labels for reactions', () => {
    expect(getReactionLabel('❤️')).toBe('喜欢');
    expect(getReactionLabel('👍')).toBe('赞同');
  });

  it('falls back safely for unknown keys', () => {
    expect(getReactionIcon('🦄')).toBe(Meh);
    expect(getReactionLabel('🦄')).toBe('反应');
  });

  it('keeps reaction API keys as unicode emoji strings', () => {
    const keys = REACTION_CATALOG.map((r) => r.key);
    expect(keys).toEqual(
      expect.arrayContaining(['❤️', '👍', '👎', '🔥', '😂', '🚀', '✨'])
    );
    expect(REACTION_CATALOG).toHaveLength(7);
  });

  it('composer catalog has 16–24 entries with key+icon+label', () => {
    expect(COMPOSER_EMOJI_CATALOG.length).toBeGreaterThanOrEqual(16);
    expect(COMPOSER_EMOJI_CATALOG.length).toBeLessThanOrEqual(24);
    for (const entry of COMPOSER_EMOJI_CATALOG) {
      expect(entry.key.length).toBeGreaterThan(0);
      expect(entry.icon).toBeDefined();
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it('getComposerEntry finds by key', () => {
    const first = COMPOSER_EMOJI_CATALOG[0];
    expect(getComposerEntry(first.key)?.label).toBe(first.label);
  });
});

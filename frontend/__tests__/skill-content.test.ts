import {
  previewMarkdownLines,
  skillDownloadFilename,
  contentPathToPublicFile,
} from '@/lib/skill-content';

describe('skill-content helpers', () => {
  it('previewMarkdownLines 默认截取前 16 行并标记截断', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `L${i + 1}`);
    const md = lines.join('\n');
    const { text, truncated } = previewMarkdownLines(md, 16);
    expect(truncated).toBe(true);
    expect(text.split('\n')).toHaveLength(16);
    expect(text.startsWith('L1')).toBe(true);
    expect(text.endsWith('L16')).toBe(true);
  });

  it('previewMarkdownLines 不足 maxLines 时不截断', () => {
    const md = 'a\nb\nc';
    const { text, truncated } = previewMarkdownLines(md, 16);
    expect(truncated).toBe(false);
    expect(text).toBe(md);
  });

  it('skillDownloadFilename 使用 {slug}-SKILL.md', () => {
    expect(skillDownloadFilename('taste')).toBe('taste-SKILL.md');
  });

  it('contentPathToPublicFile 映射站点路径到 public 相对路径', () => {
    expect(contentPathToPublicFile('/skills/taste/SKILL.md')).toBe(
      'skills/taste/SKILL.md',
    );
  });

  it('contentPathToPublicFile 拒绝路径穿越', () => {
    expect(contentPathToPublicFile('/skills/../.env')).toBeNull();
    expect(contentPathToPublicFile('skills/taste/SKILL.md')).toBeNull();
  });
});

import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import path from 'path';
import { getArticleById } from '@/lib/api/articles';

/**
 * 文章 OG 分享图（Next 文件约定：自动挂载到文章页 openGraph.images，无需改 generateMetadata）。
 *
 * - 尺寸 1200×630（主流社交平台推荐）
 * - 中文渲染：satori 无内置 CJK 字体，读取仓库内 Noto Sans SC Bold（仅服务端）
 * - 文章不存在 / 拉取失败：返回站点默认图
 * - 字体资产缺失：降级为无文字的纯渐变图，保证接口始终 200
 */
export const runtime = 'nodejs';

/** 同一文章的 OG 图内容不变，日级缓存降低社交爬虫反复抓取的渲染成本 */
export const revalidate = 86400;

export const alt = '文章分享图 - My Awesome Blog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** 字体放在 public/fonts 下：Docker 生产镜像只拷贝 public/，src/assets 不会进镜像 */
const FONT_PATH = path.join(
  process.cwd(),
  'public',
  'fonts',
  'NotoSansSC-Bold.otf'
);

/** 模块级缓存字体 Buffer：进程内只读一次磁盘，避免每请求 IO */
let fontBuffer: ArrayBuffer | null = null;

/** 读取 Noto Sans SC Bold；失败返回 null（调用方走无文字降级） */
async function loadFont(): Promise<ArrayBuffer | null> {
  if (fontBuffer) {
    return fontBuffer;
  }
  try {
    const buffer = await readFile(FONT_PATH);
    fontBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    return fontBuffer;
  } catch {
    return null;
  }
}

/** 标题字号随长度缩放，保证最多 3 行内尽量占满版面 */
function titleFontSize(title: string): number {
  const len = Array.from(title).length;
  if (len <= 16) {return 76;}
  if (len <= 28) {return 62;}
  if (len <= 42) {return 50;}
  return 42;
}

/** 站点统一深色渐变底（deep-sea：深海蓝 → tech-darkblue） */
const baseStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  width: '100%',
  height: '100%',
  background:
    'linear-gradient(135deg, #041624 0%, #082f49 45%, #0c4a6e 100%)',
};

/** 文章 OG 图主体 */
async function renderArticleImage(
  title: string,
  author: string,
  dateLabel: string
): Promise<ImageResponse> {
  const font = await loadFont();
  if (!font) {
    // 字体缺失降级：satori 渲染文字必须有字体，改为纯渐变 + 站点标识图形
    return new ImageResponse(
      <div style={baseStyle}>
        <div
          style={{
            position: 'absolute',
            right: -140,
            bottom: -180,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background:
              'radial-gradient(circle, rgba(94,234,212,0.22) 0%, rgba(94,234,212,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 96,
            top: 96,
            width: 72,
            height: 8,
            borderRadius: 4,
            background:
              'repeating-linear-gradient(to right, #5eead4 0 10px, transparent 10px 26px)',
          }}
        />
      </div>,
      size
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          ...baseStyle,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '88px 96px 72px',
        }}
      >
        {/* 右下角深海光晕 */}
        <div
          style={{
            position: 'absolute',
            right: -140,
            bottom: -180,
            width: 560,
            height: 560,
            borderRadius: 9999,
            display: 'flex',
            background:
              'radial-gradient(circle, rgba(94,234,212,0.18) 0%, rgba(94,234,212,0) 70%)',
          }}
        />
        {/* 顶部胶片齿孔线（呼应首页展厅卷轴装饰） */}
        <div
          style={{
            position: 'absolute',
            left: 96,
            right: 96,
            top: 40,
            height: 6,
            display: 'flex',
            opacity: 0.35,
            background:
              'repeating-linear-gradient(to right, #5eead4 0 8px, transparent 8px 26px)',
          }}
        />

        {/* kicker：站点标识 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            color: '#5eead4',
            fontSize: 28,
            letterSpacing: 8,
          }}
        >
          MY AWESOME BLOG
        </div>

        {/* 标题：随长度缩放字号，最多 3 行截断 */}
        <div
          style={{
            display: 'flex',
            color: '#f0f9ff',
            fontSize: titleFontSize(title),
            fontWeight: 700,
            lineHeight: 1.28,
            letterSpacing: 1,
            lineClamp: 3,
          }}
        >
          {title}
        </div>

        {/* 底部：作者 · 日期 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: 'rgba(186,230,253,0.82)',
            fontSize: 30,
            letterSpacing: 2,
          }}
        >
          {author} · {dateLabel}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'NotoSansSC',
          data: font,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}

/** 站点默认 OG 图（文章不存在 / 拉取失败时） */
async function renderDefaultImage(): Promise<ImageResponse> {
  const font = await loadFont();
  if (!font) {
    return new ImageResponse(
      <div
        style={{
          ...baseStyle,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 120,
            height: 12,
            borderRadius: 6,
            background:
              'repeating-linear-gradient(to right, #5eead4 0 10px, transparent 10px 26px)',
          }}
        />
      </div>,
      size
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          ...baseStyle,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -140,
            top: -180,
            width: 520,
            height: 520,
            borderRadius: 9999,
            display: 'flex',
            background:
              'radial-gradient(circle, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0) 70%)',
          }}
        />
        <div
          style={{
            color: '#5eead4',
            fontSize: 30,
            letterSpacing: 10,
          }}
        >
          MY AWESOME BLOG
        </div>
        <div
          style={{
            width: 96,
            height: 6,
            borderRadius: 3,
            background:
              'repeating-linear-gradient(to right, rgba(94,234,212,0.6) 0 8px, transparent 8px 26px)',
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'NotoSansSC',
          data: font,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}

/**
 * 文件约定入口：/articles/[id]/opengraph-image
 * Next 15+ 的 params 为 Promise，兼容普通对象写法（与页面 page.tsx 一致）。
 */
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  const article = resolved?.id ? await getArticleById(resolved.id) : null;

  if (!article) {
    return renderDefaultImage();
  }

  const author = article.author?.username || 'My Awesome Blog';
  // 截取 YYYY-MM-DD，避免 satori 端本地化格式差异
  const dateLabel = (article.published_at || article.created_at).slice(0, 10);

  return renderArticleImage(article.title, author, dateLabel);
}

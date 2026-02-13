/**
 * 将依赖 live2dcubismcore 中的 Cubism Core 脚本复制到 public，
 * 看板娘即可完全使用本地资源，无需 CDN。
 */
const fs = require('fs');
const path = require('path');

const pkgDir = path.dirname(require.resolve('live2dcubismcore/package.json'));
const src = path.join(pkgDir, 'live2dcubismcore.min.js');
const publicDir = path.join(process.cwd(), 'public');
const dest = path.join(publicDir, 'live2dcubismcore.min.js');

if (!fs.existsSync(src)) {
  console.warn('[copy-live2d-core] 未找到 live2dcubismcore.min.js，跳过复制');
  process.exit(0);
}

fs.mkdirSync(publicDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('[copy-live2d-core] 已复制到 public/live2dcubismcore.min.js');

# 创作台模型下拉 + 图生图工具 · 设计文档

> 日期：2026-08-08 · 状态：已获用户批准
> 前置：2026-08-08 完成 RunningHub 接口分析（50+ 端点清单，rhart/seedream 家族 OpenAPI v2 直通实测确认）

## 1. 背景与目标

基于 RunningHub 接口分析结论，接入两个已实测确认可用的能力：

1. **文生图模型下拉**：创作台图片生成当前固定 `rhart-image-g-2-official`，新增 `seedream-v5-pro` 档位（实测仅 prompt 必填，单次约 0.7 元，明显更便宜）
2. **图生图工具**：同页并入，上传/粘贴参考图 → 基于参考图生成（`rhart-image-g-2-official/image-to-image`，参数已完整实测）

**实测参数证据（2026-08-08，免费探测 + 真实任务）**：
- `seedream-v5-pro/text-to-image`：仅 prompt 必填；`resolution=2k`、`aspectRatio=1:1` 可选且被接受；单次 ≈0.7 元
- `rhart-image-g-2-official/image-to-image`：必填 `prompt` + `imageUrls[]` + `resolution` + `quality`（与文生图参数同构）
- 图生图是**独立端点**（`{model}/image-to-image`），非文生图加参数——后端需支持端点切换
- 探测消耗：seedream-v4 实测 1 次（3.9 元）、seedream-v5-pro 1 次（0.7 元）；账户余额 169.34 元 + 522 RH 币

## 2. 设计决策

### 2.1 模型下拉（仅图片类型显示）

| 模型 | 实测必填 | 前端固定档 | 张数 |
|---|---|---|---|
| `rhart-image-g-2-official`（默认） | prompt/resolution/quality | resolution=2k, quality=medium | 1/2/4 可选（现状） |
| `seedream-v5-pro` | prompt | resolution=2k, aspect_ratio 传尺寸 | **锁定 1 张**（count 未验证） |

- 下拉位置：尺寸/张数选择上方一行（模型标签 + 下拉）
- seedream 档下张数按钮禁用并置灰（仅 1 张高亮），aria-disabled 语义
- 切换模型不清空提示词/尺寸/历史

### 2.2 图生图（并入创作台图片 tab）

- 新增「参考图（可选）」区域，位于模型行下方：
  - **URL 粘贴**：输入框 + 「应用」按钮；公开免登录可用
  - **本地上传**：仅登录态显示（`localStorage` 有 auth_token 时），走既有 `@/lib/api/oss.ts uploadFile`，成功后把 `file_url` 填入 URL 状态
  - 预览：应用后显示缩略图（`h-16 w-16` + 提示文案「将作为参考图」）+ 移除按钮
  - 图片类型切换（image/video）时保留参考图状态？——**不保留**：kind 切到 video 时清空参考图（图生图仅图片），切回 image 不自动恢复（简单、可预期）
- 有参考图 → 生成模式自动为图生图：
  - payload：`mode="image"` + `workflow_inputs.imageUrls=[refImageUrl]`
  - 生成按钮文案「基于参考图生成」
- **第一版图生图仅支持 rhart 模型**：模型下拉在「有参考图」时固定 rhart（seedream 图生图参数未验证，不冒险）；无参考图时下拉可选 seedream

### 2.3 后端改动（最小，向后兼容）

```
ImageGenTaskRequest 增加（schema）:
  model: str = "rhart-image-g-2-official"   # 图片模型（仅图片生效）
  mode:  Literal["text","image"] = "text"   # 文生图/图生图

image_gen_service 端点拼接:
  type=image:  f"{model}/{image-to-image if mode=='image' else text-to-image}"
  type=video:  settings.RUNNINGHUB_VIDEO_ENDPOINT（现状，不动）
```

- 旧请求（无 model/mode）→ Pydantic 默认值 → 端点行为不变
- `config.py` 的 `RUNNINGHUB_IMAGE_ENDPOINT` 保留但不再用于拼接（动态拼 endpoint）；`RUNNINGHUB_VIDEO_ENDPOINT` 照旧
- 服务层新增 `_image_endpoint_for(model, mode)` 私有函数（拼装 + 校验非空）
- 错误信息沿用现状（ValueError → HTTP 400）

### 2.4 前端改动

| 文件 | 改动 |
|---|---|
| `frontend/src/lib/api/imageGen.ts` | `CreateGenTaskRequest` 加 `model: string`、`mode: 'text'\|'image'`（可选默认 text） |
| `frontend/src/app/tools/image-gen/image-gen-content.tsx` | model state（默认 rhart）、refImageUrl state、模型下拉、参考图区（URL 输入/上传/预览/移除）、张数禁用逻辑、按钮文案切换 |
| `frontend/src/lib/image-gen-history.ts` | `GenHistoryEntry` 加可选 `refImageUrl: string \| null`；`sanitizeEntry` 兼容旧数据（无该字段 → null） |
| `frontend/src/components/ui/GenDrawer.tsx` / `CanvasStage.tsx` | 不改（历史列表不展示参考图，恢复时由父组件回填 refImageUrl） |

**数据流**：`handleGenerate` → `createGenTask({ type:'image', model, mode: refImageUrl ? 'image' : 'text', prompt, workflow_inputs: {…imageUrls…} })` → 后端选端点 → RunningHub → 轮询（不变）→ CanvasStage 展示（不变）

**历史恢复**：`handleRestore` 回填 `refImageUrl`（entry 有则显示预览，无则空）

### 2.5 不做的事（YAGNI）

- 不做 seedream 图生图（参数未验证，后续实测后加）
- 不做图生视频/多模态视频/多图参考
- 不改视频生成（模型固定、端点不动）
- 不做模型参数 UI 暴露（分辨率/质量档位保持固定）

## 3. 测试与验证

### 后端（backend/app/tests/test_image_gen.py）
- `test_image_endpoint_model_and_mode`：model=seedream-v5-pro + mode=text → 端点 `seedream-v5-pro/text-to-image`；model=rhart + mode=image → `rhart-image-g-2-official/image-to-image`
- 既有用例兼容：无 model/mode 的请求 → 默认 rhart text（现有断言不变或微调为显式默认）
- 视频端点不受影响（既有测试覆盖）

### 前端
- `image-gen-content.test.tsx`：
  - 模型下拉渲染与切换（切 seedream 后张数禁用、切 rhart 恢复）
  - 参考图 URL 应用/预览/移除
  - 有参考图时 payload 含 `mode:'image'` + `imageUrls`；无参考图 `mode:'text'` 无 imageUrls
  - 上传按钮仅登录态显示（localStorage 有 token 时）
  - 历史恢复回填 refImageUrl
- `image-gen-history.test.ts`：旧数据（无 refImageUrl）sanitize 兼容；带 refImageUrl 正常
- a11y 套件补场景（参考图区/模型下拉无违规）
- 四道闸：type-check / lint / test / build（build 受本地 GFW 网络限制时以服务器构建为准，已知环境问题）

### 部署
- 双端改动 → `server-redeploy.sh all`（后端+前端）
- 线上验证：文生图（rhart/seedream 各 1 次，计费）→ 图生图（rhart，用已有 OSS 图 URL）→ 轮询成功出图

## 4. 计费说明

验证消耗：seedream 文生图 1 次（≈0.7 元）+ rhart 图生图 1-2 次（单价未精确，按文生图同档估算）。账户余额 169.34 元充足。

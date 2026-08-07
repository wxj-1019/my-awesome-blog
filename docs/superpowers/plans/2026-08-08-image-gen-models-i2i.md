# 创作台模型下拉 + 图生图工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `/tools/image-gen` 创作台接入文生图模型下拉（rhart 默认 + seedream-v5-pro 档位）与图生图工具（参考图 URL/上传 → `{model}/image-to-image`）。

**Architecture:** 后端 `ImageGenTaskRequest` 增加 `model`/`mode`/`image_urls` 字段，服务层按 (model, mode) 动态拼图片端点（向后兼容：旧请求默认 rhart/text）；前端创作台加模型下拉与参考图区（URL 粘贴免登录 + OSS 上传登录态），有参考图自动切图生图模式。

**Tech Stack:** FastAPI + Pydantic v2 / Next.js 16 + TS strict + Tailwind v3 / Jest + pytest。

**设计文档:** `docs/superpowers/specs/2026-08-08-image-gen-models-i2i-design.md`

---

## 文件结构

| 文件 | 职责 |
|---|---|
| `backend/app/schemas/image_gen.py` | 修改：`ImageGenTaskRequest` 加 `model`/`mode`/`image_urls` |
| `backend/app/services/image_gen_service.py` | 修改：`_image_endpoint_for(model, mode)` 动态拼端点；payload 加 `imageUrls` |
| `backend/app/tests/test_image_gen.py` | 修改：新字段/端点拼接用例；`test_no_endpoint_raises` 改为 model 校验 |
| `frontend/src/lib/api/imageGen.ts` | 修改：`CreateGenTaskRequest` 加 `model`/`mode`/`image_urls` |
| `frontend/src/lib/image-gen-history.ts` | 修改：`GenHistoryEntry` 加可选 `refImageUrl`；`sanitizeEntry` 兼容旧数据 |
| `frontend/src/app/tools/image-gen/image-gen-content.tsx` | 修改：模型下拉、参考图区（URL/上传/预览/移除）、张数禁用、按钮文案、历史回填 |
| `frontend/__tests__/image-gen-content.test.tsx` | 修改：新交互与 payload 断言 |
| `frontend/__tests__/image-gen-history.test.ts` | 修改：refImageUrl 兼容 |
| `frontend/__tests__/a11y/image-gen.a11y.test.tsx` | 修改：参考图区/下拉场景 |

**关键既有 API（勿改签名，只消费）**：
- `uploadFile(file)` → `{ file_url }`（`@/lib/api/oss.ts`；登录态经 `localStorage.auth_token`）
- `createGenTask(request)` / `getGenTaskStatus`（`@/lib/api/imageGen`）
- `GenHistoryEntry`（`@/lib/image-gen-history`）；`CanvasStage`/`ProgressSteps`/`HistoryList` 组件

---

### Task 1: 后端 schema + 服务层端点拼接（TDD）

**Files:**
- Modify: `backend/app/schemas/image_gen.py`
- Modify: `backend/app/services/image_gen_service.py`
- Test: `backend/app/tests/test_image_gen.py`

- [ ] **Step 1: 写失败测试**

在 `backend/app/tests/test_image_gen.py` 的 `TestCreateTask` 类中，`test_video_uses_video_endpoint` 之后插入：

```python
    async def test_image_endpoint_by_model_and_mode(self, monkeypatch):
        setup_runninghub(monkeypatch)
        fake = FakeAsyncClient()
        monkeypatch.setattr(httpx, "AsyncClient", lambda *a, **k: fake)

        # 默认 model/mode → rhart 文生图（现状端点）
        await create_task(make_request())
        assert fake.request_url.endswith("/rhart-image-g-2-official/text-to-image")

        # 显式 model=seedream-v5-pro + text → seedream 文生图
        await create_task(make_request(model="seedream-v5-pro"))
        assert fake.request_url.endswith("/seedream-v5-pro/text-to-image")

        # mode=image + image_urls → rhart 图生图端点 + imageUrls 数组透传
        await create_task(
            make_request(
                mode="image",
                image_urls=["https://cdn.example.com/a.png"],
            )
        )
        assert fake.request_url.endswith("/rhart-image-g-2-official/image-to-image")
        assert fake.request_kwargs["json"]["imageUrls"] == ["https://cdn.example.com/a.png"]

    async def test_empty_model_raises(self, monkeypatch):
        setup_runninghub(monkeypatch)
        with pytest.raises(ValueError, match="模型"):
            await create_task(make_request(model="  "))
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cd backend && python -m pytest app/tests/test_image_gen.py -x -q`
Expected: FAIL（`ImageGenTaskRequest` 无 `model`/`mode`/`image_urls` 字段）。同时现有 `test_no_endpoint_raises` 仍通过（改造前）。

- [ ] **Step 3: 实现**

**3a. `backend/app/schemas/image_gen.py`** — 修改 `ImageGenTaskRequest`：

```python
class ImageGenTaskRequest(BaseModel):
    """创建生成任务请求"""

    type: GenType = Field(default="image", description="生成类型：image（图片）| video（视频）")
    prompt: str = Field(..., min_length=1, max_length=1000, description="描述提示词（中文/英文均可）")
    # 工作流额外输入（如负面词、尺寸、参考图等），键名依工作流而定
    workflow_inputs: Optional[Dict[str, str]] = Field(None, description="工作流额外输入参数（可选）")
    # 图片模型标识（仅 type=image 生效；视频走 RUNNINGHUB_VIDEO_ENDPOINT 固定端点）
    model: str = Field(default="rhart-image-g-2-official", description="图片生成模型标识")
    # 图片生成模式：text 文生图 / image 图生图（配合 image_urls 使用）
    mode: Literal["text", "image"] = Field(default="text", description="图片生成模式")
    # 图生图参考图 URL 列表（mode=image 时必填，RunningHub 键名为 imageUrls）
    image_urls: Optional[List[str]] = Field(None, description="图生图参考图 URL 列表（可选）")
```

（`Literal` 已在文件顶部 import；`List` 已有。）

**3b. `backend/app/services/image_gen_service.py`** — 新增端点拼接函数（放在 `_endpoint_for` 之后）：

```python
def _image_endpoint_for(model: str, mode: str) -> str:
    """按模型与模式拼图片端点（{model}/text-to-image 或 {model}/image-to-image）"""
    model = model.strip()
    if not model:
        app_logger.warning("图片生成服务未配置：模型为空")
        raise ValueError("生成服务未配置（模型），请联系管理员")
    task = "image-to-image" if mode == "image" else "text-to-image"
    return f"{model}/{task}"
```

**3c. 同一文件** — `create_task` 的端点选择改为：

```python
    key = _config_or_raise()
    # 图片端点按 (model, mode) 动态拼接；视频保持配置端点
    endpoint = (
        _image_endpoint_for(request.model, request.mode)
        if request.type == "image"
        else _endpoint_for(request.type)
    )
```

`_endpoint_for` 简化（只处理视频）：

```python
def _endpoint_for(gen_type: GenType) -> str:
    """按类型取标准模型端点（视频走配置端点），缺失抛 ValueError"""
    endpoint = settings.RUNNINGHUB_VIDEO_ENDPOINT.strip()
    if not endpoint:
        app_logger.warning("生成服务未配置：视频模型端点为空")
        raise ValueError("生成服务未配置（模型端点），请联系管理员")
    return endpoint.lstrip("/")
```

（`gen_type` 参数保留签名兼容；内部只读视频端点。若 lint 报未使用参数，改函数签名为 `_endpoint_for_video()` 并在调用处同步——二选一，保持最小 diff。）

**3d. 同一文件** — payload 构造改为（类型从 `Dict[str, str]` 放宽为 `Dict[str, Any]` 以容纳数组；`Any` 已在 import）：

```python
    # 工作流额外输入可覆盖默认参数（如 resolution/quality/duration），prompt 始终为提示词
    payload: Dict[str, Any] = {"prompt": request.prompt.strip()}
    if request.workflow_inputs:
        payload.update(request.workflow_inputs)
    if request.image_urls:
        payload["imageUrls"] = request.image_urls
```

**3e. 调整既有测试**：`test_no_endpoint_raises`（原用 `RUNNINGHUB_IMAGE_ENDPOINT` 置空触发）改为校验 model 为空：

```python
    async def test_no_model_raises(self, monkeypatch):
        setup_runninghub(monkeypatch)
        with pytest.raises(ValueError, match="模型"):
            await create_task(make_request(model=""))
```

（若保留原测试名与 `RUNNINGHUB_IMAGE_ENDPOINT` 置空逻辑，改造后不再触发——必须更新。）

- [ ] **Step 4: 运行测试确认通过**

Run: `cd backend && python -m pytest app/tests/test_image_gen.py -q`
Expected: 全部 PASS（含 2 个新用例；既有 `test_success_returns_task_id` 的 `rhart-image-g-2-official/text-to-image` 断言在新拼接逻辑下仍成立）。

- [ ] **Step 5: Commit**

```bash
git add backend/app/schemas/image_gen.py backend/app/services/image_gen_service.py backend/app/tests/test_image_gen.py
git commit -m "feat(image-gen): 图片端点按 model/mode 动态拼接 + 图生图 image_urls 透传"
```

---

### Task 2: 前端 API 类型 + 历史兼容（TDD）

**Files:**
- Modify: `frontend/src/lib/api/imageGen.ts`
- Modify: `frontend/src/lib/image-gen-history.ts`
- Test: `frontend/__tests__/image-gen-history.test.ts`

- [ ] **Step 1: 写失败测试**

在 `frontend/__tests__/image-gen-history.test.ts` 追加（读该文件现有用例风格后插入）：

```ts
it('sanitizeEntry 兼容旧数据（无 refImageUrl → null）', () => {
  const old = {
    id: 'e1',
    createdAt: 1,
    kind: 'image',
    prompt: '月光',
    images: ['https://cdn/x.png'],
    videoUrl: null,
  };
  expect(sanitizeEntry(old)?.refImageUrl).toBeNull();
});

it('sanitizeEntry 保留合法 refImageUrl', () => {
  const entry = {
    id: 'e2',
    createdAt: 1,
    kind: 'image',
    prompt: '月光',
    images: ['https://cdn/x.png'],
    videoUrl: null,
    refImageUrl: 'https://cdn/ref.png',
  };
  expect(sanitizeEntry(entry)?.refImageUrl).toBe('https://cdn/ref.png');
});
```

（确认该测试文件 import 了 `sanitizeEntry`；没有则补 `import { sanitizeEntry } from '@/lib/image-gen-history';`。）

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npx jest __tests__/image-gen-history.test.ts`
Expected: 新用例 FAIL（类型无 refImageUrl 字段），既有用例 PASS。

- [ ] **Step 3: 实现**

**3a. `frontend/src/lib/image-gen-history.ts`** — `GenHistoryEntry` 加字段：

```ts
export interface GenHistoryEntry {
  id: string;
  createdAt: number;
  kind: GenType;
  prompt: string;
  /** 图片尺寸/张数（kind=image 时回填用；RunningHub 标准模型是否支持取决于模型） */
  size?: string;
  count?: number;
  /** 图生图参考图 URL（kind=image 且基于参考图生成时非空） */
  refImageUrl?: string | null;
  /** 生成图片 URL（kind=image 时非空） */
  images: string[];
  /** 生成视频 URL（kind=video 时非空） */
  videoUrl: string | null;
}
```

`sanitizeEntry` 返回对象加一行：

```ts
    refImageUrl: typeof r.refImageUrl === 'string' ? r.refImageUrl : null,
```

**3b. `frontend/src/lib/api/imageGen.ts`** — `CreateGenTaskRequest` 加字段：

```ts
export interface CreateGenTaskRequest {
  type: GenType;
  prompt: string;
  /** 工作流额外输入（如负面词、尺寸、参考图），键名依工作流而定（后端字段为 snake_case，勿改） */
  workflow_inputs?: Record<string, string>;
  /** 图片模型标识（仅 type=image 生效）；图生图模式仅支持 rhart-image-g-2-official */
  model?: string;
  /** 图片生成模式：text 文生图 / image 图生图（配合 image_urls） */
  mode?: 'text' | 'image';
  /** 图生图参考图 URL 列表（mode=image 时非空；后端映射为 RunningHub 的 imageUrls） */
  image_urls?: string[];
}
```

（`createGenTask` 函数体无需改——请求对象整体序列化，Pydantic 按 snake_case 接收。）

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npx jest __tests__/image-gen-history.test.ts && npm run type-check`
Expected: 全部 PASS；type-check 干净。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/api/imageGen.ts frontend/src/lib/image-gen-history.ts frontend/__tests__/image-gen-history.test.ts
git commit -m "feat(image-gen): 请求模型/模式字段 + 历史 refImageUrl 兼容"
```

---

### Task 3: 页面模型下拉 + 参考图区（TDD）

**Files:**
- Modify: `frontend/src/app/tools/image-gen/image-gen-content.tsx`
- Test: `frontend/__tests__/image-gen-content.test.tsx`

- [ ] **Step 1: 写失败测试**

在 `frontend/__tests__/image-gen-content.test.tsx` 末尾 describe 内追加（复用现有 `render`/`fireEvent`/`flushPromises`/`mockCreateTask` 帮手；`uploadFile` 需 mock——在文件顶部 jest.mock 块加）：

```ts
// OSS 上传 mock（登录态按钮测试用）
jest.mock('@/lib/api/oss', () => ({
  uploadFile: jest.fn(),
}));
import { uploadFile } from '@/lib/api/oss';
const mockUpload = uploadFile as jest.Mock;
```

新用例：

```tsx
it('模型下拉默认 rhart，切 seedream 后张数禁用', () => {
  render(<ImageGenContent />);
  const select = screen.getByLabelText('模型');
  expect(select).toHaveValue('rhart-image-g-2-official');
  fireEvent.change(select, { target: { value: 'seedream-v5-pro' } });
  expect(select).toHaveValue('seedream-v5-pro');
  // seedream 档张数按钮禁用（aria-disabled）
  const count4 = screen.getByRole('button', { name: '4' });
  expect(count4).toBeDisabled();
  // 切回 rhart 恢复
  fireEvent.change(select, { target: { value: 'rhart-image-g-2-official' } });
  expect(screen.getByRole('button', { name: '4' })).not.toBeDisabled();
});

it('参考图：应用 URL 显示预览，生成 payload 为图生图', async () => {
  mockCreateTask.mockResolvedValue({ task_id: 'task-1' });
  mockGetStatus.mockResolvedValue({
    task_id: 'task-1',
    status: 'success',
    images: ['https://cdn.example.com/a.png'],
    video_url: null,
    fail_reason: null,
  });

  render(<ImageGenContent />);
  fireEvent.change(screen.getByLabelText('提示词'), { target: { value: '改成油画风格' } });
  fireEvent.change(screen.getByLabelText('参考图 URL'), { target: { value: 'https://cdn.example.com/ref.png' } });
  fireEvent.click(screen.getByRole('button', { name: '应用' }));
  // 预览出现 + 按钮文案切换
  expect(screen.getByAltText('参考图预览')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '基于参考图生成' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '基于参考图生成' }));
  await flushPromises();
  expect(mockCreateTask).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'image',
      mode: 'image',
      model: 'rhart-image-g-2-official',
      image_urls: ['https://cdn.example.com/ref.png'],
    })
  );
});

it('移除参考图后回到文生图模式', () => {
  render(<ImageGenContent />);
  fireEvent.change(screen.getByLabelText('参考图 URL'), { target: { value: 'https://cdn.example.com/ref.png' } });
  fireEvent.click(screen.getByRole('button', { name: '应用' }));
  fireEvent.click(screen.getByRole('button', { name: '移除参考图' }));
  expect(screen.queryByAltText('参考图预览')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '生成图片' })).toBeInTheDocument();
});

it('登录态显示上传按钮，上传成功回填参考图', async () => {
  localStorage.setItem('auth_token', 'test-token');
  mockUpload.mockResolvedValue({ file_url: 'https://cdn.example.com/uploaded.png' });

  render(<ImageGenContent />);
  const fileInput = screen.getByLabelText('上传图片');
  const file = new File(['x'], 'ref.png', { type: 'image/png' });
  fireEvent.change(fileInput, { target: { files: [file] } });
  await flushPromises();
  expect(mockUpload).toHaveBeenCalledWith(file);
  expect(screen.getByAltText('参考图预览')).toHaveAttribute('src', 'https://cdn.example.com/uploaded.png');
  localStorage.removeItem('auth_token');
});

it('游客（无 token）不显示上传按钮', () => {
  localStorage.removeItem('auth_token');
  render(<ImageGenContent />);
  expect(screen.queryByLabelText('上传图片')).not.toBeInTheDocument();
});
```

（若 `getByRole('button', { name: '4' })` 与张数按钮的实际 accessible name 不符，改用容器查询——先读测试文件现有张数断言写法对齐。`toBeDisabled` 对 `disabled` 属性；seedream 档用真实 `disabled` 而非仅样式。）

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npx jest __tests__/image-gen-content.test.tsx`
Expected: 新用例 FAIL（模型下拉/参考图区未实现），既有用例 PASS。

- [ ] **Step 3: 实现页面（分段修改 image-gen-content.tsx）**

**3a. imports** 加：

```tsx
import { Upload, X } from 'lucide-react';
import { uploadFile } from '@/lib/api/oss';
```

（`X` 已有 import 则去重；`useState` 已 import。参考图预览移除按钮用 `X`。）

**3b. 常量**（`SIZE_PRESETS` 之后）：

```tsx
/** 文生图模型选项（RunningHub 标准模型）：value 即端点模型标识 */
const IMAGE_MODELS = [
  { value: 'rhart-image-g-2-official', label: '全能图片 G-2（默认）' },
  { value: 'seedream-v5-pro', label: 'Seedream V5 Pro（性价比）' },
] as const;

/** 图生图仅支持 rhart（seedream 图生图参数未验证，接入后放开） */
const I2I_MODEL = IMAGE_MODELS[0].value;
```

**3c. state**（`lightboxOpen` 之后）：

```tsx
  /** 文生图模型（有参考图时强制 rhart） */
  const [model, setModel] = useState<string>(IMAGE_MODELS[0].value);
  /** 参考图 URL（图生图；null = 文生图模式） */
  const [refImageUrl, setRefImageUrl] = useState<string | null>(null);
  /** 参考图 URL 输入框文本 */
  const [refInput, setRefInput] = useState('');
  /** 参考图上传失败提示 */
  const [refUploadError, setRefUploadError] = useState('');
```

**3d. 派生**（`hasResult` 附近）：

```tsx
  /** 图生图模式仅 rhart；无参考图时可切换模型 */
  const effectiveModel = refImageUrl ? I2I_MODEL : model;
```

**3e. `handleGenerate` payload** 替换为：

```tsx
      const { task_id } = await createGenTask({
        type: kind,
        prompt: text,
        // 后端 schema 字段为 snake_case；内部键名依工作流而定（图片 snake_case / 视频 camelCase）
        model: kind === 'image' ? effectiveModel : undefined,
        mode: kind === 'image' && refImageUrl ? 'image' : 'text',
        image_urls: refImageUrl ? [refImageUrl] : undefined,
        workflow_inputs:
          kind === 'image'
            ? effectiveModel === I2I_MODEL
              ? {
                  // RunningHub 图片工作流参数：清晰度档 + 质量档 + 画幅比例 + 张数
                  resolution: RUNNINGHUB_RESOLUTION,
                  quality: RUNNINGHUB_QUALITY,
                  aspect_ratio: size,
                  count: String(count),
                }
              : {
                  // seedream-v5-pro：仅 prompt 必填；传 resolution/aspect_ratio 可选档
                  resolution: RUNNINGHUB_RESOLUTION,
                  aspect_ratio: size,
                }
            : {
                // RunningHub 视频工作流必填参数：画幅 + 清晰度档 + 质量档（缺失会被工作流拒绝）
                aspectRatio: RUNNINGHUB_VIDEO_ASPECT_RATIO,
                resolution: RUNNINGHUB_VIDEO_RESOLUTION,
                quality: RUNNINGHUB_VIDEO_QUALITY,
              },
      });
```

**3f. 类型切换清参考图**：类型按钮 onClick 改：

```tsx
                    onClick={() => {
                      if (k.value !== kind) {
                        setKind(k.value);
                        setRefImageUrl(null);
                        setRefInput('');
                        setRefUploadError('');
                      }
                    }}
```

**3g. 模型下拉 + 参考图区**：在尺寸/张数块（`{kind === 'image' ? (...)` 内，尺寸行之前）插入：

```tsx
              <div className="mb-4 space-y-2">
                {/* 模型下拉（有参考图时锁定 rhart） */}
                <div className="flex items-center gap-2">
                  <label htmlFor="gen-model" className="shrink-0 text-xs text-muted-foreground">
                    模型
                  </label>
                  <select
                    id="gen-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={Boolean(refImageUrl)}
                    aria-label="模型"
                    className="min-w-0 flex-1 rounded-lg border border-input bg-background/60 px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  >
                    {IMAGE_MODELS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 参考图（可选，图生图） */}
                {refImageUrl ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border p-2">
                    <img
                      src={refImageUrl}
                      alt="参考图预览"
                      className="h-16 w-16 shrink-0 rounded-md border border-border object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-foreground">{refImageUrl}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        将作为生成参考图（图生图模式）
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRefImageUrl(null);
                        setRefInput('');
                        setRefUploadError('');
                      }}
                      aria-label="移除参考图"
                      className="rounded-md p-2 text-muted-foreground transition-colors hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={refInput}
                        onChange={(e) => setRefInput(e.target.value)}
                        placeholder="粘贴图片 URL（公开可访问）"
                        aria-label="参考图 URL"
                        className="min-w-0 flex-1 rounded-lg border border-input bg-background/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const u = refInput.trim();
                          if (u) {
                            setRefImageUrl(u);
                            setRefInput('');
                          }
                        }}
                      >
                        应用
                      </Button>
                    </div>
                    {typeof window !== 'undefined' && localStorage.getItem('auth_token') ? (
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Upload className="h-3.5 w-3.5" aria-hidden />
                        上传图片
                        <input
                          type="file"
                          accept="image/*"
                          aria-label="上传图片"
                          className="sr-only"
                          onChange={handleRefUpload}
                        />
                      </label>
                    ) : null}
                    {refUploadError ? (
                      <p role="alert" className="text-xs text-error">{refUploadError}</p>
                    ) : null}
                  </div>
                )}
              </div>
```

**3h. `handleRefUpload` 回调**（`handleClearHistory` 之后）：

```tsx
  /** 参考图上传：走 OSS（需登录），成功回填 URL；失败展示提示 */
  const handleRefUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) {
        return;
      }
      setRefUploadError('');
      try {
        const res = await uploadFile(file);
        setRefImageUrl(res.file_url);
      } catch {
        setRefUploadError('参考图上传失败，请重试或直接粘贴图片 URL');
      }
    },
    []
  );
```

**3i. 张数按钮禁用**：`[1, 2, 4].map` 的 button 加：

```tsx
                        disabled={effectiveModel !== I2I_MODEL}
                        aria-disabled={effectiveModel !== I2I_MODEL}
```

并确认 `disabled:opacity-40` 或现有 disabled 样式生效（Tailwind 默认 `disabled:opacity-50`，够用）。

**3j. 生成按钮文案**：`{kind === 'video' ? '生成视频' : refImageUrl ? '基于参考图生成' : '生成图片'}`（含 loading 分支外的三处文案：按钮主体 + `runGenerateFlow` 兼容——测试里 `getByRole('button', { name: '生成图片' })` 在无参考图时仍命中）。

**3k. 历史条目**：成功入历史处加 refImageUrl：

```tsx
          refImageUrl: kind === 'image' ? refImageUrl : null,
```

**3l. `handleRestore`** 回填：

```tsx
      setRefImageUrl(entry.refImageUrl ?? null);
```

- [ ] **Step 4: 运行全部相关测试**

Run: `cd frontend && npx jest __tests__/image-gen-content.test.tsx __tests__/image-gen-history.test.ts __tests__/canvas-stage.test.tsx`
Expected: 全部 PASS。若既有用例因新 DOM（模型下拉/参考图区）查询歧义失败，按新结构微调断言（可访问名称不变：生成图片/视频/1:1 方图等均保留）。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/tools/image-gen/image-gen-content.tsx frontend/__tests__/image-gen-content.test.tsx
git commit -m "feat(image-gen): 模型下拉 + 参考图图生图模式（URL/上传/预览/移除）"
```

---

### Task 4: a11y 补场景 + 四道闸

**Files:**
- Modify: `frontend/__tests__/a11y/image-gen.a11y.test.tsx`

- [ ] **Step 1: 补 a11y 场景**

在 `image-gen.a11y.test.tsx` describe 末尾追加：

```tsx
  it('参考图图生图模式（URL 预览 + 模型下拉）应无严重可访问性违规', async () => {
    const { container } = render(<ImageGenContent />);
    fireEvent.change(screen.getByLabelText('参考图 URL'), { target: { value: 'https://cdn.example.com/ref.png' } });
    fireEvent.click(screen.getByRole('button', { name: '应用' }));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 15000);
```

（若该文件 mock 块未 mock `@/lib/api/oss`，补 `uploadFile: jest.fn()`——参考图区仅登录态显示上传，未登录时不上传，无副作用。）

- [ ] **Step 2: 跑 a11y 套件**

Run: `cd frontend && npx jest __tests__/a11y/image-gen.a11y.test.tsx`
Expected: 全部 PASS 0 违规。若违规（如 select 缺 label 关联），修复组件（`aria-label` 已加；label htmlFor 已配）后重跑。

- [ ] **Step 3: 四道闸**

```bash
cd frontend
npm run type-check
npm run lint
npm test
npm run build
```

Expected: type-check 干净；lint 0 error（无新增 warning）；`npm test` 全绿；build 若因本地 GFW 网络（next/font 拉取 Google Fonts）失败，确认错误仅来自字体下载后以服务器构建为准（已知环境问题，非代码）。

- [ ] **Step 4: Commit**

```bash
git add frontend/__tests__/a11y/image-gen.a11y.test.tsx
git commit -m "test(a11y): 图生图参考图模式无障碍覆盖"
```

---

### Task 5: 部署与线上验证

**Files:** 无（遵循记忆中的部署流程；双端改动）

- [ ] **Step 1: 确认后端本地测试全绿后 tar 同步**

```bash
cd backend && python -m pytest app/tests/test_image_gen.py -q
```
Expected: 全绿。

```bash
cd E:\A_Project\my-awesome-blog
tar -czf - --exclude='node_modules' --exclude='.next' --exclude='__pycache__' --exclude='.git' --exclude='*.pyc' --exclude='.env' --exclude='.env.local' --exclude='.env.production' --exclude='venv' --exclude='.venv' --exclude='logs' --exclude='*.log' --exclude='.trae' . | ssh -o ConnectTimeout=15 root@49.234.190.85 "tar xzf - -C /opt/my-awesome-blog" && echo SYNC_OK
```

- [ ] **Step 2: CRLF 修复 + nohup 重建（all：后端+前端）**

```bash
ssh root@49.234.190.85 "cd /opt/my-awesome-blog && find . -name '*.sh' -exec sed -i 's/\r\$//' {} + && nohup bash scripts/server-redeploy.sh all > /tmp/redeploy.log 2>&1 & echo started"
```
Expected: 轮询 `/tmp/redeploy.log` 出现 `==== done ====`（约 3-4 分钟）。

- [ ] **Step 3: 线上端到端验证（计费注意）**

```bash
ssh root@49.234.190.85 "
curl -s -o /dev/null -w 'page: %{http_code}\n' http://localhost/tools/image-gen
# 1) 文生图 seedream-v5-pro（新端点拼接）
curl -s -X POST http://localhost/api/v1/image-gen/tasks/image -H 'Content-Type: application/json' -d '{\"type\":\"image\",\"prompt\":\"test seedream\",\"model\":\"seedream-v5-pro\",\"workflow_inputs\":{\"resolution\":\"2k\",\"aspect_ratio\":\"1:1\"}}'
# 2) 图生图 rhart（用已有 OSS 图 URL）
curl -s -X POST http://localhost/api/v1/image-gen/tasks/image -H 'Content-Type: application/json' -d '{\"type\":\"image\",\"prompt\":\"redraw as oil painting\",\"mode\":\"image\",\"image_urls\":[\"https://rh-images-1252422369.cos.ap-beijing.myqcloud.com/56dcac79b94fea0a1e422b3fe8cbdc15/output/71b33d5c-93c4-4b98-a9ca-257e42a83136.png\"],\"workflow_inputs\":{\"resolution\":\"2k\",\"quality\":\"medium\"}}'"
```
Expected: 两个 task_id 返回；随后轮询两个 task_id 至 success（图片 URL）。计费约 seedream 0.7 元 + 图生图 1 次。若图生图 400（参数差异），按错误信息补参重试。

- [ ] **Step 4: 浏览器人工过一遍**（页面 200、下拉/参考图交互正常），收尾提交如有调整

```bash
git add -A
git commit -m "chore(image-gen): 模型下拉与图生图部署验证"
```

---

## Self-Review

**Spec 覆盖核对**（对照 `docs/superpowers/specs/2026-08-08-image-gen-models-i2i-design.md`）：

| 设计文档要求 | 对应任务 |
|---|---|
| 2.1 模型下拉（rhart 默认 / seedream-v5-pro；seedream 张数锁定） | Task 3（3b/3g/3i） |
| 2.2 参考图区（URL 粘贴免登录 + OSS 上传登录态；预览/移除；kind 切换清空；按钮文案） | Task 3（3f/3g/3h/3j） |
| 2.2 图生图仅 rhart；有参考图锁定模型 | Task 3（3d effectiveModel + 3g select disabled） |
| 2.3 后端 model/mode/image_urls + 动态端点；旧请求向后兼容 | Task 1 |
| 2.4 前端 API 类型 + 历史 refImageUrl 兼容 | Task 2 |
| 3 测试（后端端点拼接/前端交互/a11y/四道闸） | Task 1-4 |
| 3 部署（all 重建 + 线上端到端） | Task 5 |

**Placeholder 扫描**：无 TBD/TODO；所有步骤含完整代码或精确替换说明。

**类型一致性核对**：
- `CreateGenTaskRequest`：`model?: string` / `mode?: 'text' | 'image'` / `image_urls?: string[]` → Task 2 定义 → Task 3 调用（`model: effectiveModel`、`mode: refImageUrl ? 'image' : 'text'`、`image_urls: [refImageUrl]`）一致。
- 后端 `ImageGenTaskRequest`：`model: str`（默认 rhart）/ `mode: Literal['text','image']`（默认 text）/ `image_urls: Optional[List[str]]` → Task 1 定义 → service 消费（`request.model`/`request.mode`/`request.image_urls`）一致。
- `IMAGE_MODELS[0].value === 'rhart-image-g-2-official'`（I2I_MODEL 常量）与后端默认值一致。
- `refImageUrl: string | null` state ↔ `GenHistoryEntry.refImageUrl?: string | null` ↔ `sanitizeEntry` 输出 null 兼容。

**遗留风险**：
- seedream 档 `quality` 不传（未实测验证）；若 RunningHub 报 quality 必填，接入时在 3e 分支补传并回归（上线验证 Task 5 Step 3 覆盖）。
- seedream 图生图（image-to-image）参数未验证——第一版 UI 已锁定 rhart，后端不阻止（若用户绕过 UI 发 seedream+image 端点，RunningHub 会校验必填报 400，可接受）。
- `_endpoint_for` 简化后若 lint 报 `gen_type` 未使用，改签名 `_endpoint_for_video()`（Task 1 Step 3c 已注明）。
- 既有前端测试若因 `getByRole('button', { name: '4' })` 与张数按钮名称不符失败，按测试文件现有张数断言写法对齐。

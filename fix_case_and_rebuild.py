#!/usr/bin/env python3
"""用 SSH heredoc 在服务器上创建正确的 UI 组件文件"""
from paramiko import SSHClient, AutoAddPolicy

c = SSHClient()
c.set_missing_host_key_policy(AutoAddPolicy())
c.connect('192.168.100.12', username='root', password='rongqizhizao1.!', look_for_keys=False, allow_agent=False)

def run(cmd, t=10):
    sin, sout, serr = c.exec_command(cmd, timeout=t)
    ec = sout.channel.recv_exit_status()
    out = sout.read().decode('utf-8', errors='replace')
    err = serr.read().decode('utf-8', errors='replace')
    if ec != 0:
        print(f"  ERR: {err[:200]}")
    return ec, out

UI_DIR = '/opt/my-awesome-blog/frontend/src/components/ui'

# ---------- label.tsx ----------
print("=== 创建 label.tsx ===")
label_content = r"""'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }"""

# 先删除可能存在的旧文件
run(f'rm -f {UI_DIR}/label.tsx {UI_DIR}/Label.tsx', t=5)
# 用 heredoc 写入
cmd = f"cat > {UI_DIR}/label.tsx << 'ENDOFFILE'\n{label_content}\nENDOFFILE"
ec, out = run(cmd, t=5)
print(f"  label.tsx: {'OK' if ec == 0 else 'FAIL'}")

# ---------- progress.tsx ----------
print("=== 创建 progress.tsx ===")
progress_content = r"""'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-glass/20',
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-tech-cyan transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }"""

run(f'rm -f {UI_DIR}/progress.tsx {UI_DIR}/Progress.tsx', t=5)
cmd = f"cat > {UI_DIR}/progress.tsx << 'ENDOFFILE'\n{progress_content}\nENDOFFILE"
ec, out = run(cmd, t=5)
print(f"  progress.tsx: {'OK' if ec == 0 else 'FAIL'}")

# ---------- 验证 ----------
print("\n=== 验证文件 ===")
ec, out = run(f"ls -la {UI_DIR}/label.tsx {UI_DIR}/progress.tsx 2>&1", t=5)
print(out)
ec, out = run(f"wc -l {UI_DIR}/label.tsx {UI_DIR}/progress.tsx", t=5)
print(out)

# ---------- 后台构建 ----------
print("\n=== 启动后台构建 ===")
sin, sout, serr = c.exec_command(
    'cd /opt/my-awesome-blog && '
    'nohup docker build --network host -t my-awesome-blog-frontend ./frontend '
    '> /tmp/frontend-build3.log 2>&1 &',
    timeout=5
)
sin.close(); sout.close(); serr.close()
print("  已启动，日志: /tmp/frontend-build3.log")

import time
print("等待中（每15秒检查一次）...")
for i in range(40):  # 最多 10 分钟
    time.sleep(15)
    ec, out = run('pgrep -f "docker build.*frontend" || echo "DONE"', t=5)
    ec2, log = run('tail -1 /tmp/frontend-build3.log 2>/dev/null || echo "wait..."', t=5)
    print(f"  [{i*15+15}s] {log.strip()[-80:]}")
    if 'DONE' in out:
        break

# 检查结果
print("\n=== 结果 ===")
ec, out = run("docker images my-awesome-blog-frontend --format '{{.Size}} {{.CreatedAt}}'", t=5)
if out.strip():
    print(f"  成功: {out.strip()}")
    # 启动所有服务
    print("\n=== 启动所有服务 ===")
    run('cd /opt/my-awesome-blog && docker compose -f docker-compose.prod.yml up -d', t=120)
    import time; time.sleep(15)
    run('cd /opt/my-awesome-blog && docker compose -f docker-compose.prod.yml ps', t=10)
    ec, out = run('cd /opt/my-awesome-blog && docker compose -f docker-compose.prod.yml ps', t=10)
    print(out)
else:
    print("  失败! 查看日志:")
    ec, out = run('tail -15 /tmp/frontend-build3.log', t=5)
    print(out[-600:])

c.close()

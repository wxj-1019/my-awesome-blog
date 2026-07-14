#!/usr/bin/env python3
"""检查 FeaturedHighlights.tsx 花括号匹配"""
with open(r'e:\project\my-awesome-blog\frontend\src\components\home\FeaturedHighlights.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 移除字符串和注释中的花括号
import re
# 简化: 移除 // 注释和字符串
cleaned = re.sub(r'//[^\n]*', '', content)
cleaned = re.sub(r"'[^']*'", "''", cleaned)
cleaned = re.sub(r'"[^"]*"', '""', cleaned)
cleaned = re.sub(r'`[^`]*`', '``', cleaned)

depth = 0
issues = []
for i, ch in enumerate(cleaned):
    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1
    if depth < 0:
        # 找到行号
        line_num = content[:i].count('\n') + 1
        issues.append(f"  多余的 }} 在第 {line_num} 行附近")
        depth = 0  # 重置

line_num = content[:i+1].count('\n') + 1
print(f"最终深度: {depth} (应该是 0)")
if depth > 0:
    print(f"  缺少 {depth} 个 }}")
elif depth < 0:
    print(f"  多了 {-depth} 个 }}")
else:
    print("  ✅ 花括号匹配!")

for issue in issues[:5]:
    print(issue)

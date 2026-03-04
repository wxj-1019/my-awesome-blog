import os
import re
from pathlib import Path

def fix_dark_theme_colors(file_path):
    """修复单个文件中的深色主题颜色"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    changes = []
    
    # 修复 text-gray-* 类，添加深色模式变体
    color_mappings = {
        'text-gray-300': 'text-gray-300 dark:text-gray-400',
        'text-gray-400': 'text-gray-400 dark:text-gray-500',
        'text-gray-500': 'text-gray-500 dark:text-gray-400',
        'text-white': 'text-white dark:text-gray-100',
    }
    
    for old_class, new_class in color_mappings.items():
        if old_class in content:
            content = content.replace(old_class, new_class)
            changes.append(f"  {old_class} -> {new_class}")
    
    # 修复 bg-white/5，添加深色模式
    if 'bg-white/5 border border-white/10' in content:
        content = content.replace(
            'bg-white/5 border border-white/10',
            'bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/5'
        )
        changes.append('  bg-white/5 -> bg-white/5 dark:bg-white/5')
    
    # 修复 text-gray-400 图标颜色
    content = re.sub(
        r'(text-gray-400)(?=\s*className)',
        r'text-gray-400 dark:text-gray-500',
        content
    )
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return changes
    return []

def main():
    """批量修复所有 Admin 页面"""
    admin_pages_path = Path('e:\\A_Project\\my-awesome-blog\\frontend\\src\\app\\admin')
    fixed_files = []
    
    # 查找所有 page.tsx 文件
    for page_file in admin_pages_path.rglob('page.tsx'):
        changes = fix_dark_theme_colors(page_file)
        if changes:
            fixed_files.append((str(page_file), changes))
            print(f"✓ Fixed: {page_file.name}")
            for change in changes:
                print(change)
            print()
    
    print(f"\n总计修复 {len(fixed_files)} 个文件")
    
    if len(fixed_files) == 0:
        print("没有发现需要修复的文件")

if __name__ == "__main__":
    main()

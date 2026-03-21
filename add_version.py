"""
批量给HTML文件中的JS引用添加版本号参数
用法：把此脚本放到网站文件夹，运行 python3 add_version.py
以后每次更新JS文件，改一下下面的VERSION就行
"""
import os
import glob
import re

# ===== 在这里修改版本号 =====
VERSION = '3.1'

# 需要加版本号的JS文件
JS_FILES = ['paywall-check.js']

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    changed = False
    
    for js in JS_FILES:
        # 匹配三种情况：
        # 1. paywall-check.js"        （没有版本号）
        # 2. paywall-check.js?v=2.0"  （有旧版本号）
        # 3. paywall-check.js?v=3.1"  （已经是最新）
        
        # 目标格式
        new_ref = f'{js}?v={VERSION}'
        
        # 情况1：没有版本号参数
        pattern1 = f'"{js}"'
        replacement1 = f'"{new_ref}"'
        if pattern1 in content:
            content = content.replace(pattern1, replacement1)
            changed = True
        
        # 情况2：有旧版本号参数
        pattern2 = re.compile(re.escape(js) + r'\?v=[^"\']+')
        if pattern2.search(content):
            content = pattern2.sub(new_ref, content)
            changed = True
    
    if changed and content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    html_files = sorted(glob.glob('*.html') + glob.glob('*.HTML'))
    
    if not html_files:
        print('错误：当前目录下没有找到HTML文件')
        print('请把这个脚本放到网站文件夹里再运行')
        return
    
    print(f'JS版本号设置为: v{VERSION}')
    print(f'找到 {len(html_files)} 个HTML文件')
    print('-' * 50)
    
    updated = 0
    skipped = 0
    no_ref = 0
    
    for filepath in html_files:
        filename = os.path.basename(filepath)
        
        # 检查文件里有没有引用这些JS
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
        
        has_js_ref = any(js in text for js in JS_FILES)
        
        if not has_js_ref:
            print(f'  跳过（无JS引用）: {filename}')
            no_ref += 1
            continue
        
        # 检查是否已经是最新版本
        already_latest = all(
            f'{js}?v={VERSION}' in text 
            for js in JS_FILES 
            if js in text
        )
        
        if already_latest:
            print(f'  跳过（已是v{VERSION}）: {filename}')
            skipped += 1
            continue
        
        if update_file(filepath):
            print(f'  ✅ 已更新: {filename}')
            updated += 1
        else:
            print(f'  跳过（未变化）: {filename}')
            skipped += 1
    
    print('-' * 50)
    print(f'完成！更新 {updated} 个文件，跳过 {skipped} 个，无引用 {no_ref} 个')
    print(f'所有JS引用已更新为 ?v={VERSION}')
    print(f'\n下次更新JS文件时，只需修改脚本第9行 VERSION 数字，重新运行即可。')

if __name__ == '__main__':
    main()

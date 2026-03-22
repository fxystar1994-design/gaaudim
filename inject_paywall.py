"""
批量注入 paywall-check.js 到所有课程HTML文件
使用方法：
1. 把这个脚本和 paywall-check.js 放到你的网站文件夹里
2. 运行: python inject_paywall.py
3. 所有HTML文件会被自动修改
"""
import os
import glob

# 脚本标签
SCRIPT_TAG = '<script src="paywall-check.js"></script>'

# 要跳过的文件（不需要注入的）
SKIP_FILES = ['index.html', 'index_minimal.html']

def inject(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 如果已经注入过了，跳过
    if 'paywall-check.js' in content:
        print(f'  跳过（已注入）: {os.path.basename(filepath)}')
        return False
    
    # 在 </body> 前插入
    if '</body>' in content:
        content = content.replace('</body>', SCRIPT_TAG + '\n</body>')
    elif '</BODY>' in content:
        content = content.replace('</BODY>', SCRIPT_TAG + '\n</BODY>')
    else:
        # 没有 </body> 标签，追加到文件末尾
        content += '\n' + SCRIPT_TAG
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'  ✓ 已注入: {os.path.basename(filepath)}')
    return True

def main():
    # 获取当前目录下所有HTML文件
    html_files = glob.glob('*.html') + glob.glob('*.HTML')
    
    if not html_files:
        print('错误：当前目录下没有找到HTML文件')
        print('请把这个脚本放到你的网站文件夹里再运行')
        return
    
    print(f'找到 {len(html_files)} 个HTML文件')
    print(f'跳过文件: {", ".join(SKIP_FILES)}')
    print('---')
    
    injected = 0
    skipped = 0
    
    for filepath in sorted(html_files):
        filename = os.path.basename(filepath)
        if filename in SKIP_FILES:
            print(f'  跳过（首页）: {filename}')
            skipped += 1
            continue
        
        if inject(filepath):
            injected += 1
        else:
            skipped += 1
    
    print('---')
    print(f'完成！注入 {injected} 个文件，跳过 {skipped} 个文件')
    print('现在把所有文件 + paywall-check.js 一起推送到 GitHub 即可')

if __name__ == '__main__':
    main()

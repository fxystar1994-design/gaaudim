#!/usr/bin/env python3
"""批量注入 gaaudim-analytics.js 到所有HTML课程页面"""
import glob, os

ROOT = os.path.dirname(os.path.abspath(__file__))
SCRIPT_TAG = '<script src="gaaudim-analytics.js?v=3.3"></script>'

count = 0
for f in sorted(glob.glob(os.path.join(ROOT, 'MayJie_*.html'))) + [os.path.join(ROOT, 'translator.html')]:
    with open(f, 'r', encoding='utf-8') as fh:
        html = fh.read()
    if 'gaaudim-analytics.js' in html:
        continue
    # 在 </head> 前插入，如果没有 </head> 则在 <body> 前插入
    if '</head>' in html:
        html = html.replace('</head>', SCRIPT_TAG + '\n</head>', 1)
    elif '<body' in html:
        html = html.replace('<body', SCRIPT_TAG + '\n<body', 1)
    else:
        continue
    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(html)
    count += 1
    print(f'  + {os.path.basename(f)}')

print(f'\nDone: injected into {count} files')

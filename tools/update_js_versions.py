#!/usr/bin/env python3
"""
update_js_versions.py — 批量更新所有HTML中JS引用的版本号
用法: python3 update_js_versions.py 3.3
"""

import os
import re
import sys
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERSION = sys.argv[1] if len(sys.argv) > 1 else "3.3"

# JS files to version
JS_FILES = [
    "paywall-check.js",
    "gaaudim-tts.js",
    "gaaudim-i18n.js",
    "gaaudim-progress.js",
    "gaaudim-analytics.js",
]

html_files = glob.glob(os.path.join(BASE_DIR, "*.html"))
updated_count = 0

for html_file in html_files:
    with open(html_file, "r", encoding="utf-8") as f:
        content = f.read()

    original = content
    for js_file in JS_FILES:
        # Match with or without existing version param
        pattern = re.compile(
            re.escape(js_file) + r'(\?v=[^"\'&]*)?',
            re.IGNORECASE
        )
        replacement = f"{js_file}?v={VERSION}"
        content = pattern.sub(replacement, content)

    if content != original:
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(content)
        updated_count += 1

print(f"Updated {updated_count} HTML files with JS version ?v={VERSION}")

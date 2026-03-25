#!/usr/bin/env python3
"""
generate_cards.py — JSON驱动的小红书卡片批量生成器
用法：python3 generate_cards.py input.json [-o output_dir]

input.json 格式：
{
  "cards": [
    {"template": "cover", "filename": "card_01.png", ...},
    {"template": "bubble", "filename": "card_02.png", ...},
    {"template": "cta", "filename": "card_08.png", ...}
  ]
}
"""

import argparse
import json
import sys
from pathlib import Path
from card_templates import render_card

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("错误：请先安装 playwright")
    print("  pip install playwright && playwright install chromium")
    sys.exit(1)


CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DEFAULT_OUTPUT = Path.home() / ".openclaw/workspace/assets/xhs-cards-v5"


def main():
    parser = argparse.ArgumentParser(description="搞掂粤语小红书卡片批量生成器")
    parser.add_argument("input", help="JSON数据文件")
    parser.add_argument("-o", "--output", default=str(DEFAULT_OUTPUT), help="输出目录")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    cards = data.get("cards", [])
    if not cards:
        print("JSON中没有找到cards数组")
        sys.exit(1)

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"生成 {len(cards)} 张卡片...")
    print(f"输出：{output_dir}")
    print("---")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True
        )
        page = browser.new_page(viewport={"width": 1242, "height": 1660})

        for card_data in cards:
            filename = card_data.get("filename", "card.png")
            try:
                html_content = render_card(card_data)
                page.set_content(html_content, wait_until="networkidle")
                output_path = output_dir / filename
                page.screenshot(path=str(output_path), full_page=False)
                size_kb = output_path.stat().st_size / 1024
                print(f"  ✓ {filename} ({size_kb:.0f}KB) [{card_data.get('template','?')}]")
            except Exception as e:
                print(f"  ✗ {filename} — ERROR: {e}")

        browser.close()

    print(f"\n完成！{len(cards)}张卡片")


if __name__ == "__main__":
    main()

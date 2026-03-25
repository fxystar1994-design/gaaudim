#!/usr/bin/env python3
"""
batch_tts.py — 搞掂粤语批量TTS生成工具
使用 Edge TTS（免费）批量将文本转换为粤语语音MP3

用法：
  python3 batch_tts.py input.txt -o output_dir/
  python3 batch_tts.py input.txt -v zh-HK-WanLungNeural -r "+10%" -o output_dir/

输入文件格式：
  每行一句话，空行会被跳过。
  可选前缀 "filename|text" 指定输出文件名，否则按行号自动命名。

示例 input.txt：
  greeting|你好，欢迎嚟到搞掂
  今日教大家点样讲粤语
  唔该，要个A餐
"""

import argparse
import asyncio
import os
import sys
import time

try:
    import edge_tts
except ImportError:
    print("错误：请先安装 edge-tts")
    print("  pip install edge-tts")
    sys.exit(1)


# 可用粤语语音
VOICES = {
    "female": "zh-HK-HiuGaaiNeural",
    "male": "zh-HK-WanLungNeural",
}

DEFAULT_VOICE = VOICES["female"]


async def generate_one(text: str, voice: str, rate: str, output_path: str) -> dict:
    """生成单条语音，返回结果信息"""
    start = time.time()
    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(output_path)
        elapsed = time.time() - start
        size = os.path.getsize(output_path)
        return {
            "path": output_path,
            "text": text[:40],
            "size": size,
            "time": elapsed,
            "ok": True,
        }
    except Exception as e:
        return {
            "path": output_path,
            "text": text[:40],
            "error": str(e),
            "ok": False,
        }


async def batch_generate(lines: list, voice: str, rate: str, output_dir: str):
    """批量生成所有行"""
    os.makedirs(output_dir, exist_ok=True)

    tasks = []
    for i, raw_line in enumerate(lines, 1):
        line = raw_line.strip()
        if not line:
            continue

        # 支持 "filename|text" 格式
        if "|" in line:
            name_part, text = line.split("|", 1)
            name_part = name_part.strip()
            text = text.strip()
            if not name_part:
                name_part = f"{i:03d}"
        else:
            name_part = f"{i:03d}"
            text = line

        # 确保文件名安全
        safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in name_part)
        output_path = os.path.join(output_dir, f"{safe_name}.mp3")

        tasks.append(generate_one(text, voice, rate, output_path))

    if not tasks:
        print("没有找到有效文本行。")
        return

    print(f"开始生成 {len(tasks)} 条语音...")
    print(f"语音：{voice}")
    print(f"语速：{rate}")
    print(f"输出：{output_dir}")
    print("---")

    results = await asyncio.gather(*tasks)

    ok_count = 0
    fail_count = 0
    total_size = 0
    total_time = 0

    for r in results:
        if r["ok"]:
            ok_count += 1
            total_size += r["size"]
            total_time += r["time"]
            size_kb = r["size"] / 1024
            print(f"  OK  {os.path.basename(r['path']):20s}  {size_kb:6.1f}KB  {r['time']:.2f}s  {r['text']}")
        else:
            fail_count += 1
            print(f"  FAIL {os.path.basename(r['path']):20s}  {r['error']}")

    print("---")
    print(f"完成！成功 {ok_count}/{ok_count + fail_count}")
    if ok_count > 0:
        print(f"总大小：{total_size / 1024:.1f}KB | 总耗时：{total_time:.1f}s | 平均：{total_time / ok_count:.2f}s/条")


def main():
    parser = argparse.ArgumentParser(
        description="搞掂粤语批量TTS生成工具（基于Edge TTS）"
    )
    parser.add_argument("input", help="输入文本文件（每行一句）")
    parser.add_argument(
        "-o", "--output", default="./tts_output", help="输出目录（默认 ./tts_output）"
    )
    parser.add_argument(
        "-v",
        "--voice",
        default=DEFAULT_VOICE,
        help=f"语音名称（默认 {DEFAULT_VOICE}）。可用：female={VOICES['female']}, male={VOICES['male']}",
    )
    parser.add_argument(
        "-r", "--rate", default="+0%", help='语速调整（默认 "+0%%"，慢速 "-20%%"，快速 "+20%%"）'
    )
    parser.add_argument(
        "--list-voices",
        action="store_true",
        help="列出所有可用的粤语语音",
    )

    args = parser.parse_args()

    # 列出语音
    if args.list_voices:
        print("推荐粤语语音：")
        for k, v in VOICES.items():
            print(f"  {k:8s} {v}")
        print("\n使用 edge-tts --list-voices 查看所有语音")
        return

    # 快捷语音名
    if args.voice in VOICES:
        args.voice = VOICES[args.voice]

    # 读取输入文件
    if not os.path.isfile(args.input):
        print(f"错误：输入文件不存在 — {args.input}")
        sys.exit(1)

    with open(args.input, "r", encoding="utf-8") as f:
        lines = f.readlines()

    asyncio.run(batch_generate(lines, args.voice, args.rate, args.output))


if __name__ == "__main__":
    main()

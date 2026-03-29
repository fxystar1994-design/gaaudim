#!/usr/bin/env python3
"""
extract_and_generate_tts.py — 从HTML提取speak()文本并批量生成Edge TTS音频
针对gaaudim-tts.js v2.0的命名规范：{series}_{linenum}.mp3
"""

import asyncio
import os
import re
import sys
import time

try:
    import edge_tts
except ImportError:
    print("错误：请先安装 edge-tts: pip install edge-tts")
    sys.exit(1)

VOICE_FEMALE = "zh-HK-HiuGaaiNeural"
VOICE_MALE = "zh-HK-WanLungNeural"
RATE = "-10%"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")

# HTML文件 → 音频目录ID的映射
FILE_MAP = {
    # EP30
    "MayJie_EP30.html": "ep30",
    # JP10
    "MayJie_JP10.html": "jp10",
    # VW10-20
    "MayJie_VW10.html": "vw10",
    "MayJie_VW11.html": "vw11",
    "MayJie_VW12.html": "vw12",
    "MayJie_VW13.html": "vw13",
    "MayJie_VW14.html": "vw14",
    "MayJie_VW15.html": "vw15",
    "MayJie_VW16.html": "vw16",
    "MayJie_VW17.html": "vw17",
    "MayJie_VW18.html": "vw18",
    "MayJie_VW19.html": "vw19",
    "MayJie_VW20.html": "vw20",
    # SZ01-10
    "MayJie_SZ01.html": "sz01",
    "MayJie_SZ02.html": "sz02",
    "MayJie_SZ03.html": "sz03",
    "MayJie_SZ04.html": "sz04",
    "MayJie_SZ05.html": "sz05",
    "MayJie_SZ06.html": "sz06",
    "MayJie_SZ07.html": "sz07",
    "MayJie_SZ08.html": "sz08",
    "MayJie_SZ09.html": "sz09",
    "MayJie_SZ10.html": "sz10",
    "MayJie_SZ_Extra_TaoCi.html": "sz_extra",
    # HKSongs EP01-10 + Extra
    "MayJie_HKSongs_EP01_V3.html": "hksongs_ep01",
    "MayJie_HKSongs_EP02.html": "hksongs_ep02",
    "MayJie_HKSongs_EP03_V3.html": "hksongs_ep03",
    "MayJie_HKSongs_EP04_V2.html": "hksongs_ep04",
    "MayJie_HKSongs_EP05_V2.html": "hksongs_ep05",
    "MayJie_HKSongs_EP06_V2.html": "hksongs_ep06",
    "MayJie_HKSongs_EP07_V2.html": "hksongs_ep07",
    "MayJie_HKSongs_EP08_V2.html": "hksongs_ep08",
    "MayJie_HKSongs_EP09_V2.html": "hksongs_ep09",
    "MayJie_HKSongs_EP10_V3.html": "hksongs_ep10",
    "MayJie_HKSongs_Extra_V2.html": "hksongs_extra",
}


def extract_speak_texts(html_path):
    """从HTML文件中提取所有speak()调用的文本，按出现顺序返回"""
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    # Match speak('text', ...) or speak("text", ...)
    pattern = r"""speak\s*\(\s*(['"])(.*?)\1"""
    texts = []
    seen = set()
    for match in re.finditer(pattern, content):
        text = match.group(2).strip()
        if text and text not in seen:
            texts.append(text)
            seen.add(text)
    return texts


async def generate_one(text, voice, rate, output_path):
    """生成单条语音"""
    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(output_path)
        size = os.path.getsize(output_path)
        return {"path": output_path, "ok": True, "size": size}
    except Exception as e:
        return {"path": output_path, "ok": False, "error": str(e)}


async def generate_series(series_id, texts):
    """为一个系列生成所有音频"""
    out_dir = os.path.join(AUDIO_DIR, series_id)
    os.makedirs(out_dir, exist_ok=True)

    tasks = []
    for i, text in enumerate(texts, 1):
        line_id = f"{i:02d}"
        filename = f"{series_id}_{line_id}.mp3"
        output_path = os.path.join(out_dir, filename)
        # Skip if already exists
        if os.path.exists(output_path) and os.path.getsize(output_path) > 100:
            print(f"  SKIP {filename} (already exists)")
            continue
        tasks.append(generate_one(text, VOICE_FEMALE, RATE, output_path))

    if not tasks:
        print(f"  All {len(texts)} files already exist, skipping.")
        return len(texts), 0

    results = await asyncio.gather(*tasks)
    ok = sum(1 for r in results if r["ok"])
    fail = sum(1 for r in results if not r["ok"])
    total_size = sum(r.get("size", 0) for r in results if r["ok"])

    for r in results:
        if r["ok"]:
            print(f"  OK  {os.path.basename(r['path']):30s}  {r['size']/1024:6.1f}KB")
        else:
            print(f"  FAIL {os.path.basename(r['path']):30s}  {r['error']}")

    return ok, fail


async def main():
    print("=" * 60)
    print("搞掂全站TTS批量生成")
    print(f"语音: {VOICE_FEMALE}")
    print(f"语速: {RATE}")
    print("=" * 60)

    total_ok = 0
    total_fail = 0
    total_series = 0
    report = []

    for html_file, series_id in FILE_MAP.items():
        html_path = os.path.join(BASE_DIR, html_file)
        if not os.path.isfile(html_path):
            print(f"\n⚠ 找不到 {html_file}，跳过")
            continue

        texts = extract_speak_texts(html_path)
        if not texts:
            print(f"\n⚠ {html_file} 无speak()调用，跳过")
            report.append(f"{series_id}: 0 sentences (no speak calls)")
            continue

        print(f"\n{'='*40}")
        print(f"[{series_id}] {html_file}")
        print(f"发现 {len(texts)} 句粤语")
        print("-" * 40)

        start = time.time()
        ok, fail = await generate_series(series_id, texts)
        elapsed = time.time() - start

        total_ok += ok
        total_fail += fail
        total_series += 1
        report.append(f"{series_id}: {len(texts)} sentences, {ok} generated, {fail} failed ({elapsed:.1f}s)")

        print(f"完成: {ok} OK / {fail} FAIL ({elapsed:.1f}s)")

    print("\n" + "=" * 60)
    print("全部完成！")
    print(f"系列数: {total_series}")
    print(f"成功: {total_ok} | 失败: {total_fail}")
    print("=" * 60)
    print("\n详细报告:")
    for line in report:
        print(f"  {line}")


if __name__ == "__main__":
    asyncio.run(main())

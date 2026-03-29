#!/usr/bin/env python3
"""
batch_tts_all.py — 全站Edge TTS批量生成
从 audio/tts_input/*.txt 读取句子，生成MP3到 audio/{episode_id}/
"""

import asyncio
import os
import sys
import glob
import time

# Edge TTS
try:
    import edge_tts
except ImportError:
    print("Installing edge-tts...")
    os.system(f"{sys.executable} -m pip install edge-tts -q")
    import edge_tts

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_DIR = os.path.join(BASE_DIR, "audio", "tts_input")
AUDIO_DIR = os.path.join(BASE_DIR, "audio")

VOICE_FEMALE = "zh-HK-HiuGaaiNeural"
RATE = "-10%"

async def generate_one(text, output_path, voice=VOICE_FEMALE, rate=RATE):
    """Generate a single MP3 file using Edge TTS."""
    comm = edge_tts.Communicate(text, voice, rate=rate)
    await comm.save(output_path)

async def process_file(input_file, series_filter=None):
    """Process one input file: read lines, generate MP3s."""
    basename = os.path.splitext(os.path.basename(input_file))[0]

    # Determine output directory
    # ep01_regen -> ep01, ep07 -> ep07, jp01 -> jp01, vw01 -> vw01
    ep_id = basename.replace("_regen", "")
    out_dir = os.path.join(AUDIO_DIR, ep_id)
    os.makedirs(out_dir, exist_ok=True)

    # Read sentences
    with open(input_file, "r", encoding="utf-8") as f:
        lines = [l.strip() for l in f if l.strip()]

    success = 0
    failed = 0
    total_size = 0

    for line in lines:
        parts = line.split("|", 1)
        if len(parts) != 2:
            continue
        line_num, text = parts

        # For ep01_regen, use different prefix to avoid overwriting existing
        if "regen" in basename:
            mp3_name = f"{ep_id}_regen_{line_num}.mp3"
        else:
            mp3_name = f"{ep_id}_{line_num}.mp3"

        output_path = os.path.join(out_dir, mp3_name)

        # Skip if already exists
        if os.path.exists(output_path) and os.path.getsize(output_path) > 100:
            success += 1
            total_size += os.path.getsize(output_path)
            continue

        try:
            await generate_one(text, output_path)
            fsize = os.path.getsize(output_path)
            total_size += fsize
            success += 1
        except Exception as e:
            print(f"  FAIL {mp3_name}: {e}")
            failed += 1

    return ep_id, success, failed, total_size, len(lines)

async def main():
    # Parse args
    series_filter = None
    if len(sys.argv) > 1:
        series_filter = sys.argv[1]  # "ep", "jp", "vw", or specific file

    # Find input files
    input_files = sorted(glob.glob(os.path.join(INPUT_DIR, "*.txt")))

    if series_filter:
        input_files = [f for f in input_files if os.path.basename(f).startswith(series_filter)]

    if not input_files:
        print(f"No input files found for filter '{series_filter}'")
        return

    print(f"=== Edge TTS Batch Generation ===")
    print(f"Voice: {VOICE_FEMALE}")
    print(f"Rate: {RATE}")
    print(f"Files to process: {len(input_files)}")
    print()

    grand_success = 0
    grand_failed = 0
    grand_size = 0
    grand_total = 0

    for i, input_file in enumerate(input_files, 1):
        fname = os.path.basename(input_file)
        print(f"[{i}/{len(input_files)}] Processing {fname}...", end=" ", flush=True)

        t0 = time.time()
        ep_id, success, failed, total_size, total_lines = await process_file(input_file)
        elapsed = time.time() - t0

        print(f"✓ {success}/{total_lines} OK, {failed} failed, {total_size/1024:.0f}KB, {elapsed:.1f}s")

        grand_success += success
        grand_failed += failed
        grand_size += total_size
        grand_total += total_lines

    print()
    print(f"=== DONE ===")
    print(f"Total: {grand_success}/{grand_total} generated, {grand_failed} failed")
    print(f"Total size: {grand_size/1024/1024:.1f} MB")

if __name__ == "__main__":
    asyncio.run(main())

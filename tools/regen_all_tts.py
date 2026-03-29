#!/usr/bin/env python3
"""
Regenerate ALL TTS audio files with correct naming for gaaudim-tts.js.

gaaudim-tts.js builds a manifest by scanning speak('text') buttons in order,
assigning sequential numbers: ep01_01.mp3, ep01_02.mp3, etc.

This script does the same extraction, then generates MP3s with matching names.
"""

import re
import os
import sys
import glob
import asyncio
import edge_tts

VOICE_FEMALE = "zh-HK-HiuGaaiNeural"
RATE = "-10%"
AUDIO_BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "audio")
HTML_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Episode ID extraction (mirrors gaaudim-tts.js getEpisodeId)
def get_episode_id(filename):
    name = os.path.splitext(os.path.basename(filename))[0].lower()
    m = re.search(r'mayjie_ep(\d+)', name, re.I)
    if m:
        return 'ep' + m.group(1).zfill(2)
    m = re.search(r'mayjie_jp(\d+)', name, re.I)
    if m:
        return 'jp' + m.group(1).zfill(2)
    m = re.search(r'mayjie_vw(\d+)', name, re.I)
    if m:
        return 'vw' + m.group(1).zfill(2)
    m = re.search(r'mayjie_sz(\d+)', name, re.I)
    if m:
        return 'sz' + m.group(1).zfill(2)
    m = re.search(r'mayjie_hksongs_ep(\d+)', name, re.I)
    if m:
        return 'hksongs_ep' + m.group(1).zfill(2)
    if re.search(r'mayjie_jp_extra', name, re.I):
        return 'jp_extra'
    if re.search(r'mayjie_vw_extra', name, re.I):
        return 'vw_extra'
    return None


def extract_speak_texts(html_path):
    """Extract unique speak texts in page order (mirrors buildManifest in JS)."""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    matches = re.findall(r"speak\s*\(\s*['\"]([^'\"]+)['\"]", content)
    unique = []
    seen = set()
    for text in matches:
        if text not in seen:
            unique.append(text)
            seen.add(text)
    return unique


async def generate_mp3(text, output_path, voice=VOICE_FEMALE, rate=RATE):
    """Generate a single MP3 file using edge-tts."""
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(output_path)


async def process_episode(html_path, dry_run=False):
    """Process one HTML file: extract texts, generate MP3s."""
    ep_id = get_episode_id(html_path)
    if not ep_id:
        return None, 0, 0

    texts = extract_speak_texts(html_path)
    if not texts:
        return ep_id, 0, 0

    ep_dir = os.path.join(AUDIO_BASE, ep_id)
    os.makedirs(ep_dir, exist_ok=True)

    generated = 0
    skipped = 0

    for i, text in enumerate(texts, 1):
        line_id = str(i).zfill(2)
        filename = f"{ep_id}_{line_id}.mp3"
        filepath = os.path.join(ep_dir, filename)

        if os.path.exists(filepath):
            skipped += 1
            continue

        if dry_run:
            print(f"  [DRY] {filename}: {text[:40]}")
            generated += 1
            continue

        try:
            await generate_mp3(text, filepath)
            generated += 1
        except Exception as e:
            print(f"  [ERR] {filename}: {e}")

    return ep_id, generated, skipped


async def main():
    dry_run = '--dry-run' in sys.argv
    skip_existing = '--force' not in sys.argv

    # Find all HTML files with speak buttons
    html_files = sorted(glob.glob(os.path.join(HTML_DIR, "MayJie_*.html")))

    print(f"Found {len(html_files)} HTML files")
    print(f"Audio base: {AUDIO_BASE}")
    print(f"Mode: {'DRY RUN' if dry_run else 'GENERATE'}")
    print(f"Skip existing: {skip_existing}")
    print("=" * 60)

    total_gen = 0
    total_skip = 0

    for html_path in html_files:
        basename = os.path.basename(html_path)
        ep_id, gen, skip = await process_episode(html_path, dry_run)
        if ep_id:
            texts = extract_speak_texts(html_path)
            status = f"gen={gen} skip={skip}" if skip_existing else f"gen={gen}"
            print(f"  {ep_id}: {len(texts)} texts → {status}")
            total_gen += gen
            total_skip += skip

    print("=" * 60)
    print(f"Total: generated={total_gen}, skipped={total_skip}")


if __name__ == "__main__":
    asyncio.run(main())

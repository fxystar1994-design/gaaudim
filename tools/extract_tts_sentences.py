#!/usr/bin/env python3
"""
Extract Cantonese TTS sentences from MayJie HTML lesson files.
Scans onclick="speak('TEXT', this)" patterns and outputs one text file per episode.
"""

import os
import re
import glob
from collections import OrderedDict

BASE_DIR = "/Users/fxystar/Downloads/gaaudim_with_GA"
OUTPUT_DIR = os.path.join(BASE_DIR, "audio", "tts_input")

os.makedirs(OUTPUT_DIR, exist_ok=True)

def extract_speak_texts(html_path):
    """Extract all text from speak('TEXT', this) patterns in an HTML file."""
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    # Match speak('...', this) with single quotes
    matches = re.findall(r"speak\('([^']+)',\s*this\)", content)
    return matches

def classify_file(filename):
    """Determine the episode_id and series from a filename."""
    basename = os.path.basename(filename)

    # HKSongs - must check before EP pattern
    m = re.match(r"MayJie_HKSongs_EP(\d+)", basename)
    if m:
        num = int(m.group(1))
        return f"hksongs_ep{num:02d}", "HKSongs", num

    m = re.match(r"MayJie_HKSongs_Extra", basename)
    if m:
        return "hksongs_extra", "HKSongs", 99

    # EP series
    m = re.match(r"MayJie_EP(\d+)", basename)
    if m:
        num = int(m.group(1))
        return f"ep{num:02d}", "EP", num

    # JP series
    m = re.match(r"MayJie_JP(\d+)", basename)
    if m:
        num = int(m.group(1))
        return f"jp{num:02d}", "JP", num

    m = re.match(r"MayJie_JP_Extra", basename)
    if m:
        return "jp_extra", "JP", 99

    # VW series
    m = re.match(r"MayJie_VW(\d+)", basename)
    if m:
        num = int(m.group(1))
        return f"vw{num:02d}", "VW", num

    # SZ series
    m = re.match(r"MayJie_SZ(\d+)", basename)
    if m:
        num = int(m.group(1))
        return f"sz{num:02d}", "SZ", num

    return None, None, None

def main():
    html_files = sorted(glob.glob(os.path.join(BASE_DIR, "MayJie_*.html")))

    series_counts = OrderedDict()
    total_sentences = 0
    files_processed = 0
    ep01_sentences = []

    for html_path in html_files:
        episode_id, series, num = classify_file(html_path)
        if episode_id is None:
            print(f"  SKIP (unrecognized): {os.path.basename(html_path)}")
            continue

        sentences = extract_speak_texts(html_path)
        if not sentences:
            print(f"  SKIP (no sentences): {os.path.basename(html_path)}")
            continue

        # EP01: extract separately to ep01_regen.txt
        if series == "EP" and num == 1:
            ep01_sentences = sentences
            # Write ep01_regen.txt
            out_path = os.path.join(OUTPUT_DIR, "ep01_regen.txt")
            with open(out_path, "w", encoding="utf-8") as f:
                for i, text in enumerate(sentences, 1):
                    f.write(f"{i:02d}|{text}\n")
            print(f"  EP01 -> ep01_regen.txt ({len(sentences)} sentences)")
            series_counts.setdefault("EP (ep01_regen)", 0)
            series_counts["EP (ep01_regen)"] += len(sentences)
            total_sentences += len(sentences)
            files_processed += 1
            continue

        # Skip EP02-EP06 (already have audio)
        if series == "EP" and 2 <= num <= 6:
            print(f"  SKIP (already have audio): {os.path.basename(html_path)}")
            continue

        # Write output file
        out_path = os.path.join(OUTPUT_DIR, f"{episode_id}.txt")
        with open(out_path, "w", encoding="utf-8") as f:
            for i, text in enumerate(sentences, 1):
                f.write(f"{i:02d}|{text}\n")

        print(f"  {episode_id}.txt <- {os.path.basename(html_path)} ({len(sentences)} sentences)")
        series_counts.setdefault(series, 0)
        series_counts[series] += len(sentences)
        total_sentences += len(sentences)
        files_processed += 1

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for series_name, count in series_counts.items():
        print(f"  {series_name:20s}: {count:4d} sentences")
    print(f"  {'TOTAL':20s}: {total_sentences:4d} sentences")
    print(f"  Files processed: {files_processed}")
    print(f"  Output directory: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()

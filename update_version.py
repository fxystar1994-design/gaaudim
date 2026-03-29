#!/usr/bin/env python3
"""Replace ?v=3.3 with ?v=3.4 in script src attributes across all HTML files."""

import glob
import os
import re

directory = os.path.dirname(os.path.abspath(__file__))
html_files = glob.glob(os.path.join(directory, "*.html"))

modified_count = 0
total_replacements = 0

for filepath in sorted(html_files):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content.replace("?v=3.3", "?v=3.4")

    if new_content != content:
        replacements = content.count("?v=3.3")
        total_replacements += replacements
        modified_count += 1
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  Modified: {os.path.basename(filepath)} ({replacements} replacements)")

print(f"\nDone. {modified_count} files modified, {total_replacements} total replacements.")

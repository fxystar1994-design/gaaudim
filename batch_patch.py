#!/usr/bin/env python3
"""Batch patch script for gaaudim HTML files."""
import os
import re
import glob

BASE = os.path.dirname(os.path.abspath(__file__))

# Collect all HTML files
all_html = sorted(glob.glob(os.path.join(BASE, '*.html')))
mayjie_html = [f for f in all_html if os.path.basename(f).startswith('MayJie_')]

print(f"Total HTML files: {len(all_html)}")
print(f"MayJie HTML files: {len(mayjie_html)}")
print()

# ── Task 1: Replace TTS toast text ──
tts_pattern = re.compile(
    r"'🔊 粤语发音已就绪（'\s*\+\s*ttsVoice\.lang\s*\+\s*'）'"
)
tts_replacement = "'🎧 高清粤语发音已就绪'"

tts_modified = []
for fpath in all_html:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = tts_pattern.sub(tts_replacement, content)
    if new_content != content:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count = len(tts_pattern.findall(content))
        tts_modified.append((os.path.basename(fpath), count))

print(f"[Task 1] TTS toast replaced in {len(tts_modified)} files:")
for name, count in tts_modified:
    print(f"  {name} ({count} occurrence(s))")
print()

# ── Task 2: Inject gaaudim-tts.js into MayJie_*.html ──
tts_script_tag = '<script src="gaaudim-tts.js?v=3.3"></script>'
tts_injected = []

for fpath in mayjie_html:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'gaaudim-tts.js' in content:
        continue
    # Try inserting before </body>
    if '</body>' in content:
        new_content = content.replace('</body>', tts_script_tag + '\n</body>', 1)
    else:
        # Insert before the last </script>
        idx = content.rfind('</script>')
        if idx != -1:
            new_content = content[:idx] + '</script>\n' + tts_script_tag + '\n' + content[idx + len('</script>'):]
        else:
            print(f"  WARNING: No </body> or </script> found in {os.path.basename(fpath)}, skipping")
            continue
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    tts_injected.append(os.path.basename(fpath))

print(f"[Task 2] gaaudim-tts.js injected into {len(tts_injected)} MayJie files:")
for name in tts_injected:
    print(f"  {name}")
print()

# ── Task 3: Inject OG image tags ──
og_tags = """<meta property="og:image" content="https://gaaudim.com/images/og-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://gaaudim.com/images/og-card.png">"""

og_injected = []
for fpath in all_html:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'og-card.png' in content:
        continue
    # Insert before </head>
    if '</head>' in content:
        new_content = content.replace('</head>', og_tags + '\n</head>', 1)
    else:
        print(f"  WARNING: No </head> found in {os.path.basename(fpath)}, skipping OG injection")
        continue
    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    og_injected.append(os.path.basename(fpath))

print(f"[Task 3] OG image tags injected into {len(og_injected)} files:")
for name in og_injected:
    print(f"  {name}")
print()

print("Done!")

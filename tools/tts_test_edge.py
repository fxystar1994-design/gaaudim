#!/usr/bin/env python3
"""Edge TTS test — 18 sentences with zh-HK-HiuGaaiNeural"""

import asyncio, os, edge_tts

VOICE = "zh-HK-HiuGaaiNeural"
RATE = "-10%"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "audio", "test_edge")

TEST_SENTENCES = [
    {"id": "tone_01", "text": "詩", "jyutping": "si1", "note": "第1声-高平"},
    {"id": "tone_02", "text": "史", "jyutping": "si2", "note": "第2声-高升"},
    {"id": "tone_03", "text": "試", "jyutping": "si3", "note": "第3声-中平"},
    {"id": "tone_04", "text": "時", "jyutping": "si4", "note": "第4声-低降"},
    {"id": "tone_05", "text": "市", "jyutping": "si5", "note": "第5声-低升"},
    {"id": "tone_06", "text": "事", "jyutping": "si6", "note": "第6声-低平"},
    {"id": "rush_p1", "text": "十", "jyutping": "sap6"},
    {"id": "rush_t1", "text": "一", "jyutping": "jat1"},
    {"id": "rush_t2", "text": "八", "jyutping": "baat3"},
    {"id": "rush_k1", "text": "百", "jyutping": "baak3"},
    {"id": "rush_k2", "text": "六", "jyutping": "luk6"},
    {"id": "flow_01", "text": "三碗半牛腩面"},
    {"id": "flow_02", "text": "今日天氣好好"},
    {"id": "flow_03", "text": "你食咗飯未呀？"},
    {"id": "flow_04", "text": "唔該你幫我攞杯水"},
    {"id": "teach_01", "text": "歡迎嚟到粵語課堂！今日我哋學聲調。粵語有九聲六調，比普通話多好多。"},
    {"id": "teach_02", "text": "第一聲係高平調，好似唱歌嘅時候保持一個高音。例如：詩、衣、夫。"},
    {"id": "teach_03", "text": "入聲係粵語最特別嘅地方。收尾好快，好似突然停咗噉。例如：一、八、百。"},
]

async def generate(sentence):
    out_path = os.path.join(OUT_DIR, f"{sentence['id']}.mp3")
    try:
        communicate = edge_tts.Communicate(sentence["text"], VOICE, rate=RATE)
        await communicate.save(out_path)
        size_kb = os.path.getsize(out_path) / 1024
        print(f"✅ {sentence['id']:12s} | {sentence['text']:20s} | {size_kb:.1f}KB")
        return True
    except Exception as e:
        print(f"❌ {sentence['id']:12s} | {sentence['text']:20s} | ERROR: {e}")
        return False

async def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"=== Edge TTS Test ===")
    print(f"Voice: {VOICE}")
    print(f"Rate: {RATE}")
    print(f"Output: {OUT_DIR}")
    print(f"{'='*60}")

    ok = 0
    for s in TEST_SENTENCES:
        if await generate(s):
            ok += 1

    print(f"\n{'='*60}")
    print(f"Result: {ok}/18 success")

    total_size = sum(os.path.getsize(os.path.join(OUT_DIR, f))
                     for f in os.listdir(OUT_DIR) if f.endswith('.mp3'))
    print(f"Total size: {total_size/1024:.1f}KB")

if __name__ == "__main__":
    asyncio.run(main())

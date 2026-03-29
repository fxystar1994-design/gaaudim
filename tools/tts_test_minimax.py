#!/usr/bin/env python3
"""MiniMax Speech-02-HD TTS test — 18 sentences with language_boost=zh-yue"""

import requests, json, os, time

API_KEY = "sk-api-jDq7E2fvgeYi-DylFdHqmHr_FYAzK1tHzDErj2oAn3A2P3pWi1EmN3O2UCyGM9Vba2bSxmU7bM0G93VEGAzjLS3TbaBOTdcJ2krsXmHOqIXff0CqpF8VV38"
GROUP_ID = "2038242814109683786"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "audio", "test_minimax")

# Try multiple female voices to find the best one
VOICE_ID = "Wise_Woman"  # Warm, mature female — closest to May姐 persona

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

def generate(sentence):
    url = f"https://api.minimax.chat/v1/t2a_v2?GroupId={GROUP_ID}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "speech-02-hd",
        "text": sentence["text"],
        "stream": False,
        "voice_setting": {
            "voice_id": VOICE_ID,
            "speed": 0.9,
            "vol": 1.0,
            "pitch": 0,
            "emotion": "neutral",
            "language_boost": "zh-yue"
        },
        "audio_setting": {
            "sample_rate": 32000,
            "format": "mp3"
        }
    }

    out_path = os.path.join(OUT_DIR, f"{sentence['id']}.mp3")
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        data = resp.json()
        if "data" in data and "audio" in data["data"]:
            audio_bytes = bytes.fromhex(data["data"]["audio"])
            with open(out_path, "wb") as f:
                f.write(audio_bytes)
            size_kb = len(audio_bytes) / 1024
            print(f"✅ {sentence['id']:12s} | {sentence['text']:20s} | {size_kb:.1f}KB")
            return True
        else:
            error_msg = data.get("base_resp", {}).get("status_msg", str(data))
            print(f"❌ {sentence['id']:12s} | {sentence['text']:20s} | ERROR: {error_msg}")
            return False
    except Exception as e:
        print(f"❌ {sentence['id']:12s} | EXCEPTION: {e}")
        return False

if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    print(f"=== MiniMax Speech-02-HD Test ===")
    print(f"Voice: {VOICE_ID}")
    print(f"language_boost: zh-yue ✅")
    print(f"Output: {OUT_DIR}")
    print(f"{'='*60}")

    ok = 0
    fail = 0
    for s in TEST_SENTENCES:
        if generate(s):
            ok += 1
        else:
            fail += 1
        time.sleep(0.5)  # Rate limit safety

    print(f"\n{'='*60}")
    print(f"Result: {ok}/18 success, {fail}/18 failed")

    # List generated files with sizes
    total_size = 0
    for f in sorted(os.listdir(OUT_DIR)):
        if f.endswith('.mp3'):
            size = os.path.getsize(os.path.join(OUT_DIR, f))
            total_size += size
    print(f"Total size: {total_size/1024:.1f}KB")

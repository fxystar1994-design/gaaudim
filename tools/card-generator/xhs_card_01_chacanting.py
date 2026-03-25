#!/usr/bin/env python3
"""
小红书卡片生成器 — 笔记1：茶餐厅生存战
8张卡片 (1242×1660px) HTML渲染 + Playwright截图
"""

from playwright.sync_api import sync_playwright
from pathlib import Path
import html as html_mod

OUTPUT_DIR = Path("/Users/fxystar/.openclaw/workspace/assets/xhs-cards-v5")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# 通用CSS
BASE_CSS = """
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    width: 1242px; height: 1660px;
    font-family: -apple-system, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
    overflow: hidden;
    position: relative;
}
.page-num { position: absolute; top: 40px; left: 50px; font-size: 28px; color: rgba(0,0,0,0.3); font-weight: 600; }
.watermark { position: absolute; bottom: 40px; right: 50px; font-size: 24px; color: rgba(0,0,0,0.25); font-weight: 500; }
"""

CARDS = []

# ==================== 封面 (01/08) ====================
CARDS.append({
    "filename": "card_01_cover.png",
    "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
{BASE_CSS}
body {{
    background: linear-gradient(180deg, #FFF3E0 0%, #FFE0B2 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center;
}}
.emoji-top {{ font-size: 96px; margin-bottom: 30px; }}
.title {{ font-size: 72px; font-weight: 900; color: #1C1C2E; line-height: 1.3; padding: 0 80px; }}
.subtitle {{ font-size: 36px; color: #E84545; margin-top: 24px; font-weight: 600; }}
.desc {{ font-size: 30px; color: #666; margin-top: 40px; padding: 0 100px; line-height: 1.6; }}
.emoji-deco {{ font-size: 72px; margin-top: 50px; }}
.brand {{ position: absolute; bottom: 80px; font-size: 32px; color: #C49A6C; font-weight: 700; }}
</style></head><body>
<div class="page-num">01/08</div>
<div class="emoji-top">🍜☕🫖</div>
<div class="title">茶餐厅8句<br>救命粤语</div>
<div class="subtitle">学会再也不被阿姐凶</div>
<div class="desc">来香港第一课<br>不是办八达通<br>是学会在茶餐厅生存</div>
<div class="emoji-deco">🙋‍♀️👩‍🍳</div>
<div class="brand">@May姐教粤语</div>
<div class="watermark">搞掂粤语 gaaudim.com</div>
</body></html>"""
})

# ==================== 内页2 (02/08) 入座+点餐 ====================
def bubble_page(page_num, bg_start, bg_end, items, tip_text, tip_emoji="💡"):
    """生成对话气泡内页"""
    bubbles_html = ""
    for item in items:
        if item["speaker"] == "you":
            bubbles_html += f"""
            <div class="bubble-row right">
                <div class="bubble green">
                    <div class="cantonese">{html_mod.escape(item['cantonese'])}</div>
                    <div class="jyutping">{html_mod.escape(item.get('jyutping',''))}</div>
                    <div class="mandarin">{html_mod.escape(item['mandarin'])}</div>
                </div>
                <div class="avatar">🙋‍♀️</div>
            </div>"""
        else:
            bubbles_html += f"""
            <div class="bubble-row left">
                <div class="avatar">👩‍🍳</div>
                <div class="bubble white">
                    <div class="cantonese">{html_mod.escape(item['cantonese'])}</div>
                    <div class="jyutping">{html_mod.escape(item.get('jyutping',''))}</div>
                    <div class="mandarin">{html_mod.escape(item['mandarin'])}</div>
                </div>
            </div>"""

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
{BASE_CSS}
body {{
    background: linear-gradient(180deg, {bg_start} 0%, {bg_end} 100%);
    padding: 100px 60px 120px;
}}
.bubble-row {{ display: flex; align-items: flex-start; margin-bottom: 35px; }}
.bubble-row.right {{ justify-content: flex-end; }}
.bubble-row.left {{ justify-content: flex-start; }}
.avatar {{ font-size: 56px; margin: 0 16px; flex-shrink: 0; }}
.bubble {{
    max-width: 850px; padding: 32px 40px; border-radius: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}}
.bubble.green {{ background: #95EC69; border-top-right-radius: 6px; }}
.bubble.white {{ background: #FFFFFF; border-top-left-radius: 6px; }}
.cantonese {{ font-size: 48px; font-weight: 700; color: #1C1C2E; line-height: 1.4; }}
.jyutping {{ font-size: 24px; color: #999; margin-top: 8px; font-family: monospace; }}
.mandarin {{ font-size: 28px; color: #666; margin-top: 10px; line-height: 1.4; }}
.tip-box {{
    position: absolute; bottom: 120px; left: 60px; right: 60px;
    background: rgba(28,28,46,0.9); border-radius: 20px; padding: 30px 40px;
    color: #fff;
}}
.tip-box .emoji {{ font-size: 36px; }}
.tip-box .text {{ font-size: 26px; line-height: 1.5; margin-top: 10px; }}
</style></head><body>
<div class="page-num">{page_num}/08</div>
{bubbles_html}
<div class="tip-box">
    <span class="emoji">{tip_emoji}</span>
    <div class="text">{html_mod.escape(tip_text)}</div>
</div>
<div class="watermark">@May姐教粤语</div>
</body></html>"""


# Card 2: 入座+点餐
CARDS.append({
    "filename": "card_02_seat_order.png",
    "html": bubble_page("02", "#FFF8E1", "#FFF3E0", [
        {"speaker": "you", "cantonese": "唔该，呢度有冇位？", "jyutping": "m4 goi1, ni1 dou6 jau5 mou5 wai2?", "mandarin": "请问，这里有没有位子？"},
        {"speaker": "sister", "cantonese": "坐呢边！食乜嘢呀？", "jyutping": "co5 ni1 bin1! sik6 mat1 je5 aa3?", "mandarin": "坐这边！吃什么？"},
        {"speaker": "you", "cantonese": "唔该，要个A餐。", "jyutping": "m4 goi1, jiu3 go3 A caan1.", "mandarin": "请给我一个A餐。"},
    ], "香港茶餐厅是搭台文化，不用等位直接找空位坐。说编号+餐就够了，简洁就是礼貌。")
})

# Card 3: 饮品+走字
CARDS.append({
    "filename": "card_03_drinks.png",
    "html": bubble_page("03", "#E8F5E9", "#C8E6C9", [
        {"speaker": "you", "cantonese": "冻柠茶走甜。", "jyutping": "dung3 ning4 caa4 zau2 tim4.", "mandarin": "冰柠檬茶去糖。"},
        {"speaker": "sister", "cantonese": "走甜定少甜？", "jyutping": "zau2 tim4 ding6 siu2 tim4?", "mandarin": "去糖还是少糖？"},
        {"speaker": "you", "cantonese": "走甜！", "jyutping": "zau2 tim4!", "mandarin": "去糖！"},
    ], "「走」= 去掉/不要。走甜=去糖，走冰=去冰，走辣=不辣。这个「走」字救命用！", "🔑")
})

# Card 4: 加单+菠萝油
CARDS.append({
    "filename": "card_04_add_order.png",
    "html": bubble_page("04", "#FFF9C4", "#FFF176", [
        {"speaker": "you", "cantonese": "唔该，加个菠萝油。", "jyutping": "m4 goi1, gaa1 go3 bo1 lo4 jau4.", "mandarin": "麻烦加一个菠萝油。"},
        {"speaker": "sister", "cantonese": "好！仲有冇嘢食？", "jyutping": "hou2! zung6 jau5 mou5 je5 sik6?", "mandarin": "好！还有别的吗？"},
        {"speaker": "you", "cantonese": "够啦，唔该！", "jyutping": "gau3 laa1, m4 goi1!", "mandarin": "够了，谢谢！"},
    ], "菠萝油 = 菠萝包+牛油，不是菠萝味的油！外脆内软、牛油融化的那一刻是真正的幸福。", "🍞")
})

# Card 5: 催单
CARDS.append({
    "filename": "card_05_rush.png",
    "html": bubble_page("05", "#FCE4EC", "#F8BBD0", [
        {"speaker": "you", "cantonese": "唔该，我个餐几时有啊？", "jyutping": "m4 goi1, ngo5 go3 caan1 gei2 si4 jau5 aa3?", "mandarin": "请问我的餐什么时候好？"},
        {"speaker": "sister", "cantonese": "等多阵啦！", "jyutping": "dang2 do1 zan6 laa1!", "mandarin": "再等一会儿！"},
    ], "语气温和但直接，香港人不喜欢绕弯子。「几时有」比「请问还要多久」更地道。", "⏰")
})

# Card 6: 埋单+打包
CARDS.append({
    "filename": "card_06_bill.png",
    "html": bubble_page("06", "#E3F2FD", "#BBDEFB", [
        {"speaker": "you", "cantonese": "唔该，埋单。", "jyutping": "m4 goi1, maai4 daan1.", "mandarin": "请结账。"},
        {"speaker": "sister", "cantonese": "一共五十二蚊。", "jyutping": "jat1 gung6 ng5 sap6 ji6 man1.", "mandarin": "一共52元。"},
        {"speaker": "you", "cantonese": "呢个帮我打包。", "jyutping": "ni1 go3 bong1 ngo5 daa2 baau1.", "mandarin": "这个帮我打包。"},
    ], "「埋单」是最经典的结账用语。有些茶餐厅要去收银台埋单。打包通常+1-2元。", "💰")
})

# Card 7: 好好食+完整点餐
CARDS.append({
    "filename": "card_07_complete.png",
    "html": bubble_page("07", "#F3E5F5", "#E1BEE7", [
        {"speaker": "you", "cantonese": "好好食啊！", "jyutping": "hou2 hou2 sik6 aa3!", "mandarin": "好好吃啊！"},
        {"speaker": "sister", "cantonese": "多谢！下次再嚟！", "jyutping": "do1 ze6! haa6 ci3 zoi3 lai4!", "mandarin": "谢谢！下次再来！"},
    ], "阿姐听到「好好食」会对你笑的。一句夸奖换来的是下次点餐的笑脸服务。", "😊")
})

# Card 8: 互动结尾
CARDS.append({
    "filename": "card_08_cta.png",
    "html": f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
{BASE_CSS}
body {{
    background: linear-gradient(180deg, #FFF3E0 0%, #FFE0B2 50%, #E84545 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 80px;
}}
.emoji-big {{ font-size: 96px; margin-bottom: 40px; }}
.title {{ font-size: 56px; font-weight: 900; color: #1C1C2E; line-height: 1.4; }}
.subtitle {{ font-size: 36px; color: #fff; margin-top: 30px; font-weight: 600;
    background: rgba(232,69,69,0.9); padding: 16px 40px; border-radius: 40px; }}
.tips-box {{
    background: rgba(255,255,255,0.95); border-radius: 24px; padding: 40px 50px;
    margin-top: 50px; text-align: left; width: 100%;
}}
.tips-box h3 {{ font-size: 36px; color: #E84545; margin-bottom: 20px; }}
.tips-box p {{ font-size: 28px; color: #333; line-height: 1.8; }}
.cta {{
    margin-top: 50px; font-size: 32px; color: #fff; font-weight: 700;
    background: #E84545; padding: 24px 60px; border-radius: 50px;
    box-shadow: 0 8px 24px rgba(232,69,69,0.4);
}}
.brand {{ position: absolute; bottom: 60px; font-size: 36px; color: rgba(255,255,255,0.9); font-weight: 700; }}
</style></head><body>
<div class="page-num" style="color:rgba(0,0,0,0.3)">08/08</div>
<div class="emoji-big">🎉🍜✨</div>
<div class="title">恭喜你学会了<br>茶餐厅生存8句！</div>
<div class="tips-box">
    <h3>📝 快速复习</h3>
    <p>① 唔该 — 万能礼貌词<br>
    ② 走糖/走冰/走辣 — 去掉不要<br>
    ③ 同埋 — 还有/和<br>
    ④ 埋单 — 结账<br>
    ⑤ 好好食 — 好好吃</p>
</div>
<div class="subtitle">评论区回「茶餐厅」获取完整学习卡片</div>
<div class="cta">关注 @May姐教粤语 下期见！</div>
<div class="brand">搞掂粤语 gaaudim.com</div>
</body></html>"""
})


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True
        )
        page = browser.new_page(viewport={"width": 1242, "height": 1660})

        for i, card in enumerate(CARDS):
            page.set_content(card["html"], wait_until="networkidle")
            output_path = OUTPUT_DIR / card["filename"]
            page.screenshot(path=str(output_path), full_page=False)
            size_kb = output_path.stat().st_size / 1024
            print(f"  ✓ {card['filename']} ({size_kb:.0f}KB)")

        browser.close()
        print(f"\n完成！{len(CARDS)}张卡片保存到 {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

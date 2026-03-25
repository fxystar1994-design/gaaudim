#!/usr/bin/env python3
"""
card_templates.py — 搞掂粤语小红书卡片模板引擎
三种模板：封面 / 内页（对话气泡）/ 互动结尾页
输入 JSON 数据即可批量生成整套卡片
"""

import html as html_mod

# ============================================================
# 通用 CSS
# ============================================================
BASE_CSS = """
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    width: 1242px; height: 1660px;
    font-family: -apple-system, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
    overflow: hidden; position: relative;
}
.page-num { position: absolute; top: 40px; left: 50px; font-size: 28px; color: rgba(0,0,0,0.3); font-weight: 600; }
.watermark { position: absolute; bottom: 40px; right: 50px; font-size: 24px; color: rgba(0,0,0,0.25); font-weight: 500; }
"""


def render_cover(data: dict) -> str:
    """
    封面模板
    data = {
        "page_num": "01/08",
        "total_pages": 8,
        "bg_start": "#FFF3E0",
        "bg_end": "#FFE0B2",
        "emoji_top": "🍜☕🫖",
        "title": "茶餐厅8句\\n救命粤语",
        "title_color": "#1C1C2E",
        "subtitle": "学会再也不被阿姐凶",
        "subtitle_color": "#E84545",
        "desc": "来香港第一课...",
        "emoji_deco": "🙋‍♀️👩‍🍳",
        "brand_color": "#C49A6C"
    }
    """
    title_html = data["title"].replace("\\n", "<br>").replace("\n", "<br>")
    desc_html = data.get("desc", "").replace("\\n", "<br>").replace("\n", "<br>")

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
{BASE_CSS}
body {{
    background: linear-gradient(180deg, {data['bg_start']} 0%, {data['bg_end']} 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center;
}}
.emoji-top {{ font-size: 96px; margin-bottom: 30px; }}
.title {{ font-size: 72px; font-weight: 900; color: {data.get('title_color','#1C1C2E')}; line-height: 1.3; padding: 0 80px; }}
.subtitle {{ font-size: 36px; color: {data.get('subtitle_color','#E84545')}; margin-top: 24px; font-weight: 600; }}
.desc {{ font-size: 30px; color: #666; margin-top: 40px; padding: 0 100px; line-height: 1.6; }}
.emoji-deco {{ font-size: 72px; margin-top: 50px; }}
.brand {{ position: absolute; bottom: 80px; font-size: 32px; color: {data.get('brand_color','#C49A6C')}; font-weight: 700; }}
</style></head><body>
<div class="page-num">{data['page_num']}</div>
<div class="emoji-top">{data.get('emoji_top','')}</div>
<div class="title">{title_html}</div>
<div class="subtitle">{html_mod.escape(data.get('subtitle',''))}</div>
<div class="desc">{desc_html}</div>
<div class="emoji-deco">{data.get('emoji_deco','')}</div>
<div class="brand">@May姐教粤语</div>
<div class="watermark">搞掂粤语 gaaudim.com</div>
</body></html>"""


def render_bubble_page(data: dict) -> str:
    """
    内页对话气泡模板
    data = {
        "page_num": "02/08",
        "bg_start": "#FFF8E1",
        "bg_end": "#FFF3E0",
        "bubbles": [
            {"speaker": "you"|"other", "cantonese": "...", "jyutping": "...", "mandarin": "..."}
        ],
        "tip_emoji": "💡",
        "tip_text": "..."
    }
    """
    bubbles_html = ""
    for item in data["bubbles"]:
        jyutping_line = f'<div class="jyutping">{html_mod.escape(item.get("jyutping",""))}</div>' if item.get("jyutping") else ""
        if item["speaker"] == "you":
            bubbles_html += f"""
            <div class="bubble-row right">
                <div class="bubble green">
                    <div class="cantonese">{html_mod.escape(item['cantonese'])}</div>
                    {jyutping_line}
                    <div class="mandarin">{html_mod.escape(item['mandarin'])}</div>
                </div>
                <div class="avatar">🙋‍♀️</div>
            </div>"""
        else:
            avatar = item.get("avatar", "👩‍🍳")
            bubbles_html += f"""
            <div class="bubble-row left">
                <div class="avatar">{avatar}</div>
                <div class="bubble white">
                    <div class="cantonese">{html_mod.escape(item['cantonese'])}</div>
                    {jyutping_line}
                    <div class="mandarin">{html_mod.escape(item['mandarin'])}</div>
                </div>
            </div>"""

    tip_html = ""
    if data.get("tip_text"):
        tip_html = f"""
        <div class="tip-box">
            <span class="emoji">{data.get('tip_emoji','💡')}</span>
            <div class="text">{html_mod.escape(data['tip_text'])}</div>
        </div>"""

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
{BASE_CSS}
body {{
    background: linear-gradient(180deg, {data['bg_start']} 0%, {data['bg_end']} 100%);
    padding: 100px 60px 120px;
}}
.bubble-row {{ display: flex; align-items: flex-start; margin-bottom: 35px; }}
.bubble-row.right {{ justify-content: flex-end; }}
.bubble-row.left {{ justify-content: flex-start; }}
.avatar {{ font-size: 56px; margin: 0 16px; flex-shrink: 0; }}
.bubble {{ max-width: 850px; padding: 32px 40px; border-radius: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
.bubble.green {{ background: #95EC69; border-top-right-radius: 6px; }}
.bubble.white {{ background: #FFFFFF; border-top-left-radius: 6px; }}
.cantonese {{ font-size: 48px; font-weight: 700; color: #1C1C2E; line-height: 1.4; }}
.jyutping {{ font-size: 24px; color: #999; margin-top: 8px; font-family: monospace; }}
.mandarin {{ font-size: 28px; color: #666; margin-top: 10px; line-height: 1.4; }}
.tip-box {{
    position: absolute; bottom: 120px; left: 60px; right: 60px;
    background: rgba(28,28,46,0.9); border-radius: 20px; padding: 30px 40px; color: #fff;
}}
.tip-box .emoji {{ font-size: 36px; }}
.tip-box .text {{ font-size: 26px; line-height: 1.5; margin-top: 10px; }}
</style></head><body>
<div class="page-num">{data['page_num']}</div>
{bubbles_html}
{tip_html}
<div class="watermark">@May姐教粤语</div>
</body></html>"""


def render_cta_page(data: dict) -> str:
    """
    互动结尾页模板
    data = {
        "page_num": "08/08",
        "bg_start": "#FFF3E0",
        "bg_mid": "#FFE0B2",
        "bg_end": "#E84545",
        "emoji_big": "🎉🍜✨",
        "title": "恭喜你学会了\\n茶餐厅生存8句！",
        "review_items": ["① 唔该 — 万能礼貌词", ...],
        "cta_keyword": "茶餐厅",
        "cta_text": "评论区回「茶餐厅」获取完整学习卡片"
    }
    """
    title_html = data["title"].replace("\\n", "<br>").replace("\n", "<br>")
    review_html = "<br>".join(html_mod.escape(r) for r in data.get("review_items", []))

    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
{BASE_CSS}
body {{
    background: linear-gradient(180deg, {data.get('bg_start','#FFF3E0')} 0%, {data.get('bg_mid','#FFE0B2')} 50%, {data.get('bg_end','#E84545')} 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 80px;
}}
.emoji-big {{ font-size: 96px; margin-bottom: 40px; }}
.title {{ font-size: 56px; font-weight: 900; color: #1C1C2E; line-height: 1.4; }}
.tips-box {{
    background: rgba(255,255,255,0.95); border-radius: 24px; padding: 40px 50px;
    margin-top: 50px; text-align: left; width: 100%;
}}
.tips-box h3 {{ font-size: 36px; color: #E84545; margin-bottom: 20px; }}
.tips-box p {{ font-size: 28px; color: #333; line-height: 1.8; }}
.subtitle {{
    font-size: 36px; color: #fff; margin-top: 30px; font-weight: 600;
    background: rgba(232,69,69,0.9); padding: 16px 40px; border-radius: 40px;
}}
.cta {{
    margin-top: 50px; font-size: 32px; color: #fff; font-weight: 700;
    background: #E84545; padding: 24px 60px; border-radius: 50px;
    box-shadow: 0 8px 24px rgba(232,69,69,0.4);
}}
.brand {{ position: absolute; bottom: 60px; font-size: 36px; color: rgba(255,255,255,0.9); font-weight: 700; }}
</style></head><body>
<div class="page-num" style="color:rgba(0,0,0,0.3)">{data['page_num']}</div>
<div class="emoji-big">{data.get('emoji_big','🎉✨')}</div>
<div class="title">{title_html}</div>
<div class="tips-box">
    <h3>📝 快速复习</h3>
    <p>{review_html}</p>
</div>
<div class="subtitle">{html_mod.escape(data.get('cta_text',''))}</div>
<div class="cta">关注 @May姐教粤语 下期见！</div>
<div class="brand">搞掂粤语 gaaudim.com</div>
</body></html>"""


# ============================================================
# 模板路由
# ============================================================
TEMPLATE_RENDERERS = {
    "cover": render_cover,
    "bubble": render_bubble_page,
    "cta": render_cta_page,
}


def render_card(card_data: dict) -> str:
    """根据 card_data['template'] 选择模板并渲染HTML"""
    template = card_data.get("template", "bubble")
    renderer = TEMPLATE_RENDERERS.get(template)
    if not renderer:
        raise ValueError(f"Unknown template: {template}")
    return renderer(card_data)

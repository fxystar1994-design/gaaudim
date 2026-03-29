// paywall-check.js v3.5 — 2026-03-29
// v3.5: 付费遮罩二次优化 — 权益卡片grid + 三列价格对比 + 橙红紧迫感
(function(){

// ===== 付费页面关键词（大写，用于匹配）=====
var PAID = [
  'EP06','EP07','EP08','EP09',
  'EP10','EP11','EP12','EP13','EP14','EP15',
  'EP16','EP17','EP18','EP19','EP20',
  'EP21','EP22','EP23','EP24','EP25',
  'EP26','EP27','EP28','EP29','EP30',
  'JP03','JP04','JP05','JP06','JP07','JP08','JP09','JP10','JP_EXTRA',
  'VW04','VW05','VW06','VW07','VW08','VW09','VW10',
  'VW11','VW12','VW13','VW14','VW15','VW16','VW17','VW18','VW19','VW20',
  'SZ04','SZ05','SZ06','SZ07','SZ08','SZ09','SZ10','SZ_EXTRA',
  'HKSONGS_EP03','HKSONGS_EP04','HKSONGS_EP05',
  'HKSONGS_EP06','HKSONGS_EP07','HKSONGS_EP08',
  'HKSONGS_EP09','HKSONGS_EP10','HKSONGS_EP11','HKSONGS_EXTRA'
];

var path = window.location.pathname;
var filename = path.substring(path.lastIndexOf('/') + 1).toUpperCase();
if (!filename || filename === '' || filename === '/') return;

var isPaid = false;
for (var i = 0; i < PAID.length; i++) {
  if (filename.indexOf(PAID[i]) !== -1) { isPaid = true; break; }
}
if (!isPaid) return;

function isUnlocked() {
  if (localStorage.getItem('gd_unlocked') === 'true') return true;
  if (document.cookie.indexOf('gd_unlocked=true') !== -1) {
    localStorage.setItem('gd_unlocked', 'true');
    return true;
  }
  return false;
}
function saveUnlockState() {
  localStorage.setItem('gd_unlocked', 'true');
  var d = new Date();
  d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000);
  document.cookie = 'gd_unlocked=true;expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}

if (isUnlocked()) return;
if (filename.indexOf('SZ05') !== -1 && localStorage.getItem('gd_reward_sz05') === '1') return;

// ===== 付费遮罩 =====
var MIANBAODUO_URL = 'https://mbd.pub/o/bread/YZWclJZpag==';
function _h(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h}return h}
if(typeof gtag === 'function') gtag('event', 'paywall_view', { page: filename });

// 注入样式
var style = document.createElement('style');
style.textContent = '.pw-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}'
+ '.pw-box{background:#fff;border-radius:20px;max-width:440px;width:100%;padding:32px 24px;text-align:center;animation:pwIn .35s ease-out;box-shadow:0 20px 60px rgba(0,0,0,.2);max-height:95vh;overflow-y:auto}'
+ '@keyframes pwIn{from{opacity:0;transform:scale(.93) translateY(16px)}to{opacity:1;transform:none}}'
+ '.pw-hook{font-family:"Noto Serif SC",serif;font-size:22px;font-weight:900;color:#111;line-height:1.4;margin-bottom:6px}'
+ '.pw-sub{font-size:14px;color:#777;line-height:1.7;margin-bottom:20px}'
+ '.pw-benefit-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}'
+ '.pw-benefit-card{border-radius:10px;padding:14px;text-align:center}'
+ '.pw-benefit-num{font-size:28px;font-weight:900}'
+ '.pw-benefit-desc{font-size:13px;color:#666;margin-top:4px}'
+ '.pw-benefit-extra{text-align:center;font-size:13px;color:#999;margin-bottom:16px}'
+ '.pw-social{display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;color:#999;margin-bottom:18px}'
+ '.pw-avatars{display:flex}.pw-avatars span{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;margin-left:-6px;border:2px solid #fff}'
+ '.pw-compare-row{display:flex;gap:10px;margin-bottom:16px}'
+ '.pw-compare-item{flex:1;background:#f5f5f5;border-radius:8px;padding:12px 8px;text-align:center}'
+ '.pw-compare-label{font-size:12px;color:#999}'
+ '.pw-compare-price{font-size:20px;font-weight:900;color:#999;text-decoration:line-through;margin-top:4px}'
+ '.pw-compare-note{font-size:11px;color:#bbb}'
+ '.pw-compare-ours{flex:1;background:#FFF0E8;border:2px solid #E85D3A;border-radius:8px;padding:12px 8px;text-align:center}'
+ '.pw-compare-ours .pw-compare-label{color:#E85D3A;font-weight:700}'
+ '.pw-compare-ours .pw-compare-price{color:#E85D3A;text-decoration:none;font-size:28px}'
+ '.pw-compare-ours .pw-compare-note{color:#E85D3A}'
+ '.pw-price-area{text-align:center;margin-bottom:16px}'
+ '.pw-price-explain{font-size:13px;color:#999}'
+ '.pw-price-main{margin-top:6px}'
+ '.pw-early-tag{display:inline-block;background:#E85D3A;color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:4px;vertical-align:middle}'
+ '.pw-price{font-family:"Noto Serif SC",serif;font-size:52px;font-weight:900;color:#E85D3A;margin-left:6px}'
+ '.pw-per{font-size:13px;color:#888;margin-top:6px}'
+ '.pw-urgency{font-size:12px;color:#E85D3A;margin-top:8px;font-weight:700}'
+ '.pw-cta{display:block;width:100%;background:#E85D3A;color:#fff;border:none;padding:16px;border-radius:12px;font-family:"Noto Sans SC",sans-serif;font-size:18px;font-weight:900;cursor:pointer;transition:all .25s;margin-bottom:6px}'
+ '.pw-cta:hover{transform:translateY(-2px) scale(1.02);background:#D14E30}'
+ '.pw-note{font-size:13px;color:#999;margin-bottom:16px}'
+ '.pw-unlock-toggle{font-size:13px;color:#999;cursor:pointer;border:none;background:none;font-family:inherit}'
+ '.pw-unlock-toggle:hover{color:#E85D3A}'
+ '.pw-unlock-area{display:none;margin-top:14px;padding-top:14px;border-top:1px solid #E8E4DE}'
+ '.pw-unlock-area.show{display:block}'
+ '.pw-unlock-row{display:flex;gap:8px}'
+ '.pw-unlock-input{flex:1;padding:10px 14px;border:1px solid #E8E4DE;border-radius:8px;font-family:"Noto Sans SC",sans-serif;font-size:14px;outline:none;transition:border-color .2s}'
+ '.pw-unlock-input:focus{border-color:#E85D3A}'
+ '.pw-unlock-btn{background:#111;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-family:"Noto Sans SC",sans-serif;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap}'
+ '.pw-back{display:block;font-size:13px;color:#bbb;margin-top:12px;text-decoration:none}'
+ '.pw-back:hover{color:#999}'
+ '@media(max-width:480px){.pw-compare-row{flex-direction:column}.pw-compare-row>div{padding:10px}}';
document.head.appendChild(style);

var overlay = document.createElement('div');
overlay.className = 'pw-overlay';
overlay.innerHTML = '<div class="pw-box">'
  + '<h2 class="pw-hook">你离开口说粤语<br>只差这一步</h2>'
  + '<p class="pw-sub">EP01-05免费内容你已经体验过了<br>接下来的内容更精彩</p>'
  // 权益卡片grid
  + '<div class="pw-benefit-grid">'
  + '<div class="pw-benefit-card" style="background:#FFF8EE"><div class="pw-benefit-num" style="color:#F5A623">30集</div><div class="pw-benefit-desc">场景对话 · 茶餐厅到求职</div></div>'
  + '<div class="pw-benefit-card" style="background:#EEF7F8"><div class="pw-benefit-num" style="color:#2AABB3">10集</div><div class="pw-benefit-desc">粤拼系统课 · 九声六调</div></div>'
  + '<div class="pw-benefit-card" style="background:#FFF8EE"><div class="pw-benefit-num" style="color:#F5A623">500词</div><div class="pw-benefit-desc">高频词速查 · 按场景分类</div></div>'
  + '<div class="pw-benefit-card" style="background:#EEF7F8"><div class="pw-benefit-num" style="color:#2AABB3">10集</div><div class="pw-benefit-desc">留学工作指南 · 签证租房</div></div>'
  + '</div>'
  + '<div class="pw-benefit-extra">✅ 未来新增内容永久同步解锁 · 电脑手机随时学</div>'
  // 社会认证
  + '<div class="pw-social">'
  + '<div class="pw-avatars"><span style="background:#FBF6ED">🧑</span><span style="background:#F0F9F5">👩</span><span style="background:#EBF3FB">🧑‍🎓</span><span style="background:#FDF2F0">👨‍💼</span></div>'
  + '已有 200+ 人解锁了完整课程'
  + '</div>'
  // 三列价格对比
  + '<div class="pw-compare-row">'
  + '<div class="pw-compare-item"><div class="pw-compare-label">线下粤语班</div><div class="pw-compare-price">¥6,000+</div><div class="pw-compare-note">3个月 / 每周2次</div></div>'
  + '<div class="pw-compare-item"><div class="pw-compare-label">1对1家教</div><div class="pw-compare-price">¥200/时</div><div class="pw-compare-note">30小时 = ¥6,000</div></div>'
  + '<div class="pw-compare-ours"><div class="pw-compare-label">搞掂全站</div><div class="pw-compare-price">¥99</div><div class="pw-compare-note">永久 / 85篇全解锁</div></div>'
  + '</div>'
  // 价格主区域
  + '<div class="pw-price-area">'
  + '<div class="pw-price-explain">正式定价 <span style="text-decoration:line-through">¥299</span></div>'
  + '<div class="pw-price-main"><span class="pw-early-tag">早鸟价</span><span class="pw-price">¥99</span></div>'
  + '<div class="pw-per">每篇仅 ¥1.2 · 一杯奶茶钱学会一个场景</div>'
  + '<div class="pw-urgency">🔥 前100名早鸟价 · 随时恢复¥299</div>'
  + '</div>'
  // CTA
  + '<button class="pw-cta" onclick="pwGoMianbaoduo()">立即解锁全站 ¥99 →</button>'
  + '<div class="pw-note">支持微信支付 / 支付宝 · 购买后获取解锁码</div>'
  + '<button class="pw-unlock-toggle" onclick="this.nextElementSibling.classList.toggle(\'show\')">已有解锁码？点击输入</button>'
  + '<div class="pw-unlock-area">'
  + '<div class="pw-unlock-row">'
  + '<input type="text" id="pw-code" class="pw-unlock-input" placeholder="输入解锁码">'
  + '<button onclick="pwUnlock()" class="pw-unlock-btn">解锁</button>'
  + '</div>'
  + '<p id="pw-msg" style="font-size:12px;margin-top:6px;min-height:16px"></p>'
  + '</div>'
  + '<a href="javascript:history.back()" class="pw-back">← 返回上一页</a>'
  + '</div>';
document.body.appendChild(overlay);
document.body.style.overflow = 'hidden';

// 点击遮罩外部不关闭（付费墙不允许关闭）

window.pwGoMianbaoduo = function(){
  if(typeof gtag === 'function') gtag('event', 'payment_redirect_mianbaoduo', { page: filename });
  window.open(MIANBAODUO_URL, '_blank');
};

window.pwUnlock = function() {
  var code = document.getElementById('pw-code').value.trim().toUpperCase();
  var msg = document.getElementById('pw-msg');
  if (!code) { msg.style.color = '#C0392B'; msg.textContent = '请输入解锁码'; return; }
  if (_h(code) === 602092493) {
    saveUnlockState();
    msg.style.color = '#1A7A5C'; msg.textContent = '✓ 解锁成功！正在刷新...';
    if(typeof gtag === 'function'){ gtag('event', 'unlock_attempt', { success: true }); gtag('event', 'unlock_success'); }
    setTimeout(function() { location.reload(); }, 800);
  } else {
    msg.style.color = '#C0392B'; msg.textContent = '解锁码无效，请检查后重试';
    if(typeof gtag === 'function') gtag('event', 'unlock_attempt', { success: false });
  }
};

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('pw-code')) window.pwUnlock();
});
})();

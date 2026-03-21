// paywall-check.js v3.2 — 2026-03-21
// 修复：Netlify Pretty URLs会把文件名转小写，需要toUpperCase后再匹配
// 逻辑：只有文件名包含以下付费关键词才上锁，其余全部放行
// 特殊规则：SZ05如果已领取奖励（gd_reward_sz05），也放行
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

// 获取当前文件名，转大写（Netlify会把URL转小写）
var path = window.location.pathname;
var filename = path.substring(path.lastIndexOf('/') + 1).toUpperCase();
// 兜底：如果取不到文件名，直接放行
if (!filename || filename === '' || filename === '/') return;

// 检查是否付费页面
var isPaid = false;
for (var i = 0; i < PAID.length; i++) {
  if (filename.indexOf(PAID[i]) !== -1) {
    isPaid = true;
    break;
  }
}

// 不是付费页面 → 直接放行
if (!isPaid) return;

// ===== 解锁检查：Cookie + localStorage 双重 =====
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

// 已解锁（全站付费） → 放行
if (isUnlocked()) return;

// ===== 特殊规则：SZ05奖励放行 =====
if (filename.indexOf('SZ05') !== -1 && localStorage.getItem('gd_reward_sz05') === '1') return;

// ===== 未解锁 → 显示付费遮罩 =====
var overlay = document.createElement('div');
overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(250,250,248,0.98);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px';
overlay.innerHTML = '<div style="max-width:420px;text-align:center;font-family:-apple-system,\'Noto Sans SC\',sans-serif">'
  + '<div style="font-size:48px;margin-bottom:12px">🔒</div>'
  + '<h2 style="font-size:22px;font-weight:900;margin-bottom:8px;color:#111">此内容需要解锁</h2>'
  + '<p style="font-size:14px;color:#555;line-height:1.7;margin-bottom:20px">解锁全站85篇深度指南，一次购买永久使用。</p>'
  + '<div style="background:#FBF6ED;border-radius:12px;padding:16px;margin-bottom:20px">'
  + '<span style="text-decoration:line-through;color:#999;font-size:14px">¥299</span> '
  + '<span style="font-size:32px;font-weight:900;color:#C8982E">¥99</span>'
  + '<div style="font-size:12px;color:#999;margin-top:4px">限时早鸟价 · 每篇仅 ¥1.2</div></div>'
  + '<a href="/" style="display:block;background:#C8982E;color:#fff;padding:14px;border-radius:10px;font-size:16px;font-weight:900;text-decoration:none;margin-bottom:10px">去首页解锁 →</a>'
  + '<a href="javascript:history.back()" style="display:block;font-size:13px;color:#999;margin-bottom:16px;text-decoration:none">← 返回上一页</a>'
  + '<div style="padding-top:12px;border-top:1px solid #E8E4DE">'
  + '<p style="font-size:13px;color:#999;margin-bottom:6px">已有解锁码？直接输入：</p>'
  + '<div style="display:flex;gap:8px">'
  + '<input type="text" id="pw-code" placeholder="输入解锁码" style="flex:1;padding:10px 14px;border:1px solid #E8E4DE;border-radius:8px;font-size:14px;outline:none">'
  + '<button onclick="pwUnlock()" style="background:#111;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">解锁</button></div>'
  + '<p id="pw-msg" style="font-size:12px;margin-top:6px;min-height:16px"></p>'
  + '</div></div>';
document.body.appendChild(overlay);
document.body.style.overflow = 'hidden';

// 解锁函数
window.pwUnlock = function() {
  var code = document.getElementById('pw-code').value.trim().toUpperCase();
  var msg = document.getElementById('pw-msg');
  if (!code) { msg.style.color = '#C0392B'; msg.textContent = '请输入解锁码'; return; }
  var valid = [
    String.fromCharCode(71,68,55,88,57,75,69,50,77,70)
  ];
  if (valid.indexOf(code) !== -1) {
    saveUnlockState();
    msg.style.color = '#1A7A5C'; msg.textContent = '✓ 解锁成功！正在刷新...';
    setTimeout(function() { location.reload(); }, 800);
  } else {
    msg.style.color = '#C0392B'; msg.textContent = '解锁码无效，请检查后重试';
  }
};

// 回车键触发解锁
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('pw-code')) {
    window.pwUnlock();
  }
});
})();

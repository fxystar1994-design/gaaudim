// paywall-check.js — 放在所有课程HTML同目录下
// 免费课程列表（这些页面不需要解锁）
(function(){
var FREE_PAGES = [
  'MayJie_EP01_ChaChaan.html',
  'MayJie_EP02_MTR.html',
  'MayJie_EP03_ConvStore.html',
  'MayJie_EP04_Taxi_Doctor.html',
  'MayJie_EP05_Takeout.html',
  'MayJie_JP01.html',
  'MayJie_JP02.html',
  'MayJie_VW01.html',
  'MayJie_VW02.html',
  'MayJie_VW03.html',
  'MayJie_SZ01.html',
  'MayJie_SZ02.html',
  'MayJie_SZ03.html',
  'MayJie_HKSongs_EP01_V3.html',
  'MayJie_HKSongs_EP02.html',
  'index.html',
  'index_minimal.html',
  'translator.html'
];

// 获取当前文件名
var path = window.location.pathname;
var filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

// 如果是免费页面，不做任何事
if (FREE_PAGES.indexOf(filename) !== -1) return;

// 检查是否已解锁
if (localStorage.getItem('gd_unlocked') === 'true') return;

// 未解锁 → 遮挡页面内容
var overlay = document.createElement('div');
overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(250,250,248,0.98);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px';
overlay.innerHTML = '<div style="max-width:420px;text-align:center;font-family:-apple-system,sans-serif">'
  + '<div style="font-size:48px;margin-bottom:16px">🔒</div>'
  + '<h2 style="font-size:22px;font-weight:900;margin-bottom:12px;color:#111">此内容需要解锁</h2>'
  + '<p style="font-size:15px;color:#555;line-height:1.7;margin-bottom:20px">你正在查看的是完整版内容。解锁全站85篇指南，一次付费永久使用。</p>'
  + '<div style="background:#FBF6ED;border-radius:12px;padding:16px;margin-bottom:20px">'
  + '<span style="text-decoration:line-through;color:#999;font-size:14px">¥299</span> '
  + '<span style="font-size:32px;font-weight:900;color:#C8982E">¥99</span>'
  + '<div style="font-size:12px;color:#999;margin-top:4px">限时早鸟价 · 每篇仅¥1.2</div></div>'
  + '<a href="/" style="display:block;background:#C8982E;color:#fff;padding:14px;border-radius:10px;font-size:16px;font-weight:900;text-decoration:none;margin-bottom:12px">去首页解锁 →</a>'
  + '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #E8E4DE">'
  + '<p style="font-size:13px;color:#999;margin-bottom:6px">已有解锁码？直接输入：</p>'
  + '<div style="display:flex;gap:8px"><input type="text" id="pw-code" placeholder="输入解锁码" style="flex:1;padding:10px 14px;border:1px solid #E8E4DE;border-radius:8px;font-size:14px;outline:none">'
  + '<button onclick="pwUnlock()" style="background:#111;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">解锁</button></div>'
  + '<p id="pw-msg" style="font-size:12px;margin-top:6px;min-height:16px"></p>'
  + '</div></div>';
document.body.appendChild(overlay);

// 同时阻止滚动
document.body.style.overflow = 'hidden';

// 解锁函数挂到window上
window.pwUnlock = function() {
  var code = document.getElementById('pw-code').value.trim().toUpperCase();
  var msg = document.getElementById('pw-msg');
  if (!code) { msg.style.color = '#C0392B'; msg.textContent = '请输入解锁码'; return; }
  var valid = ['GD7X9KE2MF'];
  if (valid.indexOf(code) !== -1) {
    localStorage.setItem('gd_unlocked', 'true');
    msg.style.color = '#1A7A5C'; msg.textContent = '✓ 解锁成功！';
    setTimeout(function() { location.reload(); }, 800);
  } else {
    msg.style.color = '#C0392B'; msg.textContent = '解锁码无效，请检查后重试';
  }
};
})();

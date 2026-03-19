// paywall-check.js
(function(){
var PAID_PATTERNS = [
  'EP06','EP07','EP08','EP09','EP10','EP11','EP12','EP13','EP14','EP15',
  'EP16','EP17','EP18','EP19','EP20','EP21','EP22','EP23','EP24','EP25',
  'EP26','EP27','EP28','EP29','EP30',
  'JP03','JP04','JP05','JP06','JP07','JP08','JP09','JP10',
  'JP_EXTRA',
  'VW04','VW05','VW06','VW07','VW08','VW09','VW10',
  'VW11','VW12','VW13','VW14','VW15','VW16','VW17','VW18','VW19','VW20',
  'SZ04','SZ05','SZ06','SZ07','SZ08','SZ09','SZ10',
  'SZ_EXTRA',
  'HKSONGS_EP03','HKSONGS_EP04','HKSONGS_EP05','HKSONGS_EP06',
  'HKSONGS_EP07','HKSONGS_EP08','HKSONGS_EP09','HKSONGS_EP10','HKSONGS_EP11',
  'HKSONGS_EXTRA'
];

var path = window.location.pathname;
var filename = path.substring(path.lastIndexOf('/') + 1).toUpperCase() || 'INDEX.HTML';

var isPaid = false;
for (var i = 0; i < PAID_PATTERNS.length; i++) {
  if (filename.indexOf(PAID_PATTERNS[i]) !== -1) { isPaid = true; break; }
}

if (!isPaid) return;
if (localStorage.getItem('gd_unlocked') === 'true') return;

var overlay = document.createElement('div');
overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(250,250,248,0.98);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px';
overlay.innerHTML = '<div style="max-width:420px;text-align:center;font-family:-apple-system,sans-serif">'
  + '<div style="font-size:48px;margin-bottom:16px">🔒</div>'
  + '<h2 style="font-size:22px;font-weight:900;margin-bottom:12px;color:#111">此内容需要解锁</h2>'
  + '<p style="font-size:15px;color:#555;line-height:1.7;margin-bottom:20px">你正在查看的是完整版内容。<br>解锁全站85篇指南，一次付费永久使用。</p>'
  + '<div style="background:#FBF6ED;border-radius:12px;padding:16px;margin-bottom:20px">'
  + '<span style="text-decoration:line-through;color:#999;font-size:14px">¥299</span> '
  + '<span style="font-size:32px;font-weight:900;color:#C8982E">¥99</span>'
  + '<div style="font-size:12px;color:#999;margin-top:4px">限时早鸟价 · 每篇仅¥1.2</div></div>'
  + '<a href="/" style="display:block;background:#C8982E;color:#fff;padding:14px;border-radius:10px;font-size:16px;font-weight:900;text-decoration:none;margin-bottom:12px">去首页解锁 →</a>'
  + '<a href="javascript:history.back()" style="display:block;font-size:13px;color:#999;margin-bottom:16px">← 返回上一页</a>'
  + '<div style="padding-top:12px;border-top:1px solid #E8E4DE">'
  + '<p style="font-size:13px;color:#999;margin-bottom:6px">已有解锁码？直接输入：</p>'
  + '<div style="display:flex;gap:8px"><input type="text" id="pw-code" placeholder="输入解锁码" style="flex:1;padding:10px 14px;border:1px solid #E8E4DE;border-radius:8px;font-size:14px;outline:none">'
  + '<button onclick="pwUnlock()" style="background:#111;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">解锁</button></div>'
  + '<p id="pw-msg" style="font-size:12px;margin-top:6px;min-height:16px"></p>'
  + '</div></div>';
document.body.appendChild(overlay);
document.body.style.overflow = 'hidden';

window.pwUnlock = function() {
  var code = document.getElementById('pw-code').value.trim().toUpperCase();
  var msg = document.getElementById('pw-msg');
  if (!code) { msg.style.color = '#C0392B'; msg.textContent = '请输入解锁码'; return; }
  if (code === 'GD7X9KE2MF') {
    localStorage.setItem('gd_unlocked', 'true');
    msg.style.color = '#1A7A5C'; msg.textContent = '✓ 解锁成功！';
    setTimeout(function() { location.reload(); }, 800);
  } else {
    msg.style.color = '#C0392B'; msg.textContent = '解锁码无效，请检查后重试';
  }
};
})();

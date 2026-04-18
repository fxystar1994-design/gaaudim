// paywall-check.js v4.1 — 2026-04-18 · URL迁移缓存刷新
// v4.1: 仅版本号断版刷缓存(文件内容 v4.0 起未变逻辑,WORKER_URL 已切 api.gaaudim.com)
// v4.0: 接入 XorPay 支付宝即时付款(与面包多并存),支持换设备凭邮箱找回
(function(){
var WORKER_URL='https://api.gaaudim.com';
function pwGetDeviceFp(){try{var s=navigator.userAgent+screen.width+'x'+screen.height+Intl.DateTimeFormat().resolvedOptions().timeZone;return btoa(unescape(encodeURIComponent(s))).replace(/=/g,'').slice(0,24);}catch(e){return 'nofp';}}

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
+ '@media(max-width:480px){.pw-compare-row{flex-direction:column}.pw-compare-row>div{padding:10px}}'
+ '.pw-alipay{display:block;width:100%;background:linear-gradient(135deg,#C8982E,#B8862B);color:#fff;border:none;padding:16px;border-radius:12px;font-family:"Noto Sans SC",sans-serif;font-size:17px;font-weight:900;cursor:pointer;margin-bottom:8px;box-shadow:0 4px 12px rgba(200,152,46,.3);transition:all .25s}'
+ '.pw-alipay:hover{transform:translateY(-2px) scale(1.01)}'
+ '.pw-alipay small{display:block;font-size:12px;font-weight:400;margin-top:4px;opacity:.92}'
+ '.pw-cta-sec{display:block;width:100%;background:#fff;color:#666;border:1px solid #E8E4DE;padding:12px;border-radius:10px;font-family:"Noto Sans SC",sans-serif;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;text-align:center;margin-bottom:4px}'
+ '.pw-step{display:none}.pw-step.active{display:block}'
+ '.pw-input{width:100%;padding:12px 14px;border:1px solid #E8E4DE;border-radius:10px;font-family:inherit;font-size:15px;outline:none;margin-bottom:10px;box-sizing:border-box}'
+ '.pw-input:focus{border-color:#C8982E}'
+ '.pw-backlink{display:block;width:100%;margin-top:10px;background:none;color:#999;border:none;padding:8px;font-family:inherit;font-size:13px;cursor:pointer}'
+ '.pw-qr-wrap{display:flex;justify-content:center;padding:16px;background:#FFFBF0;border:1px solid #E4D6A6;border-radius:12px;margin:10px 0}'
+ '.pw-lookup-link{display:block;text-align:center;font-size:12px;color:#bbb;margin-top:10px;text-decoration:none}';
document.head.appendChild(style);

var overlay = document.createElement('div');
overlay.className = 'pw-overlay';
overlay.innerHTML = '<div class="pw-box">'
  + '<h2 class="pw-hook">你离开口说粤语<br>只差这一步</h2>'
  + '<p class="pw-sub">EP01-05免费内容你已经体验过了<br>接下来的内容更精彩</p>'
  // 权益列表（紧凑版）
  + '<div style="text-align:left;margin:16px 0;font-size:14px;color:#333;line-height:2.2">'
  + '<div>✅ <strong>30集</strong>场景对话 · 茶餐厅到求职面试</div>'
  + '<div>✅ <strong>10集</strong>粤拼系统课 · 九声六调</div>'
  + '<div>✅ <strong>500词</strong>高频速查 · 按场景分类</div>'
  + '<div>✅ <strong>10集</strong>留学工作指南 · 签证租房</div>'
  + '<div>✅ <strong>翻译器</strong>完整词典7981条 + 英粤/俚语各1000条</div>'
  + '<div>✅ 未来新增内容永久同步解锁</div>'
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
  // CTA — 双通道
  + '<div id="pw-step-main" class="pw-step active">'
  + '<button class="pw-alipay" onclick="pwStartAlipay()">支付宝即时付款 ¥99 · 推荐<small>30秒内完成 · 自动解锁 · 附赠凭证</small></button>'
  + '<a class="pw-cta-sec" href="' + MIANBAODUO_URL + '" target="_blank" rel="noopener" onclick="if(typeof gtag===\'function\')gtag(\'event\',\'payment_redirect_mianbaoduo\',{page:\'' + filename + '\'});">面包多购买 ¥99(备选 · 跳转第三方)</a>'
  + '<div class="pw-note">支付宝 30 秒自动解锁 · 面包多付款后需手动输入码</div>'
  + '</div>'
  + '<button class="pw-unlock-toggle" onclick="this.nextElementSibling.classList.toggle(\'show\')">已有解锁码？点击输入</button>'
  + '<div class="pw-unlock-area">'
  + '<div class="pw-unlock-row">'
  + '<input type="text" id="pw-code" class="pw-unlock-input" placeholder="输入解锁码">'
  + '<button onclick="pwUnlock()" class="pw-unlock-btn">解锁</button>'
  + '</div>'
  + '<p id="pw-msg" style="font-size:12px;margin-top:6px;min-height:16px"></p>'
  + '</div>'
  // Email 收集子步骤
  + '<div id="pw-step-email" class="pw-step">'
  + '<h3 style="font-size:18px;margin:0 0 4px">支付前留个联系方式</h3>'
  + '<p style="font-size:13px;color:#777;margin-bottom:14px">用于凭证发送 · 换设备找回解锁码</p>'
  + '<input class="pw-input" type="email" id="pw-email" placeholder="邮箱(必填)" autocomplete="email">'
  + '<input class="pw-input" type="tel" id="pw-phone" placeholder="手机号(可选)" autocomplete="tel">'
  + '<p id="pw-email-msg" style="font-size:12px;color:#C0392B;min-height:16px;margin:2px 0 8px"></p>'
  + '<button class="pw-alipay" onclick="pwConfirmEmail()">生成支付二维码 →</button>'
  + '<button class="pw-backlink" onclick="pwBackMain()">← 返回</button>'
  + '</div>'
  // QR 码子步骤
  + '<div id="pw-step-qr" class="pw-step">'
  + '<h3 style="font-size:18px;margin:0 0 4px">支付宝扫码付款</h3>'
  + '<p style="font-size:13px;color:#777;margin-bottom:10px">请用支付宝扫描二维码 · 付款成功自动跳转</p>'
  + '<div class="pw-qr-wrap"><canvas id="pw-qr-canvas" style="max-width:220px"></canvas></div>'
  + '<p id="pw-qr-timer" style="font-size:13px;color:#777;margin-top:10px;text-align:center">等待付款中...</p>'
  + '<p id="pw-qr-orderid" style="font-size:12px;color:#999;text-align:center;margin-top:2px"></p>'
  + '<button class="pw-backlink" onclick="pwCancelQr()">取消</button>'
  + '</div>'
  + '<a href="javascript:history.back()" class="pw-back">← 返回上一页</a>'
  + '<a href="/lookup.html" class="pw-lookup-link">换设备找回解锁码 →</a>'
  + '</div>';
document.body.appendChild(overlay);
document.body.style.overflow = 'hidden';

// 点击遮罩外部不关闭（付费墙不允许关闭）

// pwGoMianbaoduo removed — CTA now uses <a target="_blank"> for better mobile compatibility

window.pwUnlock = function() {
  var input = document.getElementById('pw-code').value.trim().toUpperCase();
  var msg = document.getElementById('pw-msg');
  if (!input) { msg.style.color = '#C0392B'; msg.textContent = '请输入解锁码'; return; }
  msg.style.color = '#777'; msg.textContent = '验证中...';
  var isNewCode = /^GD-/.test(input);
  var onOk = function(info){
    saveUnlockState();
    msg.style.color = '#1A7A5C'; msg.textContent = '✓ 解锁成功！正在刷新...';
    if(typeof gtag === 'function'){ gtag('event', 'unlock_attempt', { success: true }); gtag('event', 'unlock_success', { method: info && info.legacy ? 'legacy' : 'worker' }); }
    setTimeout(function() { location.reload(); }, 800);
  };
  var onFail = function(err){
    msg.style.color = '#C0392B';
    if (err === 'code_bound_other_device') msg.innerHTML = '此码已绑定其他设备 · <a href="/lookup.html" style="color:#E85D3A">到找回页处理 →</a>';
    else if (err === 'rate_limit') msg.textContent = '验证次数过多,请稍后再试';
    else msg.textContent = '解锁码无效，请检查后重试';
    if(typeof gtag === 'function') gtag('event', 'unlock_attempt', { success: false, reason: err || 'unknown' });
  };
  fetch(WORKER_URL + '/api/validate', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ code: input, fp: pwGetDeviceFp() })
  }).then(function(r){ return r.json(); }).then(function(j){
    if (j && j.valid) return onOk(j);
    if (!isNewCode && _h(input) === 602092493) return onOk({ legacy: true });
    onFail(j && j.error);
  }).catch(function(){
    // 网络错误: 老 hash 兜底
    if (_h(input) === 602092493) onOk({ legacy: true });
    else { msg.style.color = '#C0392B'; msg.textContent = '网络错误,请稍后重试'; }
  });
};

// ===== XorPay 支付宝流程 =====
function pwSwitchStep(id){
  ['pw-step-main','pw-step-email','pw-step-qr'].forEach(function(s){
    var el = document.getElementById(s); if (el) el.classList.toggle('active', s === id);
  });
}
window.pwStartAlipay = function(){
  pwSwitchStep('pw-step-email');
  setTimeout(function(){ var e=document.getElementById('pw-email'); if(e)e.focus(); }, 80);
  if(typeof gtag==='function')gtag('event','alipay_click',{page:filename});
};
window.pwBackMain = function(){ pwCancelQrInternal(); pwSwitchStep('pw-step-main'); };
window.pwCancelQr = function(){ pwCancelQrInternal(); pwSwitchStep('pw-step-main'); };

var _pwOrderId=null,_pwExpiresAt=0,_pwPollTimer=null,_pwTickTimer=null;
function pwCancelQrInternal(){
  clearTimeout(_pwPollTimer);_pwPollTimer=null;
  clearInterval(_pwTickTimer);_pwTickTimer=null;
  _pwOrderId=null;_pwExpiresAt=0;
}
function pwLoadQrLib(cb){
  if (window.QRCode) { cb(); return; }
  // 先走本地 vendor (避 CORB/CDN 不稳), 失败再降级到 jsdelivr CDN
  var s=document.createElement('script');s.src='/vendor/qrcode.min.js?v=1';
  s.onload=cb;
  s.onerror=function(){
    console.warn('[pw-qr] local vendor 加载失败, 降级到 CDN');
    var s2=document.createElement('script');s2.src='https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js';
    s2.onload=cb;s2.onerror=function(){alert('二维码库加载失败,请刷新重试或切换网络');};
    document.head.appendChild(s2);
  };
  document.head.appendChild(s);
}
window.pwConfirmEmail = function(){
  var email=(document.getElementById('pw-email').value||'').trim().toLowerCase();
  var phone=(document.getElementById('pw-phone').value||'').trim();
  var msg=document.getElementById('pw-email-msg');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.style.color='#C0392B';msg.textContent='请输入有效邮箱';return;}
  msg.style.color='#777';msg.textContent='正在创建订单...';
  fetch(WORKER_URL+'/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,phone:phone,channel:'alipay'})})
    .then(function(r){return r.json().then(function(j){return {s:r.status,j:j};});})
    .then(function(res){
      if(!res.j.ok){msg.style.color='#C0392B';msg.textContent=res.j.msg||('创建订单失败:'+(res.j.error||'unknown'));return;}
      _pwOrderId=res.j.order_id;_pwExpiresAt=Date.now()+(res.j.expires_in||7200)*1000;
      if(typeof gtag==='function')gtag('event','alipay_order_created',{order_id:_pwOrderId});
      var isMobile=/iPhone|iPad|Android/i.test(navigator.userAgent);
      if(isMobile){location.href=res.j.qr;pwPollPayment();return;}
      pwSwitchStep('pw-step-qr');
      document.getElementById('pw-qr-orderid').textContent='订单号:'+_pwOrderId;
      pwLoadQrLib(function(){
        var canvas=document.getElementById('pw-qr-canvas');
        window.QRCode.toCanvas(canvas,res.j.qr,{width:220,margin:1,color:{dark:'#111',light:'#fff'}},function(err){if(err)console.error(err);});
        pwPollPayment();pwStartQrTimer();
      });
    })
    .catch(function(e){msg.style.color='#C0392B';msg.textContent='网络错误:'+e.message;});
};
function pwStartQrTimer(){
  var el=document.getElementById('pw-qr-timer');
  var tick=function(){
    var sec=Math.floor((_pwExpiresAt-Date.now())/1000);
    if(sec<=0){el.textContent='二维码已过期,请重新生成';pwCancelQrInternal();return;}
    var m=Math.floor(sec/60),s=sec%60;
    el.textContent='等待付款 · '+m+'分'+(s<10?'0':'')+s+'秒 后过期';
  };
  tick();clearInterval(_pwTickTimer);_pwTickTimer=setInterval(tick,1000);
}
function pwPollPayment(){
  if(!_pwOrderId)return;
  clearTimeout(_pwPollTimer);
  var attempts=0,maxAttempts=40;
  var tick=function(){
    if(!_pwOrderId||attempts>maxAttempts)return;
    attempts++;
    fetch(WORKER_URL+'/api/check-payment/'+encodeURIComponent(_pwOrderId))
      .then(function(r){return r.json();})
      .then(function(j){
        if(j.status==='paid'){location.href='/success.html?order_id='+encodeURIComponent(_pwOrderId);return;}
        _pwPollTimer=setTimeout(tick,3000);
      })
      .catch(function(){_pwPollTimer=setTimeout(tick,3000);});
  };
  tick();
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('pw-code')) window.pwUnlock();
});
})();

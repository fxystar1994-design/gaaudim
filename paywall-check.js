(function(){
// Cookie + localStorage 双重检查
function _gc(){return[71,68,55,88,57,75,69,50,77,70].map(function(c){return String.fromCharCode(c)}).join('')}
function isUnlocked(){
  if(localStorage.getItem('gd_unlocked')==='true') return true;
  if(document.cookie.indexOf('gd_unlocked=true')!==-1){
    localStorage.setItem('gd_unlocked','true');
    return true;
  }
  return false;
}
function saveUnlockState(){
  localStorage.setItem('gd_unlocked','true');
  var d=new Date();d.setTime(d.getTime()+365*24*60*60*1000);
  document.cookie='gd_unlocked=true;expires='+d.toUTCString()+';path=/;SameSite=Lax';
}
if(isUnlocked()) return;

// 构建付费墙遮罩
var overlay=document.createElement('div');
overlay.id='pw-overlay';
overlay.innerHTML='<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.45);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px">'
  + '<div style="background:#fff;max-width:400px;width:100%;border-radius:16px;padding:32px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.15);max-height:90vh;overflow-y:auto">'
  + '<div style="font-size:40px;margin-bottom:10px">🔒</div>'
  + '<h2 style="font-family:\'Noto Serif SC\',serif;font-size:20px;font-weight:900;margin-bottom:8px;color:#111">本篇为付费内容</h2>'
  + '<p style="font-size:14px;color:#555;line-height:1.7;margin-bottom:20px">解锁全站85篇深度指南，一次购买永久查看。</p>'
  + '<a href="/" style="display:block;width:100%;background:#C8982E;color:#fff;border:none;padding:14px;border-radius:10px;font-size:16px;font-weight:900;text-decoration:none;text-align:center;margin-bottom:10px">去首页解锁 · ¥99 →</a>'
  + '<div style="padding-top:12px;border-top:1px solid #E8E4DE">'
  + '<p style="font-size:13px;color:#999;margin-bottom:6px">已有解锁码？直接输入：</p>'
  + '<div style="display:flex;gap:8px"><input type="text" id="pw-code" placeholder="输入解锁码" style="flex:1;padding:10px 14px;border:1px solid #E8E4DE;border-radius:8px;font-size:14px;outline:none">'
  + '<button onclick="pwUnlock()" style="background:#111;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">解锁</button></div>'
  + '<p id="pw-msg" style="font-size:12px;margin-top:6px;min-height:16px"></p>'
  + '</div></div></div>';
document.body.appendChild(overlay);
document.body.style.overflow='hidden';

window.pwUnlock=function(){
  var code=document.getElementById('pw-code').value.trim().toUpperCase();
  var msg=document.getElementById('pw-msg');
  if(!code){msg.style.color='#C0392B';msg.textContent='请输入解锁码';return}
  if(code===_gc()){
    saveUnlockState();
    msg.style.color='#1A7A5C';msg.textContent='✓ 解锁成功！';
    setTimeout(function(){location.reload()},800);
  }else{
    msg.style.color='#C0392B';msg.textContent='解锁码无效，请检查后重试';
  }
};
})();

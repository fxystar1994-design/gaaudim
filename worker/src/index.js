// worker/src/index.js  —  gaaudim-unlock Worker
// XorPay Alipay 付款 → 自动发码 / 换设备凭邮箱找回
// 2026-04-17

// =============================================================
// 配置
// =============================================================
const ALLOWED_ORIGINS = [
  'https://gaaudim.com',
  'https://www.gaaudim.com',
  'https://gaaudim.pages.dev',
  'http://localhost',
  'http://127.0.0.1'
];

const PRODUCT_NAME = '搞掂GaauDim全站通行证';
const PRICE        = '99.00';
const ORDER_TTL    = 86400;       // pending 订单 24h 过期
const RL_CREATE_HR = 10;          // email 每小时最多 10 单
const RL_VAL_IP_MIN = 60;         // validate: 每 IP 每分钟 60 次
const RL_LOOKUP_IP  = 5;          // lookup: 每 IP 每小时 5 次
const RL_LOOKUP_EMAIL = 10;       // lookup: 每 email 每天 10 次
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 无 0/O/1/I/L

// =============================================================
// 入口
// =============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin') || '';

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      if (path === '/api/create-order' && method === 'POST') {
        return await handleCreateOrder(request, env, origin);
      }
      if (path === '/api/xorpay-webhook' && method === 'POST') {
        return await handleWebhook(request, env);
      }
      if (path.startsWith('/api/check-payment/') && method === 'GET') {
        return await handleCheckPayment(request, env, origin, decodeURIComponent(path.split('/').pop() || ''));
      }
      if (path === '/api/validate' && method === 'POST') {
        return await handleValidate(request, env, origin);
      }
      if (path === '/api/lookup' && method === 'POST') {
        return await handleLookup(request, env, origin);
      }
      if (path === '/api/admin/lookup' && method === 'GET') {
        return await handleAdminLookup(request, env, url);
      }
      if (path === '/api/admin/list' && method === 'GET') {
        return await handleAdminList(request, env, url);
      }
      if (path === '/api/admin/create-code' && method === 'GET') {
        return await handleAdminCreateCode(request, env, url);
      }
      if (path === '/health' && method === 'GET') {
        return jsonResponse({ ok: true, t: Date.now() }, 200, origin);
      }
      return new Response('Not Found', { status: 404, headers: corsHeaders(origin) });
    } catch (e) {
      console.error('[fatal]', e && e.stack || e);
      return jsonResponse({ ok: false, error: 'internal', msg: (e && e.message) || 'error' }, 500, origin);
    }
  }
};

// =============================================================
// 通用工具
// =============================================================
function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o)) ? origin : 'https://gaaudim.com';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function jsonResponse(obj, status = 200, origin = '') {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) }
  });
}

function maskEmail(e) {
  if (!e || typeof e !== 'string') return '';
  return e.slice(0, 3) + '***' + e.slice(-8);
}

function isValidEmail(e) {
  return typeof e === 'string' && /^[^\s@]{1,64}@[^\s@]{2,}\.[^\s@]{2,}$/i.test(e) && e.length <= 120;
}

function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')?.split(',')[0].trim()
      || '0.0.0.0';
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashIpUa(request) {
  const ip = getClientIP(request);
  const ua = request.headers.get('User-Agent') || '';
  return (await sha256Hex(ip + '|' + ua)).slice(0, 24);
}

function generateCode() {
  const n = CODE_ALPHABET.length;
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[bytes[i] % n];
  return 'GD-' + s;
}

function generateOrderId() {
  const raw = crypto.randomUUID().replace(/-/g, '').toUpperCase();
  return 'GDORD-' + raw.slice(0, 10);
}

// KV 限流辅助:窗口内递增计数,返回当前值
async function rateLimitBump(kv, key, ttl) {
  const cur = parseInt((await kv.get(key)) || '0', 10);
  await kv.put(key, String(cur + 1), { expirationTtl: ttl });
  return cur + 1;
}

// =============================================================
// MD5 (纯 JS, 公共领域实现; Workers 的 crypto.subtle 不支持 MD5)
// =============================================================
function md5(str) {
  return rstr2hex(rstr_md5(utf8Encode(str)));
}
function utf8Encode(str) {
  return unescape(encodeURIComponent(str));
}
function rstr2hex(input) {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const x = input.charCodeAt(i);
    out += hex.charAt((x >>> 4) & 0x0f) + hex.charAt(x & 0x0f);
  }
  return out;
}
function rstr_md5(s) {
  return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
}
function rstr2binl(input) {
  const out = new Array(input.length >> 2).fill(0);
  for (let i = 0; i < input.length * 8; i += 8)
    out[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
  return out;
}
function binl2rstr(input) {
  let out = '';
  for (let i = 0; i < input.length * 32; i += 8)
    out += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
  return out;
}
function binl_md5(x, len) {
  x[len >> 5] |= 0x80 << (len % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;
  let a =  1732584193, b = -271733879, c = -1732584194, d =  271733878;
  for (let i = 0; i < x.length; i += 16) {
    const olda = a, oldb = b, oldc = c, oldd = d;
    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);
    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);
    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);
    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);
    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return [a, b, c, d];
}
function md5_cmn(q, a, b, x, s, t) { return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b); }
function md5_ff(a, b, c, d, x, s, t) { return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t); }
function md5_gg(a, b, c, d, x, s, t) { return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t); }
function md5_hh(a, b, c, d, x, s, t) { return md5_cmn(b ^ c ^ d, a, b, x, s, t); }
function md5_ii(a, b, c, d, x, s, t) { return md5_cmn(c ^ (b | (~d)), a, b, x, s, t); }
function safe_add(x, y) { const lsw = (x & 0xFFFF) + (y & 0xFFFF); const msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF); }
function bit_rol(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }

// =============================================================
// 1) POST /api/create-order
// =============================================================
async function handleCreateOrder(request, env, origin) {
  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ ok: false, error: 'bad_json' }, 400, origin); }

  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').toString().slice(0, 30);
  const channel = body.channel || 'alipay';

  if (!isValidEmail(email)) {
    return jsonResponse({ ok: false, error: 'invalid_email', msg: '邮箱格式不正确' }, 400, origin);
  }

  // 限流 — email 每小时最多 RL_CREATE_HR 个 pending 订单
  const rlKey = `ratelimit:email_create:${email}`;
  const cur = await rateLimitBump(env.UNLOCK_KV, rlKey, 3600);
  if (cur > RL_CREATE_HR) {
    return jsonResponse({ ok: false, error: 'rate_limit', msg: '操作过于频繁,请稍后再试' }, 429, origin);
  }

  const order_id = generateOrderId();
  const notify_url = new URL('/api/xorpay-webhook', new URL(request.url).origin).toString();

  // 签名 = md5(name + pay_type + price + order_id + notify_url + app_secret)
  const sign = md5(PRODUCT_NAME + 'alipay' + PRICE + order_id + notify_url + env.XORPAY_SECRET);

  const formBody = new URLSearchParams({
    name: PRODUCT_NAME,
    pay_type: 'alipay',
    price: PRICE,
    order_id,
    order_uid: email,
    notify_url,
    sign
  });

  let xpData;
  try {
    const xpRes = await fetch(`https://xorpay.com/api/pay/${env.XORPAY_AID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString()
    });
    xpData = await xpRes.json();
  } catch (e) {
    console.error('[xorpay_create] network', e.message);
    return jsonResponse({ ok: false, error: 'xorpay_unreachable', msg: '支付通道暂不可用' }, 502, origin);
  }

  if (!xpData || xpData.status !== 'ok') {
    console.error('[xorpay_create] fail', JSON.stringify(xpData));
    return jsonResponse({ ok: false, error: 'xorpay_' + ((xpData && xpData.status) || 'unknown'), msg: (xpData && xpData.info) || '支付创建失败' }, 502, origin);
  }

  // 写 order:pending
  await env.UNLOCK_KV.put(`order:${order_id}`, JSON.stringify({
    email,
    phone,
    status: 'pending',
    aoid: xpData.aoid,
    created: Date.now(),
    channel,
    pay_price: PRICE
  }), { expirationTtl: ORDER_TTL });

  console.log('[order_created]', order_id, maskEmail(email), xpData.aoid);

  return jsonResponse({
    ok: true,
    order_id,
    qr: xpData.info && xpData.info.qr,
    expires_in: xpData.expires_in || 7200
  }, 200, origin);
}

// =============================================================
// 2) POST /api/xorpay-webhook  (XorPay 回调)
// =============================================================
async function handleWebhook(request, env) {
  const form = await request.formData();
  const aoid      = form.get('aoid') || '';
  const order_id  = form.get('order_id') || '';
  const pay_price = form.get('pay_price') || '';
  const pay_time  = form.get('pay_time') || '';
  const sign      = form.get('sign') || '';
  const more      = form.get('more') || '';

  const expected = md5(aoid + order_id + pay_price + pay_time + env.XORPAY_SECRET);
  if (!sign || sign !== expected) {
    console.error('[webhook] sign_invalid', order_id, sign);
    // 返 403 触发 XorPay 重试;记录到 KV 方便排查
    await env.UNLOCK_KV.put(`error:sign_fail:${Date.now()}`, JSON.stringify({ aoid, order_id, sign }), { expirationTtl: 86400 * 7 });
    return new Response('fail', { status: 403 });
  }

  // 幂等
  const orderRaw = await env.UNLOCK_KV.get(`order:${order_id}`);
  if (!orderRaw) {
    console.error('[webhook] order_not_found', order_id);
    // 订单不存在不能处理,但也别一直重试。返 success 吃掉。
    return new Response('success');
  }
  const order = JSON.parse(orderRaw);
  if (order.status === 'paid') {
    console.log('[webhook] idempotent_hit', order_id);
    return new Response('success');
  }

  // 金额校验
  if (pay_price !== PRICE) {
    console.error('[webhook] price_mismatch', order_id, pay_price, 'expected', PRICE);
    await env.UNLOCK_KV.put(`error:price_mismatch:${Date.now()}`, JSON.stringify({ aoid, order_id, pay_price }), { expirationTtl: 86400 * 30 });
    return new Response('success'); // 不触发重试,但单独记录
  }

  // 生成唯一码 (最多重试 5 次)
  let code = '';
  let exists = true;
  for (let i = 0; i < 5 && exists; i++) {
    code = generateCode();
    exists = !!(await env.UNLOCK_KV.get(`code:${code}`));
  }
  if (exists) {
    console.error('[webhook] code_collision', order_id);
    return new Response('fail', { status: 500 }); // 触发重试
  }

  const now = Date.now();
  const codeData = {
    email: order.email,
    order_id,
    aoid,
    created: now,
    pay_time,
    pay_price,
    used: false,
    device_fp: null
  };

  // 写 KV (注意顺序):code → order → email-index
  await env.UNLOCK_KV.put(`code:${code}`, JSON.stringify(codeData)); // 永久
  const updatedOrder = { ...order, status: 'paid', code, paid_at: now, more };
  await env.UNLOCK_KV.put(`order:${order_id}`, JSON.stringify(updatedOrder)); // 永久 (去掉 TTL)

  // email 索引追加 (防重复)
  const emailKey = `email:${order.email}`;
  const listRaw = await env.UNLOCK_KV.get(emailKey);
  const list = listRaw ? JSON.parse(listRaw) : [];
  if (!list.includes(order_id)) {
    list.push(order_id);
    await env.UNLOCK_KV.put(emailKey, JSON.stringify(list));
  }

  console.log('[webhook] paid', order_id, maskEmail(order.email), code);

  // 可选邮件通知
  if (env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: '搞掂 GaauDim <noreply@gaaudim.com>',
          to: order.email,
          subject: `你的解锁码 ${code} · 搞掂GaauDim付款凭证`,
          html: buildEmailHTML(code, order_id, pay_time, pay_price, aoid)
        })
      });
    } catch (e) {
      console.error('[resend] fail', e.message);
    }
  }

  return new Response('success', { status: 200 });
}

function buildEmailHTML(code, order_id, pay_time, pay_price, aoid) {
  return `
<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
  <h2 style="color:#C8982E">付款成功 · 搞掂GaauDim</h2>
  <p>你好,</p>
  <p>你已成功解锁 <strong>搞掂GaauDim 全站通行证</strong>。</p>
  <div style="background:#FFF8E8;border:1px solid #E4D6A6;border-radius:10px;padding:16px;margin:16px 0;text-align:center">
    <div style="font-size:13px;color:#888">你的解锁码</div>
    <div style="font-size:28px;font-weight:900;letter-spacing:3px;color:#C8982E;margin-top:6px">${code}</div>
  </div>
  <table style="width:100%;font-size:14px;color:#333;line-height:1.9">
    <tr><td style="color:#888;width:80px">订单号</td><td>${order_id}</td></tr>
    <tr><td style="color:#888">付款时间</td><td>${pay_time}</td></tr>
    <tr><td style="color:#888">金额</td><td>¥${pay_price}</td></tr>
    <tr><td style="color:#888">流水</td><td>${aoid}</td></tr>
  </table>
  <p style="margin-top:20px"><a href="https://gaaudim.com/?code=${code}" style="display:inline-block;background:#C8982E;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">一键解锁全站 →</a></p>
  <p style="font-size:12px;color:#888;margin-top:24px">换设备时可凭此邮箱到 <a href="https://gaaudim.com/lookup.html">gaaudim.com/lookup.html</a> 找回解锁码。</p>
</div>`;
}

// =============================================================
// 3) GET /api/check-payment/:orderId
// =============================================================
async function handleCheckPayment(request, env, origin, orderId) {
  if (!orderId || !orderId.startsWith('GDORD-')) {
    return jsonResponse({ status: 'error', error: 'bad_order_id' }, 400, origin);
  }
  const raw = await env.UNLOCK_KV.get(`order:${orderId}`);
  if (!raw) return jsonResponse({ status: 'not_found' }, 404, origin);
  const order = JSON.parse(raw);
  if (order.status !== 'paid') {
    return jsonResponse({ status: 'pending', created: order.created }, 200, origin);
  }
  // paid → 返回完整信息
  const codeRaw = await env.UNLOCK_KV.get(`code:${order.code}`);
  const codeData = codeRaw ? JSON.parse(codeRaw) : {};
  return jsonResponse({
    status: 'paid',
    code: order.code,
    email: order.email,
    order_id: orderId,
    aoid: order.aoid,
    pay_time: codeData.pay_time || '',
    pay_price: order.pay_price || PRICE
  }, 200, origin);
}

// =============================================================
// 4) POST /api/validate
// =============================================================
async function handleValidate(request, env, origin) {
  // IP 限流 (防撞库)
  const ip = getClientIP(request);
  const rlKey = `ratelimit:val_ip:${ip}`;
  const cur = await rateLimitBump(env.UNLOCK_KV, rlKey, 60);
  if (cur > RL_VAL_IP_MIN) {
    return jsonResponse({ valid: false, error: 'rate_limit' }, 429, origin);
  }

  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ valid: false, error: 'bad_json' }, 400, origin); }

  const code = (body.code || '').trim().toUpperCase();
  const fp = (body.fp || '').toString().slice(0, 64);
  if (!code) return jsonResponse({ valid: false, error: 'empty_code' }, 400, origin);

  // 老码分支
  if (code === env.LEGACY_CODE) {
    console.log('[validate] legacy_ok');
    return jsonResponse({ valid: true, legacy: true }, 200, origin);
  }

  // 新码分支
  const key = `code:${code}`;
  const raw = await env.UNLOCK_KV.get(key);
  if (!raw) return jsonResponse({ valid: false, error: 'not_found' }, 200, origin);
  const data = JSON.parse(raw);

  const deviceHash = fp || (await hashIpUa(request));

  if (!data.used) {
    // 首次验证 → 绑定设备
    data.used = true;
    data.device_fp = deviceHash;
    data.first_used_at = Date.now();
    await env.UNLOCK_KV.put(key, JSON.stringify(data));
    console.log('[validate] first_bind', code, maskEmail(data.email));
    return jsonResponse({ valid: true, first_time: true }, 200, origin);
  }

  // 已使用 → 同设备放行
  if (data.device_fp === deviceHash) {
    return jsonResponse({ valid: true }, 200, origin);
  }

  // 其他设备
  return jsonResponse({
    valid: false,
    error: 'code_bound_other_device',
    hint: '此码已绑定其他设备。请到 /lookup.html 凭付款邮箱找回。'
  }, 200, origin);
}

// =============================================================
// 5) POST /api/lookup
// =============================================================
async function handleLookup(request, env, origin) {
  const ip = getClientIP(request);
  let body;
  try { body = await request.json(); }
  catch { return jsonResponse({ ok: false, error: 'bad_json' }, 400, origin); }

  const email = (body.email || '').trim().toLowerCase();
  const last4 = (body.last4 || '').toString().trim();
  const order_id_hint = (body.order_id || '').toString().trim().toUpperCase();

  if (!isValidEmail(email)) {
    return jsonResponse({ ok: false, error: 'invalid_email' }, 400, origin);
  }

  // 限流
  const ipKey = `ratelimit:lookup_ip:${await sha256Hex(ip)}`;
  const emKey = `ratelimit:lookup_email:${email}`;
  const ipCur = await rateLimitBump(env.UNLOCK_KV, ipKey, 3600);
  if (ipCur > RL_LOOKUP_IP) {
    return jsonResponse({ ok: false, error: 'rate_limit_ip', msg: '查询过于频繁,请 1 小时后再试' }, 429, origin);
  }
  const emCur = await rateLimitBump(env.UNLOCK_KV, emKey, 86400);
  if (emCur > RL_LOOKUP_EMAIL) {
    return jsonResponse({ ok: false, error: 'rate_limit_email', msg: '此邮箱今日查询已达上限' }, 429, origin);
  }

  // 失败计数锁定
  const failKey = `lookup_fail:${email}`;
  const failCur = parseInt((await env.UNLOCK_KV.get(failKey)) || '0', 10);
  if (failCur >= 3) {
    return jsonResponse({ ok: false, error: 'locked', msg: '此邮箱已被临时锁定 1 小时' }, 429, origin);
  }

  // 查 email 索引
  const listRaw = await env.UNLOCK_KV.get(`email:${email}`);
  if (!listRaw) {
    await env.UNLOCK_KV.put(failKey, String(failCur + 1), { expirationTtl: 3600 });
    return jsonResponse({ ok: true, orders: [], msg: '未找到该邮箱下的订单' }, 200, origin);
  }
  const order_ids = JSON.parse(listRaw);
  const orders = [];
  let matched = false;

  for (const oid of order_ids) {
    const raw = await env.UNLOCK_KV.get(`order:${oid}`);
    if (!raw) continue;
    const o = JSON.parse(raw);
    if (o.status !== 'paid') continue;
    // last4 或 order_id_hint 至少一个匹配
    const priceMatch = last4 && (o.pay_price === last4 || o.pay_price.endsWith(last4));
    const oidMatch = order_id_hint && oid === order_id_hint;
    if (priceMatch || oidMatch || (!last4 && !order_id_hint)) {
      matched = true;
      orders.push({
        order_id: oid,
        code: o.code,
        pay_time: (await safeGetCodePayTime(env, o.code)) || '',
        pay_price: o.pay_price
      });
    }
  }

  // 防撞库:要求至少 last4 或 order_id_hint 其中之一,且命中
  if ((last4 || order_id_hint) && !matched) {
    await env.UNLOCK_KV.put(failKey, String(failCur + 1), { expirationTtl: 3600 });
    return jsonResponse({ ok: true, orders: [], msg: '信息不匹配,请核对邮箱、订单号或金额' }, 200, origin);
  }

  // 成功清零失败计数
  if (orders.length) await env.UNLOCK_KV.delete(failKey);

  return jsonResponse({ ok: true, orders }, 200, origin);
}

async function safeGetCodePayTime(env, code) {
  if (!code) return '';
  const raw = await env.UNLOCK_KV.get(`code:${code}`);
  if (!raw) return '';
  try { return JSON.parse(raw).pay_time || ''; } catch { return ''; }
}

// =============================================================
// 6) /api/admin/*  (Nick 后台)
// =============================================================
function checkAdmin(request, env) {
  const key = request.headers.get('X-Admin-Key') || '';
  return key && env.ADMIN_KEY && key === env.ADMIN_KEY;
}

async function handleAdminLookup(request, env, url) {
  if (!checkAdmin(request, env)) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  if (!email) return jsonResponse({ ok: false, error: 'email_required' }, 400);
  const listRaw = await env.UNLOCK_KV.get(`email:${email}`);
  const order_ids = listRaw ? JSON.parse(listRaw) : [];
  const orders = [];
  for (const oid of order_ids) {
    const raw = await env.UNLOCK_KV.get(`order:${oid}`);
    if (!raw) continue;
    orders.push(JSON.parse(raw));
  }
  return jsonResponse({ ok: true, email, count: orders.length, orders });
}

async function handleAdminList(request, env, url) {
  if (!checkAdmin(request, env)) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 500);
  const list = await env.UNLOCK_KV.list({ prefix: 'order:', limit });
  const results = [];
  for (const k of list.keys) {
    const raw = await env.UNLOCK_KV.get(k.name);
    if (!raw) continue;
    try {
      const o = JSON.parse(raw);
      results.push({ order_id: k.name.replace('order:', ''), ...o });
    } catch {}
  }
  return jsonResponse({ ok: true, count: results.length, orders: results });
}

async function handleAdminCreateCode(request, env, url) {
  if (!checkAdmin(request, env)) return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  const note = (url.searchParams.get('note') || 'manual').toString().slice(0, 80);
  if (!isValidEmail(email)) return jsonResponse({ ok: false, error: 'invalid_email' }, 400);

  let code = '', exists = true;
  for (let i = 0; i < 5 && exists; i++) {
    code = generateCode();
    exists = !!(await env.UNLOCK_KV.get(`code:${code}`));
  }
  if (exists) return jsonResponse({ ok: false, error: 'code_collision' }, 500);

  const order_id = generateOrderId();
  const now = Date.now();
  const payTime = new Date().toISOString().replace('T', ' ').slice(0, 19);

  await env.UNLOCK_KV.put(`code:${code}`, JSON.stringify({
    email, order_id, aoid: 'manual:' + note, created: now,
    pay_time: payTime, pay_price: PRICE, used: false, device_fp: null
  }));
  await env.UNLOCK_KV.put(`order:${order_id}`, JSON.stringify({
    email, phone: '', status: 'paid', aoid: 'manual:' + note,
    created: now, paid_at: now, channel: 'manual', pay_price: PRICE, code
  }));
  const emKey = `email:${email}`;
  const listRaw = await env.UNLOCK_KV.get(emKey);
  const list = listRaw ? JSON.parse(listRaw) : [];
  list.push(order_id);
  await env.UNLOCK_KV.put(emKey, JSON.stringify(list));

  console.log('[admin] create_code', maskEmail(email), code, note);
  return jsonResponse({ ok: true, code, order_id, email });
}

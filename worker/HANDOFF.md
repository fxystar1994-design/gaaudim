# GaauDim XorPay 接入 · 最终交付报告

> **上线日期:** 2026-04-17
> **Worker 生产 URL:** https://api.gaaudim.com
> **状态:** 核心链路 12/13 项实测通过,仅"真实付款回调"延后
> **维护人:** Nick (交付后)

---

## 1. 今日代码改动清单(精确到文件)

两次 commit 构成完整交付:

### 1.1 `b2df5ce` — feat(payment): XorPay Alipay + email recovery + worker deploy

Worker 后端(全新):

| 文件 | 行数 | 作用 |
|---|---|---|
| `worker/src/index.js` | +703 | Worker 主代码 · 9 个端点 · MD5 纯 JS 实现 · KV 操作 · CORS · 限流 |
| `worker/wrangler.toml` | +18 | 账号 + KV 绑定 + vars |
| `worker/package.json` | +14 | wrangler 3.70+ 依赖 |
| `worker/package-lock.json` | +1583 | 锁定依赖 |
| `worker/README.md` | +201 | 运维文档 |
| `worker/.gitignore` | +4 | 排除 .wrangler/.dev.vars |

前端(静态站):

| 文件 | 行数 | 作用 |
|---|---|---|
| `success.html` | +181 | 付款成功凭证页(轮询 /api/check-payment · 复制 · 下载 txt · 一键解锁) |
| `lookup.html` | +182 | 换设备找回页(邮箱 + 订单号/金额 · 防撞库校验) |
| `index.html` | +159 / -12 | 支付宝主按钮 + 邮箱/QR 子步骤 + Worker 验证分支 + lookup 链接;面包多降次级 |
| `paywall-check.js` | +145 / -13 | v3.5 → v4.0 同上改动 · Worker 验证 + 老 hash 降级兜底 |
| 84 个 `MayJie_*.html` + `translator.html` | 各 ±2 | `paywall-check.js?v=3.5 → v=4.0` 刷缓存 |

**统计:** 95 files changed, +3284 / -103

### 1.2 `cf5cdce` — fix(paywall): vendor qrcode.js locally to fix CORB block

| 文件 | 动作 |
|---|---|
| `vendor/qrcode.min.js` | 新建 · 55131B · `qrcode@1.4.4` UMD(1.5.x 没发 UMD) |
| `index.html` (L722-L732) | `loadQrLib` 改本地优先 + jsdelivr CDN fallback |
| `paywall-check.js` (L237-L247) | `pwLoadQrLib` 同上 |

**统计:** 3 files changed, +23 / -4

---

## 2. API 端点速查表

生产 URL: `https://api.gaaudim.com`

| Method | Path | 鉴权 | 用途 | 限流 |
|---|---|---|---|---|
| `GET` | `/health` | 无 | 健康检查 | — |
| `POST` | `/api/create-order` | CORS(白名单 Origin) | 前端下单,返回 XorPay 二维码 URL | 同 email 1h 最多 10 单 |
| `POST` | `/api/xorpay-webhook` | MD5 签名校验 | XorPay 付款成功回调(服务器端) | — |
| `GET` | `/api/check-payment/{order_id}` | 无 | success.html 轮询付款状态 | — |
| `POST` | `/api/validate` | CORS | 前端验证解锁码,首次绑定设备 | 同 IP 1min 最多 60 次 |
| `POST` | `/api/lookup` | CORS | 换设备凭邮箱+金额找回解锁码 | 同 IP 1h≤5 · 同 email 24h≤10 · 连错 3 次锁 1h |
| `GET` | `/api/admin/lookup?email=xxx` | `X-Admin-Key` | 按邮箱查所有订单 | — |
| `GET` | `/api/admin/list?limit=50` | `X-Admin-Key` | 列最近订单 | — |
| `GET` | `/api/admin/create-code?email=xxx&note=yyy` | `X-Admin-Key` | 手动补发码(微信/线下付款用户) | — |

**鉴权密钥:**
- `ADMIN_KEY`: `a7f3e9d4c6b2185f0e7d3a9c4b6e8f1d2c5a8b7e9f0d3a6c` (已存入 Worker Secret)
- `XORPAY_SECRET`: `4db66e706a2e4f6c8c1f345a9a0bbb17` (已存入 Worker Secret · 用于 webhook 签名)

---

## 3. 运维 cheatsheet

> ⚠ wrangler 本地版本 3.114.17,**默认就是远程操作**。不要加 `--remote`(会报 Unknown argument)。
> wrangler 4.x 起命令从 `kv:key` 改为 `kv key`(空格)— 两种写法下文都用 **4.x 语法**,3.114.17 上两种都兼容。

全部命令在 `/Users/fxystar/Downloads/gaaudim_with_GA/worker` 目录下执行。

### 3.1 实时日志

```bash
npx wrangler tail
```

> 建议首个真实付款前后一直开着,便于立即定位 webhook 是否到达。

### 3.2 查订单

```bash
# 列最近 50 单(JSON)
curl -H "X-Admin-Key: a7f3e9d4c6b2185f0e7d3a9c4b6e8f1d2c5a8b7e9f0d3a6c" \
  "https://api.gaaudim.com/api/admin/list?limit=50" | jq

# 按邮箱查
curl -H "X-Admin-Key: a7f3e9d4c6b2185f0e7d3a9c4b6e8f1d2c5a8b7e9f0d3a6c" \
  "https://api.gaaudim.com/api/admin/lookup?email=user@qq.com" | jq

# 订单总数
npx wrangler kv key list --binding=UNLOCK_KV --prefix="order:" | jq length
```

### 3.3 手动补发码(微信/线下付款用户)

```bash
curl -H "X-Admin-Key: a7f3e9d4c6b2185f0e7d3a9c4b6e8f1d2c5a8b7e9f0d3a6c" \
  "https://api.gaaudim.com/api/admin/create-code?email=xxx@qq.com&note=wechat_transfer_240417"
# 返回 {ok:true, code:"GD-XXXXXX", order_id:"GDORD-...", email:"xxx@qq.com"}
```

### 3.4 解绑某张码(用户换设备遗忘原设备)

```bash
# 先查
npx wrangler kv key get --binding=UNLOCK_KV "code:GD-XXXXXX"
# 把 used 改回 false, device_fp 改 null 后回写
echo '{"email":"xx@qq.com","order_id":"GDORD-xxx","aoid":"xxx","created":1718000000000,"pay_time":"2026-04-17 12:00:00","pay_price":"99.00","used":false,"device_fp":null}' | \
  npx wrangler kv key put --binding=UNLOCK_KV "code:GD-XXXXXX"
```

### 3.5 清理测试订单

```bash
npx wrangler kv key delete --binding=UNLOCK_KV "code:GD-XXXXXX"
npx wrangler kv key delete --binding=UNLOCK_KV "order:GDORD-XXXXXXXXXX"
npx wrangler kv key delete --binding=UNLOCK_KV "email:test-xxx@gaaudim.com"
```

### 3.6 重新部署 Worker

```bash
cd /Users/fxystar/Downloads/gaaudim_with_GA/worker
npx wrangler deploy
```

### 3.7 改密钥 / 轮换 Admin Key

```bash
# 更新 Secret (会立即在下一次请求生效,无需 deploy)
echo "新的值" | npx wrangler secret put ADMIN_KEY
# 如果换了 ADMIN_KEY,记得同步更新自己本地运维脚本里的 curl header
```

### 3.8 开邮件通知(Resend,可选)

```bash
echo "re_xxxxxxxxxxxxx" | npx wrangler secret put RESEND_API_KEY
# 在 Resend 后台验证 noreply@gaaudim.com 的 SPF/DKIM,然后:
npx wrangler deploy  # 重新部署让代码读到新 secret
```

---

## 4. 今日实测通过清单(12 项)

- ✅ 老码 `GD2026HKX9M7` · Worker legacy 分支 + 本地 `_h()` hash 双兜底
- ✅ XorPay API 真实对接(create-order 返回真实 qr.alipay.com)
- ✅ qrcode.js 本地化(`/vendor/qrcode.min.js` 解决 CORB 拦截)
- ✅ success.html 凭证卡(码/订单号/邮箱/时间/金额/流水号)
- ✅ 复制按钮 + 下载 txt 凭证(含找回指引)
- ✅ 一键解锁全站 + paywall-check.js v4.0 放行
- ✅ lookup.html 邮箱+金额换设备找回(同设备直接解锁)
- ✅ `device_fp` 跨设备绑定拒绝(手机测试弹出"此码已绑定其他设备·到找回页处理")
- ✅ CORS 白名单(gaaudim.com 放行,非法 Origin 默认化)
- ✅ ADMIN_KEY 认证(无 key 返 401)
- ✅ Webhook 签名校验(CC 冒烟测试验证)
- ✅ KV 清理命令无需 `--remote`(wrangler 4.x 默认远程)

---

## 5. 延后项目(按优先级)

### 🔴 [高] XorPay 真实付款回调验证

**原因:** 冒烟测试用的是 CC 签名伪造/幂等测试,不是真实 XorPay webhook。无法自付(同一支付宝账号不能自己付自己)。

**兑现方式:** 首个真实用户付款时同步开 `wrangler tail`,观察:

1. webhook 是否 200 到达(日志有 `[webhook] paid GDORD-xxx`)
2. 签名校验是否通过(没有 `[webhook] sign_invalid`)
3. 金额严格匹配 `'99.00'`(没有 `[webhook] price_mismatch`)
4. KV 三套 key 是否都写入(code:xxx / order:xxx / email:xxx)
5. success.html 是否在 30 秒内跳到 paid 状态

如果首笔付款回调失败:暂时手动用 `/api/admin/create-code` 补发(用户已验证可用),同步去 XorPay 后台看 webhook 送达记录排障。

### 🟡 [中] Resend 邮件通知

**现状:** `RESEND_API_KEY` 未设置 · Worker 代码已有 `buildEmailHTML()` 且在 webhook 里 try-catch 调用,不发也不影响主流程。当前凭证只在 `success.html` 网页展示,换设备只能凭邮箱去 `/lookup.html` 手动找回。

**影响:**
- 用户关掉浏览器后没有"凭证备份",依赖其记住/截图 success.html
- 客服申诉增加("我的码忘了"类)

**启用步骤:** 见 §3.8,需要:
1. Resend 账户 + API Key
2. DNS 加 SPF/DKIM 记录(Netlify DNS 下加 TXT)
3. `wrangler secret put RESEND_API_KEY`
4. `wrangler deploy`

### ✅ 已完成 2026-04-18 · Worker 自定义域名 `api.gaaudim.com`

**理由备注:** 中国大陆访问 workers.dev 被墙,提前执行(原排期为"低优"延后项)。

**当前生产 URL:** `https://api.gaaudim.com`(Cloudflare 自定义域,gaaudim.com 已托管在 Cloudflare)

**健康检查:** 2026-04-18 中国 iPhone 5G 实测 `GET https://api.gaaudim.com/health` → `{"ok":true,"t":1776517282977}`,SSL/DNS 均生效。

**已完成改动:**
1. ✅ Cloudflare Dashboard → Workers & Pages → `gaaudim-unlock` → Custom Domains → 绑定 `api.gaaudim.com`
2. ✅ 自动 DNS(CF 托管 gaaudim.com)
3. ✅ 前端 4 个 `WORKER_URL` 常量同步替换为 `https://api.gaaudim.com`:
   - `index.html`
   - `paywall-check.js`
   - `success.html`
   - `lookup.html`
4. ✅ `worker/README.md` / `worker/HANDOFF.md` 内文档示例 URL 同步替换
5. ✅ commit `fix(cn): migrate Worker URL to api.gaaudim.com for mainland China accessibility` 推送,Netlify 自动部署

**未改动(保持原状):**
- Worker 代码、KV 数据、XorPay notify_url 无需调整(workers.dev 原地址仍可用作备用入口,自定义域是并存映射)
- Worker CORS 白名单:仍只允许 `https://gaaudim.com`,因为前端只从 gaaudim.com 调 api.gaaudim.com,Origin 是 gaaudim.com,无需额外加项

### 🟢 [低] wrangler 升级 3.114.17 → 4.83.0

**当前:** `worker/package.json` 锁 `^3.70.0`,实际装了 3.114.17

**升级原因:** 官方 deprecation warning,4.x 是 LTS

**兼容风险:**
- 命令语法 `kv:key` → `kv key`(已 HANDOFF 文档里用 4.x 语法,向前兼容 3.x)
- wrangler.toml 字段若有破坏性变更需对照 [3→4 migration](https://developers.cloudflare.com/workers/wrangler/migration/v3-to-v4/) 调整

**建议:** 等系统稳定运行 2-4 周、首批真实付款走完后,再择机:

```bash
cd worker
npm install --save-dev wrangler@4
npx wrangler deploy  # 验证
```

---

## 6. 故障排查手册

| 症状 | 可能原因 | 排查步骤 |
|---|---|---|
| 用户扫码付了款,success.html 一直 loading | XorPay webhook 没到 | `wrangler tail` 看有无 `[webhook]` · 去 XorPay 后台查回调记录 · 若 XorPay 端显示"发送成功"但 Worker 无日志,检查 XorPay notify_url 是否填 `https://api.gaaudim.com/api/xorpay-webhook`(非 gaaudim.com) |
| webhook 到了但返 403 | 签名不对 | `wrangler secret list` 确认 `XORPAY_SECRET` 存在 · 到 XorPay 后台核对 app_secret 是否修改过 · Worker 日志搜 `[webhook] sign_invalid` |
| webhook 到了但返 success 却没发码 | 金额不是 99.00 | 日志 `[webhook] price_mismatch` · 检查是否有人在 XorPay 改过订单金额 · KV `error:price_mismatch:*` 记录 30 天 |
| 用户报"解锁码用不了" | 码已绑定其他设备 | `wrangler kv key get --binding=UNLOCK_KV "code:GD-XXXXXX"` 看 `device_fp` 是否和当前不一致 · 必要时用 §3.4 手动解绑 |
| /api/lookup 返 429 | 同 IP 1h 超 5 次或同 email 24h 超 10 次 | 让用户换网络或等;如需强解:`wrangler kv key list --binding=UNLOCK_KV --prefix="ratelimit:lookup_"` 找到对应 key 后 `kv key delete` |
| /api/lookup 返 locked | 连续错 3 次被锁 1h | 同上,删 `lookup_fail:<email>` |
| create-order 返 502 xorpay_unreachable | XorPay 网络故障 | 让用户走面包多备选通道 · 或稍后重试 |
| create-order 返 400 invalid_email | 前端校验漏了 | 浏览器 Console 看 fetch body · 前端 regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` 和 Worker 端 `^[^\s@]{1,64}@[^\s@]{2,}\.[^\s@]{2,}$` 规则稍有差异,用户填奇异邮箱可能前端过后端挂 |
| 桌面端二维码空白 + CORB 报错 | 外部 CDN 被拦 | 已修复(`cf5cdce`)· 本地 `/vendor/qrcode.min.js?v=1` 优先 · 若还出现,检查 Netlify 是否部署了 `vendor/` 目录 |
| lookup 返 {ok:true, orders:[]} | 邮箱从未有过 paid 订单 / 填的金额不是 99.00 | 让用户核对付款时填的邮箱 · last4 必须精确 `99.00`(字符串匹配) |
| admin 接口返 401 | `X-Admin-Key` header 缺失或错误 | 确认 header 名拼写 · 确认 key 值无多余空格换行 |

---

## 7. 关键文件索引(Nick 维护用)

```
/Users/fxystar/Downloads/gaaudim_with_GA/
├── index.html               # 首页 + 付费弹窗(L704-L800 是 XorPay JS)
├── paywall-check.js         # 课程页付费墙 v4.0(IIFE 内全部逻辑)
├── success.html             # 付款成功凭证页
├── lookup.html              # 换设备找回页
├── vendor/qrcode.min.js     # qrcode@1.4.4 UMD · 不要改
├── MayJie_EP*.html          # 84 个课程页 · 都引 paywall-check.js?v=4.0
└── worker/
    ├── src/index.js         # Worker 所有业务逻辑
    ├── wrangler.toml        # 绑定配置(account_id + KV id)
    ├── package.json
    ├── README.md            # 初版运维文档
    └── HANDOFF.md           # ← 本文档
```

**前端 Worker URL 耦合点(4 处同步改):**

当前值:`https://api.gaaudim.com`(2026-04-18 起,原 `gaaudim-unlock.fxystar1994.workers.dev` 因中国大陆被墙已下线引用)

1. `index.html` 搜 `var WORKER_URL=`
2. `paywall-check.js` 搜 `var WORKER_URL=`
3. `success.html` 搜 `var WORKER_URL =`
4. `lookup.html` 搜 `var WORKER_URL =`

> 若未来再切域名(例如换账号或启用多域名),4 处必须同步,否则 CORS/fetch 会静默失败。

---

## 8. 变更记录

| 日期 | 版本 | 内容 | Commit |
|---|---|---|---|
| 2026-04-17 | v1.0 | 初版 · XorPay 支付宝接入 + lookup 找回 + success 凭证 | `b2df5ce` |
| 2026-04-17 | v1.0.1 | 修复桌面端 CORB 拦截 qrcode.js · 本地 vendor | `cf5cdce` |
| 2026-04-17 | — | HANDOFF 交付文档 + README 命令修正 | 本次 |

# gaaudim-unlock Worker 交付文档

> XorPay 支付宝付款 → 自动发解锁码 / 换设备凭邮箱找回 / 面包多通道共存
> 2026-04-17 初版

---

## 1. 线上地址

- Worker URL: `https://gaaudim-unlock.fxystar1994.workers.dev`
- 前端入口: `https://gaaudim.com/` (付费弹窗)、`https://gaaudim.com/success.html` (凭证)、`https://gaaudim.com/lookup.html` (找回)
- XorPay 后台: https://xorpay.com (AID: `703606`)
- Cloudflare 后台: https://dash.cloudflare.com/0143defacbe1fa10bdcc3285c043f18b

---

## 2. 首次部署步骤(新机器/重装)

```bash
cd /Users/fxystar/Downloads/gaaudim_with_GA/worker

# 1) 装 wrangler (只装一次)
npm install

# 2) Cloudflare 登录
npx wrangler login          # 浏览器会打开 → 点 Allow

# 3) 部署 secrets (每个命令敲完回车后粘贴 value,再回车)
npx wrangler secret put XORPAY_SECRET
# → 粘贴: 4db66e706a2e4f6c8c1f345a9a0bbb17

npx wrangler secret put ADMIN_KEY
# → 粘贴: a7f3e9d4c6b2185f0e7d3a9c4b6e8f1d2c5a8b7e9f0d3a6c

# 可选 — 邮件通知:
# npx wrangler secret put RESEND_API_KEY

# 4) 预置老解锁码 (老用户 3 位仍用它)
# wrangler 4.x 默认就是远程,不要加 --remote 否则报 Unknown argument
npx wrangler kv key put --binding=UNLOCK_KV \
  "legacy:GD2026HKX9M7" '{"valid":true,"old":true}'

# 5) 部署
npx wrangler deploy
```

部署成功后会看到形如:
```
Published gaaudim-unlock
  https://gaaudim-unlock.fxystar1994.workers.dev
```

---

## 3. XorPay 后台配置

登 https://xorpay.com,商户后台 → 应用 703606:

1. **notify_url 白名单**(如有):填 `https://gaaudim-unlock.fxystar1994.workers.dev/api/xorpay-webhook`
2. **回调 IP 白名单**:一般不用配,XorPay 直接 POST 即可
3. **测试**:后台有"发送测试回调"功能,建议先用 `¥0.01` 创建一单,过流程,确认回调签名校验通过

> 每次 webhook 到达后,Worker 会在 log 里输出 `[webhook] paid <order_id>` 或错误原因。用 `npx wrangler tail` 实时监控。

---

## 4. 日常运维

### 4.1 实时看日志

```bash
cd worker
npx wrangler tail
```

### 4.2 查最近 50 个订单

```bash
curl -H "X-Admin-Key: a7f3e9d4c6b2185f0e7d3a9c4b6e8f1d2c5a8b7e9f0d3a6c" \
  "https://gaaudim-unlock.fxystar1994.workers.dev/api/admin/list?limit=50" | jq
```

### 4.3 按邮箱查订单(用户申诉时)

```bash
curl -H "X-Admin-Key: <ADMIN_KEY>" \
  "https://gaaudim-unlock.fxystar1994.workers.dev/api/admin/lookup?email=user@example.com" | jq
```

返回该邮箱所有 paid 订单 + 对应的解锁码 + device_fp 绑定状态。

### 4.4 手动补发码(微信/线下付款用户)

```bash
curl -H "X-Admin-Key: <ADMIN_KEY>" \
  "https://gaaudim-unlock.fxystar1994.workers.dev/api/admin/create-code?email=xxx@qq.com&note=wechat_transfer_240417"
```

返回 `{ok:true, code:"GD-XXXXXX", order_id:"GDORD-..."}`,把 code 发给客户。

### 4.5 统计订单总数 / 总收入

```bash
# 订单总数
npx wrangler kv key list --binding=UNLOCK_KV --prefix="order:" | jq length

# 细看(所有订单 JSON)
npx wrangler kv key list --binding=UNLOCK_KV --prefix="order:" | \
  jq -r '.[].name' | while read k; do
    npx wrangler kv key get --binding=UNLOCK_KV "$k"; echo
  done
```

总收入 = paid 订单数 × ¥99。

### 4.6 解绑某张码(用户换设备遗忘原设备)

```bash
# 先查
npx wrangler kv key get --binding=UNLOCK_KV "code:GD-XXXXXX"
# 手动编辑后回写 (把 used 改回 false, device_fp 改 null)
echo '{"email":"xx@qq.com","order_id":"GDORD-xxx","aoid":"xxx","created":1718000000000,"pay_time":"2026-04-17 12:00:00","pay_price":"99.00","used":false,"device_fp":null}' | \
  npx wrangler kv key put --binding=UNLOCK_KV "code:GD-XXXXXX"
```

---

## 5. 前端代码与 Worker 耦合点

| 前端文件 | 耦合点 |
|---|---|
| `index.html` | `var WORKER_URL='https://gaaudim-unlock.fxystar1994.workers.dev'` |
| `paywall-check.js` | 同上 (IIFE 顶部) |
| `success.html` | 同上 |
| `lookup.html` | 同上 |

如果 Worker 换域名,**这四处都要同步改**。

---

## 6. 常见故障排查

| 症状 | 可能原因 | 排查方法 |
|---|---|---|
| 用户扫码付了款但没跳转 success | XorPay webhook 没到 | `wrangler tail` 看 `[webhook]`;若完全没日志,去 XorPay 后台查回调记录 |
| webhook 到了但返 403 | 签名不对 | 检查 `XORPAY_SECRET` 是否正确 (`wrangler secret list`) |
| 用户说码用不了 | 换设备绑定冲突 | 查 `code:GD-XXXXXX`,看 device_fp 是否和当前不一致 |
| /api/lookup 返回 rate_limit | 同 IP 1h 超 5 次 or 同邮箱 24h 超 10 次 | 让用户等,或从 KV 删除 `ratelimit:lookup_ip:...` / `ratelimit:lookup_email:...` |
| 订单一直 pending | XorPay 没收到款,或支付宝超时 | 让用户再扫一次,或重建订单 |

---

## 7. Resend 邮件通知接入(可选)

1. 去 https://resend.com 注册,新建 API Key
2. `npx wrangler secret put RESEND_API_KEY` → 粘 key
3. 在 Resend 后台绑定 `noreply@gaaudim.com` (DNS 加 SPF/DKIM)
4. 重新部署 `npx wrangler deploy`

下次有新付款,用户会收到含解锁码的邮件。

---

## 8. 数据结构参考(KV key 命名)

| Key | Value | TTL |
|---|---|---|
| `code:GD-XXXXXX` | `{email,order_id,aoid,created,pay_time,pay_price,used,device_fp}` | 永久 |
| `order:GDORD-xxxxxxxxxx` | `{email,phone,status,aoid,created,channel,pay_price,code?,paid_at?}` | pending:24h / paid:永久 |
| `email:user@x.com` | `["GDORD-aaa","GDORD-bbb"]` | 永久 |
| `legacy:GD2026HKX9M7` | `{"valid":true,"old":true}` | 永久 |
| `ratelimit:email_create:<email>` | 计数字符串 | 1h |
| `ratelimit:val_ip:<ip>` | 计数 | 60s |
| `ratelimit:lookup_ip:<sha256_ip>` | 计数 | 1h |
| `ratelimit:lookup_email:<email>` | 计数 | 24h |
| `lookup_fail:<email>` | 失败次数 | 1h (≥3 锁定) |
| `error:sign_fail:<ts>` | 调试记录 | 7d |
| `error:price_mismatch:<ts>` | 调试记录 | 30d |

---

## 9. 测试清单

完整测试过一遍(¥0.01 测试单):

- [ ] XorPay 后台"发送测试回调",看 `wrangler tail` 有 `[webhook] paid`
- [ ] `wrangler kv key get --binding=UNLOCK_KV "code:GD-XXXXXX"` 看码已写入
- [ ] 手工拼 `/success.html?order_id=GDORD-xxx` 打开,显示凭证卡
- [ ] 首页付费弹窗输入新码 → 解锁成功
- [ ] 某课程页(如 MayJie_EP06)输入新码 → 解锁成功
- [ ] 老码 `GD2026HKX9M7` 在新版 validate 仍能用
- [ ] `/lookup.html` 输入邮箱+金额 → 返回码
- [ ] 第二台设备(或隐身窗口)输入同一新码 → 报 `code_bound_other_device`
- [ ] 无签名伪造 webhook → 返 403
- [ ] 同 IP 连续 11 次创建订单 → 第 11 次返 429
- [ ] 幂等:同一 webhook 重放 → KV code 不重复写入

---

## 10. 变更记录

- **2026-04-17 v1.0** — 初版,接入 XorPay。

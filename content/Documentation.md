# Crypto Tip Jar — Finalized Project Overview & Design (Solana + x402)

**Status:** Finalized v1.0 (Solana‑only, USDC via x402, free‑tier architecture)

**Audience:** Engineering, Product, Operations

**Objective:** Provide a cohesive specification for the client and server programs, their free hosting profile, security, and the MVP feature set.

---

## 0. Abstract

Crypto Tip Jar enables anyone to publish a personalized “crypto business card” (tip page) and receive tips in **USDC on Solana**. The platform offers a **free tier** at `cryptip.org/<wallet>` and paid upgrades purchased via **x402** with Phantom. Upgrades include vanity paths, custom domains, premium template packs, and **limited visual add‑ons**—the latter minted as NFTs (on‑chain entitlements). Template packs are represented by **non‑transferable Token‑2022 licenses**; rare add‑ons are **collection‑verified NFTs**. The system is **non‑custodial**: funds move directly from supporters to creators; our backend only verifies payments, issues entitlements, and renders pages.

---

## 1. Problem & Goals

### 1.1 Problem

Creators lack a fast, non‑custodial way to stand up a personal landing page that doubles as a crypto tip hub and a flexible brand identity surface.

### 1.2 Goals

* **Frictionless free page** at `cryptip.org/<wallet>` with basic templates and instant sharing.
* **Upsell via x402**: client‑side Phantom checkout for vanity paths, custom domains, and design packs.
* **On‑chain entitlements**: template licenses (non‑transferable) and rare visual add‑ons (transferable) minted to the owner’s wallet.
* **Quality editor**: rich customization with entitlement‑gated features; fast mobile render.
* **Non‑custodial & auditable**: we verify, mint, and render—never hold funds.

### 1.3 Non‑Goals

* Holding user funds or managing custodied balances.
* Building a decentralized social network (future discovery/gallery optional).

---

## 2. System Overview (Free‑tier reference architecture)

```
Browser (Phantom) ─▶ x402 Checkout (USDC/SPL)
      │                       │
      │                       └─▶ Signed tx on Solana
      │                             │
      │                             ▼
      └────────────────────────▶ Crypto Tip Jar BFF (Next.js API on Vercel)
                                  • Verify x402 webhooks + on‑chain tx
                                  • Mint entitlements synchronously (fast path)
                                  • Pages CRUD & entitlement snapshots
                                   ▲
                                   │
                         Supabase Postgres (Free)
                               (Service Role from server only)
                                   ▲
                                   │
                      Solana RPC (Helius Free API key)

Optional (still free): Upstash Redis for simple rate‑limits & idempotency locks.
Scheduled (free): Vercel Cron (once/day) for reconciliation of failed mints & subscriptions.
```

* **Client program**: Next.js (App Router), editor UI, Phantom integration, store modal powered by x402.
* **Server program**: Next.js API routes on Vercel (backend‑for‑frontend). No separate server.
* **Data**: Supabase Postgres (free tier). Server‑only Service Role client; browser never touches DB directly.
* **Minting**: Synchronous in the x402 webhook path (fast path). If it fails, mark `paid-pending-mint` and retry via daily Vercel Cron.

> This profile deliberately avoids paid infrastructure (queues, KMS) while preserving security basics and idempotency.

---

## 3. Offering & Monetization

### 3.1 Free Tier

* Page at `cryptip.org/<wallet>` with 2 base templates, QR tip widget, social links, light/dark.

### 3.2 Paid Upgrades (x402)

* **Vanity Path**: `cryptip.org/<custom-name>` (small monthly fee). Managed as a subscription (off‑chain expiry timestamp).
* **Custom Domain**: Point `yourname.xyz` to your page (larger monthly fee). DNS TXT verification; auto SSL via Vercel domain linking.
* **Template Packs**: one‑time purchase, minted as **non‑transferable Token‑2022 license NFTs** bound to the wallet.
* **Limited Add‑Ons**: rare, tradeable **collection‑verified NFTs** that enable effects/components (per‑SKU cap).

> Entitlements are checked client‑side (via API snapshot) and enforced server‑side. Licenses are SBT‑style (non‑transferable); add‑ons are standard NFTs.

---

## 4. Client Programs

### 4.1 Web App (Next.js)

* **Routes**

  * `/(marketing)`
  * `/tip/[walletOrSlug]` — SSR public page
  * `/dashboard` — creator home
  * `/editor` — visual editor (entitlement‑gated components)
  * `/store` — SKU catalog/modal
* **UI**: Tailwind + shadcn/ui; a11y basics; Recharts for analytics.
* **State**: React Query/Server Actions; Zod validation.
* **Wallet**: `@solana/wallet-adapter` (Phantom) for connect/signing.
* **x402**: backend returns order payload; Phantom signs/sends.

### 4.2 Editor UX

* **Template Picker**: base + unlocked; live preview.
* **Sections**: avatar, bio, links, media, gallery, tip widget, FAQ.
* **Theme**: palette, font, spacing, background (image/video/shader). Add‑ons unlock effects.
* **Gating**: `NEXT_PUBLIC_API_BASE_URL` + `/api/me/entitlements` (direct backend call) drives locks and purchase CTAs.
* **Publish**: saves JSON config; SSR composes deterministic HTML/CSS.

### 4.3 Error Handling & UX

* **Checkout states**: pending → confirmed → minted; toasts and inline statuses.
* **Rate limits**: visible cooldowns for create/rename.
* **Recovery**: If mint fails, entitlement still unlocks (`paid-pending-mint`), and a cron job reconciles.

---

## 5. Server Programs

### 5.1 Backend HTTP API

**Key endpoints**

```
POST /api/auth/siws/start        → returns nonce + message
POST /api/auth/siws/finish       → verify signature → set HttpOnly session cookie
GET  /api/pages/:slug            → public page metadata
POST /api/pages                  → create/update page (auth)
GET  /api/me                     → profile + entitlements snapshot (auth)
GET  /api/me/entitlements        → licenses/add‑ons/subscriptions (auth)
POST /api/store/checkout         → create order, return x402 tx payload
POST /api/store/webhook/x402     → HMAC verify → on‑chain confirm → mark paid → **mint now**
GET  /api/health                 → { build, db, rpc }
```

**Responsibilities**

* Construct x402 payloads and persist `purchases(pending)`.
* On webhook: verify HMAC + confirm on chain; set `paid` and **mint synchronously**. On mint failure → set `paid-pending-mint`.
* Serve entitlement snapshots; enforce vanity/custom‑domain validity in routing middleware.

### 5.2 Scheduled Jobs (Vercel Cron, free tier)

* **Daily**: retry `paid-pending-mint` mints; expire vanity/custom‑domain subscriptions; send renewal notices.

---

## 6. Data Model

**users**

* `id UUID PK`, `wallet_pubkey TEXT UNIQUE`, `handle TEXT UNIQUE NULL`, `created_at TIMESTAMPTZ`, `last_login TIMESTAMPTZ`

**pages**

* `id UUID PK`, `user_id UUID FK`, `slug TEXT UNIQUE NULL`, `custom_domain TEXT NULL`, `template_key TEXT`, `theme_json JSONB`, `public BOOL DEFAULT true`, `created_at`

**purchases**

* `id UUID PK`, `user_id UUID FK`, `sku TEXT`, `amount_atomic BIGINT`, `tx_sig TEXT UNIQUE`, `status TEXT CHECK (status IN ('pending','paid','paid-pending-mint','failed'))`, `idempotency_key TEXT UNIQUE`, `created_at`

**entitlements**

* `id UUID PK`, `user_id UUID FK`, `type TEXT CHECK (type IN ('license','addon','subscription'))`, `sku TEXT`, `ref_mint TEXT NULL`, `status TEXT CHECK (status IN ('active','expired','revoked'))`, `expires_at TIMESTAMPTZ NULL`, `source_purchase UUID FK`, `created_at`

**nfts_minted**

* `id UUID PK`, `user_id UUID FK`, `purchase_id UUID FK`, `mint_address TEXT UNIQUE`, `kind TEXT CHECK (kind IN ('license','addon'))`, `collection TEXT NULL`, `metadata_uri TEXT`, `collection_verified BOOL`, `created_at`

**subscriptions**

* `id UUID PK`, `user_id UUID FK`, `feature TEXT CHECK (feature IN ('vanity','custom_domain'))`, `period_start`, `period_end`, `status TEXT CHECK (status IN ('active','grace','expired'))`

**domains**

* `id UUID PK`, `user_id UUID FK`, `domain TEXT UNIQUE`, `verification_txt TEXT`, `ssl_status TEXT`, `status TEXT`, `created_at`

**templates**

* `key TEXT PK`, `name TEXT`, `preview_url TEXT`, `min_tier TEXT`, `schema_json JSONB`, `price_sku TEXT NULL`

**addons**

* `key TEXT PK`, `name TEXT`, `supply_cap INT`, `collection TEXT`, `price_sku TEXT`, `active BOOL`

**webhook_events**

* `id UUID PK`, `provider TEXT`, `raw_json JSONB`, `signature_valid BOOL`, `idempotency_key TEXT`, `processed BOOL`, `created_at`

**Indexes**: `purchases(tx_sig)`, `purchases(idempotency_key)`, `pages(slug)`, `nfts_minted(mint_address)`, `entitlements(user_id, type, sku)`, `domains(domain)`.

**RLS policy sketch** (optional for MVP since server uses Service Role)

* `pages`: public read on whitelisted columns; owners can update.
* `entitlements`, `purchases`, `nfts_minted`, `subscriptions`, `domains`: owner‑only.

> MVP uses server‑only Supabase Service Role from API routes. All client DB access goes through our API, with owner checks in code. We can enable strict RLS later.

---

## 7. NFTs & On‑Chain Entitlements

### 7.1 License NFTs (Non‑Transferable)

* **Standard**: Token‑2022 with **NonTransferable** extension.
* **Use**: Template packs (lifetime license). One token per pack per user.
* **Validation**: Client uses API snapshot; server can verify on chain; token cannot be transferred.

### 7.2 Limited Add‑Ons (Transferable)

* **Standard**: Metaplex Token Metadata; collection‑verified; fixed supply per SKU.
* **Use**: Unlock effects/components; transferable for collectability/resale.
* **Validation**: API confirms ownership of a collection‑verified mint.

### 7.3 Minting Service (Free‑profile)

* **Signer**: Collection/signing key loaded from Vercel env vars; enforce SKU allowlist in code. (Upgrade path: move to KMS later.)
* **Metadata**: Supabase Storage (free) for images/JSON now; Arweave/IPFS later.
* **Idempotency**: `purchase_id` is the mint job key; webhook + DB checks prevent double‑minting.

---

## 8. Payments (x402 + Phantom)

### 8.1 Flow

1. User picks an SKU (e.g., `templates.packA`).
2. Frontend calls backend `/api/store/checkout` with `{ sku }`.
3. Backend validates SKU (allowlist), inserts `purchases(pending)` with `idempotency_key`, returns **x402 tx payload**.
4. Phantom signs/sends USDC tx.
5. x402 posts **webhook** → backend `/api/store/webhook/x402` with `{ order_id, sku, tx_sig, amount_atomic }` and headers `X-402-Signature`, `X-Idempotency-Key`.
6. Backend verifies HMAC + confirms tx on chain with `finalized` commitment; sets purchase → **paid** and **mints immediately**. On mint error → set `paid-pending-mint` for daily retry.

### 8.2 SKUs (MVP)

* `vanity.monthly` — subscription entitlement; off‑chain expiry.
* `templates.packA` — non‑transferable license NFT.
* `addon.halo.v1` — limited, transferable NFT (e.g., supply 250).

### 8.3 Webhook semantics

* **Headers**: `X-402-Signature = base64(HMAC-SHA256(raw_body, X402_WEBHOOK_SECRET))`, `X-Idempotency-Key = uuid`.
* **Responses**: `200` processed; `409` duplicate idempotency (safe); `422` amount/memo mismatch; `401` bad signature; `500` transient.

---

## 9. Security Model (Free‑tier practical)

* **Authentication**: SIWS with nonce; issue **15‑minute JWT** stored as **HttpOnly, Secure, SameSite=Lax** cookie; audience/domain bound.
* **Webhook security**: HMAC verification + idempotency keys; store raw payloads.
* **Mint signer**: env‑backed key with **SKU allowlist** and tight code paths. (Upgrade path: KMS/HSM.)
* **DB access**: server‑only Service Role; all writes checked against `req.user_id`.
* **Rate limiting**: per IP + per wallet on auth, checkout, webhooks (optional Redis for counters).
* **Observability**: structured logs with `request_id`; health checks; alerting on mint/webhook failures.

**Threat highlights & mitigations**

* **Fake collections** → enforce collection verification; display collection badge.
* **DNS hijack** → TXT verification + automatic SSL; revoke on mismatch.
* **RPC issues** → fallback RPC + retries; circuit breaker on verification calls.

---

## 10. Hosting & Deployment (Free‑only)

* **Frontend + API + Webhooks**: **Vercel Hobby** (Node 20). SSR for `/tip/[slug]` and API routes.
* **DB**: **Supabase Free** (Postgres). Service Role key used only on server.
* **RPC**: **Helius Free** API key.
* **Storage**: **Supabase Storage Free** for media + NFT JSON.
* **Rate‑limit/locks (optional)**: **Upstash Redis Free**.
* **Cron**: **Vercel Cron** once/day for reconciliation.
* **Env management**: Vercel Environment Variables per environment.

**Scaling notes**: Vercel scales API routes for bursts; keep webhook fast (single on‑chain confirm + mint). When outgrowing free limits, add a queue and move signer to KMS.

---

## 11. API Contracts (selected)

### 11.1 Checkout

**POST** `/api/store/checkout`

```json
{ "sku": "templates.packA" }
```

**200**

```json
{
  "order_id": "uuid",
  "x402": { "transaction": "...serialized...", "expires_at": 1736200000 }
}
```

### 11.2 Webhook (x402)

**POST** `/api/store/webhook/x402`

* **Headers**: `X-402-Signature`, `X-Idempotency-Key`

```json
{ "order_id": "uuid", "sku": "templates.packA", "tx_sig": "5Y...", "amount_atomic": 1000000 }
```

**200** `{ "status": "ok" }`

---

## 12. MVP Scope & Acceptance Criteria

### 12.1 Scope

* Free pages at `/[wallet]` with 2 base templates + QR widget.
* SIWS auth with nonce + JWT; dashboard & editor.
* Store with 3 SKUs: `vanity.monthly`, `templates.packA`, `addon.halo.v1`.
* x402 checkout E2E: order → Phantom → webhook → verify → **mint/activate**.
* Entitlement gating in editor; vanity routing middleware.
* Analytics (views, tips) + CSV export.
* Admin view for failed mints/webhooks.

### 12.2 Acceptance

* Post‑purchase, UI reflects entitlement **≤10s p95** from on‑chain confirm.
* License NFTs are **NonTransferable** on Token‑2022; add‑ons are **collection‑verified** with supply accounting.
* Vanity path active only when subscription `active` or `grace`.
* Webhooks idempotent: repeated deliveries never double‑mint/activate.
* Health endpoint returns build hash + DB/RPC status.

---

## 13. Observability, QA, and Ops

* **Logging**: pino JSON with `request_id`, `user_id?`, `wallet`, `route`, `sku`, `purchase_id`.
* **Metrics**: `api_latency_ms`, `webhook_ok_rate`, `mint_ok_rate`, `editor_save_ms`, `page_ssr_ms`.
* **Tracing**: OpenTelemetry spans across checkout → webhook → mint (baggage: `purchase_id`).
* **Testing**: Unit (Vitest), API contracts, E2E (Playwright) simulating Phantom + webhook.
* **Runbooks**: webhook failure handling, stuck mint reconciliation, DNS verification issues.

---

## 14. Risks & Mitigations

* **RPC downtime/lag** → multi‑provider fallback URLs; retries with backoff.
* **Signer compromise** (env‑key) → strict SKU allowlist, minimal scope code, rotate keys on deploy; upgrade to KMS when feasible.
* **x402/Phantom UX edge cases** → robust errors; retry checkout; cron resumes failed mints.
* **Fraudulent mint claims** → on‑chain verification + collection checks.
* **Subscription drift** → daily reconciliation + 72h grace before revoke.

---

## 15. Environment & Configuration

**Core env vars (free profile)**

* `NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta`
* `RPC_PRIMARY_URL` (Helius) ; `RPC_FALLBACK_URL` (alt RPC)
* `X402_WEBHOOK_SECRET`
* `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
* `JWT_SECRET`, `SIWS_DOMAIN=cryptip.org`
* `MINT_COLLECTION_ADDRESS`, `MINT_SIGNER_SECRET` (env key)
* `STORAGE_BUCKET` (Supabase), `PUBLIC_STORAGE_BASE_URL`
* *(Optional)* `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Secrets handling**: Vercel encrypted env; no private keys in repo.

---

## 16. Roadmap (Post‑MVP)

* Custom domains at scale (DNS APIs + automated SSL).
* Template marketplace & revenue share.
* Advanced editor (grid, component marketplace, collaboration).
* Seasonal programmable add‑ons (rule sets, time‑locked reveals).
* Public discovery gallery with curation.
* Infra upgrades: async queue (QStash), KMS signer, higher‑frequency cron.

---

## 17. Conclusion

This design delivers a non‑custodial, Solana‑native platform where free pages are the on‑ramp and **x402** purchases unlock deep customization via **on‑chain entitlements**. The free‑tier architecture (Vercel + Supabase + Helius, optional Upstash) keeps operations simple and cost‑free while remaining secure and idempotent. When usage grows, we have a clean path to queues, KMS, and higher‑frequency jobs—without rewriting the core.

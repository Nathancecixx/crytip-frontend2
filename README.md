# Crypto Tip Jar — Frontend (Next.js)

MVP React app for the Crypto Tip Jar project. Works with the separate backend (x402 + Supabase) you deployed on Vercel.

## Quick start

```bash
pnpm i   # or npm i / yarn
cp .env.example .env.local
pnpm dev
```

### Required env
- `NEXT_PUBLIC_BFF_ORIGIN` – e.g. `https://crytip-backend2.vercel.app/api`
- `NEXT_PUBLIC_SOLANA_CLUSTER` – `mainnet-beta` (default) | `devnet` | `testnet`
- `NEXT_PUBLIC_SOLANA_RPC` – (optional) Helius or other RPC URL

## Features
- Phantom wallet connect (wallet-adapter)
- SIWS: `/login` calls backend `/auth/siws/start` and `/finish` through the `/bff` proxy
- Dashboard shows your entitlements from `/bff/me/entitlements`
- Editor with templates, theme, links; saves to `/bff/pages`
- Store page calls `/bff/store/checkout` and submits the returned x402 transaction through Phantom
- Public tip pages at `/{walletOrSlug}` (SSR fetching from backend)

## Deployment (Vercel)
- Import this repo into Vercel as a Next.js app.
- Set envs in Vercel Project Settings:
  - `NEXT_PUBLIC_BFF_ORIGIN=https://<your-backend>.vercel.app/api`
  - `NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta`
  - `NEXT_PUBLIC_SOLANA_RPC=https://rpc.helius.xyz/?api-key=<key>` (optional)
- Deploy.
- Ensure your backend sets cookies with a domain that matches your frontend if you need cross-site auth.

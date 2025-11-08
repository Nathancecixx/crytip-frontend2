# Crypto Tip Jar — Frontend (Next.js)

MVP React app for the Crypto Tip Jar project. Works with the separate backend (x402 + Supabase) you deployed on Vercel.

The frontend talks directly to that backend (no BFF). `/login` posts to the backend's `/api/auth/siws/start` and `/finish` endpoints, so make sure your backend allow-lists your local dev origin (e.g. `http://localhost:3000` for the backend and `http://localhost:3001` or similar for the frontend).

## Quick start

```bash
pnpm i   # or npm i / yarn
cp .env.example .env.local
pnpm dev
```

> ⚠️ If your backend is already listening on `http://localhost:3000`, start Next on another port (e.g. `pnpm dev -- -p 3001`) and allow-list that origin in the backend.

### Required env
- `NEXT_PUBLIC_API_BASE_URL` – e.g. `http://localhost:3000`
- `NEXT_PUBLIC_SOLANA_CLUSTER` – `devnet` (for local Phantom testing) | `mainnet-beta` | `testnet`
- `NEXT_PUBLIC_SOLANA_RPC` – (optional) Helius or other RPC URL

## Features
- Phantom wallet connect (wallet-adapter)
- SIWS: `/login` calls backend `/api/auth/siws/start` and `/finish`
- Dashboard shows your entitlements from `/api/me/entitlements`
- Editor with templates, theme, links; saves to `/api/pages`
- Store page calls `/api/store/checkout` and submits the returned x402 transaction through Phantom
- Public tip pages at `/{walletOrSlug}` (SSR fetching from backend)

## Deployment (Vercel)
- Import this repo into Vercel as a Next.js app.
- Set envs in Vercel Project Settings:
  - `NEXT_PUBLIC_API_BASE_URL=https://<your-backend>.vercel.app`
  - `NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta`
  - `NEXT_PUBLIC_SOLANA_RPC=https://rpc.helius.xyz/?api-key=<key>` (optional)
- Deploy.
- Ensure your backend sets cookies with a domain that matches your frontend if you need cross-site auth.

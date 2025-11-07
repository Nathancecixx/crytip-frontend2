declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_BASE_URL: string; // e.g. https://cryptip-backend.vercel.app
    NEXT_PUBLIC_SOLANA_CLUSTER?: 'mainnet-beta' | 'devnet' | 'testnet';
    NEXT_PUBLIC_SOLANA_RPC?: string; // optional override
  }
}

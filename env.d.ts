declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_BFF_ORIGIN: string; // e.g. https://crytip-backend2.vercel.app/api
    NEXT_PUBLIC_SOLANA_CLUSTER?: 'mainnet-beta' | 'devnet' | 'testnet';
    NEXT_PUBLIC_SOLANA_RPC?: string; // optional override
  }
}

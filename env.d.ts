declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_BASE_URL: string; // e.g. https://cryptip-backend.vercel.app
    NEXT_PUBLIC_SOLANA_CLUSTER?: 'mainnet-beta' | 'devnet' | 'testnet';
    NEXT_PUBLIC_SOLANA_RPC?: string; // optional override
    SESSION_SECRET: string;
    SESSION_COOKIE_NAME?: string;
    SESSION_COOKIE_DOMAIN?: string;
    SESSION_MAX_AGE?: string;
    FRONTEND_ORIGIN: string;
    ALLOWED_ORIGINS?: string;
    SIWS_DOMAIN?: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }
}

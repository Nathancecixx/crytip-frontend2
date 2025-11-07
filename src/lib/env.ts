import { z } from 'zod';

const schema = z.object({
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET is required'),
  SESSION_COOKIE_NAME: z.string().min(1).default('ctj_sess'),
  SESSION_COOKIE_DOMAIN: z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1))
    .optional(),
  SESSION_MAX_AGE: z.coerce
    .number({ invalid_type_error: 'SESSION_MAX_AGE must be a number' })
    .int()
    .positive()
    .default(60 * 60 * 24 * 14),
  FRONTEND_ORIGIN: z.string().min(1, 'FRONTEND_ORIGIN is required'),
  ALLOWED_ORIGINS: z
    .string()
    .transform((value) => value.split(',').map((entry) => entry.trim()).filter(Boolean))
    .optional(),
  SIWS_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
});

type RawEnv = z.input<typeof schema>;

type ParsedEnv = z.output<typeof schema> & {
  ALLOWED_ORIGINS: string[];
};

const rawEnv: RawEnv = {
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  SESSION_COOKIE_DOMAIN: process.env.SESSION_COOKIE_DOMAIN,
  SESSION_MAX_AGE: process.env.SESSION_MAX_AGE,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  SIWS_DOMAIN: process.env.SIWS_DOMAIN,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

const parsed = schema.parse(rawEnv);

export const env: ParsedEnv = {
  ...parsed,
  ALLOWED_ORIGINS: parsed.ALLOWED_ORIGINS ?? [],
};

export type Env = typeof env;

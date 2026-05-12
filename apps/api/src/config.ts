import { z } from 'zod';

const EnvSchema = z.object({
  PORT:                      z.coerce.number().default(3001),
  NODE_ENV:                  z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL:              z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  SUPABASE_JWT_SECRET:       z.string().min(10),
  CORS_ORIGINS:              z.string().default('http://localhost:3000'),
});

export type Config = z.infer<typeof EnvSchema>;

export function loadConfig(): Config {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();

import { z } from 'zod';

export const envValidationSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  DATABASE_URL: z.string().url(),
  
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRATION: z.string().default('15m'),
});

export type EnvConfig = z.infer<typeof envValidationSchema>;

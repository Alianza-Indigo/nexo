import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32).optional(),
  FIELD_ENCRYPTION_KEY_CURRENT: z.string().min(32).optional(),
  FIELD_ENCRYPTION_KEY_PREVIOUS: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  AI_PRIMARY_PROVIDER: z.enum(["deterministic", "openai", "gemini", "anthropic"]).default("gemini"),
  AI_PRIMARY_API_KEY: z.string().optional(),
  AI_PRIMARY_MODEL: z.string().optional(),
  STT_PROVIDER: z.enum(["disabled", "openai", "gemini", "browser"]).default("gemini"),
  STT_API_KEY: z.string().optional(),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  PROTOCOL_VERSION: z.string().default("2.0"),
  PRIVACY_NOTICE_VERSION: z.string().default("1.0"),
  WORKFLOW_SECRET: z.string().optional()
});

export const env = schema.parse(process.env);

export function requireProductionEnv() {
  const required = ["DATABASE_URL", "AUTH_SECRET", "FIELD_ENCRYPTION_KEY_CURRENT"] as const;
  const missing = required.filter((key) => !env[key]);
  if (missing.length) throw new Error(`Configuración requerida ausente: ${missing.join(", ")}`);
}

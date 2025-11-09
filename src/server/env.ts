import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
  ADMIN_PASSWORD: z.string().default("admin"),
  JWT_SECRET: z.string().min(1).default("insecure-default-jwt-secret-change-in-production"),
  RESEND_API_KEY: z.string().default(""),
  FROM_EMAIL: z.string().email().default("noreply@example.com"),
  MINIO_ROOT_USER: z.string().default("minioadmin"),
  MINIO_ROOT_PASSWORD: z.string().default("minioadmin"),
  MINIO_BUCKET_NAME: z.string().default("callsheet-uploads"),
});

export const env = envSchema.parse(process.env);

// Warn if using default JWT_SECRET in production
if (env.NODE_ENV === "production" && env.JWT_SECRET === "insecure-default-jwt-secret-change-in-production") {
  console.warn("⚠️  WARNING: Using default JWT_SECRET in production! Please set a secure JWT_SECRET environment variable.");
}

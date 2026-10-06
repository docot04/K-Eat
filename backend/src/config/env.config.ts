import "dotenv/config";
import type { SignOptions } from "jsonwebtoken";

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const ENV = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as NonNullable<
    SignOptions["expiresIn"]
  >,
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
};

import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

const getRequiredEnv = (key: string) => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getNumberEnv = (key: string, fallback: number) => {
  const rawValue = process.env[key];
  if (rawValue === undefined || rawValue === null || rawValue.trim() === "") {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return parsed;
};

const frontendOrigins = getRequiredEnv("FRONTEND_ORIGIN")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (frontendOrigins.length === 0) {
  throw new Error("FRONTEND_ORIGIN must contain at least one valid origin");
}

const refreshTtlDays = getNumberEnv("REFRESH_TTL_DAYS", 7);
if (refreshTtlDays <= 0) {
  throw new Error("REFRESH_TTL_DAYS must be greater than zero");
}

const port = getNumberEnv("PORT", 5000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_PROD: process.env.NODE_ENV === "production",
  PORT: port,
  MONGO_URI: getRequiredEnv("MONGO_URI"),
  JWT_SECRET: getRequiredEnv("JWT_SECRET"),
  REFRESH_SECRET: getRequiredEnv("REFRESH_SECRET"),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL?.trim() || "15m",
  REFRESH_TTL_DAYS: refreshTtlDays,
  FRONTEND_ORIGINS: frontendOrigins,
  ACCESS_COOKIE_NAME: process.env.ACCESS_COOKIE_NAME?.trim() || "lm_access",
  REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME?.trim() || "lm_refresh"
} as const;
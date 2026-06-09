function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDatabaseUrl(): string {
  return requireEnv("DATABASE_URL");
}

export function getAuthConfig() {
  return {
    secret: requireEnv("AUTH_SECRET"),
    googleId: requireEnv("AUTH_GOOGLE_ID"),
    googleSecret: requireEnv("AUTH_GOOGLE_SECRET"),
  };
}

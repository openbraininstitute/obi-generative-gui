// To be imported only in server components, where the env variables can be loaded at runtime.
// PublicRuntimeConfig is exposed to the client, so it shouldn't contain any secret.

export type PublicRuntimeConfig = {
    API_URL: string;
};

function isClient(): boolean {
  return typeof window !== "undefined";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPublicRuntimeConfig(): PublicRuntimeConfig {
  if (!cachedConfig) {
    if (isClient()) {
      throw new Error("getRuntimeConfig() must not be called on the client");
    }
    const config = {
      API_URL: requireEnv("ENTITYCORE_API_URL"),
    };
    cachedConfig = config;
  }
  return cachedConfig;
}

let cachedConfig: ReturnType<typeof getPublicRuntimeConfig> | null = null;

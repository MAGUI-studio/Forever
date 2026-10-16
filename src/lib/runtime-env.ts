import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function runtimeEnv(name: string): string | undefined {
  try {
    const value = (getCloudflareContext().env as unknown as Record<string, unknown>)[name];
    if (typeof value === "string") return value;
  } catch {
    // Next.js development and tests run without a Cloudflare request context.
  }
  return process.env[name];
}

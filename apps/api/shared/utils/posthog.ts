import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getPosthogClient(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host) return null;

  if (!client) {
    client = new PostHog(apiKey, { host });
  }

  return client;
}

/**
 * Captures a single PostHog event if PostHog is configured.
 */
export function capturePosthogEvent(params: {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}) {
  const posthog = getPosthogClient();
  if (!posthog) return;

  try {
    posthog.capture({
      distinctId: params.distinctId,
      event: params.event,
      properties: params.properties,
    });
  } catch (err) {
    console.error("[PostHog] Failed to capture event", err);
  }
}

/**
 * Flushes and disposes the PostHog client during graceful shutdown.
 */
export async function shutdownPosthog() {
  if (!client) return;

  try {
    await client.shutdown();
  } catch (err) {
    console.error("[PostHog] Failed to shutdown", err);
  } finally {
    client = null;
  }
}

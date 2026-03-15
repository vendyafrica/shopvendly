export type CollectoResponse = {
  ok: boolean;
  status: number;
  json: unknown;
  text: string;
};

type CollectoRequestOptions = {
  timeoutMs?: number;
};

export function getCollectoBaseUrl() {
  return (process.env.COLLECTO_BASE_URL || "https://collecto.cissytech.com/api").replace(/\/$/, "");
}

export function getCollectoProxySecret() {
  return process.env.COLLECTO_PROXY_SECRET || "";
}

export function buildCollectoUtilityUrl(path: string) {
  const baseUrl = getCollectoBaseUrl();
  const normalizedPath = path.replace(/^\/+/, "");

  if (baseUrl.endsWith("/api")) {
    return `${baseUrl.slice(0, -4)}/${normalizedPath}`;
  }

  return `${baseUrl}/${normalizedPath}`;
}

async function executeCollectoRequest(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  options: CollectoRequestOptions = {},
) {
  const requestBody = JSON.stringify(body);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 10000;
  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getCollectoProxySecret() ? { "x-proxy-secret": getCollectoProxySecret() } : {}),
        ...headers,
      },
      body: requestBody,
      signal: controller.signal,
    });

    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      text,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Collecto request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function collectoApiFetch(
  method: string,
  body: unknown,
  options: CollectoRequestOptions = {},
): Promise<CollectoResponse> {
  const username = process.env.COLLECTO_USERNAME || "";
  if (!username) {
    throw new Error("Missing COLLECTO_USERNAME");
  }

  const response = await executeCollectoRequest(`${getCollectoBaseUrl()}/${username}/${method}`, body, {
    "x-api-key": process.env.COLLECTO_API_KEY || "",
  }, options);

  let json: unknown = null;
  try {
    json = response.text ? JSON.parse(response.text) : null;
  } catch {
    json = response.text || null;
  }

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json,
    text: response.text,
  };
}

export async function collectoDirectFetch(
  url: string,
  body: unknown,
  options: CollectoRequestOptions = {},
): Promise<CollectoResponse> {
  const response = await executeCollectoRequest(url, body, {}, options);

  let json: unknown = null;
  try {
    json = response.text ? JSON.parse(response.text) : null;
  } catch {
    json = response.text || null;
  }

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json,
    text: response.text,
  };
}
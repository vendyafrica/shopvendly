export type CollectoResponse = {
  ok: boolean;
  status: number;
  json: unknown;
  text: string;
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

async function executeCollectoRequest(url: string, body: unknown, headers: Record<string, string>) {
  const requestBody = JSON.stringify(body);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getCollectoProxySecret() ? { "x-proxy-secret": getCollectoProxySecret() } : {}),
      ...headers,
    },
    body: requestBody,
  });

  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    text,
  };
}

export async function collectoApiFetch(method: string, body: unknown): Promise<CollectoResponse> {
  const username = process.env.COLLECTO_USERNAME || "";
  if (!username) {
    throw new Error("Missing COLLECTO_USERNAME");
  }

  const response = await executeCollectoRequest(`${getCollectoBaseUrl()}/${username}/${method}`, body, {
    "x-api-key": process.env.COLLECTO_API_KEY || "",
  });

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

export async function collectoDirectFetch(url: string, body: unknown): Promise<CollectoResponse> {
  const response = await executeCollectoRequest(url, body, {});

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

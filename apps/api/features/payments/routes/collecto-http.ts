import { HttpsProxyAgent } from "https-proxy-agent";
import https from "node:https";

export type CollectoResponse = {
  ok: boolean;
  status: number;
  json: unknown;
  text: string;
};

export function getCollectoBaseUrl() {
  return (process.env.COLLECTO_BASE_URL || "https://collecto.cissytech.com/api").replace(/\/$/, "");
}

export function getCollectoProxyUrl() {
  const proxyUrl = process.env.FIXIE_URL?.trim();
  return proxyUrl || null;
}

export function getCollectoDispatcher() {
  const proxyUrl = getCollectoProxyUrl();
  if (!proxyUrl) {
    return undefined;
  }

  return new HttpsProxyAgent(proxyUrl);
}

async function executeCollectoRequest(url: string, body: string, headers: Record<string, string>) {
  const agent = getCollectoDispatcher();

  return await new Promise<{ status: number; text: string }>((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body),
        },
        agent,
      },
      (response) => {
        let text = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          text += chunk;
        });
        response.on("end", () => {
          resolve({ status: response.statusCode || 500, text });
        });
      },
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

export async function collectoApiFetch(method: string, body: unknown): Promise<CollectoResponse> {
  const username = process.env.COLLECTO_USERNAME || "";
  if (!username) {
    throw new Error("Missing COLLECTO_USERNAME");
  }

  const requestBody = JSON.stringify(body);
  const response = await executeCollectoRequest(
    `${getCollectoBaseUrl()}/${username}/${method}`,
    requestBody,
    {
      "Content-Type": "application/json",
      "x-api-key": process.env.COLLECTO_API_KEY || "",
    },
  );

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
  const requestBody = JSON.stringify(body);
  const response = await executeCollectoRequest(url, requestBody, {
    "Content-Type": "application/json",
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

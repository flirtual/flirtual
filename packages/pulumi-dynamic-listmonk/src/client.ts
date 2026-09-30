import type { Api, Body } from "@flirtual/pulumi-dynamic-fetch";

export type { components } from "./generated/index.ts";

// Every response wraps its payload in `data`.
export async function call<T>(api: Api, method: string, path: string, body?: Body) {
  return (await api.request<{ data: T }>(method, path, body))?.data;
}

export function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

export const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const attempts = 60;

// A fresh deployment may still be booting, or waiting on its certificate and DNS.
export async function ready(api: Api, attempt = 1): Promise<void> {
  const healthy = await call<boolean>(api, "GET", "/health").catch(() => false);
  if (healthy) return;
  if (attempt >= attempts) throw new Error(`${api.connection.baseUrl} never became healthy.`);

  await pause(5000);
  return ready(api, attempt + 1);
}

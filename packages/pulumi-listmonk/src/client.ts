import type * as pulumi from "@pulumi/pulumi";
import type { Client } from "openapi-fetch";

import type { paths } from "./api.ts";

export type { components } from "./api.ts";

export interface Connection {
  endpoint: string;
  username: string;
  token: string;
}

export type ConnectionArgs = { [Key in keyof Connection]: pulumi.Input<Connection[Key]> };

export type Listmonk = Client<paths>;

export async function connect({ endpoint, username, token }: Connection): Promise<Listmonk> {
  const { default: createClient } = await import("openapi-fetch");

  return createClient<paths>({
    baseUrl: new URL("/api", endpoint).href,
    headers: { authorization: `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}` },
  });
}

// Every response wraps its payload in `data`. A 404 reads as missing rather than failing.
export function unwrap<T>(result: {
  data?: { data?: T };
  error?: unknown;
  response: Response;
}): T | undefined {
  const { data, error, response } = result;

  if (response.status === 404) return undefined;
  if (error !== undefined || !response.ok)
    throw new Error(`${response.url} answered ${response.status}: ${JSON.stringify(error)}`);

  return data?.data;
}

// A fresh deployment may still be booting, or waiting on its certificate and DNS.
export async function ready(listmonk: Listmonk, endpoint: string) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      if (unwrap(await listmonk.GET("/health"))) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error(`${endpoint} never became healthy.`);
}

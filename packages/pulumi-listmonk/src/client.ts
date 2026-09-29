import * as pulumi from "@pulumi/pulumi";
import type { Client } from "openapi-fetch";

import type { paths } from "./api.ts";

export type { components } from "./api.ts";

export interface Connection {
  endpoint: string;
  username: string;
  token: string;
}

export type ProviderArgs = { [Key in keyof Connection]: pulumi.Input<Connection[Key]> };

// A `pulumi-nodejs` provider's inputs reach `configure` as its config, which `Config.get` scopes to
// the project unless a key names its own namespace (@pulumi/pulumi/cmd/dynamic-provider/config.js).
const key = (name: keyof Connection) => `listmonk:${name}`;

export class Provider extends pulumi.ProviderResource {
  constructor(name: string, args: ProviderArgs, options?: pulumi.ResourceOptions) {
    super(
      "pulumi-nodejs",
      name,
      {
        [key("endpoint")]: args.endpoint,
        [key("username")]: args.username,
        [key("token")]: args.token,
      },
      options,
    );
  }
}

export type Listmonk = Client<paths>;

export abstract class Configured {
  declare protected connection: Connection;

  async configure({ config }: pulumi.dynamic.ConfigureRequest) {
    this.connection = {
      endpoint: config.require(key("endpoint")),
      username: config.require(key("username")),
      token: config.require(key("token")),
    };
  }

  private get authorization() {
    const { username, token } = this.connection;
    return `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`;
  }

  protected async connect(): Promise<Listmonk> {
    const { default: createClient } = await import("openapi-fetch");

    return createClient<paths>({
      baseUrl: new URL("/api", this.connection.endpoint).href,
      headers: { authorization: this.authorization },
    });
  }

  // For routes the spec leaves out, like /users and /roles (cmd/handlers.go in knadh/listmonk).
  protected async request<T>(method: string, path: string, body?: unknown) {
    const response = await fetch(new URL(`/api${path}`, this.connection.endpoint), {
      method,
      headers: { authorization: this.authorization, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();
    return unwrap<T>({
      data: response.ok && text ? JSON.parse(text) : undefined,
      error: response.ok ? undefined : text,
      response,
    });
  }

  // A fresh deployment may still be booting, or waiting on its certificate and DNS.
  protected async ready(listmonk: Listmonk) {
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        if (unwrap(await listmonk.GET("/health"))) return;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error(`${this.connection.endpoint} never became healthy.`);
  }
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

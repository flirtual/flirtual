import * as fetch from "@flirtual/pulumi-dynamic-fetch";
import * as pulumi from "@pulumi/pulumi";

export interface Connection {
  endpoint: string;
  username: string;
  token: string;
}

export type ProviderArgs = { [Key in keyof Connection]: pulumi.Input<Connection[Key]> };

// An API user's token goes in Basic auth as its password.
export class Provider extends fetch.Provider {
  constructor(
    name: string,
    { endpoint, username, token }: ProviderArgs,
    options?: pulumi.ResourceOptions,
  ) {
    super(
      name,
      {
        baseUrl: pulumi.output(endpoint).apply((endpoint) => new URL("/api", endpoint).href),
        headers: pulumi.all([username, token]).apply(([username, token]) => ({
          authorization: `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`,
        })),
      },
      options,
    );
  }
}

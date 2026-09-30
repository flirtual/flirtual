import { defineConfig, types } from "@flirtual/pulumi-dynamic-fetch";
import * as pulumi from "@pulumi/pulumi";

import type { EndpointByMethod } from "./generated/index.ts";

export const { Provider, WebhookEndpoint } = defineConfig({
  ...types<EndpointByMethod>(),
  module: "chargebee",
  // Chargebee takes the API key as the Basic auth username and form-encoded request bodies
  // (https://apidocs.chargebee.com/docs/api/getting-started).
  provider: (args: { site?: pulumi.Input<string>; token?: pulumi.Input<string> }, { config }) => {
    const {
      site = process.env.CHARGEBEE_SITE || config.require("site"),
      token = process.env.CHARGEBEE_TOKEN || config.requireSecret("token"),
    } = args;

    return {
      baseUrl: pulumi.interpolate`https://${site}.chargebee.com/api/v2`,
      headers: {
        authorization: pulumi
          .output(token)
          .apply((token) => `Basic ${Buffer.from(`${token}:`).toString("base64")}`),
      },
      encoding: "form",
    };
  },
  resources: {
    WebhookEndpoint: {
      create: "post /webhook_endpoints",
      read: "get /webhook_endpoints/{webhook-endpoint-id}",
      update: "post /webhook_endpoints/{webhook-endpoint-id}",
      delete: "post /webhook_endpoints/{webhook-endpoint-id}/delete",
      model: "webhook_endpoint",
      // Chargebee never returns the Basic auth password, so a refresh leaves it as configured.
      inputs: ["name", "url", "api_version", "disabled", "primary_url", "enabled_events"],
    },
  },
});

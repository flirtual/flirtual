import { defineConfig, types } from "@flirtual/pulumi-dynamic-fetch";

import type { EndpointByMethod } from "./generated/index.ts";

export const { Provider, WebhookEndpoint } = defineConfig({
  ...types<EndpointByMethod>(),
  module: "chargebee",
  // Chargebee takes the API key as the Basic auth username and form-encoded request bodies
  // (https://apidocs.chargebee.com/docs/api/getting-started).
  provider: ({ site, apiKey }: { site: string; apiKey: string }) => ({
    baseUrl: `https://${site}.chargebee.com/api/v2`,
    headers: { authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}` },
    encoding: "form",
  }),
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

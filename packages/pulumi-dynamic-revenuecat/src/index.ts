import { defineConfig, types } from "@flirtual/pulumi-dynamic-fetch";

import type { EndpointByMethod } from "./generated/index.ts";

export const { Provider, WebhookIntegration } = defineConfig({
  ...types<EndpointByMethod>(),
  module: "revenuecat",
  // A v2 secret key with write access to the project.
  provider: ({ apiKey }: { apiKey: string }) => ({
    baseUrl: "https://api.revenuecat.com/v2",
    headers: { authorization: `Bearer ${apiKey}` },
  }),
  resources: {
    WebhookIntegration: {
      create: "post /projects/{project_id}/integrations/webhooks",
      read: "get /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
      update: "post /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
      delete: "delete /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
      replaceOnChanges: ["project_id"],
      // RevenueCat never returns the authorization header, so a refresh leaves it as configured.
      inputs: ["name", "url", "environment", "app_id"],
    },
  },
});

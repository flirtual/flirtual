import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, expectTypeOf, it } from "vitest";

import { defineConfig } from "./config.ts";
import {
  type ChargebeeEndpoints,
  chargebeeTypes,
  type RevenueCatEndpoints,
  revenuecatTypes,
} from "./endpoints.fixtures.ts";

const registered: Array<pulumi.runtime.MockResourceArgs> = [];

beforeAll(async () => {
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => {
        registered.push(args);
        return { id: `${args.name}-id`, state: args.inputs };
      },
      call: (args) => args.inputs,
    },
    "project",
    "stack",
  );
});

const settled = (resource: pulumi.Resource) =>
  new Promise((resolve) => resource.urn.apply(resolve));

const { Provider, WebhookIntegration } = defineConfig({
  ...revenuecatTypes,
  module: "revenuecat",
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
      inputs: ["name", "url"],
    },
  },
});

describe("Provider", () => {
  it("builds its connection from its arguments, keeping the headers secret", async () => {
    await settled(new Provider("revenuecat", { apiKey: "sk_test" }));

    const { type, inputs } = registered.find(({ name }) => name === "revenuecat")!;
    expect(type).toBe("pulumi:providers:pulumi-nodejs");
    expect(inputs["fetch:baseUrl"]).toBe("https://api.revenuecat.com/v2");
    expect(inputs["fetch:headers"]).toEqual({
      [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
      value: JSON.stringify({ authorization: "Bearer sk_test" }),
    });
    expect(inputs["fetch:encoding"]).toBe("json");
  });

  it("takes Pulumi inputs for each argument", () => {
    expectTypeOf<ConstructorParameters<typeof Provider>[1]>().toEqualTypeOf<{
      apiKey: pulumi.Input<string>;
    }>();
  });
});

describe("resources", () => {
  it("registers each resource under the module, named by its key", async () => {
    await settled(
      new WebhookIntegration("webhook", {
        project_id: "proj_1",
        name: "api",
        url: "https://api.example/v1/revenuecat",
      }),
    );

    const { type, inputs } = registered.find(({ name }) => name === "webhook")!;
    expect(type).toBe("pulumi-nodejs:dynamic/revenuecat:WebhookIntegration");
    expect(inputs).toMatchObject({ project_id: "proj_1", name: "api" });
  });

  it("takes the create body and the create route's path parameters as inputs", () => {
    type Args = ConstructorParameters<typeof WebhookIntegration>[1];

    expectTypeOf<Args["project_id"]>().toEqualTypeOf<pulumi.Input<string>>();
    expectTypeOf<Args["name"]>().toEqualTypeOf<pulumi.Input<string>>();
    expectTypeOf<Args["authorization_header"]>().toEqualTypeOf<
      pulumi.Input<string | null | undefined> | undefined
    >();
  });

  it("types `output` as the live object", () => {
    expectTypeOf<InstanceType<typeof WebhookIntegration>["output"]>().toEqualTypeOf<
      pulumi.Output<
        RevenueCatEndpoints["post"]["/projects/{project_id}/integrations/webhooks"]["responses"][201]
      >
    >();
  });

  it("types `output` as the object inside the model key when responses wrap it", () => {
    const { WebhookEndpoint } = defineConfig({
      ...chargebeeTypes,
      module: "chargebee",
      provider: () => ({ baseUrl: "https://site.chargebee.com/api/v2", encoding: "form" }),
      resources: {
        WebhookEndpoint: {
          create: "post /webhook_endpoints",
          read: "get /webhook_endpoints/{webhook-endpoint-id}",
          delete: "post /webhook_endpoints/{webhook-endpoint-id}/delete",
          model: "webhook_endpoint",
          inputs: ["name", "url"],
        },
      },
    });

    expectTypeOf<InstanceType<typeof WebhookEndpoint>["output"]>().toEqualTypeOf<
      pulumi.Output<
        ChargebeeEndpoints["post"]["/webhook_endpoints"]["responses"][200]["webhook_endpoint"]
      >
    >();
  });

  it("rejects a route the spec doesn't have", () => {
    defineConfig({
      ...revenuecatTypes,
      module: "revenuecat",
      provider: () => ({ baseUrl: "https://api.revenuecat.com/v2" }),
      resources: {
        Webhook: {
          create: "post /projects/{project_id}/integrations/webhooks",
          // @ts-expect-error: no such route.
          read: "get /webhooks",
          delete: "delete /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
        },
      },
    });
  });
});

describe("routes", () => {
  it("rejects routes, models and path parameters the spec doesn't have", () => {
    defineConfig({
      ...chargebeeTypes,
      module: "example",
      provider: () => ({ baseUrl: "https://example.com" }),
      resources: {
        Resource: {
          // @ts-expect-error: no such route.
          create: "post /webhooks",
          read: "get /webhook_endpoints/{webhook-endpoint-id}",
          delete: "post /webhook_endpoints/{webhook-endpoint-id}/delete",
        },
      },
    });

    defineConfig({
      ...revenuecatTypes,
      module: "example",
      provider: () => ({ baseUrl: "https://example.com" }),
      resources: {
        Resource: {
          create: "post /projects/{project_id}/integrations/webhooks",
          // @ts-expect-error: `project_ref` isn't an input.
          read: {
            method: "get",
            path: "/webhooks/{project}/{webhook}",
            pathParams: { project: "project_ref" },
          },
          delete: "delete /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
        },
      },
    });

    defineConfig({
      ...revenuecatTypes,
      module: "example",
      provider: () => ({ baseUrl: "https://example.com" }),
      resources: {
        Resource: {
          create: "post /projects/{project_id}/integrations/webhooks",
          read: {
            method: "get",
            path: "/webhooks/{project}/{webhook}",
            // @ts-expect-error: the path has no `{team}` parameter.
            pathParams: { team: "project_id" },
          },
          delete: "delete /projects/{project_id}/integrations/webhooks/{webhook_integration_id}",
        },
      },
    });

    defineConfig({
      ...chargebeeTypes,
      module: "example",
      provider: () => ({ baseUrl: "https://example.com" }),
      resources: {
        Resource: {
          create: "post /webhook_endpoints",
          read: "get /webhook_endpoints/{webhook-endpoint-id}",
          // @ts-expect-error: the path exists, but has no DELETE.
          delete: { method: "delete", path: "/webhook_endpoints/{webhook-endpoint-id}" },
          // @ts-expect-error: with one route wrong, the entry falls back to every route.
          model: "webhook_endpoint",
        },
      },
    });

    defineConfig({
      ...chargebeeTypes,
      module: "example",
      provider: () => ({ baseUrl: "https://example.com" }),
      resources: {
        Resource: {
          create: "post /webhook_endpoints",
          read: "get /webhook_endpoints/{webhook-endpoint-id}",
          delete: "post /webhook_endpoints/{webhook-endpoint-id}/delete",
          // @ts-expect-error: the create response has no `endpoint` key.
          model: "endpoint",
        },
      },
    });
  });
});

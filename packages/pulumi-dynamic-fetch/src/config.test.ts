import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it } from "vitest";

import { defineConfig } from "./config.ts";

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

const { Provider, Webhook } = defineConfig({
  module: "example",
  provider: ({ site, apiKey }: { site: string; apiKey: string }) => ({
    baseUrl: `https://${site}.example.com/api`,
    headers: { authorization: `Bearer ${apiKey}` },
    encoding: "form",
  }),
  resources: {
    Webhook: {
      create: "post /webhooks",
      read: "get /webhooks/{id}",
      delete: "delete /webhooks/{id}",
    },
  },
});

describe("Provider", () => {
  it("builds its connection from its arguments, keeping the headers secret", async () => {
    await settled(new Provider("example", { site: "acme", apiKey: "key" }));

    const { type, inputs } = registered.find(({ name }) => name === "example")!;
    expect(type).toBe("pulumi:providers:pulumi-nodejs");
    expect(inputs["fetch:baseUrl"]).toBe("https://acme.example.com/api");
    expect(inputs["fetch:headers"]).toEqual({
      [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
      value: JSON.stringify({ authorization: "Bearer key" }),
    });
    expect(inputs["fetch:encoding"]).toBe("form");
  });
});

describe("resources", () => {
  it("registers each resource under the module, named by its key", async () => {
    await settled(new Webhook("webhook", { name: "api", url: "https://api.example/hooks" }));

    const { type, inputs } = registered.find(({ name }) => name === "webhook")!;
    expect(type).toBe("pulumi-nodejs:dynamic/example:Webhook");
    expect(inputs).toMatchObject({ name: "api", url: "https://api.example/hooks" });
  });
});

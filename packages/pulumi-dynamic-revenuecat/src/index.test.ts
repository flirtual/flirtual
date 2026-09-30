import * as pulumi from "@pulumi/pulumi";
import { beforeAll, expect, it } from "vitest";

import { Provider, WebhookIntegration } from "./index.ts";

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

it("points at the v2 API with the secret key as a Bearer token, sending JSON", async () => {
  const provider = new Provider("revenuecat", { apiKey: "sk_test" });
  await new Promise((resolve) => provider.urn.apply(resolve));

  const { inputs } = registered.find(({ name }) => name === "revenuecat")!;
  expect(inputs["fetch:baseUrl"]).toBe("https://api.revenuecat.com/v2");
  expect(inputs["fetch:headers"]).toEqual({
    [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
    value: JSON.stringify({ authorization: "Bearer sk_test" }),
  });
  expect(inputs["fetch:encoding"]).toBe("json");
});

it("registers as revenuecat:WebhookIntegration with its inputs", async () => {
  const webhook = new WebhookIntegration("webhook", {
    project_id: "proj_1",
    name: "api",
    url: "https://api.example/v1/revenuecat",
    environment: "production",
    authorization_header: "Bearer secret",
  });
  await new Promise((resolve) => webhook.urn.apply(resolve));

  const { type, inputs } = registered.find(({ name }) => name === "webhook")!;
  expect(type).toBe("pulumi-nodejs:dynamic/revenuecat:WebhookIntegration");
  expect(inputs).toMatchObject({
    project_id: "proj_1",
    name: "api",
    url: "https://api.example/v1/revenuecat",
    environment: "production",
    authorization_header: "Bearer secret",
  });
});

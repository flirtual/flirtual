import * as pulumi from "@pulumi/pulumi";
import { beforeAll, expect, it } from "vitest";

import { Provider, WebhookEndpoint } from "./index.ts";

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

it("points at the site's v2 API with Basic auth and form encoding", async () => {
  const provider = new Provider("chargebee", { site: "flirtual-test", apiKey: "test_key" });
  await new Promise((resolve) => provider.urn.apply(resolve));

  const { inputs } = registered.find(({ name }) => name === "chargebee")!;
  expect(inputs["fetch:baseUrl"]).toBe("https://flirtual-test.chargebee.com/api/v2");
  expect(inputs["fetch:headers"]).toEqual({
    [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
    value: JSON.stringify({
      authorization: `Basic ${Buffer.from("test_key:").toString("base64")}`,
    }),
  });
  expect(inputs["fetch:encoding"]).toBe("form");
});

it("registers as chargebee:WebhookEndpoint with its inputs", async () => {
  const webhook = new WebhookEndpoint("webhook", {
    name: "api",
    url: "https://api.example/v1/chargebee",
    basic_auth_username: "chargebee",
    basic_auth_password: "secret",
  });
  await new Promise((resolve) => webhook.urn.apply(resolve));

  const { type, inputs } = registered.find(({ name }) => name === "webhook")!;
  expect(type).toBe("pulumi-nodejs:dynamic/chargebee:WebhookEndpoint");
  expect(inputs).toMatchObject({
    name: "api",
    url: "https://api.example/v1/chargebee",
    basic_auth_username: "chargebee",
    basic_auth_password: "secret",
  });
});

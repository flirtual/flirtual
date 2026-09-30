import * as pulumi from "@pulumi/pulumi";
import { afterEach, beforeAll, expect, it, vi } from "vitest";

import { Provider, WebhookEndpoint } from "./index.ts";

const registered: Array<pulumi.runtime.MockResourceArgs> = [];

const settled = (resource: pulumi.Resource) =>
  new Promise((resolve) => resource.urn.apply(resolve));

const basic = (token: string) => ({
  [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
  value: JSON.stringify({ authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}` }),
});

afterEach(() => {
  vi.unstubAllEnvs();
  pulumi.runtime.setAllConfig({});
});

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
  const provider = new Provider("chargebee", { site: "flirtual-test", token: "test_key" });
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

it("takes the site and key from CHARGEBEE_SITE and CHARGEBEE_TOKEN when not given", async () => {
  vi.stubEnv("CHARGEBEE_SITE", "from-env");
  vi.stubEnv("CHARGEBEE_TOKEN", "env_key");

  await settled(new Provider("chargebee-env"));

  const { inputs } = registered.find(({ name }) => name === "chargebee-env")!;
  expect(inputs["fetch:baseUrl"]).toBe("https://from-env.chargebee.com/api/v2");
  expect(inputs["fetch:headers"]).toEqual(basic("env_key"));
});

it("falls back to the chargebee:site and chargebee:token config", async () => {
  vi.stubEnv("CHARGEBEE_SITE", "");
  vi.stubEnv("CHARGEBEE_TOKEN", "");
  pulumi.runtime.setAllConfig(
    { "chargebee:site": "from-config", "chargebee:token": "config_key" },
    ["chargebee:token"],
  );

  await settled(new Provider("chargebee-config"));

  const { inputs } = registered.find(({ name }) => name === "chargebee-config")!;
  expect(inputs["fetch:baseUrl"]).toBe("https://from-config.chargebee.com/api/v2");
  expect(inputs["fetch:headers"]).toEqual(basic("config_key"));
});

it("fails without a key from anywhere", () => {
  vi.stubEnv("CHARGEBEE_SITE", "flirtual-test");
  vi.stubEnv("CHARGEBEE_TOKEN", "");

  expect(() => new Provider("chargebee-missing")).toThrow("chargebee:token");
});

it("registers as chargebee:WebhookEndpoint with its inputs", async () => {
  vi.stubEnv("CHARGEBEE_SITE", "flirtual-test");
  vi.stubEnv("CHARGEBEE_TOKEN", "test_key");

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

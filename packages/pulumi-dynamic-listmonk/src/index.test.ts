import * as pulumi from "@pulumi/pulumi";
import { afterEach, beforeAll, expect, it, vi } from "vitest";

import { List, Provider, Role, SampleCleanup, Settings, User } from "./index.ts";

const registered: Array<pulumi.runtime.MockResourceArgs> = [];

const settled = (resource: pulumi.Resource) =>
  new Promise((resolve) => resource.urn.apply(resolve));

const basic = (username: string, token: string) => ({
  [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
  value: JSON.stringify({
    authorization: `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`,
  }),
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

it("points at the instance's /api with Basic auth from the API user and token", async () => {
  const provider = new Provider("listmonk", {
    endpoint: "https://news.example",
    username: "api",
    token: "token",
  });
  await new Promise((resolve) => provider.urn.apply(resolve));

  const { inputs } = registered.find(({ name }) => name === "listmonk")!;
  expect(inputs["fetch:baseUrl"]).toBe("https://news.example/api");
  expect(inputs["fetch:headers"]).toEqual({
    [pulumi.runtime.specialSigKey]: pulumi.runtime.specialSecretSig,
    value: JSON.stringify({
      authorization: `Basic ${Buffer.from("api:token").toString("base64")}`,
    }),
  });
  expect(inputs["fetch:encoding"]).toBe("json");
});

it("takes its connection from the API's LISTMONK_* variables when not given", async () => {
  vi.stubEnv("LISTMONK_URL", "https://env.example");
  vi.stubEnv("LISTMONK_USERNAME", "env-user");
  vi.stubEnv("LISTMONK_PASSWORD", "env-token");

  await settled(new Provider("listmonk-env"));

  const { inputs } = registered.find(({ name }) => name === "listmonk-env")!;
  expect(inputs["fetch:baseUrl"]).toBe("https://env.example/api");
  expect(inputs["fetch:headers"]).toEqual(basic("env-user", "env-token"));
});

it("falls back to the listmonk:endpoint, listmonk:username and listmonk:token config", async () => {
  vi.stubEnv("LISTMONK_URL", "");
  vi.stubEnv("LISTMONK_USERNAME", "");
  vi.stubEnv("LISTMONK_PASSWORD", "");
  pulumi.runtime.setAllConfig(
    {
      "listmonk:endpoint": "https://config.example",
      "listmonk:username": "config-user",
      "listmonk:token": "config-token",
    },
    ["listmonk:token"],
  );

  await settled(new Provider("listmonk-config"));

  const { inputs } = registered.find(({ name }) => name === "listmonk-config")!;
  expect(inputs["fetch:baseUrl"]).toBe("https://config.example/api");
  expect(inputs["fetch:headers"]).toEqual(basic("config-user", "config-token"));
});

it("registers each resource under the listmonk module, keeping its type name", async () => {
  vi.stubEnv("LISTMONK_URL", "https://news.example");
  vi.stubEnv("LISTMONK_USERNAME", "api");
  vi.stubEnv("LISTMONK_PASSWORD", "token");

  const resources = [
    new List("list", { name: "Newsletter", type: "public", optin: "single" }),
    new Role("role", { name: "Flirtual", permissions: [] }),
    new User("user", { username: "flirtual", roleId: "3" }),
    new Settings("settings", {}),
    new SampleCleanup("sample-cleanup", {}),
  ];
  await Promise.all(
    resources.map((resource) => new Promise((resolve) => resource.urn.apply(resolve))),
  );

  expect(
    ["list", "role", "user", "settings", "sample-cleanup"].map(
      (name) => registered.find((resource) => resource.name === name)!.type,
    ),
  ).toEqual([
    "pulumi-nodejs:dynamic/listmonk:List",
    "pulumi-nodejs:dynamic/listmonk:Role",
    "pulumi-nodejs:dynamic/listmonk:User",
    "pulumi-nodejs:dynamic/listmonk:Settings",
    "pulumi-nodejs:dynamic/listmonk:SampleCleanup",
  ]);
});

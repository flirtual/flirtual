import * as pulumi from "@pulumi/pulumi";
import { beforeAll, expect, it } from "vitest";

import { Provider } from "./provider.ts";

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

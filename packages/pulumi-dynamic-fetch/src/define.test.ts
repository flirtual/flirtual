import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, expectTypeOf, it } from "vitest";

import { define } from "./resource.ts";

interface Inputs {
  name: string;
  url: string;
}

interface Live {
  id: string;
  name: string;
  url: string;
  disabled: boolean;
  events: Array<string>;
}

const live: Live = {
  id: "we_1",
  name: "api",
  url: "https://api.example/hooks",
  disabled: false,
  events: ["a"],
};

beforeAll(async () => {
  await pulumi.runtime.setMocks(
    {
      newResource: (args) => ({ id: "we_1", state: { ...args.inputs, output: live } }),
      call: (args) => args.inputs,
    },
    "project",
    "stack",
  );
});

const Webhook = define<Inputs, Live>({
  module: "example",
  type: "Webhook",
  create: async () => live,
  read: async () => live,
  delete: async () => {},
  id: (live) => live.id,
});

const resolved = <T>(output: pulumi.Output<T>) =>
  new Promise<T>((resolve) => output.apply(resolve));

describe("a resource's live fields", () => {
  it("reads each live field straight off the resource", async () => {
    const webhook = new Webhook("webhook", { name: "api", url: "https://api.example/hooks" });

    expect(await resolved(webhook.disabled)).toBe(false);
    expect(await resolved(webhook.events)).toEqual(["a"]);
  });

  it("keeps the resource's own properties", async () => {
    const webhook = new Webhook("webhook", {
      name: "configured",
      url: "https://api.example/hooks",
    });

    expect(await resolved(webhook.id)).toBe("we_1");
    // Declared inputs are the resource's own outputs, whatever the live object says.
    expect(await resolved(webhook.name)).toBe("configured");
    expect(pulumi.CustomResource.isInstance(webhook)).toBe(true);
  });

  it("leaves protocol and internal properties alone, so the resource isn't taken for a promise", async () => {
    const webhook = new Webhook("webhook", { name: "api", url: "https://api.example/hooks" });
    const properties = webhook as unknown as Record<string, unknown>;

    expect(properties["then"]).toBeUndefined();
    expect(properties["toJSON"]).toBeUndefined();
    expect(properties["__pulumiComponentResource"]).toBeUndefined();
    expect(await Promise.resolve(webhook)).toBe(webhook);
  });

  it("types each live field as an Output, except the resource's own id", () => {
    type Instance = InstanceType<typeof Webhook>;

    expectTypeOf<Instance["disabled"]>().toEqualTypeOf<pulumi.Output<boolean>>();
    expectTypeOf<Instance["events"]>().toEqualTypeOf<pulumi.Output<Array<string>>>();
    expectTypeOf<Instance["id"]>().toEqualTypeOf<pulumi.Output<pulumi.ID>>();
  });
});

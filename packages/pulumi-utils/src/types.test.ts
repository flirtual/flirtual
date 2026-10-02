import * as pulumi from "@pulumi/pulumi";
import { expectTypeOf, it } from "vitest";

import type { DeepInput, DeepOutput, Deeply, TypeConstructor } from "./types.ts";

interface Config {
	name: string;
	env: Record<string, { type: "r2"; name: string } | { type: "text"; value: string }>;
	triggers: Array<{ type: "queue"; name: string }>;
}

it("accepts outputs at any depth of a nested structure", () => {
	expectTypeOf({
		name: pulumi.output("worker"),
		env: { BUCKET: { type: "r2" as const, name: pulumi.output("bucket") } },
		triggers: [{ type: "queue" as const, name: pulumi.output("queue") }],
	}).toExtend<DeepInput<Config>>();
});

it("still rejects values of the wrong type", () => {
	expectTypeOf({ name: 1, env: {}, triggers: [] }).not.toExtend<DeepInput<Config>>();
});

interface ListOf extends TypeConstructor {
	readonly type: Array<this["argument"]>;
}

it("wraps every level of a structure in the given type constructor", () => {
	expectTypeOf<Deeply<{ name: string; tags: Array<string> }, ListOf>>().toEqualTypeOf<
		Array<{ name: Array<string>; tags: Array<Array<Array<string>>> }>
	>();
});

it("is pulumi.Input at every level for DeepInput", () => {
	expectTypeOf<DeepInput<{ name: string }>>().toEqualTypeOf<pulumi.Input<{ name: pulumi.Input<string> }>>();
});

it("is pulumi.Output at every level for DeepOutput", () => {
	expectTypeOf<DeepOutput<{ name: string }>>().toEqualTypeOf<pulumi.Output<{ name: pulumi.Output<string> }>>();
});

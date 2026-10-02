import type * as pulumi from "@pulumi/pulumi";
import { expect, it, vi } from "vitest";

import { moduleProvider } from "./provider.ts";

type Provider = pulumi.dynamic.ResourceProvider<{ name: string }, { name: string; id: string }>;

const complete = {
	check: vi.fn(async () => ({ inputs: { name: "checked" } })),
	diff: vi.fn(async () => ({ changes: true })),
	create: vi.fn(async () => ({ id: "created", outs: { name: "created", id: "created" } })),
	read: vi.fn(async () => ({ id: "read", props: { name: "read", id: "read" } })),
	update: vi.fn(async () => ({ outs: { name: "updated", id: "updated" } })),
	delete: vi.fn(async () => {}),
} satisfies Provider;

const olds = { name: "old", id: "old" };
const news = { name: "new" };

it("hands every call to the loaded module's provider", async () => {
	const provider = moduleProvider(async () => ({ default: complete }));

	expect(await provider.check!(olds, news)).toStrictEqual({ inputs: { name: "checked" } });
	expect(await provider.diff!("id", olds, news)).toStrictEqual({ changes: true });
	expect(await provider.create(news)).toStrictEqual({ id: "created", outs: { name: "created", id: "created" } });
	expect(await provider.read!("id", olds)).toStrictEqual({ id: "read", props: { name: "read", id: "read" } });
	expect(await provider.update!("id", olds, news)).toStrictEqual({ outs: { name: "updated", id: "updated" } });
	await provider.delete!("id", olds);

	expect(complete.check).toHaveBeenCalledWith(olds, news);
	expect(complete.diff).toHaveBeenCalledWith("id", olds, news);
	expect(complete.create).toHaveBeenCalledWith(news);
	expect(complete.read).toHaveBeenCalledWith("id", olds);
	expect(complete.update).toHaveBeenCalledWith("id", olds, news);
	expect(complete.delete).toHaveBeenCalledWith("id", olds);
});

it("does what Pulumi's host does for a method the module's provider leaves out", async () => {
	const provider = moduleProvider<{ name: string }, { name: string; id: string }>(async () => ({
		default: { create: complete.create },
	}));

	expect(await provider.check!(olds, news)).toStrictEqual({ inputs: news });
	expect(await provider.diff!("id", olds, news)).toStrictEqual({});
	expect(await provider.read!("id", olds)).toStrictEqual({ id: "id", props: olds });
	expect(await provider.update!("id", olds, news)).toStrictEqual({});
	expect(await provider.delete!("id", olds)).toBeUndefined();
});

it("loads the module only when Pulumi calls the provider", async () => {
	const load = vi.fn(async () => ({ default: complete }));
	const provider = moduleProvider(load);

	expect(load).not.toHaveBeenCalled();
	await provider.create(news);
	expect(load).toHaveBeenCalledOnce();
});

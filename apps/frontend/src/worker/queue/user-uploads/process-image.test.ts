import { env } from "cloudflare:workers";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { updateVariants } from "./api";
import { processImage } from "./process-image";

vi.mock("./api", () => ({ updateVariants: vi.fn() }));
// Local Images output has no RGBA, and streams without a length R2 rejects.
vi.mock("./blurhash", () => ({ computeBlurhash: async () => "blurhash" }));

// A 1×1 PNG.
const png = Uint8Array.from(
	atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="),
	(character) => character.charCodeAt(0)
);

async function variants() {
	return (await env.DESTINATION_BUCKET.list()).objects.map(({ key }) => key).sort();
}

beforeEach(async () => {
	vi.spyOn(env.IMAGES, "input").mockImplementation(() => ({
		transform: () => ({
			output: async () => ({
				image: () => new Response("variant").body!,
				contentType: () => "image/webp",
				response: () => new Response("variant")
			})
		})
	}) as unknown as ImageTransformer);
	await env.SOURCE_BUCKET.put("upload", png, { httpMetadata: { contentType: "image/png" } });
});

afterEach(async () => {
	await env.DESTINATION_BUCKET.delete(await variants());
	vi.mocked(updateVariants).mockReset();
	vi.restoreAllMocks();
});

it("deletes the variants it wrote when the API turns them down", async () => {
	vi.mocked(updateVariants).mockRejectedValue(new Error("API returned 401"));

	await expect(processImage("upload")).rejects.toThrow("API returned 401");

	expect(await variants()).toEqual([]);
});

it("keeps the variants once the API has them", async () => {
	vi.mocked(updateVariants).mockResolvedValue();

	await processImage("upload");

	const { externalId, blurId } = vi.mocked(updateVariants).mock.calls[0]![0];
	expect(await variants()).toEqual(
		[
			`${blurId}/blur`,
			`${externalId}/full`,
			`${externalId}/icon`,
			`${externalId}/profile`,
			`${externalId}/thumb`
		].sort()
	);
});

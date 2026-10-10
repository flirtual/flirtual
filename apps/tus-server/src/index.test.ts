import { env, exports } from "cloudflare:workers";
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";

const worker = exports.default;
const secret = new Uint8Array(Buffer.from("test", "base64"));
const singlePartLimit = 1024 * 1024 * 5;

async function authorization(subject: string, audience = "attachments") {
	const token = await new SignJWT({ maxLen: singlePartLimit * 2 })
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(subject)
		.setAudience(audience)
		.setIssuedAt()
		.sign(secret);
	return `Bearer ${token}`;
}

function metadata(entries: Record<string, string>) {
	return Object.entries(entries)
		.map(([key, value]) => `${key} ${btoa(value)}`)
		.join(",");
}

async function upload(id: string, body: Uint8Array, entries: Record<string, string>) {
	const create = await worker.fetch("http://localhost/upload/attachments", {
		method: "POST",
		headers: {
			Authorization: await authorization(id),
			"Tus-Resumable": "1.0.0",
			"Upload-Length": String(body.byteLength),
			"Upload-Metadata": metadata(entries),
		},
	});
	expect(create.status).toBe(201);

	const location = create.headers.get("Location");
	expect(location).not.toBeNull();

	const patch = await worker.fetch(location!, {
		method: "PATCH",
		headers: {
			Authorization: await authorization(id),
			"Tus-Resumable": "1.0.0",
			"Content-Type": "application/offset+octet-stream",
			"Upload-Offset": "0",
		},
		body,
	});
	expect(patch.status).toBe(204);
	expect(patch.headers.get("Upload-Offset")).toBe(String(body.byteLength));

	return location!;
}

describe.each([
	["a single put", 4],
	["a multipart upload", singlePartLimit + 1],
])("an upload finished through %s", (_, size) => {
	it("is stored under its id, not its filename", async () => {
		const id = crypto.randomUUID();
		const location = await upload(id, new Uint8Array(size), { id, filename: "photo.jpg" });

		expect(new URL(location).pathname).toBe(`/upload/attachments/${id}`);
		expect((await env.ATTACHMENT_BUCKET.head(id))?.size).toBe(size);
		expect(await env.ATTACHMENT_BUCKET.head("photo.jpg")).toBeNull();
	});

	it("carries its filetype as the content type", async () => {
		const id = crypto.randomUUID();
		await upload(id, new Uint8Array(size), { id, filename: "photo.png", filetype: "image/png" });

		expect((await env.ATTACHMENT_BUCKET.head(id))?.httpMetadata?.contentType).toBe("image/png");
	});

	it("carries its stereo layout as custom metadata", async () => {
		const id = crypto.randomUUID();
		await upload(id, new Uint8Array(size), { id, filename: "photo.jpg", stereoLayout: "sbs" });

		expect((await env.ATTACHMENT_BUCKET.head(id))?.customMetadata?.stereo).toBe("sbs");
	});
});

it("rejects an upload whose id is not the token's subject", async () => {
	const response = await worker.fetch("http://localhost/upload/attachments", {
		method: "POST",
		headers: {
			Authorization: await authorization("someone-else"),
			"Tus-Resumable": "1.0.0",
			"Upload-Length": "4",
			"Upload-Metadata": metadata({ id: crypto.randomUUID(), filename: "photo.jpg" }),
		},
	});

	expect(response.status).toBe(401);
});

it("rejects an upload token used on the unbound backups namespace", async () => {
	const id = crypto.randomUUID();
	const response = await worker.fetch("http://localhost/upload/backups", {
		method: "POST",
		headers: {
			Authorization: await authorization(id),
			"Tus-Resumable": "1.0.0",
			"Upload-Length": "4",
			"Upload-Metadata": metadata({ id, filename: id }),
		},
	});

	expect(response.status).toBe(401);
});

describe("the /tus collection", () => {
	const origin = "https://app.example";

	async function create(id: string, headers: Record<string, string> = {}) {
		return worker.fetch("http://localhost/tus/", {
			method: "POST",
			headers: {
				Origin: origin,
				Authorization: await authorization(id),
				"Tus-Resumable": "1.0.0",
				"Upload-Length": "4",
				"Upload-Metadata": metadata({ id, filename: "photo.jpg" }),
				...headers,
			},
		});
	}

	it("creates an upload whose location stays under /tus", async () => {
		const id = crypto.randomUUID();
		const response = await create(id);

		expect(response.status).toBe(201);
		expect(new URL(response.headers.get("Location")!).pathname).toBe(`/tus/${id}`);
	});

	it("finishes an upload into the bucket, under its id", async () => {
		const id = crypto.randomUUID();
		const location = (await create(id)).headers.get("Location")!;

		const patch = await worker.fetch(location, {
			method: "PATCH",
			headers: {
				Origin: origin,
				Authorization: await authorization(id),
				"Tus-Resumable": "1.0.0",
				"Content-Type": "application/offset+octet-stream",
				"Upload-Offset": "0",
			},
			body: new Uint8Array(4),
		});

		expect(patch.status).toBe(204);
		expect(patch.headers.get("Upload-Offset")).toBe("4");
		expect((await env.ATTACHMENT_BUCKET.head(id))?.size).toBe(4);
	});

	it("lets the frontend read the headers a tus client needs", async () => {
		const response = await create(crypto.randomUUID());

		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
		expect(response.headers.get("Vary")).toContain("Origin");
		expect(response.headers.get("Access-Control-Expose-Headers")?.split(/,\s*/u)).toEqual(
			expect.arrayContaining(["Location", "Upload-Offset", "Upload-Length", "Tus-Resumable"]),
		);
	});

	it("doesn't let another origin read its responses", async () => {
		const response = await create(crypto.randomUUID(), { Origin: "https://elsewhere.example" });

		expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});

	it("answers the preflight before a PATCH to an upload", async () => {
		const response = await worker.fetch(`http://localhost/tus/${crypto.randomUUID()}`, {
			method: "OPTIONS",
			headers: {
				Origin: origin,
				"Access-Control-Request-Method": "PATCH",
				"Access-Control-Request-Headers": "authorization, tus-resumable, upload-offset, content-type",
			},
		});

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
		expect(response.headers.get("Access-Control-Allow-Methods")?.split(/,\s*/u)).toEqual(
			expect.arrayContaining(["POST", "PATCH", "HEAD"]),
		);
		expect(
			response.headers
				.get("Access-Control-Allow-Headers")
				?.toLowerCase()
				.split(/,\s*/u),
		).toEqual(
			expect.arrayContaining(["authorization", "tus-resumable", "upload-offset", "content-type", "upload-length", "upload-metadata"]),
		);
		expect(response.headers.get("Tus-Resumable")).toBe("1.0.0");
	});

	it("leaves Signal's own /upload paths as they were, without CORS", async () => {
		const id = crypto.randomUUID();
		const response = await worker.fetch("http://localhost/upload/attachments", {
			method: "POST",
			headers: {
				Origin: origin,
				Authorization: await authorization(id),
				"Tus-Resumable": "1.0.0",
				"Upload-Length": "4",
				"Upload-Metadata": metadata({ id, filename: "photo.jpg" }),
			},
		});

		expect(response.status).toBe(201);
		expect(new URL(response.headers.get("Location")!).pathname).toBe(`/upload/attachments/${id}`);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
	});
});

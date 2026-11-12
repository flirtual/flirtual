import type { Fetcher } from "./fetch";
import { contentType, follow, limit, peek } from "./fetch";

const maximumImageBytes = 10 * 1024 * 1024;
const maximumVideoBytes = 64 * 1024 * 1024;

export function sniffImage(bytes: Uint8Array): string | null {
	const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));

	if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return "image/jpeg";
	if (ascii(0, 8) === "\x89PNG\r\n\x1A\n") return "image/png";
	if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "image/gif";
	if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
	if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";

	return null;
}

// What we relay is shown in <img> and <video>, never as a document, but it's still served from our
// origin, so it can't be allowed to render as one if opened directly.
const mediaHeaders = {
	"content-security-policy": "default-src 'none'; sandbox",
	"x-content-type-options": "nosniff",
	"cross-origin-resource-policy": "cross-origin",
	"content-disposition": "inline",
	"cache-control": "public, max-age=604800, immutable"
};

export interface ProxyOptions {
	fetcher: Fetcher;
	userAgent: string;
}

export async function proxyImage(target: URL, { fetcher, userAgent }: ProxyOptions): Promise<Response> {
	const { response } = await follow(target, {
		fetcher,
		headers: { "user-agent": userAgent, accept: "image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.9" },
		cf: { cacheTtl: 86400, cacheEverything: true }
	});

	const length = Number(response.headers.get("content-length") ?? 0);
	if (!response.ok || !response.body || length > maximumImageBytes) {
		await response.body?.cancel();
		return new Response(null, { status: 502 });
	}

	const [head, body] = await peek(response.body, 16);
	const type = sniffImage(head);
	if (!type) {
		await body.cancel();
		return new Response(null, { status: 502 });
	}

	return new Response(limit(body, maximumImageBytes, "error"), {
		headers: { ...mediaHeaders, "content-type": type, ...(length ? { "content-length": String(length) } : {}) }
	});
}

export async function proxyVideo(target: URL, range: string | null, { fetcher, userAgent }: ProxyOptions): Promise<Response> {
	const { response } = await follow(target, {
		fetcher,
		headers: { "user-agent": userAgent, accept: "video/mp4,video/webm;q=0.9", ...(range ? { range } : {}) },
		cf: { cacheTtl: 86400, cacheEverything: true },
		timeout: 15000
	});

	const type = contentType(response);
	const length = Number(response.headers.get("content-length") ?? 0);

	if ((response.status !== 200 && response.status !== 206) || !response.body || !/^video\/(?:mp4|webm|quicktime)$/.test(type) || (response.status === 200 && length > maximumVideoBytes)) {
		await response.body?.cancel();
		return new Response(null, { status: 502 });
	}

	const headers = new Headers({ ...mediaHeaders, "content-type": type === "video/quicktime" ? "video/mp4" : type, "accept-ranges": "bytes" });
	for (const name of ["content-length", "content-range"]) {
		const value = response.headers.get(name);
		if (value) headers.set(name, value);
	}

	return new Response(limit(response.body, maximumVideoBytes, "error"), { status: response.status, headers });
}

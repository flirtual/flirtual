import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { download } from "./api/images";
import { classify, isReady } from "./classifiers";
import { accessToken, port, temporaryDirectory } from "./consts";
import { imageHashes } from "./hash";
import { log } from "./log";

const authorized = (header: string | undefined): boolean => {
	if (!accessToken) return false;

	const a = Buffer.from(header ?? "");
	const b = Buffer.from(`Bearer ${accessToken}`);
	return a.length === b.length && timingSafeEqual(a, b);
};

const readBody = (request: IncomingMessage): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		const chunks: Array<Buffer> = [];
		request.on("data", (chunk: Buffer) => chunks.push(chunk));
		request.on("end", () => resolve(Buffer.concat(chunks)));
		request.on("error", reject);
	});

const sendJson = (response: ServerResponse, status: number, payload: unknown): void => {
	response
		.writeHead(status, { "content-type": "application/json" })
		.end(JSON.stringify(payload));
};

// POST /hash: returns { hash, flipped } for an image body. Used for moderation
// image search.
const handleHash = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
	const body = await readBody(request);
	if (body.length === 0) {
		response.writeHead(400).end();
		return;
	}

	const hashes = await imageHashes(body);
	if (!hashes.hash) {
		response.writeHead(422).end();
		return;
	}

	sendJson(response, 200, hashes);
};

// POST /classify { id, file }: downloads an image and returns
// { classifications, hash, flipped }. Used for image uploads.
const handleClassify = async (
	request: IncomingMessage,
	response: ServerResponse
): Promise<void> => {
	const raw = await readBody(request);
	const { file } = JSON.parse(raw.toString() || "{}") as { id?: string; file?: string };

	if (!file) {
		sendJson(response, 400, { error: "missing file" });
		return;
	}

	if (!isReady()) {
		sendJson(response, 503, { error: "model not ready" });
		return;
	}

	const groupDir = path.resolve(temporaryDirectory, randomBytes(16).toString("hex"));
	await fs.mkdir(groupDir, { recursive: true });

	try {
		const imagePath = await download(groupDir, file);
		if (!imagePath) {
			sendJson(response, 422, { error: "download failed" });
			return;
		}

		const [classifications, hashes] = await Promise.all([
			classify(imagePath),
			imageHashes(imagePath)
		]);

		sendJson(response, 200, {
			classifications,
			hash: hashes.hash,
			flipped: hashes.flipped
		});
	} finally {
		await fs.rm(groupDir, { recursive: true, force: true });
	}
};

export const startServer = () => {
	const server = createServer((request, response) => {
		void (async () => {
			if (request.method !== "POST") {
				response.writeHead(404).end();
				return;
			}

			if (!authorized(request.headers.authorization)) {
				response.writeHead(401).end();
				return;
			}

			try {
				if (request.url === "/hash") {
					await handleHash(request, response);
					return;
				}

				if (request.url === "/classify") {
					await handleClassify(request, response);
					return;
				}

				response.writeHead(404).end();
			} catch (reason) {
				const error = reason instanceof Error ? reason.message : String(reason);
				log.error({ url: request.url, reason: error }, "Request failed.");
				if (!response.headersSent) response.writeHead(500).end();
			}
		})();
	});

	server.listen(port, "::", () => log.info({ port }, "Image Classification server listening."));
	return server;
};

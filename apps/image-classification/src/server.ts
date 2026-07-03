import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";
import { timingSafeEqual } from "node:crypto";

import { accessToken, port } from "./consts";
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

// POST /hash: returns { hash, flipped } for an image body.
export const startServer = () => {
	const server = createServer((request, response) => {
		void (async () => {
			if (request.method !== "POST" || request.url !== "/hash") {
				response.writeHead(404).end();
				return;
			}

			if (!authorized(request.headers.authorization)) {
				response.writeHead(401).end();
				return;
			}

			try {
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

				response
					.writeHead(200, { "content-type": "application/json" })
					.end(JSON.stringify(hashes));
			} catch (reason) {
				const error = reason instanceof Error ? reason.message : String(reason);
				log.error({ reason: error }, "Failed to hash uploaded image.");
				response.writeHead(422).end();
			}
		})();
	});

	server.listen(port, "::", () => log.info({ port }, "Image Classification server listening."));
	return server;
};

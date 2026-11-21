import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { svgDir } from "@ffaubert/twemoji";
import type { Plugin } from "vite";

const moduleId = "virtual:twemoji";
const resolvedModuleId = `\0${moduleId}`;

// Serves jdecked's Twemoji SVGs (https://github.com/jdecked/twemoji) from our own origin. They're
// emitted under a versioned path, so they cache immutably and the SVG optimizer still runs on them.
export function twemoji(): Plugin {
	let directory = "";

	return {
		name: "twemoji",
		async configResolved(config) {
			const { version } = JSON.parse(await readFile(join(svgDir, "..", "..", "package.json"), "utf8")) as { version: string };
			directory = `${config.build.assetsDir}/twemoji/${version}`;
		},
		resolveId: (id) => (id === moduleId ? resolvedModuleId : undefined),
		load(id) {
			if (id !== resolvedModuleId) return;
			return `export const twemojiUrl = (codepoints) => \`\${import.meta.env.BASE_URL}${directory}/\${codepoints}.svg\`;`;
		},
		configureServer(server) {
			server.middlewares.use(async (request, response, next) => {
				const prefix = `${server.config.base}${directory}/`;
				const name = request.url?.startsWith(prefix) && request.url.slice(prefix.length);
				if (!name || !/^[\da-f-]+\.svg$/.test(name)) return next();

				try {
					response.setHeader("content-type", "image/svg+xml");
					response.end(await readFile(join(svgDir, name)));
				}
				catch {
					next();
				}
			});
		},
		async buildStart() {
			if (this.environment.mode !== "build" || this.environment.name !== "client") return;

			for (const name of await readdir(svgDir))
				this.emitFile({ type: "asset", name, fileName: `${directory}/${name}`, source: await readFile(join(svgDir, name)) });
		}
	};
}

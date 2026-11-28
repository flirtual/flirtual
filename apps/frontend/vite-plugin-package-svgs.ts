import { createHash } from "node:crypto";
import { copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { Config as SvgoConfig } from "svgo";
import type { Plugin } from "vite";

export interface PackageSvgsOptions {
	/** Name of the output directory, which sits under a versioned path in the assets directory. */
	name: string;
	/** Directory of `{name}.svg` files inside an installed package. */
	directory: string;
	/** Virtual module that exports `exportName(name)`, the URL of that SVG. */
	moduleId: string;
	exportName: string;
	/** Answer `undefined` for names the directory lacks, at the cost of listing every name in the bundle. */
	knownNamesOnly?: boolean;
	/**
	 * Optimize each SVG once, keeping the results in node_modules/.cache between builds. An optimized
	 * file that comes out no smaller is dropped for the original.
	 */
	svgo?: SvgoConfig;
}

function packageVersion(directory: string): string {
	for (let current = directory; current !== dirname(current); current = dirname(current)) {
		const manifest = join(current, "package.json");
		if (existsSync(manifest)) return (JSON.parse(readFileSync(manifest, "utf8")) as { version: string }).version;
	}
	throw new Error(`No package.json above ${directory}`);
}

function linkOrCopy(source: string, target: string) {
	try {
		linkSync(source, target);
	}
	catch {
		copyFileSync(source, target);
	}
}

// Serves a package's SVGs from our own origin under a versioned path, so they cache immutably,
// without passing each one through the bundler. Files are hard-linked into the output: nothing
// writes to it in place, so the package's own files (or the optimized cache) stay intact.
export function packageSvgs(options: PackageSvgsOptions): Plugin {
	const { name, directory, moduleId, exportName, knownNamesOnly = false, svgo } = options;
	const resolvedModuleId = `\0${moduleId}`;
	const files = readdirSync(directory).filter((file) => file.endsWith(".svg"));
	const names = new Set(files.map((file) => file.slice(0, -".svg".length)));
	const version = packageVersion(directory);
	let urlPath = "";
	let cacheRoot = "";

	async function optimizedDirectory(): Promise<string> {
		if (!svgo) return directory;

		const configHash = createHash("sha256").update(JSON.stringify(svgo)).digest("hex").slice(0, 12);
		const cached = join(cacheRoot, `${name}@${version}-${configHash}`);
		mkdirSync(cached, { recursive: true });
		const missing = files.filter((file) => !existsSync(join(cached, file)));
		if (missing.length === 0) return cached;

		const { optimize } = await import("svgo");
		for (const file of missing) {
			const target = join(cached, file);
			const original = readFileSync(join(directory, file));
			const optimized = Buffer.from(optimize(original.toString(), { path: file, ...svgo }).data);
			writeFileSync(target, optimized.byteLength < original.byteLength ? optimized : original);
		}
		return cached;
	}

	return {
		name: `package-svgs:${name}`,
		configResolved(config) {
			urlPath = `${config.build.assetsDir}/${name}/${version}`;
			cacheRoot = join(config.root, "node_modules/.cache/package-svgs");
		},
		resolveId: {
			filter: { id: new RegExp(`^${moduleId}$`) },
			handler: () => resolvedModuleId
		},
		load: {
			filter: { id: new RegExp(`^\0${moduleId}$`) },
			handler: () => knownNamesOnly
				? `const names = new Set(${JSON.stringify([...names])});\nexport const ${exportName} = (name) => names.has(name) ? \`\${import.meta.env.BASE_URL}${urlPath}/\${name}.svg\` : undefined;`
				: `export const ${exportName} = (name) => \`\${import.meta.env.BASE_URL}${urlPath}/\${name}.svg\`;`
		},
		configureServer(server) {
			server.middlewares.use(async (request, response, next) => {
				const prefix = `${server.config.base}${urlPath}/`;
				const file = request.url?.startsWith(prefix) && request.url.slice(prefix.length);
				if (!file || !files.includes(file)) return next();

				response.setHeader("content-type", "image/svg+xml");
				response.end(await readFile(join(directory, file)));
			});
		},
		async writeBundle(output) {
			if (this.environment.name !== "client" || !output.dir) return;

			const source = await optimizedDirectory();
			const target = join(output.dir, urlPath);
			mkdirSync(target, { recursive: true });
			for (const file of files) linkOrCopy(join(source, file), join(target, file));
		}
	};
}

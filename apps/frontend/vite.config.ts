import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { hostname as osHostname } from "node:os";
import { fileURLToPath } from "node:url";

import reactCompiler from "@acusti/vite-plugin-react-compiler";
import { svgDir } from "@ffaubert/twemoji";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import sonda from "sonda/vite";
import macros from "unplugin-macros/vite";
import { defineConfig, loadEnv } from "vite";
import type { UserConfig } from "vite";
import { imagetools } from "vite-imagetools";
import { ViteImageOptimizer as imageOptimize } from "vite-plugin-image-optimizer";

import { targets } from "./src/targets.ts";
import { reactRouterHookFilters, withHookFilters } from "./vite-plugin-hook-filters.ts";
import { hush } from "./vite-plugin-hush.ts";
import { packageSvgs } from "./vite-plugin-package-svgs.ts";

const mkcertPaths = {
	cert: "./certificates/localhost.pem",
	key: "./certificates/localhost-key.pem"
};

const mkcertExists = existsSync(mkcertPaths.cert) && existsSync(mkcertPaths.key);

export default defineConfig(async (config): Promise<UserConfig> => {
	const { mode } = config;

	// eslint-disable-next-line unicorn/prevent-abbreviations
	const env = loadEnv(mode, process.cwd(), "");

	const defaultHost = osHostname().toLowerCase();
	// Until portless passes apps each other's URLs: https://github.com/vercel-labs/portless/issues/408
	const portlessUrl = env.PORTLESS_URL ? new URL(env.PORTLESS_URL) : undefined;
	const origin = env.VITE_ORIGIN || portlessUrl?.origin || `https://${defaultHost}:3000`;
	const apiUrl = env.VITE_API_URL || (portlessUrl
		? `${portlessUrl.protocol}//api.${portlessUrl.host}/v1/`
		: `https://${defaultHost}:4001/v1/`);
	const servesHttps = mode === "development" && !portlessUrl;

	const sentryOrganization = env.VITE_SENTRY_ORGANIZATION;
	const sentryProjectId = env.VITE_SENTRY_PROJECT_ID;
	const sentryAuthToken = env.SENTRY_AUTH_TOKEN;

	const useSentry = sentryOrganization && sentryProjectId && sentryAuthToken;

	const { hostname } = new URL(origin);

	if (!env.VITE_ORIGIN) process.env.VITE_ORIGIN = origin;
	if (!env.VITE_API_URL) process.env.VITE_API_URL = apiUrl;

	// tailwind.config.ts reads process.env.
	for (const [key, value] of Object.entries(env))
		if (key.startsWith("VITE_BRAND_") && !process.env[key]) process.env[key] = value;

	if (!env.VITE_BRAND_ASSET_DOMAIN) throw new Error("VITE_BRAND_ASSET_DOMAIN is required: the static bucket is served from there");
	if (!env.VITE_BRAND_REPOSITORY_URL) throw new Error("VITE_BRAND_REPOSITORY_URL is required: you must publish your source code to comply with the AGPL");

	const commitId = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();

	return {
		appType: "mpa",
		define: {
			__COMMIT_ID__: JSON.stringify(commitId)
		},
		ssr: {
			noExternal: ["posthog-js"]
		},
		resolve: {
			tsconfigPaths: true
		},
		build: {
			assetsDir: "static",
			minify: true,
			sourcemap: true,
			target: targets,
			chunkSizeWarningLimit: 100,
			rolldownOptions: {
				// experimentalLogSideEffects: true,
				treeshake: {
					unknownGlobalSideEffects: false,
					propertyReadSideEffects: false
				},
				output: {
					// experimentalMinChunkSize: 8192,
					entryFileNames: "static/[hash:16].js",
					chunkFileNames: "static/[hash:16].js",
					assetFileNames: "static/[hash:16].[ext]",
					codeSplitting: {
						groups: [{ name: "react", test: /[\\/]node_modules[\\/](?:react|react-dom|react-router|react-error-boundary)[\\/]/ }]
					}
				}
			}
		},
		server: {
			host: "::",
			origin,
			port: 3000,
			strictPort: true,
			watch: {
				ignored: [
					"android/**",
					"ios/**",
					"visionos/**"
				]
			},
			...(servesHttps && {
				https: mkcertExists
					? { cert: readFileSync(mkcertPaths.cert), key: readFileSync(mkcertPaths.key) }
					: undefined
			})
		},
		plugins: [
			tailwindcss(),
			hush([
				"Can't resolve original location of error"
			]),
			withHookFilters(macros(), { transform: { code: /type:\s*["']macro["']/ } }),
			servesHttps && !mkcertExists && basicSsl({
				name: "flirtual",
				domains: [hostname],
				certDir: "./certificates",
			}),
			reactRouter().map((plugin) => withHookFilters(plugin, reactRouterHookFilters[plugin.name] ?? {})),
			withHookFilters(reactCompiler({ compiler: { reportDiagnostics: true } }), {
				transform: { id: { include: /\.[jt]sx?(?:\?|$)/, exclude: /[/\\]node_modules[/\\]/ } }
			}),
			packageSvgs({
				name: "twemoji",
				directory: svgDir,
				moduleId: "virtual:twemoji",
				exportName: "twemojiUrl"
			}),
			packageSvgs({
				name: "flag-icons",
				directory: fileURLToPath(new URL("node_modules/flag-icons/flags/4x3", import.meta.url)),
				moduleId: "virtual:flag-icons",
				exportName: "flagUrl",
				knownNamesOnly: true,
				// vite-plugin-image-optimizer's own SVGO defaults, which these flags went through as bundled assets.
				svgo: {
					multipass: true,
					plugins: [
						{ name: "preset-default", params: { overrides: { cleanupNumericValues: false, cleanupIds: { minify: false, remove: false }, convertPathData: false } } },
						"sortAttrs",
						{ name: "addAttributesToSVGElement", params: { attributes: [{ xmlns: "http://www.w3.org/2000/svg" }] } }
					]
				}
			}),
			imageOptimize({
				cache: true,
				cacheLocation: "./node_modules/.cache/vite-image-optimizer",
				logStats: false,
				test: /\.svg$/i
			}),
			imagetools({
				exclude: [],
				// include: /^[^?]+\.(avif|gif|heif|jpeg|jpg|png|tiff|webp)(\?.*)?$/
				// https://github.com/JonasKruckenberg/imagetools/issues/317
				include: [
					/^[^?]+\.(avif|heif|jpeg|jpg|png|tiff|webp)(\?.*)?$/,
					// An SVG stays a vector unless the import asks for a raster size or format.
					/^[^?]+\.svg\?(.*&)?(w|h|format)=/
				],
				defaultDirectives: (url) => {
					const directives = new URLSearchParams(url.pathname.endsWith(".svg") ? { allowUpscale: "true" } : {});
					if (url.searchParams.has("raw") || url.searchParams.has("format")) return directives;

					directives.set("quality", "90");
					directives.set("effort", "max");
					directives.set("format", "webp");
					return directives;
				}
			}),
			!!env.ANALYZE && sonda({
				open: false
			}),
			useSentry && (await import("@sentry/react-router/vite")).sentryReactRouter({
				org: sentryOrganization,
				project: sentryProjectId,
				authToken: sentryAuthToken,
				telemetry: false,
				sourcemaps: {
					filesToDeleteAfterUpload: [
						"**/*.data"
					]
				},
				bundleSizeOptimizations: {
					excludeDebugStatements: true
				}
			}, config)
		].filter(Boolean),
	};
});

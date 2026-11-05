import { existsSync, readFileSync } from "node:fs";
import { hostname as osHostname } from "node:os";

import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import sonda from "sonda/vite";
import info from "unplugin-info/vite";
import macros from "unplugin-macros/vite";
import { defineConfig, loadEnv } from "vite";
import { imagetools } from "vite-imagetools";
import { ViteImageOptimizer as imageOptimize } from "vite-plugin-image-optimizer";

import { targets } from "./src/targets.ts";
import { hush } from "./vite-plugin-hush.ts";

const mkcertPaths = {
	cert: "./certificates/localhost.pem",
	key: "./certificates/localhost-key.pem"
};

const mkcertExists = existsSync(mkcertPaths.cert) && existsSync(mkcertPaths.key);

function getManualChunk(moduleId: string) {
	const [,, language] = /(?:\/@uppy\/locales\/lib\/|\/messages\/(attributes\.)?)([a-z-_]+)\.(?:json|js)$/i.exec(moduleId) || [];
	if (language) return `languages/${language === "pt_BR" ? "pt-BR" : language.split("_")[0]}`;

	if (/node_modules\/@?(?:react|react-dom|react-router|react-error-boundary)\//i.test(moduleId)) return "react";
	if (/node_modules\/@?(?:capacitor|capawesome|capgo|revenuecat)/i.test(moduleId)) return "native";

	return null;
}

export default defineConfig((config) => {
	const { mode } = config;

	// eslint-disable-next-line unicorn/prevent-abbreviations
	const env = loadEnv(mode, process.cwd(), "");

	const defaultHost = osHostname().toLowerCase();
	const origin = env.VITE_ORIGIN || `https://${defaultHost}:3000`;
	const apiUrl = env.VITE_API_URL || `https://${defaultHost}:4001/v1/`;

	const sentryOrganization = env.VITE_SENTRY_ORGANIZATION;
	const sentryProjectId = env.VITE_SENTRY_PROJECT_ID;
	const sentryAuthToken = env.SENTRY_AUTH_TOKEN;

	const useSentry = sentryOrganization && sentryProjectId && sentryAuthToken;

	const { hostname } = new URL(origin);

	if (!env.VITE_ORIGIN) process.env.VITE_ORIGIN = origin;
	if (!env.VITE_API_URL) process.env.VITE_API_URL = apiUrl;

	// tailwind.config.js reads process.env.
	for (const [key, value] of Object.entries(env))
		if (key.startsWith("VITE_BRAND_") && !process.env[key]) process.env[key] = value;

	if (!env.VITE_BRAND_ASSET_DOMAIN) throw new Error("VITE_BRAND_ASSET_DOMAIN is required: the static bucket is served from there");
	if (!env.VITE_BRAND_REPOSITORY_URL) throw new Error("VITE_BRAND_REPOSITORY_URL is required: you must publish your source code to comply with the AGPL");

	return {
		appType: "mpa",
		ssr: {
			noExternal: ["posthog-js", "@posthog/react"]
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
			rollupOptions: {
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
					manualChunks: getManualChunk
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
			...(mode === "development" && {
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
			macros(),
			info(),
			mode === "development" && !mkcertExists && basicSsl({
				name: "flirtual",
				domains: [hostname],
				certDir: "./certificates",
			}),
			reactRouter(),
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
			useSentry && sentryReactRouter({
				org: sentryOrganization,
				project: sentryProjectId,
				authToken: sentryAuthToken,
				telemetry: false,
				sourceMapsUploadOptions: {
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

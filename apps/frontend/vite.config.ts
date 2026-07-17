import { existsSync, readFileSync } from "node:fs";
import { hostname as osHostname } from "node:os";

import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import basicSsl from "@vitejs/plugin-basic-ssl";
import autoprefixer from "autoprefixer";
import webpackStatsPlugin from "rollup-plugin-webpack-stats";
import sonda from "sonda/vite";
import tailwindcss from "tailwindcss";
import info from "unplugin-info/vite";
import remoteAssets from "unplugin-remote-assets/vite";
import { defineConfig, loadEnv } from "vite";
import { imagetools } from "vite-imagetools";
import babel from "vite-plugin-babel";
import { ViteImageOptimizer as imageOptimize } from "vite-plugin-image-optimizer";
import tsconfigPaths from "vite-tsconfig-paths";

import { browserslist, targets } from "./src/polyfill";
import { hush } from "./vite-plugin-hush";

const mkcertPaths = {
	cert: "./certificates/localhost.pem",
	key: "./certificates/localhost-key.pem"
};

const mkcertExists = existsSync(mkcertPaths.cert) && existsSync(mkcertPaths.key);

function getManualChunk(moduleId: string) {
	const [,, language] = /(?:\/@uppy\/locales\/lib\/|\/messages\/(attributes\.)?)([a-z-_]+)\.(?:json|js)$/i.exec(moduleId) || [];
	if (language) return `languages/${{ en_US: "en", ja_JP: "ja" }[language] || language}`;

	if (/node_modules\/@?(?:react|react-dom|react-router|react-portal|react-error-boundary)\//i.test(moduleId)) return "react";
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

	return {
		appType: "mpa",
		ssr: {
			noExternal: ["posthog-js", "@posthog/react"]
		},
		css: {
			postcss: {
				plugins: [
					tailwindcss(),
					autoprefixer({ overrideBrowserslist: browserslist })
				]
			}
		},
		build: {
			assetsDir: "static",
			minify: true,
			sourcemap: true,
			target: targets,
			chunkSizeWarningLimit: 100,
			// cssMinify: "lightningcss",
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
			host: "0.0.0.0",
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
					: undefined,
				proxy: {
					"/tidewave": {
						target: new URL(apiUrl).origin,
						secure: false
					}
				}
			})
		},
		plugins: [
			hush([
				"Can't resolve original location of error"
			]),
			tsconfigPaths(),
			babel({
				include: /\.[jt]sx?$/,
				babelConfig: {
					babelrc: false,
					configFile: false,
					presets: ["@babel/preset-typescript"],
					plugins: [
						["babel-plugin-macros", {}],
						["babel-plugin-dev-expression", {}]
					]
				}
			}),
			info(),
			remoteAssets({
				aliases: [
					{
						regex: /^(\w+)\/(.+)/,
						replacement: "https://$1.flirtual.com/$2"
					},
					{
						regex: /^(.+)/,
						replacement: "https://static.flirtual.com/$1"
					}
				]
			}),
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
				include: /^[^?]+\.(avif|heif|jpeg|jpg|png|tiff|webp)(\?.*)?$/,
				defaultDirectives: (url) => {
					if (url.searchParams.has("raw")) return new URLSearchParams();

					return new URLSearchParams({
						// lossless: "",
						quality: "90",
						effort: "max",
						format: "webp"
					});
				}
			}),
			sonda({
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
			}, config),
			webpackStatsPlugin()
		].filter(Boolean),
	};
});

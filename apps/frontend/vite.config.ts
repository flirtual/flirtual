import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import basicSsl from "@vitejs/plugin-basic-ssl";
import sonda from "sonda/vite";
import invariant from "tiny-invariant";
import info from "unplugin-info/vite";
import remoteAssets from "unplugin-remote-assets/vite";
import { defineConfig, loadEnv } from "vite";
import { imagetools } from "vite-imagetools";
import babel from "vite-plugin-babel";
import { ViteImageOptimizer as imageOptimize } from "vite-plugin-image-optimizer";
import tsconfigPaths from "vite-tsconfig-paths";

import { hush } from "./vite-plugin-hush";

function getManualChunk(moduleId: string) {
	const [,, language] = /(?:\/@uppy\/locales\/lib\/|\/messages\/(attributes\.)?)([a-z-_]+)\.(?:json|js)$/i.exec(moduleId) || [];
	if (language) return `languages/${{ en_US: "en", ja_JP: "ja" }[language] || language}`;

	if (/node_modules\/@?(?:react|react-dom|react-router|react-portal|react-error-boundary)\//i.test(moduleId)) return "react";
	if (/node_modules\/@?(?:capacitor|capawesome|capgo|revenuecat|trapezedev)/i.test(moduleId)) return "native";

	return null;
}

export default defineConfig((config) => {
	const { mode } = config;

	const {
		VITE_ORIGIN: origin,
		VITE_SENTRY_ORGANIZATION: sentryOrganization,
		VITE_SENTRY_PROJECT_ID: sentryProjectId,
		SENTRY_AUTH_TOKEN: sentryAuthToken
	} = loadEnv(mode, process.cwd(), "");

	invariant(origin, "VITE_ORIGIN is required");
	const { hostname } = new URL(origin);

	return {
		esbuild: {
			charset: "utf8",
			legalComments: "external",
		},
		appType: "mpa",
		build: {
			assetsDir: "static",
			minify: true,
			sourcemap: true,
			target: [
				"chrome106",
				"edge106",
				"firefox104",
				"safari16"
			],
			chunkSizeWarningLimit: 100,
			// cssMinify: "lightningcss",
			rollupOptions: {
				// experimentalLogSideEffects: true,
				treeshake: {
					unknownGlobalSideEffects: false,
					propertyReadSideEffects: false,
					tryCatchDeoptimization: false
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
		},
		plugins: [
			hush([
				"Can't resolve original location of error"
			]),
			tsconfigPaths(),
			babel({
				filter: /\.[jt]sx?$/,
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
			mode === "development" && basicSsl({
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
			// checker({
			// 	overlay: false,
			// 	typescript: true,
			// 	eslint: {
			// 		useFlatConfig: true,
			// 		lintCommand: "eslint \"./src/**/*.{ts,tsx}\"",
			// 		watchPath: "./src",
			// 	}
			// }),
			sonda({
				open: false
			}),
			sentryReactRouter({
				org: sentryOrganization,
				project: sentryProjectId,
				authToken: sentryAuthToken,
				telemetry: false,
				sourceMapsUploadOptions: {
					filesToDeleteAfterUpload: [
						"**/*.data",
						mode === "production" && "**/*.map"
					].filter(Boolean)
				},
				bundleSizeOptimizations: {
					excludeDebugStatements: true,
					excludeReplayIframe: true,
					excludeReplayShadowDom: true,
					excludeReplayWorker: true
				}
			}, config)
		],
	};
});

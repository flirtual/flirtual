import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { reactRouter } from "@react-router/dev/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import type { PreRenderedChunk } from "rollup";
import sonda from "sonda/vite";
import info from "unplugin-info/vite";
import { defineConfig, loadEnv } from "vite";
import { ViteImageOptimizer as imageOptimize } from "vite-plugin-image-optimizer";
import tsconfigPaths from "vite-tsconfig-paths";

function getChunkName({ name }: PreRenderedChunk) {
	return `static/${name.toLowerCase().replaceAll(/^use|[_.-]/g, "")}.[hash:8].js`;
}

function getManualChunk(moduleId: string) {
	const [,, language] = /(?:\/@uppy\/locales\/lib\/|\/messages\/(attributes\.)?)([a-z-_]+)\.(?:json|js)$/i.exec(moduleId) || [];
	if (language) return `languages/${{ en_US: "en", ja_JP: "ja" }[language] || language}`;

	if (/node_modules\/@?(?:react|react-dom|react-router|react-portal|react-error-boundary)\//i.test(moduleId)) return "react";
	if (/node_modules\/@?(?:capacitor|capawesome|capgo|revenuecat|trapezedev)/i.test(moduleId)) return "native";

	return null;
}

export const bucketNames = [
	"static",
	"content",
	"uploads"
] as const;

export type BucketName = typeof bucketNames[number];

export const bucketOriginMap = {
	static: "https://static.flirtual.com",
	content: "https://content.flirtual.com",
	uploads: "https://uploads.flirtual.com"
} as const satisfies Record<BucketName, string>;

export const bucketOrigins = Object.values(bucketOriginMap);

async function downloadAsset(url: URL) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Asset \"${url}\" threw an error: ${response.status} ${response.statusText}`, { cause: response });

	const temporaryFile = path.resolve("node_modules/vite-plugin-remote-assets/.data", url.href);
	await mkdir(path.dirname(temporaryFile), { recursive: true });

	await writeFile(temporaryFile, Buffer.from(await response.arrayBuffer()));
	return temporaryFile;
}

function remoteAssets() {
	return {
		name: "vite-plugin-remote-assets",
		async resolveId(id: string) {
			const [, bucket = "static", pathname] = /^virtual:r2\/(?:(\w+)\/)?(\S+)/.exec(id) || [];
			if (!pathname || !bucketNames.includes(bucket as BucketName)) return;

			const url = new URL(pathname, bucketOriginMap[bucket as BucketName]);
			return downloadAsset(url);
		},
	};
}

export default defineConfig(({ mode }) => {
	const { VITE_ORIGIN: origin } = loadEnv(mode, process.cwd(), "");
	const { hostname } = new URL(origin);

	return {
		appType: "spa",
		esbuild: {
			charset: "utf8",
			legalComments: "external",
		},
		resolve: {
			alias: {
				ramda: "remeda"
			}
		},
		build: {
			assetsDir: "static",
			sourcemap: true,
			minify: true,
			target: ["chrome106", "edge106", "firefox104", "safari15"],
			chunkSizeWarningLimit: 100,
			cssMinify: "lightningcss",
			rollupOptions: {
				output: {
					experimentalMinChunkSize: 10000,
					hashCharacters: "hex",
					entryFileNames: getChunkName,
					chunkFileNames: getChunkName,
					assetFileNames: "static/[name].[hash:8].[ext]",
					manualChunks: getManualChunk
				}
			}
		},
		server: {
			host: hostname,
			origin,
			port: 3000,
			strictPort: true,
		},
		plugins: [
			tsconfigPaths(),
			info(),
			remoteAssets(),
			mode === "development" && basicSsl({
				name: "flirtual",
				domains: [hostname],
				certDir: "./certificates",
			}),
			reactRouter(),
			imageOptimize(),
			// checker({
			// 	overlay: false,
			// 	typescript: true,
			// 	eslint: {
			// 		useFlatConfig: true,
			// 		lintCommand: "eslint \"./src/**/*.{ts,tsx}\"",
			// 		watchPath: "./src",
			// 	}
			// }),
			sonda(),
		],
	};
});

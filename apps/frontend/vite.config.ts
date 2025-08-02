import { reactRouter } from "@react-router/dev/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import sonda from "sonda/vite";
import info from "unplugin-info/vite";
import remoteAssets from "unplugin-remote-assets/vite";
import { defineConfig, loadEnv } from "vite";
import { ViteImageOptimizer as imageOptimize } from "vite-plugin-image-optimizer";
import tsconfigPaths from "vite-tsconfig-paths";

function getManualChunk(moduleId: string) {
	const [,, language] = /(?:\/@uppy\/locales\/lib\/|\/messages\/(attributes\.)?)([a-z-_]+)\.(?:json|js)$/i.exec(moduleId) || [];
	if (language) return `languages/${{ en_US: "en", ja_JP: "ja" }[language] || language}`;

	if (/node_modules\/@?(?:react|react-dom|react-router|react-portal|react-error-boundary)\//i.test(moduleId)) return "react";
	if (/node_modules\/@?(?:capacitor|capawesome|capgo|revenuecat|trapezedev)/i.test(moduleId)) return "native";

	return null;
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
					experimentalMinChunkSize: 8192,
					entryFileNames: "static/[hash:16].js",
					chunkFileNames: "static/[hash:16].js",
					assetFileNames: "static/[hash:16].[ext]",
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
			sonda(),
		],
	};
});

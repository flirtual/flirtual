import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import sonda from "sonda/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const moduleLanguageRegex = /(\/@uppy\/locales\/lib\/|\/messages\/(attributes\.)?)(?<language>[a-z-_]+)\.(json|js)$/i;

const moduleLanguageOverrides: Record<string, string> = {
	en_US: "en",
	ja_JP: "ja",
};

function getModuleLanguage(id: string): string | null {
	const match = id.match(moduleLanguageRegex);
	if (!match?.groups?.language) return null;

	const language = moduleLanguageOverrides[match.groups.language] || match.groups.language;
	return language;
}

const modulePackageNameRegex = /\/node_modules\/.+\/node_modules\/(?<name>(@[^/]+\/)?[^/]+)\//i;

function getPackageName(id: string): string | null {
	const match = id.match(modulePackageNameRegex);
	if (!match?.groups?.name) return null;

	return match.groups.name;
}

export default defineConfig(({ mode }) => {
	const { VITE_ORIGIN: origin } = loadEnv(mode, process.cwd(), "");
	const { hostname } = new URL(origin);

	return {
		build: {
			sourcemap: true,
			rollupOptions: {
				output: {
					hashCharacters: "hex",
					entryFileNames: "chunks/[hash:8].js",
					chunkFileNames: "chunks/[name].[hash:8].js",
					assetFileNames: "chunks/[name].[hash:8].[ext]",
					manualChunks: (id) => {
						const language = getModuleLanguage(id);
						if (language) return `languages/${language}`;

						const packageName = getPackageName(id);
						if (packageName?.startsWith("@capacitor")) return `capacitor`;

						return null;
					}
				}
			}
		},
		server: {
			host: hostname,
			port: 3000,
			strictPort: true,
		},
		plugins: [
			basicSsl({
				name: "flirtual",
				domains: [hostname],
				certDir: "./certificates",
			}),
			reactRouter(),
			tsconfigPaths(),
			cloudflare({
				experimental: {
					headersAndRedirectsDevModeSupport: true,
				}
			}),
			sonda()
		],
	};
});

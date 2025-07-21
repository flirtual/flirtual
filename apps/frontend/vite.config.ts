import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import sonda from "sonda/vite";
import info from "unplugin-info/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// import checker from "vite-plugin-checker";

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

const modulePackageRegex = /\/node_modules\/.+\/node_modules\/(?<name>(@[^/]+\/)?[^/]+)\//i;

function getModuleIdentifiers(id: string) {
	const match = id.match(modulePackageRegex);
	if (!match?.groups?.name) return null;

	const [scopeOrName, name] = match.groups.name.split("/").slice(0, 2);

	return {
		scope: name ? scopeOrName.replace(/@/, "") : undefined,
		name: name || scopeOrName,
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
		build: {
			assetsDir: "static",
			sourcemap: true,
			chunkSizeWarningLimit: 100,
			cssMinify: "lightningcss",
			rollupOptions: {
				output: {
					hashCharacters: "hex",
					entryFileNames: "static/[name].[hash:8].js",
					chunkFileNames: "static/[name].[hash:8].js",
					assetFileNames: "static/[name].[hash:8].[ext]",
					manualChunks: (id) => {
						const language = getModuleLanguage(id);
						if (language) return `language-${language}`;

						const identifiers = getModuleIdentifiers(id);
						if (identifiers) {
							const { scope, name } = identifiers;

							if (
								(scope && [
									"capacitor",
									"capawesome",
									"capgo",
									"revenuecat",
									"trapezedev"
								].includes(scope)) || [
									"capacitor-native-settings"
								].includes(name)
							)
								return "native";
						}

						return null;
					}
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
			basicSsl({
				name: "flirtual",
				domains: [hostname],
				certDir: "./certificates",
			}),
			reactRouter(),
			cloudflare({
				experimental: {
					headersAndRedirectsDevModeSupport: true,
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
			sonda(),
		],
	};
});

import { reactRouter } from "@react-router/dev/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import type { PreRenderedChunk } from "rollup";
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

function getChunkName({ name: _name, facadeModuleId, moduleIds }: PreRenderedChunk) {
	const moduleId = facadeModuleId || moduleIds.at(-1);
	const identifiers = moduleId ? getModuleIdentifiers(moduleId) : null;

	const name = (_name.startsWith("chunk")
		? identifiers?.name
		: _name) || _name;

	return `static/${name.toLowerCase().replaceAll(/^use|[_.-]/g, "")}.[hash:8].js`;
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
			minify: true,
			target: ["chrome106", "edge106", "firefox104", "safari15"],
			chunkSizeWarningLimit: 100,
			cssMinify: "lightningcss",
			rollupOptions: {
				output: {
					hashCharacters: "hex",
					entryFileNames: getChunkName,
					chunkFileNames: getChunkName,
					assetFileNames: "static/[name].[hash:8].[ext]",
					manualChunks: (id) => {
						const language = getModuleLanguage(id);
						if (language) return `languages/${language}`;

						const identifiers = getModuleIdentifiers(id);
						if (identifiers) {
							const { scope, name } = identifiers;

							if (
								(scope && [
									"capacitor",
									"capacitor-community",
									"capawesome",
									"capawesome-team",
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
			mode === "development" && basicSsl({
				name: "flirtual",
				domains: [hostname],
				certDir: "./certificates",
			}),
			reactRouter(),
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

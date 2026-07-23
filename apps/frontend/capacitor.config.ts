import { readFileSync } from "node:fs";

import type { CapacitorConfig } from "@capacitor/cli";
import invariant from "tiny-invariant";

function nativeVersion(path: string, pattern: RegExp) {
	const versions = new Set(
		[...readFileSync(path, "utf8").matchAll(pattern)].map(([, version]) => version)
	);

	invariant(versions.size === 1, `Expected one version in ${path}, found ${versions.size}`);
	return [...versions][0] as string;
}

const androidVersion = nativeVersion("android/app/build.gradle", /versionName\s+'([^']+)'/g);
const iosVersion = nativeVersion(
	"ios/App/App.xcodeproj/project.pbxproj",
	/MARKETING_VERSION = ([^;]+);/g
);

const origin = process.env.VITE_ORIGIN;
invariant(origin, "VITE_ORIGIN is not set");

const frontendUrl = new URL(origin);
const frontendScheme = frontendUrl.protocol.slice(0, -1);

const appId = process.env.VITE_APP_BUNDLE_ID;
invariant(appId, "VITE_APP_BUNDLE_ID is not set");

const androidFlavors: Record<string, string> = {
	"zone.homie.flirtual.pwa": "production",
	"zone.homie.flirtual.beta": "beta"
};
const androidFlavor = androidFlavors[appId];

const iosSchemes: Record<string, string> = {
	"zone.homie.flirtual.pwa": "Flirtual",
	"zone.homie.flirtual.beta": "Flirtual Beta"
};
const iosScheme = iosSchemes[appId];

const apiUrl = process.env.VITE_API_URL;
invariant(apiUrl, "VITE_API_URL is not set");

export default {
	appId,
	appName: "Flirtual",
	server: {
		androidScheme: frontendScheme,
		hostname: frontendUrl.hostname,
		url: frontendUrl.origin,
		cleartext: frontendScheme === "http",
		allowNavigation: ["flirtual.com"] // migration prep
	},
	android: {
		flavor: androidFlavor,
		appendUserAgent: `Flirtual-Native/${androidVersion}`
	},
	ios: {
		scheme: iosScheme,
		appendUserAgent: `Flirtual-Native/${iosVersion}`
	},
	appendUserAgent: "Flirtual-Native",
	plugins: {
		Flirtual: {
			apiUrl
		},
		SystemBars: {
			insetsHandling: "disable"
		},
		SocialLogin: {
			providers: {
				google: true,
				facebook: false,
				apple: true,
				twitter: false
			}
		}
	}
} satisfies CapacitorConfig;

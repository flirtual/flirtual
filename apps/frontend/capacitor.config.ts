import type { CapacitorConfig } from "@capacitor/cli";
import invariant from "tiny-invariant";

const origin = process.env.VITE_ORIGIN;
invariant(origin, "VITE_ORIGIN is not set");

const frontendUrl = new URL(origin);
const frontendScheme = frontendUrl.protocol.slice(0, -1);

const appId = process.env.VITE_APP_BUNDLE_ID;
invariant(appId, "VITE_APP_BUNDLE_ID is not set");

export default {
	appId,
	appName: "Flirtual",
	webDir: "dist/client",
	server: {
		androidScheme: frontendScheme,
		hostname: frontendUrl.hostname,
		url: frontendUrl.origin,
		cleartext: frontendScheme === "http"
	},
	ios: {
		scheme: "Flirtual"
	},
	appendUserAgent: "Flirtual-Native",
	plugins: {
		Keyboard: {
			resizeOnFullScreen: true
		}
	}
} satisfies CapacitorConfig;

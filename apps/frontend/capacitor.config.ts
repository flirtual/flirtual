import type { CapacitorConfig } from "@capacitor/cli";
import invariant from "tiny-invariant";

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

const apiUrl = process.env.VITE_API_URL;
invariant(apiUrl, "VITE_API_URL is not set");

export default {
	appId,
	appName: "Flirtual",
	server: {
		androidScheme: frontendScheme,
		hostname: frontendUrl.hostname,
		url: frontendUrl.origin,
		cleartext: frontendScheme === "http"
	},
	android: {
		flavor: androidFlavor
	},
	ios: {
		scheme: "Flirtual"
	},
	appendUserAgent: "Flirtual-Native",
	plugins: {
		Flirtual: {
			apiUrl
		}
	}
} satisfies CapacitorConfig;

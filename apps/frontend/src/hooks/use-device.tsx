import type { AppInfo } from "@capacitor/app";
import { App } from "@capacitor/app";
import type { DeviceId, DeviceInfo } from "@capacitor/device";
import { Device } from "@capacitor/device";

import { client, commitId, platformOverride } from "~/const";
import { log as _log } from "~/log";

export type DevicePlatform = "android" | "apple" | "web";

const log = _log.extend("device");

const [
	{
		build,
		version
	},
	{
		platform: nativePlatform,
		operatingSystem,
		webViewVersion,
		androidSDKVersion,
		iOSVersion,
		osVersion,
	},
	{
		identifier: deviceId
	}
] = await Promise.all([
	client
		? App.getInfo().catch(() => ({} as Partial<AppInfo>))
		: {} as AppInfo,
	client
		? Device.getInfo()
		: {} as DeviceInfo,
	client
		? Device.getId()
		: {} as DeviceId,
]);

// const userAgent = userAgentFromString(client ? navigator.userAgent : "");
// const { os, ua } = userAgent;

const platform: DevicePlatform = platformOverride || ({
	android: "android",
	mac: "apple",
	ios: "apple",
	windows: "web",
	unknown: "web"
} as const)[operatingSystem];

const userAgent = client ? navigator.userAgent : "";
const vision = userAgent.includes("Flirtual-Vision");

// const native = ua.includes("Flirtual-Native");
const native = nativePlatform !== "web";

export const device = {
	userAgent,
	platform,
	nativePlatform,
	native,
	vision,
	deviceId,
	operatingSystem,
	versions: {
		commit: commitId,
		build,
		version,
		operatingSystem: osVersion,
		webView: webViewVersion,
		android: androidSDKVersion,
		iOS: iOSVersion,
	}
} as const;

export type Device = typeof device;

if (client)
	log(device);

export function useDevice() {
	return device;
}

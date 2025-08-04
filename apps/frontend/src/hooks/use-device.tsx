import type { AppInfo } from "@capacitor/app";
import { App } from "@capacitor/app";
import type { DeviceInfo } from "@capacitor/device";
import { Device } from "@capacitor/device";

import { client, nativeOverride, platformOverride, server } from "~/const";
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
	id
] = await Promise.all([
	client
		? App.getInfo().catch(() => ({} as Partial<AppInfo>))
		: {} as AppInfo,
	client
		? Device.getInfo()
		: {} as DeviceInfo,
	client
		? Device.getId().then(({ identifier }) => identifier.replaceAll(/-/g, ""))
		: "",
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
const native = nativeOverride || (nativePlatform && nativePlatform !== "web");

const _device = {
	id,
	userAgent,
	platform,
	web: ["unknown", "web"].includes(operatingSystem),
	apple: platformOverride === "apple" || ["ios", "mac"].includes(operatingSystem),
	android: platformOverride === "android" || operatingSystem === "android",
	native,
	vision,
	operatingSystem,
	versions: {
		build,
		version,
		operatingSystem: osVersion,
		webView: webViewVersion,
		android: androidSDKVersion,
		iOS: iOSVersion,
	}
} as const;

const safeKeys = [
	platformOverride && "platform",
	platformOverride && "apple",
	platformOverride && "android",
	platformOverride && "web",
	nativeOverride && "native"
].filter(Boolean);

// export const device = _device;
export const device = server
	? new Proxy(_device, {
		get: (device, property) => {
			if (safeKeys.includes(String(property))) return Reflect.get(device, property);
			throw new Error(`"device.${String(property)}" cannot be accessed on the server, as it relies on the client environment.`);
		}
	})
	: _device;

export type Device = typeof device;

if (client)
	log(device);

// eslint-disable-next-line react-hooks-extra/no-unnecessary-use-prefix
export function useDevice() {
	return device;
}

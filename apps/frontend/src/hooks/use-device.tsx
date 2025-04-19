"use client";

import type { AppInfo } from "@capacitor/app";
import { App } from "@capacitor/app";
import type { DeviceId, DeviceInfo } from "@capacitor/device";
import { Device } from "@capacitor/device";
import { omitBy } from "remeda";

import { client, gitCommitSha, platformOverride } from "~/const";
import { log as _log } from "~/log";

import { usePostpone } from "./use-postpone";

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
		? App.getInfo().catch(() => ({} as AppInfo))
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
		commit: gitCommitSha,
		build,
		version,
		operatingSystem: osVersion,
		webView: webViewVersion,
		android: androidSDKVersion,
		iOS: iOSVersion,
	}
} as const;

export type Device = typeof device;

if (client) {
	log(device);

	Object.assign(document.documentElement.dataset, omitBy({
		vision,
		native,
		platform
	}, (value) => !value));
}

export function useDevice() {
	usePostpone("useDevice()");
	return device;
}

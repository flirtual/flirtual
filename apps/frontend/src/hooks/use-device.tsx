"use client";

import type { AppInfo } from "@capacitor/app";
import { App } from "@capacitor/app";
import type { DeviceId, DeviceInfo } from "@capacitor/device";
import { Device } from "@capacitor/device";
import { userAgentFromString } from "next/server";

import { gitCommitSha, isClient, isServer } from "~/const";

import { usePostpone } from "./use-postpone";

export type DevicePlatform = "android" | "apple" | "web";

const platforms: Record<string, DevicePlatform> = {
	android: "android",
	ios: "apple",
	"mac os": "apple"
};

const [
	{
		platform: nativePlatform,
		operatingSystem,
		webViewVersion,
		androidSDKVersion,
		iOSVersion,
		osVersion,
	},
	{ identifier: deviceId }
] = await Promise.all([
	isClient ? Device.getInfo() : {} as DeviceInfo,
	isClient ? Device.getId() : {} as DeviceId
]);

const {
	build,
	version
} = (isServer || nativePlatform === "web")
	? {} as Partial<AppInfo>
	: await App.getInfo();

const userAgent = userAgentFromString(isClient ? navigator.userAgent : "");
const { os, ua } = userAgent;

const platform: DevicePlatform
		= platforms[os.name?.toLowerCase() ?? ""] || "web";

const vision = ua.includes("Flirtual-Vision");

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

export function useDevice() {
	usePostpone("useDevice()");
	return device;
}

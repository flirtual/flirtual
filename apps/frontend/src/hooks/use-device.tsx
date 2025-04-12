"use client";

import type { DeviceId, DeviceInfo } from "@capacitor/device";
import { Device } from "@capacitor/device";
import { userAgentFromString } from "next/server";
import { use } from "react";

import { gitCommitSha, isServer } from "~/const";

import { usePostpone } from "./use-postpone";

export type DevicePlatform = "android" | "apple" | "web";
export type UserAgent = ReturnType<typeof userAgentFromString>;

export function useUserAgent(): UserAgent {
	usePostpone("useUserAgent()");
	return userAgentFromString(navigator.userAgent);
}

const platforms: Record<string, DevicePlatform> = {
	android: "android",
	ios: "apple",
	"mac os": "apple"
};

const deviceInfoPromise = isServer
	? Promise.resolve({} as unknown as DeviceInfo)
	: Device.getInfo();

const deviceIdPromise = isServer
	? Promise.resolve({} as unknown as DeviceId)
	: Device.getId();

export function useDevice() {
	usePostpone("useDevice()");

	const userAgent = useUserAgent();
	const { os, ua } = userAgent;

	const {
		platform: nativePlatform,
		operatingSystem,
		webViewVersion,
		androidSDKVersion,
		iOSVersion,
		osVersion,
	} = use(deviceInfoPromise);

	const { identifier: deviceId } = use(deviceIdPromise);

	const platform: DevicePlatform
		= platforms[os.name?.toLowerCase() ?? ""] || "web";

	const vision = ua.includes("Flirtual-Vision");

	// const native = ua.includes("Flirtual-Native");
	const native = nativePlatform !== "web";

	return {
		userAgent,
		platform,
		nativePlatform,
		native,
		vision,
		deviceId,
		operatingSystem,
		versions: {
			gitCommit: gitCommitSha,
			operatingSystem: osVersion,
			webView: webViewVersion,
			android: androidSDKVersion,
			iOS: iOSVersion,
		}
	} as const;
}

export type Device = ReturnType<typeof useDevice>;

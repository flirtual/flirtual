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

export async function getDevice() {
	const userAgent = userAgentFromString(navigator.userAgent);
	const { os, ua } = userAgent;

	const {
		platform: nativePlatform,
		operatingSystem,
		webViewVersion,
		androidSDKVersion,
		iOSVersion,
		osVersion,
	} = await deviceInfoPromise;

	const { identifier: deviceId } = await deviceIdPromise;

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

export type Device = ReturnType<typeof getDevice>;

export const devicePromise = isServer
	? Promise.resolve({} as unknown as Device)
	: getDevice();

export function useDevice() {
	usePostpone("useDevice()");
	return use(devicePromise);
}

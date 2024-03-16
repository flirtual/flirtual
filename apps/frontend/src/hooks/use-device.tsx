"use client";

import * as Sentry from "@sentry/nextjs";
import { createContext, useContext, useEffect } from "react";

import type { userAgentFromString } from "next/server";

export type DevicePlatform = "web" | "android" | "apple";
export type UserAgent = ReturnType<typeof userAgentFromString>;

export interface DeviceContext {
	userAgent: UserAgent;
	platform: DevicePlatform;
	native: boolean;
	vision: boolean;
}

const DeviceContext = createContext<DeviceContext>({} as DeviceContext);

export type DeviceProviderProps = React.PropsWithChildren<
	Pick<DeviceContext, "userAgent" | "platform" | "native" | "vision">
>;

export function DeviceProvider({ children, ...value }: DeviceProviderProps) {
	useEffect(() => {
		Sentry.setTag("native", value.native ? "yes" : "no");
		Sentry.setTag("vision", value.vision ? "yes" : "no");
	}, [value.native, value.vision]);

	return (
		<DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
	);
}

export function useDevice() {
	return useContext(DeviceContext);
}

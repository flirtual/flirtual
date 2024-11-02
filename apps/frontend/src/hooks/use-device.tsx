"use client";

import { Slot } from "@radix-ui/react-slot";
import type { userAgentFromString } from "next/server";
import { createContext, forwardRef, useContext, useMemo } from "react";

export type DevicePlatform = "android" | "apple" | "web";
export type UserAgent = ReturnType<typeof userAgentFromString>;

export interface DeviceContext {
	userAgent: UserAgent;
	platform: DevicePlatform;
	native: boolean;
	vision: boolean;
}

const DeviceContext = createContext<DeviceContext>({} as DeviceContext);

export type DeviceProviderProps = React.PropsWithChildren<
	Pick<DeviceContext, "native" | "platform" | "userAgent" | "vision">
>;

export const DeviceProvider = forwardRef<HTMLHtmlElement, DeviceProviderProps>(
	({ children, native, platform, userAgent, vision, ...props }, reference) => {
		return (
			<DeviceContext.Provider
				value={useMemo(() => ({
					native,
					platform,
					userAgent,
					vision
				}), [native, platform, userAgent, vision])}
			>
				<Slot
					{...props}
					data-native={native ? "" : undefined}
					data-platform={platform}
					data-vision={vision ? "" : undefined}
					ref={reference}
				>
					{children}
				</Slot>
			</DeviceContext.Provider>
		);
	}
);

DeviceProvider.displayName = "DeviceProvider";

export function useDevice() {
	return useContext(DeviceContext);
}

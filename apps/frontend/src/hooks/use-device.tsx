"use client";

import { Slot } from "@radix-ui/react-slot";
import type { userAgentFromString } from "next/server";
import type { PropsWithChildren, RefAttributes } from "react";
import { createContext, use, useMemo } from "react";

export type DevicePlatform = "android" | "apple" | "web";
export type UserAgent = ReturnType<typeof userAgentFromString>;

export interface DeviceContext {
	userAgent: UserAgent;
	platform: DevicePlatform;
	native: boolean;
	vision: boolean;
}

const DeviceContext = createContext<DeviceContext>({} as DeviceContext);

export interface DeviceProviderProps extends PropsWithChildren, RefAttributes<HTMLHtmlElement>, Pick<DeviceContext, "native" | "platform" | "userAgent" | "vision"> {}

export function DeviceProvider({ children, native, platform, userAgent, vision, ...props }: DeviceProviderProps) {
	return (
		<DeviceContext
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
			>
				{children}
			</Slot>
		</DeviceContext>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDevice() {
	return use(DeviceContext);
}

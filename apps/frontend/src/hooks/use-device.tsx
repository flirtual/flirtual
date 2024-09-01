"use client";

import * as Sentry from "@sentry/nextjs";
import { createContext, forwardRef, useContext } from "react";
import { Slot } from "@radix-ui/react-slot";

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

export const DeviceProvider = forwardRef<HTMLHtmlElement, DeviceProviderProps>(
	({ children, native, platform, userAgent, vision, ...props }, ref) => {
		Sentry.setTag("native", native ? "yes" : "no");
		Sentry.setTag("vision", vision ? "yes" : "no");

		return (
			<DeviceContext.Provider
				value={{
					native,
					platform,
					userAgent,
					vision
				}}
			>
				<Slot
					{...props}
					ref={ref}
					data-platform={platform}
					data-native={native ? "" : undefined}
					data-vision={vision ? "" : undefined}
				>
					{children}
				</Slot>
			</DeviceContext.Provider>
		);
	}
);

export function useDevice() {
	return useContext(DeviceContext);
}

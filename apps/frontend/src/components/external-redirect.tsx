"use client";

import { App } from "@capacitor/app";
import { type FC, useEffect } from "react";

import { urls } from "~/urls";

export const ExternalRedirect: FC<{ url: string }> = ({ url }) => {
	useEffect(() => {
		window.location.assign(url);

		const handleAppStateChange = (state: { isActive: boolean }) => {
			if (state.isActive) window.location.assign(urls.default);
		};
		void App.addListener("appStateChange", handleAppStateChange);
		return () => {
			void App.removeAllListeners();
		};
	}, [url]);

	return null;
};

"use client";

import Script from "next/script";
import { useEffect } from "react";

import { PreferenceThemes } from "~/api/user/preferences";
import { uploadcarePublicKey } from "~/const";
import { useTheme } from "~/hooks/use-theme";

declare global {
	interface Window {
		Blinkloader: {
			optimize: (options: unknown) => void;
		};
		fwSettings: Record<string, unknown>;
		FreshworksWidget: (...args: Array<unknown>) => void;
	}
}

export const ClientScripts: React.FC = () => {
	const { theme } = useTheme();

	useEffect(() => {
		if ("serviceWorker" in navigator) {
			window.addEventListener("load", function () {
				void navigator.serviceWorker.register("/sw.js");
			});
		}

		/* eslint-disable */
		// @ts-expect-error
		!function(){if("function"!=typeof window.FreshworksWidget){var n=function(){n.q.push(arguments)};n.q=[],window.FreshworksWidget=n}}() 
		/* eslint-enable */

		window.fwSettings = { widget_id: 73000002566 };
		window.FreshworksWidget("hide", "launcher");
	}, []);

	useEffect(() => {
		document.documentElement.classList.remove(...PreferenceThemes);
		document.documentElement.classList.add(theme);
	}, [theme]);

	return (
		<>
			{/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
			<Script
				src="https://media.flirtu.al/libs/blinkloader/3.x/blinkloader.min.js"
				onReady={() => {
					window.Blinkloader.optimize({
						pubkey: uploadcarePublicKey,
						cdnBase: "https://media.flirtu.al",
						lazyload: false,
						smartCompression: true,
						retina: true,
						webp: true,
						responsive: true,
						fadeIn: true
					});
				}}
			/>
			<Script src="https://widget.freshworks.com/widgets/73000002566.js" strategy="lazyOnload" />
		</>
	);
};

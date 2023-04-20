"use client";

import { usePathname, useSearchParams } from "next/navigation";
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
	}, []);

	const searchParams = useSearchParams();
	const pathname = usePathname();

	const kind = searchParams.get("kind");

	useEffect(() => {
		if (pathname === "/browse" && kind === "friend")
			document.documentElement.classList.add("friend-mode");
		return () => document.documentElement.classList.remove("friend-mode");
	}, [kind, pathname]);

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
		</>
	);
};

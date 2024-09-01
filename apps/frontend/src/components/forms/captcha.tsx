"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { forwardRef, useState } from "react";

import { turnstileSiteKey } from "~/const";
import { useTheme } from "~/hooks/use-theme";

export type FormCaptchaReference = TurnstileInstance;

let warned = false;

export const FormCaptcha = forwardRef<TurnstileInstance, unknown>(
	(props, reference) => {
		const { theme } = useTheme();
		const [isInteractive, setIsInteractive] = useState(false);

		if (!turnstileSiteKey) {
			if (!warned) {
				console.error(
					"Turnstile was not properly configured. If this is unintentional, set the NEXT_PUBLIC_TURNSTILE_SITE_KEY environment variable."
				);
				warned = true;
			}

			return null;
		}

		return (
			<Turnstile
				className={isInteractive ? "mx-auto" : "-mt-8"}
				ref={reference}
				siteKey={turnstileSiteKey}
				options={{
					theme: theme,
					appearance: "interaction-only"
				}}
				onBeforeInteractive={() => {
					setIsInteractive(true);
				}}
			/>
		);
	}
);

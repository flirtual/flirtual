"use client";

import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { forwardRef, useState } from "react";

import { turnstileSiteKey } from "~/const";

export type FormCaptchaReference = TurnstileInstance;

export const FormCaptcha = forwardRef<TurnstileInstance, unknown>(
	(props, reference) => {
		const [isInteractive, setIsInteractive] = useState(false);

		return (
			<Turnstile
				className={isInteractive ? "mx-auto" : "-mt-8"}
				ref={reference}
				siteKey={turnstileSiteKey}
				options={{
					theme: "light",
					appearance: "interaction-only"
				}}
				onBeforeInteractive={() => {
					setIsInteractive(true);
				}}
			/>
		);
	}
);

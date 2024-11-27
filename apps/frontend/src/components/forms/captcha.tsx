"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { RefAttributes } from "react";
import { forwardRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import { turnstileSiteKey } from "~/const";
import { warnOnce } from "~/hooks/use-log";
import { useTheme } from "~/hooks/use-theme";

export type FormCaptchaReference = TurnstileInstance;

export function FormCaptcha({ ref }: RefAttributes<TurnstileInstance>) {
	const { theme } = useTheme();
	const [error, setError] = useState<string | null>(null);

	const [success, setSuccess] = useState<boolean>(false);

	if (!turnstileSiteKey) {
		warnOnce("Turnstile was not properly configured. If this is unintentional, set the \"NEXT_PUBLIC_TURNSTILE_SITE_KEY\" environment variable.");
		return null;
	}

	return (
		<div className="relative mx-auto flex h-[64px] w-[300px] items-center justify-center overflow-hidden rounded-xl border border-[#e0e0e0] bg-[#fafafa] text-[#232323] shadow-sm dark:border-[#797979]/5 dark:bg-[#232323] dark:text-white-10">
			<div className="flex items-center gap-2 text-sm">
				{success
					? (
							<div className="motion-preset-fade flex items-center gap-2 text-sm">
								<ShieldCheck className="size-4" />
								<span>
									Device verified.
								</span>
							</div>
						)
					: error
						? (
								<button
									className="motion-preset-fade flex items-center gap-2 text-left"
									type="button"
									onClick={() => {
										setError(null);
										setSuccess(false);

										if (ref && "current" in ref) ref.current?.reset();
									}}
								>
									<ShieldAlert className="size-4" />
									<span>
										{{
											110500: "Unsupported device."
										}[error] || "Couldn't verify your device."}
										{" "}
										<span className="text-xs opacity-80">
											{error}
										</span>
									</span>

								</button>
							)
						: (
								<>
									<span>
										Checking your device...
									</span>
									<LoaderCircle className="size-4 animate-spin" />
								</>
							)}
			</div>
			<Turnstile
				options={{
					theme,
					size: "normal",
					appearance: "interaction-only",
					retryInterval: 500
				}}
				className={twMerge("absolute -inset-px", success && "pointer-events-none opacity-0")}
				ref={ref}
				siteKey={turnstileSiteKey}
				onBeforeInteractive={() => {
					setError(null);
					setSuccess(false);
				}}
				onError={(reason) => {
					setError(reason);
					setSuccess(false);
				}}
				onSuccess={() => {
					setError(null);
					setSuccess(true);
				}}
			/>
		</div>
	);
}

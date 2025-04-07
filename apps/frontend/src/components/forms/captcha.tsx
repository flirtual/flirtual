"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { RefAttributes } from "react";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

import { turnstileSiteKey } from "~/const";
import { useInternationalization, useTranslations } from "~/hooks/use-internationalization";
import { useTheme } from "~/hooks/use-theme";

export type FormCaptchaReference = TurnstileInstance;

interface FormCaptchaProps extends RefAttributes<TurnstileInstance> {
	tabIndex?: number;
}

export function FormCaptcha({ ref, tabIndex }: FormCaptchaProps) {
	const { locale: { current: language } } = useInternationalization();
	const t = useTranslations();

	const { theme } = useTheme();
	const [error, setError] = useState<string | null>(null);

	const [success, setSuccess] = useState<boolean>(false);

	return (
		<div className="relative mx-auto flex h-[64px] w-[300px] items-center justify-center overflow-hidden rounded-xl border border-[#e0e0e0] bg-[#fafafa] text-[#232323] shadow-sm transition-all dark:border-[#797979]/5 dark:bg-[#232323] dark:text-white-10">
			<div className="flex items-center gap-2 text-sm">
				{success
					? (
							<div className="motion-preset-fade flex items-center gap-2 text-sm">
								<ShieldCheck className="size-4" />
								<span>
									{t("home_wild_marten_wave")}
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
										{t("jolly_this_crow_hug")}
									</span>
									<LoaderCircle className="size-4 animate-spin" />
								</>
							)}
			</div>
			<Turnstile
				options={useMemo(() => ({
					theme,
					tabIndex,
					language,
					size: "normal",
					appearance: "interaction-only",
					retryInterval: 500
				}), [language, tabIndex, theme])}
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

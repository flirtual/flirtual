import type { TurnstileInstance, TurnstileProps } from "@marsidev/react-turnstile";
import {
	Turnstile as _Turnstile
} from "@marsidev/react-turnstile";
import { LoaderCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { FC, RefAttributes } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";
import { withSuspense } from "with-suspense";

import { turnstileSiteKey } from "~/const";
import { useFormContext } from "~/hooks/use-input-form";
import { useTheme } from "~/hooks/use-theme";
import { useLocale } from "~/i18n";

import { FormInputMessages } from "./input-messages";

export type FormCaptchaReference = TurnstileInstance;

interface FormCaptchaProps extends RefAttributes<TurnstileInstance> {
	tabIndex?: number;
}

export function FormCaptcha({ ref, tabIndex }: FormCaptchaProps) {
	const { t } = useTranslation();

	const [error, setError] = useState<string | null>(null);

	const [success, setSuccess] = useState<boolean>(false);
	const { fields, setFieldErrors } = useFormContext();

	return (
		<div className="flex flex-col gap-2">
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
												110500: t("elegant_actual_ray_buzz")
											}[error] || t("major_vivid_beetle_support")}
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
					className={twMerge("absolute -inset-px", success && "pointer-events-none opacity-0")}
					ref={ref}
					tabIndex={tabIndex}
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
						setFieldErrors((previous) => ({ ...previous, captcha: [] }));
					}}
				/>
			</div>
			<FormInputMessages
				className="mx-auto w-fit text-center"
				messages={fields.captcha?.errors.map((value) => ({ type: "error", value }))}
			/>
		</div>
	);
}

const Turnstile: FC<{ tabIndex?: number } & Omit<TurnstileProps, "options" | "siteKey"> & RefAttributes<TurnstileInstance>> = withSuspense(({ tabIndex, ...props }) => {
	const [locale] = useLocale();
	const [theme] = useTheme();

	return (
		<_Turnstile
			{...props}
			options={useMemo(() => ({
				theme,
				tabIndex,
				language: locale,
				size: "normal",
				appearance: "interaction-only",
				retryInterval: 500
			}), [locale, tabIndex, theme])}
			siteKey={turnstileSiteKey}
		/>
	);
});

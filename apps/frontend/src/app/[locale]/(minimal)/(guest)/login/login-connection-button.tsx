import { SocialLogin } from "@capgo/capacitor-social-login";
import { InAppBrowser, ToolBarType } from "@capgo/inappbrowser";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Authentication } from "~/api/auth";
import { isWretchError } from "~/api/common";
import {
	Connection,
	ConnectionMetadata

} from "~/api/connections";
import type { ConnectionType } from "~/api/connections";
import { Button } from "~/components/button";
import { device, useDevice } from "~/hooks/use-device";
import { useTheme } from "~/hooks/use-theme";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { invalidate, mutate, sessionKey } from "~/query";
import { toAbsoluteUrl, toRelativeUrl } from "~/urls";

import { next as getNextUrl } from "./form";

export interface LoginConnectionButtonProps {
	type: ConnectionType;
	tabIndex?: number;
	next?: string;
	className?: string;
	// Return false to block the action, i.e. when the service agreement is unchecked.
	guard?: () => boolean;
}

const label = {
	google: "Google",
	apple: "Apple",
	meta: "Meta",
	discord: "Discord",
	vrchat: "VRChat"
};

type NativeSocialProvider = "apple" | "google";
const nativeSocialProviders: Array<NativeSocialProvider> = ["apple", "google"];

function isNativeSocialProvider(type: ConnectionType): type is NativeSocialProvider {
	return nativeSocialProviders.includes(type as NativeSocialProvider);
}

export const LoginConnectionButton: FC<LoginConnectionButtonProps> = ({
	type,
	tabIndex,
	next = "/",
	className,
	guard
}) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const toasts = useToast();
	const { id: deviceId } = useDevice();
	const [isLoading, setIsLoading] = useState(false);

	const { Icon, color, logoColor, darkColor, darkLogoColor } = ConnectionMetadata[type];
	const [theme] = useTheme();
	const backgroundColor = theme === "dark" ? darkColor ?? color : color;
	const iconColor = theme === "dark" ? darkLogoColor ?? logoColor : logoColor;

	const handleNativeSocialLogin = async () => {
		if (!isNativeSocialProvider(type)) {
			return handleOAuthLogin();
		}

		setIsLoading(true);

		try {
			const result = await SocialLogin.login({
				provider: type,
				options: {
					scopes: type === "apple" ? ["email"] : ["email", "profile"]
				}
			});

			if (!result || !result.result) {
				return;
			}

			const { result: loginResult } = result;

			let idToken: string | undefined;
			let authorizationCode: string | undefined;

			if (type === "apple" && "idToken" in loginResult) {
				idToken = loginResult.idToken ?? undefined;
				authorizationCode = "authorizationCode" in loginResult ? (loginResult.authorizationCode ?? undefined) : undefined;
			}
			else if (type === "google" && "idToken" in loginResult) {
				idToken = loginResult.idToken ?? undefined;
			}

			if (!idToken) {
				toasts.add({ type: "error", value: t("errors.internal_server_error" as any) });
				return;
			}

			const response = await Authentication.socialLogin({
				provider: type,
				idToken,
				authorizationCode,
				deviceId
			});

			if ("error" in response) {
				toasts.add({ type: "error", value: t(`errors.${response.error}` as any) });
				return;
			}

			if ("status" in response) {
				return;
			}

			await invalidate({ refetchType: "none" });
			await mutate(sessionKey(), response);
			navigate(getNextUrl());
		}
		catch (reason) {
			console.error("Social login error:", reason);

			if (reason instanceof Error) {
				const message = reason.message.toLowerCase();
				if (message.includes("cancel") || message.includes("abort")) {
					return;
				}
			}

			if (isWretchError(reason)) {
				toasts.add({ type: "error", value: t(`errors.${reason.json?.error}` as any) });
				return;
			}

			toasts.add({ type: "error", value: t("errors.internal_server_error" as any) });
		}
		finally {
			setIsLoading(false);
		}
	};

	const handleOAuthLogin = async () => {
		if (!device.native) {
			location.href = Connection.authorizeUrl({
				type,
				prompt: "consent",
				next: toAbsoluteUrl(next).href
			});

			return;
		}

		const { authorizeUrl } = await Connection.authorize({
			type,
			prompt: "consent",
			next: toAbsoluteUrl(next).href
		});

		await InAppBrowser.addListener("urlChangeEvent", async (event) => {
			const url = new URL(event.url);

			const query: any = Object.fromEntries(url.searchParams.entries());

			if ("error" in query) {
				await InAppBrowser.removeAllListeners();
				await InAppBrowser.close();
			}
			if ("code" in query) {
				setTimeout(async () => {
					const response = await Connection.grant({
						...query,
						redirect: "manual"
					});

					await invalidate({ queryKey: sessionKey() });

					const next = response.headers.get("location");
					if (next) navigate(toRelativeUrl(new URL(next)));

					await InAppBrowser.removeAllListeners();
					await InAppBrowser.close();
				}, 1000);
			}
		});

		await InAppBrowser.openWebView({
			url: authorizeUrl,
			toolbarType: ToolBarType.BLANK
		});
	};

	const handleClick = async () => {
		if (guard && !guard()) return;

		if (device.native && isNativeSocialProvider(type)) {
			await handleNativeSocialLogin();
		}
		else {
			await handleOAuthLogin();
		}
	};

	return (
		<Button
			className={twMerge("gap-4 bg-none", className)}
			disabled={isLoading}
			size="sm"
			style={{ backgroundColor, color: iconColor }}
			tabIndex={tabIndex}
			onClick={handleClick}
		>
			<Icon className="size-6" />
			<span className="font-montserrat text-lg font-semibold">
				{t("continue_with", { type: label[type] })}
			</span>
		</Button>
	);
};

export type ConnectionItemProps = Connection;

export const ConnectionItem: FC<ConnectionItemProps> = ({
	type,
	displayName
}) => {
	return (
		<div className="flex grow basis-64 flex-col gap-2 bg-white-30 p-4">
			<span className="text-sm font-semibold">{label[type]}</span>
			<div className="flex items-center gap-2">
				<span className="text-lg leading-4">{displayName}</span>
			</div>
		</div>
	);
};

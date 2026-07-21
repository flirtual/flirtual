import { SocialLogin } from "@capgo/capacitor-social-login";
import { X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { twMerge } from "tailwind-merge";

import { Authentication } from "~/api/auth";
import { isWretchError } from "~/api/common";
import {
	Connection,
	ConnectionMetadata
} from "~/api/connections";
import type { ConnectionType } from "~/api/connections";
import { device, useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";
import { useTheme } from "~/hooks/use-theme";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { authorizeAndGrant } from "~/oauth";
import { invalidate, sessionKey } from "~/query";
import { toRelativeUrl } from "~/urls";

type NativeSocialProvider = "apple" | "google";
const nativeSocialProviders: Array<NativeSocialProvider> = ["apple", "google"];

function isNativeSocialProvider(type: ConnectionType): type is NativeSocialProvider {
	return nativeSocialProviders.includes(type as NativeSocialProvider);
}

export interface ConnectionButtonProps {
	type: ConnectionType;
}

export const AddConnectionButton: React.FC<ConnectionButtonProps> = (props) => {
	const { type } = props;
	const { Icon, color, logoColor, darkColor, darkLogoColor } = ConnectionMetadata[type];
	const [theme] = useTheme();
	const backgroundColor = theme === "dark" ? darkColor ?? color : color;
	const iconColor = theme === "dark" ? darkLogoColor ?? logoColor : logoColor;
	const location = useLocation();
	const session = useOptionalSession();
	const navigate = useNavigate();
	const toasts = useToast();
	const { native, id: deviceId } = useDevice();
	const { t } = useTranslation();

	const connection = useMemo(() => {
		return session
			? session.user.connections?.find((connection) => connection.type === type)
			: null;
	}, [session, type]);

	const handleNativeSocialLink = async () => {
		if (!isNativeSocialProvider(type)) return;

		try {
			const result = await SocialLogin.login({
				provider: type,
				options: type === "apple" ? { scopes: ["email"] } : {}
			});

			if (!result || !result.result) return;

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

			if ("status" in response && response.status === "linked") {
				toasts.add(t("linked_connection"));
			}

			await invalidate({ queryKey: sessionKey() });
		}
		catch (reason) {
			console.error("Social link error:", reason);

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
	};

	const handleOAuthLink = async () => {
		const url = new URL(`${location.pathname}`, window.location.origin);

		if (!native) {
			return navigate(
				Connection.authorizeUrl({
					type,
					prompt: "consent",
					next: url.href
				})
			);
		}

		const nextLocation = await authorizeAndGrant(type, url.href);
		if (!nextLocation) return;

		navigate(toRelativeUrl(new URL(nextLocation)));
		await invalidate({ queryKey: sessionKey() });
	};

	const handleClick = async () => {
		if (connection) return;

		if (device.native && isNativeSocialProvider(type)) {
			await handleNativeSocialLink();
		}
		else {
			await handleOAuthLink();
		}
	};

	if (!session) return null;

	return (
		<div
			className={twMerge(
				"relative isolate flex h-11 w-full overflow-hidden rounded-xl bg-white-40 text-left shadow-brand-1 focus-within:ring-2 focus-within:ring-coral focus-within:ring-offset-2 focus:outline-none dark:bg-black-60 dark:text-white-20 focus-within:dark:ring-offset-black-50",
				!connection && "cursor-pointer"
			)}
		>
			<button
				className={twMerge(
					"flex aspect-square h-full shrink-0 items-center justify-center p-2 text-white-20 before:absolute before:inset-0",
					connection && "cursor-default"
				)}
				style={{ backgroundColor, color: iconColor }}
				type="button"
				onClick={handleClick}
			>
				<Icon className="size-6" />
			</button>
			<div className="pointer-events-none flex flex-col overflow-hidden whitespace-nowrap px-4 py-2 font-nunito leading-none vision:text-black-80">
				<span className="text-sm leading-none opacity-75">{t(type)}</span>
				<span
					className={twMerge(
						"overflow-x-clip text-ellipsis",
						connection && "pointer-events-auto z-10"
					)}
					title={connection?.displayName}
				>
					{connection?.displayName ?? t("connect_account")}
				</span>
			</div>
			{connection && (
				<button
					className="z-10 ml-auto mr-3 shrink-0 cursor-pointer self-center opacity-50 hover:text-red-400 hover:opacity-100 vision:text-black-80"
					type="button"
					onClick={async () => {
						await Connection.delete(type)
							.then(() => toasts.add(t("removed_connection")))
							.catch(toasts.addError);

						await invalidate({ queryKey: sessionKey() });
					}}
				>
					<X className="size-5" />
				</button>
			)}
		</div>
	);
};

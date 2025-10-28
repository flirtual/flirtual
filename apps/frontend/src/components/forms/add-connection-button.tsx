import { InAppBrowser, ToolBarType } from "@capgo/inappbrowser";
import { X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { twMerge } from "tailwind-merge";

import {
	Connection,
	ConnectionMetadata

} from "~/api/connections";
import type { ConnectionType } from "~/api/connections";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { useNavigate } from "~/i18n";
import { invalidate, sessionKey } from "~/query";
import { toRelativeUrl } from "~/urls";

export interface ConnectionButtonProps {
	type: ConnectionType;
}

export const AddConnectionButton: React.FC<ConnectionButtonProps> = (props) => {
	const { type } = props;
	const { Icon, iconClassName, color } = ConnectionMetadata[type];
	const location = useLocation();
	const session = useOptionalSession();
	const navigate = useNavigate();
	const toasts = useToast();
	const { native } = useDevice();
	const { t } = useTranslation();

	const connection = useMemo(() => {
		return session
			? session.user.connections?.find((connection) => connection.type === type)
			: null;
	}, [session, type]);

	if (!session) return null;

	return (
		<div
			className={twMerge(
				"relative isolate flex h-11 w-full overflow-hidden rounded-xl bg-white-40 text-left shadow-brand-1 focus-within:ring-2 focus-within:ring-coral focus-within:ring-offset-2 focus:outline-none dark:bg-black-60 dark:text-white-20 focus-within:dark:ring-offset-black-50",
				!connection && "cursor-pointer"
			)}
		>
			<button
				className="flex aspect-square h-full items-center justify-center p-2 text-white-20 before:absolute before:inset-0"
				style={{ backgroundColor: color }}
				type="button"
				onClick={async () => {
					if (connection) return;

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

					const { authorizeUrl } = await Connection.authorize({
						type,
						prompt: "consent",
						next: url.href
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

								const next = response.headers.get("location");
								if (next) navigate(toRelativeUrl(new URL(next)));

								await invalidate({ queryKey: sessionKey() });

								await InAppBrowser.removeAllListeners();
								await InAppBrowser.close();
							}, 1000);
						}
					});

					await InAppBrowser.openWebView({
						url: authorizeUrl,
						toolbarType: ToolBarType.BLANK
					});
				}}
			>
				<Icon className={twMerge("size-6", iconClassName)} />
			</button>
			<div className="pointer-events-none flex flex-col overflow-hidden whitespace-nowrap px-4 py-2 font-nunito leading-none vision:text-black-80">
				<span className="text-sm leading-none opacity-75">{t(type)}</span>
				<span data-mask>{connection?.displayName ?? t("connect_account")}</span>
			</div>
			{connection && (
				<button
					className="z-10 ml-auto mr-3 cursor-pointer self-center opacity-50 hover:text-red-400 hover:opacity-100 vision:text-black-80"
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

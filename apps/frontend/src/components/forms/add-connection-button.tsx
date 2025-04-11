"use client";

import { InAppBrowser, ToolBarType } from "@capgo/inappbrowser";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

import {
	Connection,
	ConnectionMetadata,
	type ConnectionType
} from "~/api/connections";
import { useDevice } from "~/hooks/use-device";
import { useLocation } from "~/hooks/use-location";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export interface ConnectionButtonProps {
	type: ConnectionType;
}

export const AddConnectionButton: React.FC<ConnectionButtonProps> = (props) => {
	const { type } = props;
	const { Icon, iconClassName, color } = ConnectionMetadata[type];
	const location = useLocation();
	const [session] = useSession();
	const router = useRouter();
	const toasts = useToast();
	const { native } = useDevice();
	const t = useTranslations();

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

					const url = new URL(location.href);
					url.search = "";

					if (!native) {
						return router.push(
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
								if (next) router.push(next);

								router.refresh();

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
							.then(() => {
								toasts.add(t("removed_connection"));
								return router.refresh();
							})
							.catch(toasts.addError);
					}}
				>
					<X className="size-5" />
				</button>
			)}
		</div>
	);
};

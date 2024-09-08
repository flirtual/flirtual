"use client";

import { InAppBrowser } from "@capgo/inappbrowser";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
	const { Icon, iconClassName, label, color } = ConnectionMetadata[type];
	const location = useLocation();
	const [session] = useSession();
	const router = useRouter();
	const toasts = useToast();
	const { platform, native } = useDevice();

	const connection = useMemo(() => {
		return session
			? session.user.connections?.find((connection) => connection.type === type)
			: null;
	}, [session, type]);

	const [text, setText] = useState("");

	useMemo(() => {
		setText(connection?.displayName ?? "Connect account");
	}, [connection]);

	if (!session) return null;

	return (
		<div className="col-span-2 flex flex-col gap-4 wide:col-span-1">
			<div
				className={twMerge(
					"flex w-full overflow-hidden rounded-xl bg-white-40 text-left shadow-brand-1 focus-within:ring-2 focus-within:ring-coral focus-within:ring-offset-2 focus:outline-none dark:bg-black-60 dark:text-white-20 focus-within:dark:ring-offset-black-50",
					!connection && "cursor-pointer"
				)}
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

					if (platform === "android") {
						toasts.add(
							"Sorry, Discord connection is currently only available on our website."
						);
						return;
					}

					const { authorizeUrl, state } = await Connection.authorize({
						type,
						prompt: "consent",
						next: url.href
					});

					await InAppBrowser.addListener("urlChangeEvent", async (event) => {
						const url = new URL(event.url);
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const query: any = Object.fromEntries(url.searchParams.entries());

						if ("code" in query && "state" in query) {
							if (query.state !== state) {
								await InAppBrowser.removeAllListeners();
								await InAppBrowser.close();

								return;
							}

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

					await InAppBrowser.open({ url: authorizeUrl });
				}}
			>
				<div
					className="flex aspect-square size-12 items-center justify-center p-2 text-white-20"
					style={{ backgroundColor: color }}
				>
					<Icon className={twMerge("size-7", iconClassName)} />
				</div>
				<div className="flex flex-col overflow-hidden whitespace-nowrap px-4 py-2 font-nunito leading-none vision:text-black-80">
					{label}
					<span className="text-sm leading-none text-black-60 dark:text-white-40">
						{text}
					</span>
				</div>
				{connection && (
					<div
						className="ml-auto cursor-pointer self-center p-3 text-black-30 hover:text-red-600"
						onClick={async () => {
							await Connection.delete(type)
								.then(() => {
									toasts.add("Removed connection");
									return router.refresh();
								})
								.catch(toasts.addError);
						}}
					>
						<Trash2 />
					</div>
				)}
			</div>
		</div>
	);
};

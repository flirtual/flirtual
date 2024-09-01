"use client";

import { twMerge } from "tailwind-merge";
import { InAppBrowser } from "@capgo/inappbrowser";
import { useRouter } from "next/navigation";

import { api } from "~/api";
import {
	type Connection,
	ConnectionMetadata,
	type ConnectionType
} from "~/api/connections";
import { useLocation } from "~/hooks/use-location";
import { useDevice } from "~/hooks/use-device";

import type { FC } from "react";

export interface AddConnectionButtonProps {
	type: ConnectionType;
}

const label = {
	google: "Google",
	apple: "Apple",
	meta: "Meta",
	discord: "Discord",
	vrchat: "VRChat"
};

export const LoginConnectionButton: FC<AddConnectionButtonProps> = ({
	type
}) => {
	const location = useLocation();
	const router = useRouter();
	const { native } = useDevice();
	const { Icon, iconClassName, color } = ConnectionMetadata[type];

	return (
		<button
			className="flex items-center justify-center gap-4 rounded-lg px-4 py-2 text-white-20 shadow-brand-1"
			style={{ backgroundColor: color }}
			type="button"
			onClick={async () => {
				const url = new URL(location.href);
				url.search = "";

				if (!native)
					return router.push(
						api.connections.authorizeUrl(
							type,
							"none",
							url.href
						).href
					);

				const { authorizeUrl, state } = await api.connections.authorize(
					type,
					"none",
					url.href
				);

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
							const response = await api.connections.grant({
								query,
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
			<Icon className={twMerge("size-6", iconClassName)} />
			<span className="font-montserrat text-lg font-semibold">
				Log in with {label[type]}
			</span>
		</button>
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

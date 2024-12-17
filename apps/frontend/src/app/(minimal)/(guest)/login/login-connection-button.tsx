"use client";

import { InAppBrowser, ToolBarType } from "@capgo/inappbrowser";
import { useRouter } from "next/navigation";
import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import {
	Connection,
	ConnectionMetadata,
	type ConnectionType
} from "~/api/connections";
import { Button, ButtonLink } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { useLocation } from "~/hooks/use-location";

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
	location.search = "";

	const router = useRouter();
	const { native } = useDevice();

	const { Icon, iconClassName, color } = ConnectionMetadata[type];

	const Component = native ? Button : ButtonLink;
	const href = Connection.authorizeUrl({
		type,
		prompt: "consent",
		next: location.href
	});

	return (
		<Component
			className="gap-4 bg-none"
			href={href}
			size="sm"
			style={{ backgroundColor: color }}
			target="_self"
			onClick={async () => {
				if (!native) return;

				const { authorizeUrl } = await Connection.authorize({
					type,
					prompt: "consent",
					next: location.href
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
			<span className="font-montserrat text-lg font-semibold">
				Log in with
				{" "}
				{label[type]}
			</span>
		</Component>
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
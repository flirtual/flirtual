"use client";

import Link from "next/link";
import { FC } from "react";
import { twMerge } from "tailwind-merge";
import { Browser } from "@capacitor/browser";

import { api } from "~/api";
import {
	Connection,
	ConnectionMetadata,
	ConnectionType
} from "~/api/connections";
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
	const { Icon, iconClassName, color } = ConnectionMetadata[type];

	return (
		<button
			className="flex items-center justify-center gap-4 rounded-lg px-4 py-2 text-white-20 shadow-brand-1"
			style={{ backgroundColor: color }}
			type="button"
			onClick={async () =>
				await Browser.open({
					url: api.connections.authorizeUrl(type, location.href.split("?")[0])
						.href,
					windowName: "_self"
				})
			}
		>
			<Icon className={twMerge("h-6 w-6", iconClassName)} />
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

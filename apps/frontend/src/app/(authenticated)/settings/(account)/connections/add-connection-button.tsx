"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

import { api } from "~/api";
import { ConnectionMetadata, ConnectionType } from "~/api/connections";
import { useLocation } from "~/hooks/use-location";
import { useSession } from "~/hooks/use-session";

export interface ConnectionButtonProps {
	type: ConnectionType;
}

export const AddConnectionButton: React.FC<ConnectionButtonProps> = (props) => {
	const { type } = props;
	const { Icon, iconClassName, label, color } = ConnectionMetadata[type];
	const location = useLocation();
	const [session] = useSession();

	const connection = useMemo(() => {
		return session
			? session.user.connections?.find((connection) => connection.type === type)
			: null;
	}, [session, type]);

	const [text, setText] = useState(
		connection?.displayName ?? "Connect account"
	);

	if (!session) return null;

	return (
		<div className="flex flex-col gap-4">
			<Link
				className="flex w-full cursor-pointer overflow-hidden rounded-xl bg-white-40 text-left shadow-brand-1 focus-within:ring-2 focus-within:ring-coral focus-within:ring-offset-2 focus:outline-none dark:bg-black-60 dark:text-white-20 focus-within:dark:ring-offset-black-50"
				href={
					connection
						? api.connections.deleteUrl(type, location.href.split("?")[0])
						: api.connections.authorizeUrl(type, location.href.split("?")[0])
				}
				onMouseEnter={() => {
					if (connection) setText("Disconnect account");
				}}
				onMouseLeave={() =>
					setText(connection?.displayName ?? "Connect account")
				}
			>
				<div
					className="flex aspect-square h-12 w-12 items-center justify-center p-2 text-white-20"
					style={{ backgroundColor: color }}
				>
					<Icon className={twMerge("h-7 w-7", iconClassName)} />
				</div>
				<div className="flex flex-col px-4 py-2 font-nunito leading-none">
					{label}
					<span className="text-sm leading-none text-black-60 dark:text-white-40">
						{text}
					</span>
				</div>
			</Link>
		</div>
	);
};

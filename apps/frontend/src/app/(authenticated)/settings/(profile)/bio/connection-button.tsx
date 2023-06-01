"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { FC } from "react";

import { api } from "~/api";
import { Connection, ConnectionType } from "~/api/connections";
import { useLocation } from "~/hooks/use-location";

export interface AddConnectionButtonProps {
	type: ConnectionType;
}

const label = {
	discord: "Discord",
	vrchat: "VRChat"
};

export const AddConnectionButton: FC<AddConnectionButtonProps> = ({ type }) => {
	const location = useLocation();

	return (
		<a
			className="flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-white-20"
			href={api.connections.authorizeUrl(type, location.href).href}
		>
			<span className="font-montserrat text-lg font-semibold">{label[type]}</span>
			<PlusIcon className="h-5 w-5" strokeWidth={3} />
		</a>
	);
};

export type ConnectionItemProps = Connection;

export const ConnectionItem: FC<ConnectionItemProps> = ({ type, displayName }) => {
	return (
		<div className="flex grow basis-64 flex-col gap-2 bg-white-30 p-4">
			<span className="text-sm font-semibold">{label[type]}</span>
			<div className="flex items-center gap-2">
				<span className="text-lg leading-4">{displayName}</span>
			</div>
		</div>
	);
};

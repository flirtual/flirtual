import {
	AppleIcon,
	DiscordIcon,
	MetaIcon,
	GoogleIcon,
	VRChatIcon,
	IconComponent
} from "~/components/icons";

import { UpdatedAtModel } from "./common";
import { NarrowFetchOptions, fetch, newUrl } from "./exports";

export const ConnectionType = [
	"google",
	"apple",
	"meta",
	"discord",
	"vrchat"
] as const;
export type ConnectionType = (typeof ConnectionType)[number];

export const ConnectionMetadata: Record<
	ConnectionType,
	{ Icon: IconComponent; iconClassName?: string; label: string; color: string }
> = {
	google: {
		Icon: GoogleIcon,
		label: "Google",
		color: "#dd4b39"
	},
	apple: {
		Icon: AppleIcon,
		label: "Apple",
		color: "#000000"
	},
	meta: {
		Icon: MetaIcon,
		label: "Meta",
		color: "#0082fb"
	},
	discord: {
		Icon: DiscordIcon,
		label: "Discord",
		color: "#5865f2"
	},
	vrchat: {
		Icon: VRChatIcon,
		iconClassName: "text-black-90",
		label: "VRChat",
		color: "#095d6a"
	}
};

export type Connection = UpdatedAtModel & {
	type: ConnectionType;
	uid: string;
	displayName: string;
	url?: string;
	avatarUrl?: string;
};

export function authorizeUrl(type: ConnectionType, next: string) {
	return newUrl("connections/authorize", { type, next });
}

export function deleteUrl(type: ConnectionType, next: string) {
	return newUrl("connections/delete", { type, next });
}

export async function listAvailable(
	options: NarrowFetchOptions = {}
): Promise<Array<ConnectionType>> {
	return fetch<Array<ConnectionType>>("get", "connections/available", options);
}

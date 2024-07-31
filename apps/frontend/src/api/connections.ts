import {
	AppleIcon,
	DiscordIcon,
	MetaIcon,
	GoogleIcon,
	VRChatIcon,
	type IconComponent
} from "~/components/icons";

import { type NarrowFetchOptions, fetch, newUrl } from "./exports";

import type { UpdatedAtModel } from "./common";

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

export function authorizeUrl(
	type: ConnectionType,
	prompt: string,
	next: string,
	json: boolean = false
) {
	return newUrl("connections/authorize", {
		type,
		prompt,
		next,
		json: json ? "1" : undefined
	});
}

export function authorize(
	type: ConnectionType,
	prompt: string,
	next: string,
	options: NarrowFetchOptions = {}
) {
	return fetch<{
		state: string;
		authorizeUrl: string;
	}>("get", authorizeUrl(type, prompt, next, true).href, options);
}

export function grant(
	options: NarrowFetchOptions<
		undefined,
		{
			type: ConnectionType;
			code: string;
			state: string;
			redirect?: string;
		}
	>
) {
	return fetch("get", "connections/grant", { ...options, raw: true });
}

export { _delete as delete };
export async function _delete(
	options: NarrowFetchOptions<undefined, { type: ConnectionType }>
) {
	return fetch("delete", "connections", options);
}

export async function listAvailable(
	options: NarrowFetchOptions = {}
): Promise<Array<ConnectionType>> {
	return fetch<Array<ConnectionType>>("get", "connections/available", options);
}

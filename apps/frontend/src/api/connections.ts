import {
	AppleIcon,
	DiscordIcon,
	MetaIcon,
	GoogleIcon,
	VRChatIcon,
	type IconComponent
} from "~/components/icons";

import { api, type UpdatedAtModel } from "./common";

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

export interface ConnectionAuthorizeOptions {
	type: ConnectionType;
	prompt: string;
	next: string;
	json?: boolean;
}

export interface ConnectionGrantOptions {
	type: ConnectionType;
	code: string;
	state: string;
	redirect?: string;
}

export const Connection = {
	api: api.url("connections"),
	authorizeUrl(options: ConnectionAuthorizeOptions) {
		return this.api.url("/authorize").query({
			...options,
			...(options.json ? { json: "1" } : {})
		})._url;
	},
	authorize(options: Omit<ConnectionAuthorizeOptions, "json">) {
		return api
			.url(this.authorizeUrl({ ...options, json: true }), true)
			.get()
			.json<{
				state: string;
				authorizeUrl: string;
			}>();
	},
	grant(options: ConnectionGrantOptions) {
		return this.api.url("/grant").query(options).get().res();
	},
	delete(type: ConnectionType) {
		return this.api.query({ type }).delete().res();
	},
	listAvailable() {
		return this.api.url("/available").get().json<Array<ConnectionType>>();
	}
};

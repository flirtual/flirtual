import {
	AppleIcon,
	DiscordIcon,
	GoogleIcon,

	MetaIcon,
	VRChatIcon
} from "~/components/icons";
import type { IconComponent } from "~/components/icons";

import { api } from "./common";
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
	{
		Icon: IconComponent;
		color?: string;
		logoColor?: string;
		darkColor?: string;
		darkLogoColor?: string;
	}
> = {
	google: {
		Icon: GoogleIcon,
		color: "#dd4b39"
	},
	apple: {
		Icon: AppleIcon,
		color: "#000000",
		logoColor: "#ffffff",
		darkColor: "#ffffff",
		darkLogoColor: "#000000"
	},
	meta: {
		Icon: MetaIcon,
		color: "#0082fb"
	},
	discord: {
		Icon: DiscordIcon,
		color: "#5865f2"
	},
	vrchat: {
		Icon: VRChatIcon,
		color: "#095d6a"
	}
};

export type Connection = {
	type: ConnectionType;
	uid: string;
	displayName: string;
	url?: string;
	avatarUrl?: string;
} & UpdatedAtModel;

export interface ConnectionAuthorizeOptions {
	type: ConnectionType;
	prompt: string;
	next: string;
	json?: boolean;
	notifications?: boolean;
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
			authorizeUrl: string;
			redirectUri: string;
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

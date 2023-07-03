import { UpdatedAtModel } from "./common";
import { NarrowFetchOptions, fetch, newUrl } from "./exports";

export const connectionType = ["discord", "vrchat"] as const;
export type ConnectionType = (typeof connectionType)[number];

export const connectionTypeName: Record<ConnectionType, string> = {
	discord: "Discord",
	vrchat: "VRChat"
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

export async function listAvailable(
	options: NarrowFetchOptions = {}
): Promise<Array<ConnectionType>> {
	return fetch<Array<ConnectionType>>("get", "connections/available", options);
}

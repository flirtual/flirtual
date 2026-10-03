import type { Api, Body } from "@flirtual/pulumi-dynamic-fetch";

export type { Schemas } from "./generated/index.ts";

// Every response wraps its payload in `data`.
export async function request<T>(api: Api, method: string, path: string, body?: Body) {
	return (await api.request<{ data: T }>(method, path, body))?.data;
}

export function required<T>(value: T | undefined, message: string): T {
	if (value === undefined) throw new Error(message);
	return value;
}

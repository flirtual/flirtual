/* eslint-disable ts/no-unsafe-function-type */
import { entries, fromEntries, toCamelCase, toSnakeCase } from "remeda";

export type Expand<T> = T extends
	| Function
	| bigint
	| boolean
	| number
	| string
	| symbol
	| null
	| undefined
	? T
	: { [P in keyof T]: T[P] };

export function transformObject<T>(
	object: any,
	transformer: (key: string, value: any) => any
): T {
	if (Array.isArray(object))
		return object.map((innerObject) => {
			return transformObject(innerObject, transformer);
		}) as T;
	if (typeof object !== "object") return object;
	if (object === null) return null as T;

	return fromEntries(
		entries(object).map(([key, value]) => {
			return transformer(key, transformObject(value, transformer));
		})
	) as T;
}

export function toCamelObject<T>(object: any): T {
	return transformObject(object, (key, value) => {
		return [toCamelCase(key), toCamelObject(value)];
	});
}

export function toSnakeObject<T>(object: any): T {
	return transformObject(object, (key, value) => [
		toSnakeCase(key),
		toSnakeObject(value)
	]);
}

export function isUid(value: string): boolean {
	return isShortUuid(value) || isUuid(value);
}

export function isShortUuid(value: string): boolean {
	return value.length === 22;
}

export function isUuid(value: string): boolean {
	return /^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
		value
	);
}

export function tryJsonParse<T>(value: string, fallbackValue: T): T {
	try {
		return JSON.parse(value) as T;
	}
	catch {
		return fallbackValue;
	}
}

export function hashCode(value: string): number {
	let hash = 0;
	const length = value.length;

	for (let index = 0; index < length; index++) {
		hash = (hash << 5) - hash + (value.codePointAt(index) || 1);
		hash = Math.trunc(hash);
	}

	return hash;
}

export function tinySimpleHash(value: string): number {
	let h = 9;

	for (let index = 0; index < value.length;) {
		h = Math.imul(h ^ (value.codePointAt(index++) || 1), 9 ** 9);
	}

	return h ^ (h >>> 9);
}

export async function newConversationId(
	userId: string,
	targetUserId: string
): Promise<string> {
	const sortedIds = [userId, targetUserId].sort();
	const jsonString = JSON.stringify(sortedIds);
	const hash = await crypto.subtle.digest(
		"SHA-1",
		new TextEncoder().encode(jsonString)
	);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")
		.slice(0, 20);
}

export function newIdempotencyKey() {
	return [Date.now(), ...Array.from(crypto.getRandomValues(new Uint8Array(16)))]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

export const emptyObject = Object.freeze({}) as Record<string, never>;
export const emptyArray = Object.freeze([]) as Array<never>;

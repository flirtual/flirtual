/* eslint-disable @typescript-eslint/no-explicit-any */
import { camelCase, snakeCase } from "change-case";

export function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

export type Entries<T> = Array<
	{
		[K in keyof T]: [K, T[K]];
	}[keyof T]
>;

// eslint-disable-next-line @typescript-eslint/ban-types
export function entries<T extends {}>(value: T): Entries<T> {
	return Object.entries(value) as Entries<T>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function omit<T extends {}, K extends keyof T>(value: T, keys: Array<K>): Omit<T, K> {
	return Object.fromEntries(entries(value).filter(([key]) => !keys.includes(key as K))) as Omit<
		T,
		K
	>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function pick<T extends {}, K extends keyof T>(value: T, keys: Array<K>): Pick<T, K> {
	return Object.fromEntries(entries(value).filter(([key]) => keys.includes(key as K))) as Pick<
		T,
		K
	>;
}

export function transformObject<T>(object: any, transformer: (key: string, value: any) => any): T {
	if (Array.isArray(object))
		return object.map((innerObject) => {
			return transformObject(innerObject, transformer);
		}) as T;
	if (typeof object !== "object") return object;
	if (object === null) return null as T;

	return Object.fromEntries(
		entries(object).map(([key, value]) => {
			return transformer(key, transformObject(value, transformer));
		})
	) as T;
}

export function toCamelObject<T>(object: any): T {
	return transformObject(object, (key, value) => {
		return [camelCase(key), toCamelObject(value)];
	});
}

export function toSnakeObject<T>(object: any): T {
	return transformObject(object, (key, value) => [snakeCase(key), toSnakeObject(value)]);
}

export function capitalize(value: string): string {
	return `${value[0].toUpperCase()}${value.slice(1)}`;
}

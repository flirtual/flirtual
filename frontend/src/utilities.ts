/* eslint-disable @typescript-eslint/no-explicit-any */
import { camelCase, snakeCase } from "change-case";

export function clamp(value: number, min: number, max: number): number {
	return value < min ? min : value > max ? max : value;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function omit<T extends {}, K extends keyof T>(value: T, keys: Array<K>): Omit<T, K> {
	return Object.fromEntries(
		Object.entries(value).filter(([key]) => !keys.includes(key as K))
	) as Omit<T, K>;
}

export function transformObject<T>(object: any, transformer: (key: string, value: any) => any): T {
	if (Array.isArray(object))
		return object.map((innerObject) => {
			return transformObject(innerObject, transformer);
		}) as T;
	if (typeof object !== "object") return object;
	if (object === null) return null as T;

	return Object.fromEntries(
		Object.entries(object).map(([key, value]) => {
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

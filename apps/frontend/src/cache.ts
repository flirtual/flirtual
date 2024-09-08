import { unstable_cache as globalCache } from "next/cache";
import { cache as requestCache } from "react";

export type GlobalCacheOptions = Parameters<typeof globalCache>[2] & {
	key?: Parameters<typeof globalCache>[1];
};

export const cache = {
	request<T>(callback: () => T) {
		if (typeof window !== "undefined") return callback();
		return requestCache(callback);
	},
	global<T>(callback: () => Promise<T>, options: GlobalCacheOptions = {}) {
		if (typeof window !== "undefined") return callback();
		return globalCache(callback, options.key, options)();
	}
};

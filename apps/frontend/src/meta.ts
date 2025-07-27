import type { MetaDescriptor } from "react-router";
import { uniqueBy } from "remeda";

function metaKey(meta: MetaDescriptor): string | null {
	if ("key" in meta && meta.key && typeof meta.key === "string") return meta.key;
	if ("title" in meta && meta.title) return "title";

	if ("name" in meta && meta.name)
		return ["name", meta.name, "media" in meta && meta.media]
			.filter(Boolean)
			.join("/");

	if ("property" in meta && meta.property)
		return ["property",	meta.property, "media" in meta && meta.media]
			.filter(Boolean)
			.join("/");

	if ("httpEquiv" in meta && meta.httpEquiv)
		return ["httpEquiv", meta.httpEquiv].join("/");

	return null;
}

export function metaMerge(metas: Array<MetaDescriptor>) {
	return uniqueBy(
		metas
			.reverse()
			.map((meta, index) => [(metaKey(meta) || index).toString(), meta] as const),
		([key]) => key
	)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([, meta]) => meta);
}

export { meta as rootMeta } from "./root";

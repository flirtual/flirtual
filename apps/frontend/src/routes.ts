import {
	layout as _layout,
	route as _route,
	prefix,
	type RouteConfig,
	type RouteConfigEntry
} from "@react-router/dev/routes";

const filePrefix = "./app/[locale]";

function route(path: string, file: string, children?: Array<RouteConfigEntry>) {
	return _route(path, `${filePrefix}/${file}.tsx`, children);
}

function layout(file: string, children?: Array<RouteConfigEntry>) {
	return _layout(`${filePrefix}/${file}/layout.tsx`, children);
}

function page(path: string, file?: string, children?: Array<RouteConfigEntry>) {
	return route(path, `${file}/page`, children);
}

export default [
	...prefix(":locale?", [
		layout("(public)", [
			page("home", "(public)/home"),
		]),
		layout("(minimal)", [
			layout("(minimal)/(guest)", [
				page("login", "(minimal)/(guest)/login"),
			])
		]),
		route("*", "not-found"),
	])
] satisfies RouteConfig;

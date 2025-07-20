import {
	layout as _layout,
	route as _route,
	prefix

} from "@react-router/dev/routes";
import type { RouteConfig, RouteConfigEntry } from "@react-router/dev/routes";

const filePrefix = "./app/[locale]";

function route(path: string, file: string, children?: Array<RouteConfigEntry>) {
	return _route(path, `${filePrefix}/${file}.tsx`, children);
}

function file(file: string, extension: string = "ts") {
	return _route(`/${file}`, `./app/${file}.${extension}`);
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
				page("sign-up", "(minimal)/(guest)/sign-up"),
				page("forgot", "(minimal)/(guest)/forgot"),
			])
		]),
		route("*", "not-found"),
	]),

	// Static files, not in public folder.
	// Keep in sync with react-router.config.ts.
	file("manifest.json"),
	file("robots.txt"),
	file("pico_authentication.json"),
	file(".well-known/security.txt"),
] satisfies RouteConfig;

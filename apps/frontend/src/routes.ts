import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
	index("app/[locale]/(public)/home/page.tsx"),
	route("*", "./app/not-found.tsx")
] satisfies RouteConfig;

import { route, type RouteConfig } from "@react-router/dev/routes";

export default [
	route("/home", "./routes/home/index.tsx"),
	route("/test", "./routes/test.tsx"),
	route("*", "./routes/not-found.tsx"),
] satisfies RouteConfig;

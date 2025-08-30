import {
	index as _index,
	layout as _layout,
	route as _route,
	prefix

} from "@react-router/dev/routes";
import type { RouteConfig, RouteConfigEntry } from "@react-router/dev/routes";

const filePrefix = "./app/[locale]";

type RouteOptions = Parameters<typeof _route>[2] & Record<string, unknown>;

function route(path: string, file: string, options: RouteOptions = {}, children?: Array<RouteConfigEntry>) {
	return _route(path, `${filePrefix}/${file}.tsx`, options, children);
}

function file(file: string, extension: string = "ts") {
	return _route(`/${file}`, `./app/${file}.${extension}`);
}

function layout(file: string, children?: Array<RouteConfigEntry>) {
	return _layout(`${filePrefix}/${file}/layout.tsx`, children);
}

function index(file: string) {
	return _index(`${filePrefix}/${file}/page.tsx`);
}

function page(path: string, file?: string, options?: RouteOptions, children?: Array<RouteConfigEntry>) {
	return route(path, `${file}/page`, options, children);
}

export default [
	...prefix(":locale", [
		layout("(public)", [
			index("(public)/home"),
			// page("/home", "(public)/home"),
			// route("/", "(public)/route"),
		]),
		layout("(minimal)", [
			layout("(minimal)/(guest)", [
				page("login", "(minimal)/(guest)/login"),
				page("sign-up", "(minimal)/(guest)/sign-up"),
				page("forgot", "(minimal)/(guest)/forgot"),
			]),
			layout("(minimal)/(session)", [
				page("onboarding/1", "(minimal)/(session)/onboarding/1"),
				page("onboarding/2", "(minimal)/(session)/onboarding/2"),
			])
		]),
		layout("(app)", [
			layout("(app)/(authenticated)", [
				page("finish/1", "(app)/(authenticated)/finish/1"),
				page("finish/2", "(app)/(authenticated)/finish/2"),
				page("finish/3", "(app)/(authenticated)/finish/3"),
				page("finish/4", "(app)/(authenticated)/finish/4"),
				page("finish/5", "(app)/(authenticated)/finish/5"),
				page("subscription", "(app)/(authenticated)/subscription"),
				layout("(app)/(authenticated)/(onboarded)", [
					page(":slug", "(app)/(authenticated)/(onboarded)/[slug]"),
					// page("discover/:group", "(app)/(authenticated)/(onboarded)/discover/[group]"),
					page("dates", "(app)/(authenticated)/(onboarded)/discover", { id: "dates" }),
					page("homies", "(app)/(authenticated)/(onboarded)/discover", { id: "homies" }),
					page("likes", "(app)/(authenticated)/(onboarded)/likes"),
					layout("(app)/(authenticated)/(onboarded)/matches", [
						page("matches", "(app)/(authenticated)/(onboarded)/matches"),
						page("matches/:conversationId", "(app)/(authenticated)/(onboarded)/matches/[conversationId]")
					])
					// route("me", "(app)/(authenticated)/(onboarded)/me/route"),
				]),
				layout("(app)/(authenticated)/settings", [
					page("settings", "(app)/(authenticated)/settings"),
					page("settings/appearance", "(app)/(authenticated)/settings/(account)/appearance"),
					page("settings/connections", "(app)/(authenticated)/settings/(account)/connections"),
					page("settings/deactivate", "(app)/(authenticated)/settings/(account)/deactivate"),
					page("settings/delete", "(app)/(authenticated)/settings/(account)/delete"),
					page("settings/email", "(app)/(authenticated)/settings/(account)/email"),
					page("settings/fun", "(app)/(authenticated)/settings/(account)/fun"),
					page("settings/notifications", "(app)/(authenticated)/settings/(account)/notifications"),
					page("settings/password", "(app)/(authenticated)/settings/(account)/password"),
					page("settings/privacy", "(app)/(authenticated)/settings/(account)/privacy"),
					page("settings/reactivate", "(app)/(authenticated)/settings/(account)/reactivate"),
					page("settings/referral", "(app)/(authenticated)/settings/(account)/referral"),
					page("settings/bio", "(app)/(authenticated)/settings/(profile)/bio"),
					page("settings/info", "(app)/(authenticated)/settings/(profile)/info"),
					page("settings/interests", "(app)/(authenticated)/settings/(profile)/interests"),
					page("settings/matchmaking", "(app)/(authenticated)/settings/(profile)/matchmaking"),
					page("settings/nsfw", "(app)/(authenticated)/settings/(profile)/nsfw"),
					page("settings/personality", "(app)/(authenticated)/settings/(profile)/personality"),
				]),
				layout("(app)/(authenticated)/(admin)", [
					page("stats", "(app)/(authenticated)/(admin)/stats"),
					page("test/vrchat-browse", "(app)/(authenticated)/(admin)/test/vrchat-browse"),
				]),
				layout("(app)/(authenticated)/(moderator)", [
					page("reports", "(app)/(authenticated)/(moderator)/reports"),
					page("search", "(app)/(authenticated)/(moderator)/search"),
				]),
			]),
			layout("(app)/(public)", [
				page("about", "(app)/(public)/about"),
				page("branding", "(app)/(public)/branding"),
				page("confirm-email", "(app)/(public)/confirm-email"),
				page("debugger", "(app)/(public)/debugger"),
				page("download", "(app)/(public)/download"),
				page("events", "(app)/(public)/events"),
				page("guidelines", "(app)/(public)/guidelines"),
				page("guides", "(app)/(public)/guides"),
				page("guides/mental-health", "(app)/(public)/guides/mental-health"),
				page("payments", "(app)/(public)/payments"),
				page("press", "(app)/(public)/press"),
				page("privacy", "(app)/(public)/privacy"),
				page("privacy-20221022", "(app)/(public)/privacy-20221022"),
				page("terms", "(app)/(public)/terms"),
				page("terms-20230530", "(app)/(public)/terms-20230530"),
			]),
			route("*", "not-found")
		])
	]),

	// Static files, not in public folder.
	// Keep in sync with react-router.config.ts.
	file("manifest.json"),
	file("robots.txt"),
	file("pico_authentication.json"),
	file(".well-known/security.txt"),
	file("_redirects"),
	file("_headers"),
	file("wrangler.json"),
] satisfies RouteConfig;

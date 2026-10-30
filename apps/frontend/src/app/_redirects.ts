import { homieMode } from "~/features";
import Favicon from "~/static/mark.svg?w=48&h=48&fit=contain&background=transparent&format=png&no-inline&imagetools";
import { urls } from "~/urls";

// A brand without a BIMI logo leaves out static/bimi.svg.
const [bimi] = Object.values(import.meta.glob<string>("~/static/bimi.svg", { eager: true, import: "default" }));

// see: https://developers.cloudflare.com/workers/static-assets/redirects/

export const redirects = [
	{
		source: "/home",
		destination: "/en/"
	},
	{
		source: "/register",
		destination: "/sign-up"
	},
	{
		source: "/signup",
		destination: "/sign-up"
	},
	{
		source: "/onboarding/0",
		destination: "/sign-up"
	},
	{
		source: "/discover/homies",
		destination: homieMode ? "/homies" : "/dates"
	},
	{
		source: "/browse",
		destination: "/dates"
	},
	{
		source: "/discover/dates",
		destination: "/dates"
	},
	...(urls.socials.discord
		? [{
				source: "/discord",
				destination: urls.socials.discord
			}]
		: []),
	{
		source: "/speeddate",
		destination: "https://vrchat.com/home/world/wrld_f5844d7c-dc4d-4ee7-bf3f-63c8e6be5539"
	},
	{
		source: "/club",
		destination: "https://vrchat.com/home/world/wrld_d4f2cc35-83b9-41e9-9b3a-b861691c8df4"
	},
	{
		source: "/premium",
		destination: "/subscription"
	},
	{
		source: "/settings/apps",
		destination: "/download"
	},
	{
		source: "/ios",
		destination: urls.apps.apple
	},
	{
		source: "/settings/account",
		destination: "/settings"
	},
	{
		source: "/settings/deactivateaccount",
		destination: "/settings/deactivate"
	},
	{
		source: "/settings/deleteaccount",
		destination: "/settings/delete"
	},
	{
		source: "/settings/change-email",
		destination: "/settings/email"
	},
	{
		source: "/settings/change-password",
		destination: "/settings/password"
	},
	{
		source: "/settings/tags",
		destination: "/settings/info"
	},
	{
		source: "/mentalhealth",
		destination: "/guides/mental-health"
	},
	{
		source: "/terms-20230530",
		destination: "/terms"
	},
	{
		source: "/privacy-20221022",
		destination: "/privacy"
	},
	{
		source: "/.well-known/change-password",
		destination: "/settings/password"
	},
	{
		source: "/security.txt",
		destination: "/.well-known/security.txt"
	},
	{
		source: "/favicon.ico",
		destination: Favicon
	},
	...(bimi ? [{ source: "/bimi.svg", destination: bimi }] : []),
	{
		source: "/reports",
		destination: "/mod"
	},
	{
		source: "/user/:slug",
		destination: "/:slug"
	}
]
	.sort(({ destination: a }, { destination: b }) => a.localeCompare(b));

const data = redirects
	.map(({ source, destination }) => `${source} ${destination}`)
	.join("\n");

export const loader = () => data;

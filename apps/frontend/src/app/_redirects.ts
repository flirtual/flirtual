import Bimi from "virtual:remote/76eef593-c3fb-498d-a6b6-1b75903a10fc.svg";
import Favicon from "virtual:remote/b4c0e29e-4055-4924-8ddf-adee9bc505c3";

import { urls } from "~/urls";

// see: https://developers.cloudflare.com/workers/static-assets/redirects/

export const redirects = [
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
		source: "/homies",
		destination: "/discover/homies"
	},
	{
		source: "/browse",
		destination: "/discover/dates"
	},
	{
		source: "/discord",
		destination: urls.socials.discord
	},
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
		source: "/terms-20230605",
		destination: "/terms"
	},
	{
		source: "/privacy-20230605",
		destination: "/privacy"
	},
	{
		source: "/.well-known/change-password",
		destination: "/settings/password",
		run_worker_first: false
	},
	{
		source: "/security.txt",
		destination: "/.well-known/security.txt"
	},
	{
		source: "/favicon.ico",
		destination: Favicon
	},
	{
		source: "/bimi.svg",
		destination: Bimi
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

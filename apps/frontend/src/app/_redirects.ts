import type { Locale } from "~/i18n";
import { urls } from "~/urls";

// see: https://developers.cloudflare.com/workers/static-assets/redirects/

export function loader() {
	return [
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
			destination: "/settings/password"
		},
		{
			source: "/security.txt",
			destination: "/.well-known/security.txt"
		}
	]
		.sort(({ destination: a }, { destination: b }) => a.localeCompare(b))
		.map(({ source, destination }) => `${source} ${destination}`)
		.join("\n");
}

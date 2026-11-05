import { homieMode } from "~/features";
import Favicon from "~/static/icon-color.svg?w=48&h=48&fit=contain&background=transparent&format=png&no-inline&imagetools";
import { urls } from "~/urls";

// A brand without a BIMI logo leaves out static/bimi.svg.
const [bimi] = Object.values(import.meta.glob<string>("~/static/bimi.svg", { eager: true, import: "default" }));

const brandImagesByWidth = {
	128: import.meta.glob<string>("~/static/{logo,icon}-*.svg", { eager: true, import: "default", query: "?w=128&format=png&no-inline&imagetools" }),
	256: import.meta.glob<string>("~/static/{logo,icon}-*.svg", { eager: true, import: "default", query: "?w=256&format=png&no-inline&imagetools" }),
	512: import.meta.glob<string>("~/static/{logo,icon}-*.svg", { eager: true, import: "default", query: "?w=512&format=png&no-inline&imagetools" }),
	1024: import.meta.glob<string>("~/static/{logo,icon}-*.svg", { eager: true, import: "default", query: "?w=1024&format=png&no-inline&imagetools" })
};

const brandImageRedirects = Object.entries(brandImagesByWidth).flatMap(([width, images]) =>
	Object.entries(images).map(([path, png]) => ({
		source: `/${path.slice(path.lastIndexOf("/") + 1, -".svg".length)}-${width}x.png`,
		destination: png
	})));

interface Redirect {
	source: string;
	destination: string;
}

const pages: Array<Redirect> = [
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
	{
		source: "/premium",
		destination: "/subscription"
	},
	{
		source: "/settings/apps",
		destination: "/download"
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
		source: "/reports",
		destination: "/mod"
	},
	{
		source: "/user/:slug",
		destination: "/:slug"
	}
];

const external: Array<Redirect> = [
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
		source: "/ios",
		destination: urls.apps.apple
	}
];

const assets: Array<Redirect> = [
	{
		source: "/favicon.ico",
		destination: Favicon
	},
	...(bimi ? [{ source: "/bimi.svg", destination: bimi }] : []),
	...brandImageRedirects
];

const bySource = ({ source: a }: Redirect, { source: b }: Redirect) => a.localeCompare(b, "en", { numeric: true });

const groups = { pages, external, assets };

export const redirects = Object.values(groups).flat();

// see: https://developers.cloudflare.com/workers/static-assets/redirects/
const data = Object.entries(groups)
	.map(([name, group]) => [`# ${name}`, ...group.toSorted(bySource).map(({ source, destination }) => `${source} ${destination}`)].join("\n"))
	.join("\n");

export const loader = () => data;

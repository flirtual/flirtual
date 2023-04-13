import { NextResponse } from "next/server";

import { siteOrigin, urls } from "~/urls";

export async function GET() {
	return NextResponse.json({
		name: "Flirtual",
		short_name: "Flirtual",
		icons: [
			{
				src: "/images/android-chrome-192x192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any maskable"
			},
			{
				src: "/images/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any maskable"
			}
		],
		theme_color: "#e9658b",
		background_color: "#fffaf0",
		start_url: siteOrigin,
		display: "standalone",
		categories: ["social"],
		shortcuts: [
			{
				name: "Browse",
				url: urls.browse("love"),
				description: "Find new dates",
				icons: [
					{
						src: "/images/shortcuts/browse.png",
						sizes: "256x256"
					}
				]
			},
			{
				name: "Homies",
				url: urls.browse("friend"),
				description: "Find new homies",
				icons: [
					{
						src: "/images/shortcuts/homies.png",
						sizes: "256x256"
					}
				]
			},
			{
				name: "Matches",
				url: urls.conversations.list,
				description: "Message your matches",
				icons: [
					{
						src: "/images/shortcuts/matches.png",
						sizes: "256x256"
					}
				]
			},
			{
				name: "Profile",
				url: urls.user.me,
				description: "View your profile",
				icons: [
					{
						src: "/images/shortcuts/profile.png",
						sizes: "256x256"
					}
				]
			},
			{
				name: "Settings",
				url: urls.settings.list(),
				description: "Change settings and edit your profile",
				icons: [
					{
						src: "/images/shortcuts/settings.png",
						sizes: "256x256"
					}
				]
			}
		],
		description: "The first VR dating app. Join thousands for dates in VR apps like VRChat.",
		ovr_package_name: "zone.homie.flirtual.pwa",
		iarc_rating_id: "6e4124cb-ab7a-416e-aeb3-f93a42787fa4",
		screenshots: [
			{
				src: "/images/screenshots/1.png",
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Real People, Avatar Profiles"
			},
			{
				src: "/images/screenshots/2.png",
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Share Interests"
			},
			{
				src: "/images/screenshots/3.png",
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Match on Flirtual"
			},
			{
				src: "/images/screenshots/4.png",
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Meet in VR!"
			}
		]
	});
}

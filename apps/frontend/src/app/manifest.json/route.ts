import { NextResponse } from "next/server";

import { siteOrigin, urls } from "~/urls";

export async function GET() {
	return NextResponse.json({
		name: "Flirtual",
		short_name: "Flirtual",
		icons: [
			{
				src: urls.media("b5df3a2a-4a8b-4f9f-a332-7337caa0d80b"),
				sizes: "192x192",
				type: "image/png",
				purpose: "any maskable"
			},
			{
				src: urls.media("3b32c8d4-a8d2-44d6-8d58-4f114937f107"),
				sizes: "512x512",
				type: "image/png",
				purpose: "any maskable"
			}
		],
		background_color: "#fffaf0",
		start_url: siteOrigin,
		display: "standalone",
		categories: ["social"],
		shortcuts: [
			{
				name: "Browse",
				url: urls.browse(),
				description: "Find new dates",
				icons: [
					{
						src: urls.media("8c2015ab-ee61-4f5e-ad69-d4d03e45a90a"),
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
						src: urls.media("83e96aea-cd0a-42a6-b178-ebf253c02f50"),
						sizes: "256x256"
					}
				]
			},
			{
				name: "Matches",
				url: urls.conversations.list(),
				description: "Message your matches",
				icons: [
					{
						src: urls.media("21747a8e-1863-4534-b184-e6b0940245db"),
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
						src: urls.media("9e9b05bf-56a8-45d2-b593-2b3d05077560"),
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
						src: urls.media("6987eb07-6baa-4500-aed0-c09a94a49b19"),
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
				src: urls.media("eecdfea3-ae12-43bb-a1e0-a438ec99f009"),
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Real People, Avatar Profiles"
			},
			{
				src: urls.media("bcd06f9f-7b4a-4604-9d50-ebefac6dd8a9"),
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Share Interests"
			},
			{
				src: urls.media("d1de5f9f-b206-40a5-9e07-1b88c16112c2"),
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Match on Flirtual"
			},
			{
				src: urls.media("b430ed56-4ade-4a12-b4fb-aa2a4c54a56c"),
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Meet in VR!"
			}
		]
	});
}

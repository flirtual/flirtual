import { NextResponse } from "next/server";

import { siteOrigin } from "~/const";
import { urls } from "~/urls";

export async function GET() {
	return NextResponse.json({
		id: "flirtual",
		name: "Flirtual",
		short_name: "Flirtual",
		icons: [
			{
				src: urls.media("36caae65-e07f-4ccf-9290-f4d329de66a6"),
				sizes: "192x192",
				type: "image/png",
				purpose: "any"
			},
			{
				src: urls.media("ae8bdc6b-2073-491a-9d09-58fce4223d4e"),
				sizes: "512x512",
				type: "image/png",
				purpose: "any"
			},
			{
				src: urls.media("4977b687-26ae-4da7-b1aa-7fbf6cd2b14e"),
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable"
			},
			{
				src: urls.media("680f5d7b-65dd-4cd2-bcad-15d4b4ae200b"),
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable"
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
						src: urls.media("143f16e8-288c-429c-86d9-5bd1404b42a3"),
						sizes: "96x96"
					},
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
						src: urls.media("7275f45b-680a-4e19-b793-4554784a8fb1"),
						sizes: "96x96"
					},
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
						src: urls.media("544e3a7a-7604-4415-b132-bf02aa49550d"),
						sizes: "96x96"
					},
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
						src: urls.media("086711c1-e359-4a10-bcd5-492ef4687936"),
						sizes: "96x96"
					},
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
						src: urls.media("037c3224-2390-4dbc-bfdf-09bbbe53ef5d"),
						sizes: "96x96"
					},
					{
						src: urls.media("6987eb07-6baa-4500-aed0-c09a94a49b19"),
						sizes: "256x256"
					}
				]
			}
		],
		description:
			"The first VR dating app. Join thousands for dates in VR apps like VRChat.",
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
		],
		lang: "en",
		handle_links: "preferred",
		launch_handler: {
			client_mode: ["navigate-existing", "auto"]
		},
		orientation: "any",
		edge_side_panel: {}
	});
}

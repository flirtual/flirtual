import Image037c3224 from "virtual:remote/037c3224-2390-4dbc-bfdf-09bbbe53ef5d";
import Image086711c1 from "virtual:remote/086711c1-e359-4a10-bcd5-492ef4687936";
import Image143f16e8 from "virtual:remote/143f16e8-288c-429c-86d9-5bd1404b42a3";
import Image21747a8e from "virtual:remote/21747a8e-1863-4534-b184-e6b0940245db";
import Image36caae65 from "virtual:remote/36caae65-e07f-4ccf-9290-f4d329de66a6";
import Image4977b687 from "virtual:remote/4977b687-26ae-4da7-b1aa-7fbf6cd2b14e";
import Image544e3a7a from "virtual:remote/544e3a7a-7604-4415-b132-bf02aa49550d";
import Image680f5d7b from "virtual:remote/680f5d7b-65dd-4cd2-bcad-15d4b4ae200b";
import Image6987eb07 from "virtual:remote/6987eb07-6baa-4500-aed0-c09a94a49b19";
import Image7273fe85 from "virtual:remote/7273fe85-1b60-402b-9d69-5e5b884df74d";
import Image7275f45b from "virtual:remote/7275f45b-680a-4e19-b793-4554784a8fb1";
import Image7b134496 from "virtual:remote/7b134496-3a5a-4cc9-acd1-f5e332269b3e";
import Image83e96aea from "virtual:remote/83e96aea-cd0a-42a6-b178-ebf253c02f50";
import Image8c2015ab from "virtual:remote/8c2015ab-ee61-4f5e-ad69-d4d03e45a90a";
import Image9e9b05bf from "virtual:remote/9e9b05bf-56a8-45d2-b593-2b3d05077560";
import ImageAe8bdc6b from "virtual:remote/ae8bdc6b-2073-491a-9d09-58fce4223d4e";
import ImageCff9ca62 from "virtual:remote/cff9ca62-2ec5-4467-8bb1-5ec0972f0a5e";
import ImageDcfbd0d6 from "virtual:remote/dcfbd0d6-1f35-44b9-9f4e-d9c50a368907";

import { appBundleId, siteOrigin } from "~/const";
import { urls } from "~/urls";

export function loader() {
	return {
		id: "flirtual",
		name: "Flirtual",
		short_name: "Flirtual",
		icons: [
			{
				src: Image36caae65,
				sizes: "192x192",
				type: "image/png",
				purpose: "any"
			},
			{
				src: ImageAe8bdc6b,
				sizes: "512x512",
				type: "image/png",
				purpose: "any"
			},
			{
				src: Image4977b687,
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable"
			},
			{
				src: Image680f5d7b,
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable"
			}
		],
		background_color: "#fffaf0",
		start_url: siteOrigin,
		display: "standalone",
		categories: ["lifestyle", "social"],
		shortcuts: [
			{
				name: "Browse",
				url: urls.discover("dates"),
				description: "Find new dates",
				icons: [
					{
						src: Image143f16e8,
						sizes: "96x96"
					},
					{
						src: Image8c2015ab,
						sizes: "256x256"
					}
				]
			},
			{
				name: "Homies",
				url: urls.discover("dates"),
				description: "Find new homies",
				icons: [
					{
						src: Image7275f45b,
						sizes: "96x96"
					},
					{
						src: Image83e96aea,
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
						src: Image544e3a7a,
						sizes: "96x96"
					},
					{
						src: Image21747a8e,
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
						src: Image086711c1,
						sizes: "96x96"
					},
					{
						src: Image9e9b05bf,
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
						src: Image037c3224,
						sizes: "96x96"
					},
					{
						src: Image6987eb07,
						sizes: "256x256"
					}
				]
			}
		],
		description:
			"The first VR dating app. Join thousands for dates in VR apps like VRChat.",
		ovr_package_name: appBundleId,
		iarc_rating_id: "6e4124cb-ab7a-416e-aeb3-f93a42787fa4",
		screenshots: [
			{
				src: Image7b134496,
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Real People, Avatar Profiles"
			},
			{
				src: ImageCff9ca62,
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Share Interests and Personality"
			},
			{
				src: Image7273fe85,
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Match on Flirtual"
			},
			{
				src: ImageDcfbd0d6,
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
		related_applications: [
			{
				platform: "itunes",
				url: urls.apps.apple
			},
			{
				platform: "play",
				url: urls.apps.google,
				id: appBundleId
			},
			{
				platform: "windows",
				url: urls.apps.microsoft,
			}
		],
		prefer_related_applications: true,
		edge_side_panel: {}
	};
}

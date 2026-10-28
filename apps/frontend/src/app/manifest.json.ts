import * as brand from "~/brand";
import { appBundleId, siteOrigin } from "~/const";
import { homieMode } from "~/features";
import ScreenshotInterests from "~/static/manifest/screenshots/interests.png";
import ScreenshotMatches from "~/static/manifest/screenshots/matches.png";
import ScreenshotMeetInVr from "~/static/manifest/screenshots/meet-in-vr.png";
import ScreenshotProfiles from "~/static/manifest/screenshots/profiles.png";
import ShortcutBrowse256 from "~/static/manifest/shortcuts/browse.png";
import ShortcutBrowse96 from "~/static/manifest/shortcuts/browse.png?w=96&h=96&imagetools";
import ShortcutHomies256 from "~/static/manifest/shortcuts/homies.png";
import ShortcutHomies96 from "~/static/manifest/shortcuts/homies.png?w=96&h=96&imagetools";
import ShortcutMatches256 from "~/static/manifest/shortcuts/matches.png";
import ShortcutMatches96 from "~/static/manifest/shortcuts/matches.png?w=96&h=96&imagetools";
import ShortcutProfile256 from "~/static/manifest/shortcuts/profile.png";
import ShortcutProfile96 from "~/static/manifest/shortcuts/profile.png?w=96&h=96&imagetools";
import ShortcutSettings256 from "~/static/manifest/shortcuts/settings.png";
import ShortcutSettings96 from "~/static/manifest/shortcuts/settings.png?w=96&h=96&imagetools";
import IconMaskable192 from "~/static/mark-on-gradient.svg?w=192&h=192&format=png&imagetools";
import IconMaskable512 from "~/static/mark-on-gradient.svg?w=512&h=512&format=png&imagetools";
import Icon192 from "~/static/mark.svg?w=192&h=192&fit=contain&background=transparent&format=png&imagetools";
import Icon512 from "~/static/mark.svg?w=512&h=512&fit=contain&background=transparent&format=png&imagetools";
import { urls } from "~/urls";

export function loader() {
	return {
		id: brand.name.toLowerCase(),
		name: brand.name,
		short_name: brand.name,
		icons: [
			{
				src: Icon192,
				sizes: "192x192",
				type: "image/png",
				purpose: "any"
			},
			{
				src: Icon512,
				sizes: "512x512",
				type: "image/png",
				purpose: "any"
			},
			{
				src: IconMaskable192,
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable"
			},
			{
				src: IconMaskable512,
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable"
			}
		],
		background_color: brand.backgroundColor,
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
						src: ShortcutBrowse96,
						sizes: "96x96"
					},
					{
						src: ShortcutBrowse256,
						sizes: "256x256"
					}
				]
			},
			...(homieMode
				? [{
						name: "Homies",
						url: urls.discover("homies"),
						description: "Find new homies",
						icons: [
							{
								src: ShortcutHomies96,
								sizes: "96x96"
							},
							{
								src: ShortcutHomies256,
								sizes: "256x256"
							}
						]
					}]
				: []),
			{
				name: "Matches",
				url: urls.conversations.list(),
				description: "Message your matches",
				icons: [
					{
						src: ShortcutMatches96,
						sizes: "96x96"
					},
					{
						src: ShortcutMatches256,
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
						src: ShortcutProfile96,
						sizes: "96x96"
					},
					{
						src: ShortcutProfile256,
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
						src: ShortcutSettings96,
						sizes: "96x96"
					},
					{
						src: ShortcutSettings256,
						sizes: "256x256"
					}
				]
			}
		],
		...(brand.manifestDescription && { description: brand.manifestDescription }),
		ovr_package_name: appBundleId,
		...(brand.iarcRatingId && { iarc_rating_id: brand.iarcRatingId }),
		screenshots: [
			{
				src: ScreenshotProfiles,
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Real People, Avatar Profiles"
			},
			{
				src: ScreenshotInterests,
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: "Share Interests and Personality"
			},
			{
				src: ScreenshotMatches,
				sizes: "1440x2560",
				type: "image/png",
				platform: "narrow",
				label: `Match on ${brand.name}`
			},
			{
				src: ScreenshotMeetInVr,
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
			...(urls.apps.microsoft
				? [{
						platform: "windows",
						url: urls.apps.microsoft,
					}]
				: [])
		],
		prefer_related_applications: true,
		edge_side_panel: {}
	};
}

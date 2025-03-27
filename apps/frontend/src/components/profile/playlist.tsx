import { useLocale } from "next-intl";
import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import type { PreferenceLanguage } from "~/api/user/preferences";
import { useInternationalization } from "~/hooks/use-internationalization";
import { useTheme } from "~/hooks/use-theme";
import type { Theme } from "~/theme";

// eslint-disable-next-line react-refresh/only-export-components
export const playlistPlatforms = [
	{
		name: "Spotify",
		pattern: /^https?:\/\/open\.spotify\.com\/playlist\/([\dA-Za-z]+)/,
		embed: (id: string, theme: Theme, locale: PreferenceLanguage) =>
			`https://open.spotify.com/embed/playlist/${id}?locale=${locale}`
	},
	{
		name: "YouTube Music",
		pattern: /^https?:\/\/music\.youtube\.com\/playlist\?list=([\dA-Za-z-]+)/,
		embed: (id: string, theme: Theme, locale: PreferenceLanguage) =>
			`https://www.youtube.com/embed/?listType=playlist&color=white&fs=0&iv_load_policy=3&playsinline=1&rel=0&list=${id}&hl=${locale}`
	},
	{
		name: "Apple Music",
		pattern:
			/^https?:\/\/music\.apple\.com\/(?:[a-z]{2}\/)?playlist(?:\/[^\/]+)?\/(pl\.[\dA-Za-z-]+)/,
		embed: (id: string, theme: Theme, locale: PreferenceLanguage) => {
			const locales = {
				en: "us",
				// de: "de",
				// es: "es",
				// fr: "fr",
				ja: "jp"// ,
				// ko: "kr",
				// nl: "nl",
				// pt: "pt",
				// "pt-BR": "br",
				// ru: "ru",
				// sv: "se"
			};

			return `https://embed.music.apple.com/${locales[locale]}/playlist/${id}?theme=${theme}`;
		}
	},
	{
		name: "Tidal",
		pattern:
			/^https?:\/\/(www\.|listen\.)?tidal\.com\/(browse\/)?playlist\/([\dA-Za-z-]+)/,
		embed: (id: string) =>
			`https://embed.tidal.com/playlists/${id}?disableAnalytics=true`
	},
	{
		name: "Amazon Music",
		pattern:
			/^https?:\/\/music\.amazon\.[.a-z]+\/(user-)?playlists\/([\dA-Za-z]+)/,
		embed: (id: string) => `https://music.amazon.com/embed/${id}/`
	},
	{
		name: "Deezer",
		pattern:
			/^https?:\/\/(www\.)?deezer\.com\/(?:[a-z]{2}\/)?playlist\/([\dA-Za-z-]+)/,
		embed: (id: string, theme: Theme) =>
			`https://widget.deezer.com/widget/${theme}/playlist/${id}`
	},
	{
		name: "SoundCloud",
		pattern:
			/^https?:\/\/(www\.)?soundcloud\.com\/([\dA-Za-z-_]+\/sets\/[\dA-Za-z-_]+)/,
		embed: (id: string) =>
			`https://w.soundcloud.com/player/?url=https://soundcloud.com/${id}?buying=false&sharing=false&download=false&show_artwork=true&show_comments=false&show_teaser=false&visual=false`
	},
	{
		name: "Mixcloud",
		pattern:
			/^https?:\/\/(www\.)?mixcloud\.com\/([\dA-Za-z-_]+\/(?:playlists\/)?[\dA-Za-z-_]+)/,
		embed: (id: string, theme: Theme) =>
			`https://player-widget.mixcloud.com/widget/iframe/?light=${theme === "dark" ? 0 : 1}&feed=%2F${id}%2F`
	}
];

export const ProfilePlaylist: FC<{
	playlist: string;
	className?: string;
}> = ({ playlist, className }) => {
	const { theme } = useTheme();
	const { locale: { current: locale } } = useInternationalization();

	const matchedPlatform = playlistPlatforms.find(({ pattern }) => pattern.test(playlist));
	const match = matchedPlatform?.pattern.exec(playlist);
	const playlistId = match ? match.at(-1) : null;

	if (!matchedPlatform || !playlistId) return;

	return (
		<iframe
			allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture; clipboard-write"
			className={twMerge("w-full rounded-xl shadow-brand-1", className)}
			frameBorder="0"
			height={matchedPlatform.name === "Mixcloud" ? 180 : 450}
			// eslint-disable-next-line react-dom/no-unsafe-iframe-sandbox
			sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
			src={matchedPlatform.embed(playlistId, theme, locale)}
		/>
	);
};

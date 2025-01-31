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
		pattern: /^https?:\/\/open\.spotify\.com\/playlist\/([\dA-Za-z]+)/,
		embed: (id: string, theme: Theme, locale: PreferenceLanguage) =>
			`https://open.spotify.com/embed/playlist/${id}?locale=${locale}`
	},
	{
		pattern: /^https?:\/\/music\.youtube\.com\/playlist\?list=([\dA-Za-z-]+)/,
		embed: (id: string, theme: Theme, locale: PreferenceLanguage) =>
			`https://www.youtube.com/embed/?listType=playlist&color=white&fs=0&iv_load_policy=3&playsinline=1&rel=0&list=${id}&hl=${locale}`
	},
	{
		pattern:
			/^https?:\/\/music\.apple\.com\/(?:[a-z]{2}\/)?playlist\/(pl\.[\dA-Za-z-]+)/,
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
		pattern:
			/^https?:\/\/(www\.|listen\.)?tidal\.com\/(browse\/)?playlist\/([\dA-Za-z-]+)/,
		embed: (id: string) =>
			`https://embed.tidal.com/playlists/${id}?disableAnalytics=true`
	},
	{
		pattern:
			/^https?:\/\/music\.amazon\.[.a-z]+\/(user-)?playlists\/([\dA-Za-z]+)/,
		embed: (id: string) => `https://music.amazon.com/embed/${id}/`
	},
	{
		pattern:
			/^https?:\/\/(www\.)?deezer\.com\/(?:[a-z]{2}\/)?playlist\/([\dA-Za-z-]+)/,
		embed: (id: string, theme: Theme) =>
			`https://widget.deezer.com/widget/${theme}/playlist/${id}`
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
			height="450"
			// eslint-disable-next-line react-dom/no-unsafe-iframe-sandbox
			sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
			src={matchedPlatform.embed(playlistId, theme, locale)}
		/>
	);
};

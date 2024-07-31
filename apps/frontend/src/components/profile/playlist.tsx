import { twMerge } from "tailwind-merge";

import { useTheme } from "~/hooks/use-theme";
import { resolveTheme } from "~/theme";

import type { FC } from "react";

const platforms = [
	{
		pattern: /^https?:\/\/open\.spotify\.com\/playlist\/([\dA-Za-z]+)/,
		embed: (id: string) => `https://open.spotify.com/embed/playlist/${id}`
	},
	{
		pattern:
			/^https?:\/\/music\.apple\.com\/(?:[a-z]{2}\/)?playlist\/(pl\.[\dA-Za-z-]+)/,
		embed: (id: string, theme: string) =>
			`https://embed.music.apple.com/playlist/${id}?theme=${theme}`
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
		embed: (id: string, theme: string) =>
			`https://widget.deezer.com/widget/${theme}/playlist/${id}`
	}
];

export const ProfilePlaylist: FC<{
	playlist: string;
	className?: string;
}> = ({ playlist, className }) => {
	const { sessionTheme } = useTheme();

	const matchedPlatform = platforms.find(({ pattern }) =>
		pattern.test(playlist)
	);
	const match = matchedPlatform?.pattern.exec(playlist);
	const playlistId = match ? match.at(-1) : null;

	if (!matchedPlatform || !playlistId) return;

	return (
		<iframe
			allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture; clipboard-write"
			className={twMerge("w-full rounded-xl shadow-brand-1", className)}
			frameBorder="0"
			height="450"
			sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
			src={matchedPlatform.embed(playlistId, resolveTheme(sessionTheme))}
		/>
	);
};

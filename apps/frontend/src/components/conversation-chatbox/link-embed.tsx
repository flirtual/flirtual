import { Play } from "lucide-react";
import type { CSSProperties, FC } from "react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import type { Embed } from "~/api/embed";
import { useEmbed } from "~/api/embed";
import { embedOrigin } from "~/const";
import { useDevice } from "~/hooks/use-device";
import { useMediaQuery } from "~/hooks/use-media-query";
import { useTheme } from "~/hooks/use-theme";
import { useLocale } from "~/i18n";
import { intlLocale } from "~/i18n/languages";

const frame = "mt-2 block overflow-hidden rounded-xl bg-black-90/5 group-data-[sender=currentUser]/message:bg-white-10/15 dark:bg-white-10/5";
const media = "mt-2 block max-h-80 max-w-full rounded-xl object-contain";

// A fixed width capped at the bubble's, so the bubble grows to fit the embed rather than the
// embed shrinking to the bubble's text.
function size(width: number | null | undefined, height: number | null | undefined): CSSProperties | undefined {
	return width && height ? { aspectRatio: `${width} / ${height}`, width: Math.round(320 * Math.min(width / height, 1.6)), maxWidth: "100%" } : undefined;
}

const EmbedFrame: FC<{ player: NonNullable<Embed["player"]>; title: string }> = ({ player, title }) => {
	const reference = useRef<HTMLIFrameElement>(null);
	const [theme] = useTheme();
	const { vision } = useDevice();
	const colorScheme = vision ? "dark" : theme;
	const [height, setHeight] = useState(player.height);

	useEffect(() => {
		if (!player.resizes) return;

		// The frame's only message is its content's height. Nothing else in it is trusted.
		const onMessage = ({ origin, source, data }: MessageEvent) => {
			if (origin !== embedOrigin || source !== reference.current?.contentWindow) return;
			if (typeof data !== "object" || data?.type !== "embed:resize" || typeof data.height !== "number") return;

			setHeight(Math.min(Math.max(Math.round(data.height), 80), 800));
		};

		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [player.resizes]);

	const source = new URL(player.url);
	source.searchParams.set("theme", colorScheme);
	source.searchParams.set("autoplay", "1");

	const aspectRatio = player.aspectRatio ?? (height ? null : 16 / 9);

	return (
		<iframe
			allowFullScreen
			style={{
				colorScheme,
				maxWidth: player.maxWidth ?? undefined,
				...(aspectRatio ? { aspectRatio: String(aspectRatio) } : { height: height ?? 320 })
			}}
			allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
			className="block w-full border-0"
			referrerPolicy="no-referrer"
			// eslint-disable-next-line react-dom/no-unsafe-iframe-sandbox
			sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
			src={source.href}
			title={title}
		/>
	);
};

const EmbedCard: FC<{ embed: Embed }> = ({ embed }) => {
	const { t } = useTranslation();
	const [playing, setPlaying] = useState(false);
	// A preview image can fail upstream (GitHub rate limits its own): the card closes up without it.
	const [imageFailed, setImageFailed] = useState(false);
	const { url, siteName, title, description, player } = embed;
	const image = imageFailed ? null : embed.image;
	const imageFails = () => setImageFailed(true);

	const wideImage = !!image?.width && !!image.height && image.width >= 400 && image.width / image.height >= 1.3;
	const maxWidth = player?.maxWidth ?? 448;

	const details = (
		<a className="flex min-w-0 gap-3 p-3 text-inherit! no-underline!" href={url} rel="noopener noreferrer" target="_blank">
			<span className="flex min-w-0 grow flex-col gap-0.5">
				<span className="truncate text-[0.8em]! opacity-75">{siteName}</span>
				{title && <span className="line-clamp-2 font-semibold!">{title}</span>}
				{description && !playing && <span className="line-clamp-3 text-[0.9em]! opacity-75">{description}</span>}
			</span>
			{image && !wideImage && !player && (
				<img alt="" className="size-16 shrink-0 rounded-lg object-cover" decoding="async" loading="lazy" referrerPolicy="no-referrer" src={image.url} onError={imageFails} />
			)}
		</a>
	);

	if (!player) {
		return (
			<span className={twMerge(frame, "w-96 max-w-full")}>
				{image && wideImage && (
					<a href={url} rel="noopener noreferrer" target="_blank">
						<img alt="" className="block aspect-[1.91] w-full object-cover" decoding="async" loading="lazy" referrerPolicy="no-referrer" src={image.url} onError={imageFails} />
					</a>
				)}
				{details}
			</span>
		);
	}

	const aspectRatio = player.aspectRatio ?? (image?.width && image.height ? image.width / image.height : 16 / 9);

	return (
		<span className={twMerge(frame, "max-w-full")} style={{ width: maxWidth }}>
			{playing
				? <EmbedFrame player={player} title={title ?? siteName} />
				: (
						<button
							aria-label={t("show_embed", { name: title ?? siteName })}
							className="group/play relative block w-full cursor-pointer bg-black-90"
							style={{ aspectRatio: String(Math.min(Math.max(aspectRatio, 0.5), 2.4)) }}
							type="button"
							onClick={() => setPlaying(true)}
						>
							{image && <img alt="" className="size-full object-cover opacity-90" decoding="async" loading="lazy" referrerPolicy="no-referrer" src={image.url} onError={imageFails} />}
							<span className="absolute inset-0 flex items-center justify-center">
								<span className="flex size-14 items-center justify-center rounded-full bg-black-90/60 text-white-10! transition-transform group-hocus/play:scale-110">
									<Play className="ml-1 size-7 fill-current! text-white-10!" />
								</span>
							</span>
						</button>
					)}
			{details}
		</span>
	);
};

const EmbedMedia: FC<{ embed: Embed; media: NonNullable<Embed["media"]> }> = ({ embed, media: { type, url, width, height, loop } }) => {
	const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false);
	const style = size(width, height);
	const label = embed.title ?? embed.siteName;

	if (type === "image") {
		return (
			<a className="block w-fit" href={embed.url} rel="noopener noreferrer" target="_blank">
				<img alt={label} className={media} decoding="async" loading="lazy" referrerPolicy="no-referrer" src={url} style={style} />
			</a>
		);
	}

	return loop
		? (
				<video
					disablePictureInPicture
					disableRemotePlayback
					loop
					muted
					playsInline
					aria-label={label}
					autoPlay={!reducedMotion}
					className={media}
					controls={reducedMotion}
					src={url}
					style={style}
				/>
			)
		: <video controls playsInline aria-label={label} className={media} preload="metadata" src={url} style={style} />;
};

type PostMedia = NonNullable<Embed["post"]>["media"][number];

const PostMediaItem: FC<{ item: PostMedia; href: string; label: string; single: boolean }> = ({ item: { type, url, poster, width, height }, href, label, single }) => {
	const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", false);
	const fit = single ? "w-full max-h-96 object-contain" : "aspect-square w-full object-cover";
	const style = single && width && height ? { aspectRatio: `${width} / ${height}` } : undefined;

	if (type === "image") {
		return (
			<a className="relative block" href={href} rel="noopener noreferrer" target="_blank">
				<img alt={label} className={twMerge("block bg-black-90", fit)} decoding="async" loading="lazy" referrerPolicy="no-referrer" src={url} style={style} />
				{/* A Bluesky video's still: its stream only plays on Bluesky. */}
				{poster && (
					<span className="absolute inset-0 flex items-center justify-center">
						<span className="flex size-14 items-center justify-center rounded-full bg-black-90/60 text-white-10!">
							<Play className="ml-1 size-7 fill-current! text-white-10!" />
						</span>
					</span>
				)}
			</a>
		);
	}

	return type === "gif"
		? <video disablePictureInPicture disableRemotePlayback loop muted playsInline aria-label={label} autoPlay={!reducedMotion} className={twMerge("block bg-black-90", fit)} controls={reducedMotion} poster={poster ?? undefined} src={url} style={style} />
		: <video controls playsInline aria-label={label} className={twMerge("block bg-black-90", fit)} poster={poster ?? undefined} preload="none" src={url} style={style} />;
};

const EmbedPost: FC<{ embed: Embed; post: NonNullable<Embed["post"]> }> = ({ embed, post: { author, text, createdAt, media } }) => {
	const [locale] = useLocale();
	const [avatarFailed, setAvatarFailed] = useState(false);
	const date = createdAt ? new Date(createdAt) : null;

	return (
		<span className={twMerge(frame, "w-120 max-w-full")}>
			<a className="block p-3 text-inherit! no-underline!" href={embed.url} rel="noopener noreferrer" target="_blank">
				<span className="flex items-center gap-2">
					{author.avatar && !avatarFailed && (
						<img alt="" className="size-9 shrink-0 rounded-full" decoding="async" loading="lazy" referrerPolicy="no-referrer" src={author.avatar} onError={() => setAvatarFailed(true)} />
					)}
					<span className="flex min-w-0 grow flex-col leading-tight">
						<span className="truncate font-semibold!">{author.name}</span>
						{author.handle && <span className="truncate text-[0.85em]! opacity-75">{`@${author.handle}`}</span>}
					</span>
					<span className="shrink-0 self-start text-[0.8em]! opacity-75">
						{embed.siteName === "X" ? <span aria-label="X" role="img">𝕏</span> : embed.siteName}
					</span>
				</span>
				{text && <span className="mt-2 line-clamp-12 block whitespace-pre-wrap">{text}</span>}
			</a>
			{media.length > 0 && (
				<span className={twMerge("mx-3 grid gap-0.5 overflow-hidden rounded-lg", media.length > 1 && "grid-cols-2")}>
					{media.map((item) => <PostMediaItem key={item.url} href={embed.url} item={item} label={author.name} single={media.length === 1} />)}
				</span>
			)}
			{date && !Number.isNaN(date.getTime()) && (
				<time className="block px-3 pt-2 pb-3 text-[0.8em]! opacity-75" dateTime={date.toISOString()}>
					{date.toLocaleDateString(intlLocale(locale), { dateStyle: "medium" })}
				</time>
			)}
		</span>
	);
};

const LinkEmbed: FC<{ url: string }> = ({ url }) => {
	const embed = useEmbed(url);
	if (!embed) return null;

	if (embed.post) return <EmbedPost embed={embed} post={embed.post} />;
	if (embed.media) return <EmbedMedia embed={embed} media={embed.media} />;
	return <EmbedCard embed={embed} />;
};

export const LinkEmbeds: FC<{ links: Array<string> }> = ({ links }) => (
	<>
		{links.map((link) => <LinkEmbed key={link} url={link} />)}
	</>
);

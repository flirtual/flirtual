// Adapted from https://github.com/talkjs/themes/blob/6140418/default/react-tsx/ImageBlock.tsx and LocationBlock.tsx
// Copyright (c) 2025 TalkJS (Klets B.V.), MIT License: https://github.com/talkjs/themes/blob/6140418/LICENSE.md

import { formatFilesize, getGoogleMapsUrls, Highlightable } from "@talkjs/react-components";
import type { ImageBlockProps, LocationBlockProps } from "@talkjs/react-components";
import { Download, MapPin } from "lucide-react";

import { Image } from "~/components/image";

// Images and locations fill the top of the bubble, as the classic chat's thumbnails did.
const thumbnail = "-mx-4 -mt-3 mb-3 block h-[200px] overflow-hidden rounded-t-2xl";
const caption = "inline-flex max-w-[calc(100%-4rem)] items-center gap-1 align-top";

export function ImageBlock({ block, downloadUrl }: ImageBlockProps) {
	return (
		<>
			<a className={thumbnail} href={block.url} rel="noopener noreferrer" target="_blank">
				<Image alt="" className="size-full object-cover" src={block.url} />
			</a>
			<a className={caption} href={downloadUrl} rel="noopener noreferrer" target="_blank">
				<Download className="size-4 shrink-0 fill-none!" />
				<Highlightable className="truncate underline" text={block.filename} />
			</a>
			<span className="text-[0.74em]! whitespace-nowrap">{` (${formatFilesize(block.size)})`}</span>
		</>
	);
}

export function LocationBlock({ block }: LocationBlockProps) {
	const { imageUrl, linkUrl } = getGoogleMapsUrls(block);

	return (
		<>
			<a className={thumbnail} href={linkUrl} rel="noopener noreferrer" target="_blank">
				<Image alt="" className="size-full object-cover" src={imageUrl} />
			</a>
			<a className={caption} href={linkUrl} rel="noopener noreferrer" target="_blank">
				<MapPin className="size-4 shrink-0 fill-none!" />
				<span className="truncate underline">{linkUrl}</span>
			</a>
		</>
	);
}

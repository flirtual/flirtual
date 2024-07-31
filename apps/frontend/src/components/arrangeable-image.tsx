"use client";

import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import { Expand, MoreHorizontal, Trash } from "lucide-react";

import { UserImage } from "./user-avatar";
import { useCurrentSortableItem } from "./forms/sortable";

import type { ImageProps } from "./image";

export interface ArrangeableImageProps {
	src: string;
	id: string;
	onDelete: () => void;
	onFullscreen: () => void;
}

export const ArrangeableImagePreview: React.FC<
	Omit<ImageProps, "width" | "height" | "src" | "alt"> & { src: string }
> = (props) => {
	return (
		<UserImage
			{...props}
			alt="Profile image"
			height={175}
			width={175}
			className={twMerge(
				"size-full rounded-md object-cover shadow-brand-1",
				props.className
			)}
		/>
	);
};

export const ArrangeableImage = forwardRef<
	HTMLDivElement,
	ArrangeableImageProps
>(({ src, id, onDelete, onFullscreen, ...props }, reference) => {
	const currentId = useCurrentSortableItem();
	const dragging = currentId === id;

	return (
		<div
			className="group relative aspect-square max-h-full w-full shrink-0"
			ref={reference}
			{...props}
		>
			<ArrangeableImagePreview
				className={twMerge("transition-all", dragging && "brightness-50")}
				src={src}
			/>
			<div
				className="absolute right-0 top-0 p-2"
				onMouseDown={(event) => event.stopPropagation()}
				onTouchStart={(event) => event.stopPropagation()}
			>
				<div className="flex items-center justify-center rounded-md bg-black-70/80 p-1 transition-all group-hocus-within:bg-black-70">
					<div className="flex w-0 items-center justify-center gap-2 opacity-0 transition-all group-hocus-within:w-fit group-hocus-within:pr-2 group-hocus-within:opacity-100">
						<button
							className="opacity-60 hocus:opacity-100"
							type="button"
							onClick={onDelete}
						>
							<Trash className="size-4 text-white-20" />
						</button>
						<button
							className="opacity-60 hocus:opacity-100"
							type="button"
							onClick={onFullscreen}
						>
							<Expand className="size-4 text-white-20" />
						</button>
					</div>
					<button className="opacity-60 hocus:opacity-100" type="button">
						<MoreHorizontal className="size-4 text-white-20" />
					</button>
				</div>
			</div>
		</div>
	);
});

"use client";

import { type Dispatch, forwardRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Expand, MoreHorizontal, Trash } from "lucide-react";

import { UserImage } from "./user-avatar";
import { useCurrentSortableItem } from "./forms/sortable";
import { Modal } from "./modal";

import type { ImageProps } from "./image";
import type { ImageSetValue } from "./forms/input-image-set";

export interface ArrangeableImageProps {
	src: string;
	fullSrc: string;
	id: string;
	onDelete: () => void;
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
				"h-full w-full rounded-md object-cover shadow-brand-1",
				props.className
			)}
		/>
	);
};

const ArrangeableImageModal: React.FC<{
	image: ImageSetValue;
	setFullPreview: Dispatch<boolean>;
}> = ({ image, setFullPreview }) => {
	return (
		<Modal
			visible
			className="max-w-[90svw] overflow-hidden p-0"
			onClick={() => setFullPreview(false)}
			onMouseDown={(event) => event.stopPropagation()}
			onTouchStart={(event) => event.stopPropagation()}
		>
			<UserImage
				fill
				alt="Profile image"
				className="!relative mx-auto aspect-auto !size-auto max-h-[80vh] object-cover"
				src={image.fullSrc}
			/>
		</Modal>
	);
};

export const ArrangeableImage = forwardRef<
	HTMLDivElement,
	ArrangeableImageProps
>(({ src, fullSrc, id, onDelete, ...props }, reference) => {
	const currentId = useCurrentSortableItem();
	const dragging = currentId === id;

	const [fullPreview, setFullPreview] = useState(false);

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
			{fullPreview && (
				<ArrangeableImageModal
					image={{ id, src, fullSrc }}
					setFullPreview={setFullPreview}
				/>
			)}
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
							onClick={() => {
								setFullPreview((fullPreview) => !fullPreview);
							}}
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

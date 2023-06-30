"use client";

import {
	ArrowsPointingOutIcon,
	EllipsisHorizontalIcon,
	TrashIcon
} from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { useDrag, useDragLayer, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { twMerge } from "tailwind-merge";

import { TailCircleIcon } from "./icons/tail-circle";
import { ImageProps } from "./image";
import { UserImage } from "./user-avatar";

export interface ArrangeableImageProps {
	uploading?: boolean;
	src: string;
	idx: number;
	moveImage: (sourceIndex: number, targetIndex: number) => void;
	onDelete: () => void;
}

interface DragItem {
	itemIdx: number;
}

const ArrangeableImagePreview: React.FC<
	Omit<ImageProps, "width" | "height" | "src"> & { src: string }
> = (props) => {
	return (
		<UserImage
			{...props}
			alt="Profile image"
			className={twMerge("h-full w-full rounded-md", props.className)}
			height={175}
			width={175}
		/>
	);
};

export const ArrangeableImage: React.FC<ArrangeableImageProps> = ({
	src,
	idx,
	uploading = true,
	moveImage,
	onDelete
}) => {
	const [{ dragging }, dragReference, preview] = useDrag({
		type: "item",
		item: { itemIdx: idx } as DragItem,
		collect: (monitor) => ({
			dragging: monitor.isDragging()
		})
	});

	useEffect(() => void preview(getEmptyImage(), {}), [preview]);

	const [, dropReference] = useDrop({
		accept: "item",
		drop: (item: DragItem) => {
			moveImage(idx, item.itemIdx);
			item.itemIdx = idx;
		}
	});

	const reference = useRef<HTMLDivElement | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dragDropReference = dragReference(dropReference(reference)) as any;

	const { currentItem, dragOffset } = useDragLayer((monitor) => {
		const currentItem = monitor.getItem() as DragItem;
		const dragOffset = monitor.getDifferenceFromInitialOffset() ?? {
			x: 0,
			y: 0
		};

		return {
			currentItem,
			dragOffset
		};
	});

	const [fullPreview, setFullPreview] = useState(false);

	return (
		<>
			{fullPreview && (
				<div
					className="fixed left-0 top-0 z-40 flex h-full w-full items-center justify-center bg-black-90/60 p-4 backdrop-blur-sm md:p-16"
					onClick={() => setFullPreview(false)}
				>
					<UserImage
						alt="Profile image"
						className="h-auto w-full rounded-md md:w-96"
						height={1024}
						src={src}
						width={1024}
					/>
				</div>
			)}
			<div
				className="group relative aspect-square max-h-full w-full shrink-0"
				ref={dragDropReference}
			>
				{dragging && (
					<div
						className="pointer-events-none absolute left-0 top-0 z-50 w-full rounded-md shadow-brand-1"
						style={{
							transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`
						}}
					>
						<ArrangeableImagePreview alt="Draggable image" src={src} />
					</div>
				)}
				<ArrangeableImagePreview
					alt="Profile image"
					className={twMerge("transition-all", dragging && "brightness-50")}
					src={src}
				/>
				{uploading ? (
					<div
						className={twMerge(
							"absolute right-0 top-0 flex h-full w-full items-center justify-center rounded-md bg-black-90/50 p-2 backdrop-blur"
						)}
					>
						<TailCircleIcon className="h-10 w-10" />
					</div>
				) : (
					<div
						className={twMerge(
							"absolute right-0 top-0 p-2",
							currentItem ? "opacity-0" : "opacity-100"
						)}
					>
						<div className="flex items-center justify-center rounded-md bg-black-70/80 p-1 transition-all group-hocus-within:bg-black-70">
							<div className="flex w-0 items-center justify-center gap-2 opacity-0 transition-all group-hocus-within:w-fit group-hocus-within:pr-2 group-hocus-within:opacity-100">
								<button
									className="opacity-60 hocus:opacity-100"
									type="button"
									onClick={onDelete}
								>
									<TrashIcon className="h-4 w-4 text-white-20" />
								</button>
								<button
									className="opacity-60 hocus:opacity-100"
									type="button"
									onClick={() => {
										setFullPreview((fullPreview) => !fullPreview);
									}}
								>
									<ArrowsPointingOutIcon className="h-4 w-4 text-white-20" />
								</button>
							</div>
							<button className="opacity-60 hocus:opacity-100" type="button">
								<EllipsisHorizontalIcon className="h-4 w-4 text-white-20" />
							</button>
						</div>
					</div>
				)}
			</div>
		</>
	);
};

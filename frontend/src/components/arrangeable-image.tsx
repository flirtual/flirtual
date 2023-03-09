"use client";

import { EllipsisHorizontalIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { useDrag, useDragLayer, useDrop } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { twMerge } from "tailwind-merge";

import { TailCircleIcon } from "./icons/tail-circle";

export interface ArrangeableImageProps {
	uploading?: boolean;
	src: string;
	idx: number;
	moveImage: (sourceIdx: number, targetIdx: number) => void;
	onDelete: () => void;
}

interface DragItem {
	itemIdx: number;
}

const ArrangeableImagePreview: React.FC<React.ComponentProps<"img">> = (props) => (
	<img
		{...props}
		className={twMerge("aspect-square h-full w-full rounded-md object-cover", props.className)}
	/>
);

export const ArrangeableImage: React.FC<ArrangeableImageProps> = ({
	src,
	idx,
	uploading = true,
	moveImage,
	onDelete
}) => {
	const [{ dragging }, dragRef, preview] = useDrag({
		type: "item",
		item: { itemIdx: idx } as DragItem,
		collect: (monitor) => ({
			dragging: monitor.isDragging()
		})
	});

	useEffect(() => void preview(getEmptyImage(), {}), [preview]);

	const [, dropRef] = useDrop({
		accept: "item",
		drop: (item: DragItem) => {
			moveImage(idx, item.itemIdx);
			item.itemIdx = idx;
		}
	});

	const ref = useRef<HTMLDivElement | null>(null);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const dragDropRef = dragRef(dropRef(ref)) as any;

	const { currentItem, dragOffset } = useDragLayer((monitor) => {
		const currentItem = monitor.getItem() as DragItem;
		const dragOffset = monitor.getDifferenceFromInitialOffset() ?? { x: 0, y: 0 };

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
					className="fixed top-0 left-0 z-40 flex h-full w-full items-center justify-center bg-black-90/60 p-4 backdrop-blur-sm md:p-16"
					onClick={() => setFullPreview(false)}
				>
					<ArrangeableImagePreview className="h-auto w-full md:w-96" src={src} />
				</div>
			)}
			<div className="group relative aspect-square max-h-full w-full shrink-0" ref={dragDropRef}>
				{dragging && (
					<div
						className="pointer-events-none absolute top-0 left-0 z-50 w-full rounded-md shadow-brand-1"
						style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
					>
						<ArrangeableImagePreview src={src} />
					</div>
				)}
				<ArrangeableImagePreview
					className={twMerge("transition-all", dragging && "brightness-50")}
					src={src}
				/>
				{uploading ? (
					<div
						className={twMerge(
							"absolute top-0 right-0 flex h-full w-full items-center justify-center rounded-md bg-black-90/50 p-2 backdrop-blur"
						)}
					>
						<TailCircleIcon className="h-10 w-10" />
					</div>
				) : (
					<div
						className={twMerge(
							"absolute top-0 right-0 p-2",
							currentItem ? "opacity-0" : "opacity-100"
						)}
					>
						<div className="flex items-center justify-center rounded-md bg-black-70/80 p-1 transition-all group-hocus-within:bg-black-70">
							<div className="flex w-0 items-center justify-center gap-2 opacity-0 transition-all group-hocus-within:w-fit group-hocus-within:pr-2 group-hocus-within:opacity-100">
								<button className="opacity-60 hocus:opacity-100" type="button" onClick={onDelete}>
									<TrashIcon className="h-4 w-4 text-white-20" />
								</button>
								<button
									className="opacity-60 hocus:opacity-100"
									type="button"
									onClick={() => {
										setFullPreview((fullPreview) => !fullPreview);
									}}
								>
									<PencilSquareIcon className="h-4 w-4 text-white-20" />
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

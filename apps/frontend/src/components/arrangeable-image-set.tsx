"use client";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { ImagePlus } from "lucide-react";

import { ArrangeableImage, ArrangeableImageProps } from "./arrangeable-image";

export type ArrangeableImageSetValue = Array<
	Omit<ArrangeableImageProps, "idx" | "moveImage" | "onDelete">
>;

export const ArrangeableImageSet: React.FC<{
	value: ArrangeableImageSetValue;
	onChange?: React.Dispatch<ArrangeableImageSetValue>;
	inputId: string;
}> = ({ inputId, value, onChange }) => {
	return (
		<DndProvider backend={HTML5Backend}>
			<div className="grid grid-cols-3 gap-2">
				{value.map((image, imageIndex) => (
					<ArrangeableImage
						{...image}
						idx={imageIndex}
						key={imageIndex}
						moveImage={(sourceIndex: number, targetIndex: number) => {
							const sourceItem = value[sourceIndex];
							const targetItem = value[targetIndex];

							const newValue = [...value];
							newValue[sourceIndex] = targetItem;
							newValue[targetIndex] = sourceItem;

							onChange?.(newValue);
						}}
						onDelete={() => {
							onChange?.(value.filter((_, index) => imageIndex !== index));
						}}
					/>
				))}
				<label
					className="focusable flex aspect-square h-full w-full cursor-pointer items-center justify-center rounded-md bg-brand-gradient"
					htmlFor={inputId}
					tabIndex={0}
				>
					<ImagePlus className="h-10 w-10 text-white-20" />
				</label>
			</div>
		</DndProvider>
	);
};

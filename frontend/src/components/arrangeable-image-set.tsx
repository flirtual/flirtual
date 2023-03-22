"use client";

import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { PlusIcon } from "@heroicons/react/24/outline";

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
				{value.map((image, imageIdx) => (
					<ArrangeableImage
						{...image}
						idx={imageIdx}
						key={imageIdx}
						moveImage={(sourceIdx: number, targetIdx: number) => {
							const sourceItem = value[sourceIdx];
							const targetItem = value[targetIdx];

							const newValue = [...value];
							newValue[sourceIdx] = targetItem;
							newValue[targetIdx] = sourceItem;

							onChange?.(newValue);
						}}
						onDelete={() => {
							onChange?.(value.filter((_, idx) => imageIdx !== idx));
						}}
					/>
				))}
				<label
					className="focusable flex aspect-square h-full w-full cursor-pointer items-center justify-center rounded-md bg-brand-gradient"
					htmlFor={inputId}
					tabIndex={0}
				>
					<PlusIcon className="h-10 w-10 text-white-20" />
				</label>
			</div>
		</DndProvider>
	);
};

import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,

	useSensor,
	useSensors
} from "@dnd-kit/core";
import type { UniqueIdentifier } from "@dnd-kit/core";
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	useSortable
} from "@dnd-kit/sortable";
import { Slot } from "@radix-ui/react-slot";
import { useEffect, useState } from "react";
import type { Dispatch, FC, PropsWithChildren } from "react";

export const SortableGrid: FC<
	PropsWithChildren<{
		values: Array<UniqueIdentifier>;
		onChange: Dispatch<Array<UniqueIdentifier>>;
		disabled?: boolean;
	}>
> = ({ values, onChange, disabled = false, children }) => {
	const [currentItem, setCurrentItem] = useState<UniqueIdentifier | null>(null);

	useEffect(() => setCurrentItem(null), [values]);

	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {})
	);

	return (
		<DndContext
			accessibility={{}}
			autoScroll={false}
			collisionDetection={closestCenter}
			sensors={sensors}
			onDragCancel={() => setCurrentItem(null)}
			onDragEnd={({ over }) => {
				setCurrentItem(null);

				if (over) {
					const overIndex = values.indexOf(over.id);

					if (currentItem && currentItem !== over.id) {
						const currentIndex = values.indexOf(currentItem);
						onChange(arrayMove(values, currentIndex, overIndex));
					}
				}
			}}
			onDragStart={({ active }) => {
				if (!active) return;
				setCurrentItem(active.id as string);
			}}
		>
			<SortableContext
				disabled={disabled}
				items={values}
				strategy={rectSortingStrategy}
			>
				{children}
			</SortableContext>
		</DndContext>
	);
};

export const SortableItem: FC<PropsWithChildren<{ id: UniqueIdentifier }>> = ({
	id,
	children
}) => {
	const {
		transform,
		transition,
		setNodeRef,
		attributes,
		listeners,
		isDragging
	} = useSortable({ id });

	return (
		<Slot
			suppressHydrationWarning
			style={
				{
					transition,
					transform: transform
						? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
						: undefined,
					transformOrigin: "0 0",
					zIndex: isDragging ? 100 : undefined,
					cursor: isDragging ? "grabbing" : "grab"
				} as React.CSSProperties
			}
			data-dragging={isDragging ? "" : undefined}
			ref={setNodeRef}
			{...attributes}
			{...listeners}
		>
			{children}
		</Slot>
	);
};

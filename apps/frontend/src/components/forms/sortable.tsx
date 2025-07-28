import {
	closestCenter,
	DndContext,
	DragOverlay,
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
import {
	createContext,

	use,
	useEffect,
	useMemo,
	useState
} from "react";
import type { Dispatch, FC, PropsWithChildren } from "react";
import { Portal } from "react-portal";

const CurrentSortableContext = createContext(
	{} as { currentItem: UniqueIdentifier | null }
);

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentSortableItem() {
	return use(CurrentSortableContext).currentItem;
}

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
		<CurrentSortableContext
			value={useMemo(() => ({ currentItem }), [currentItem])}
		>
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
					key={JSON.stringify(values)}
					disabled={disabled}
					items={values}
					strategy={rectSortingStrategy}
				>
					{children}
				</SortableContext>
			</DndContext>
		</CurrentSortableContext>
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
					transform: `translate3d(${
						transform ? `${Math.round(transform.x)}px` : 0
					}, ${transform ? `${Math.round(transform.y)}px` : undefined}, 0)
    scaleX(${transform?.scaleX ?? 1}) scaleY(${transform?.scaleY ?? 1})`,
					transformOrigin: "0 0"
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

export const SortableItemOverlay: FC<PropsWithChildren> = ({ children }) => {
	const currentId = useCurrentSortableItem();

	return (
		<Portal>
			<DragOverlay>{currentId && children}</DragOverlay>
		</Portal>
	);
};

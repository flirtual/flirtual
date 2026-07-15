import type { FC, PropsWithChildren, ReactElement } from "react";
import {
	Children,
	isValidElement,
	useLayoutEffect,
	useRef,
	useState
} from "react";
import { twMerge } from "tailwind-merge";

// Editable pills grow on hover to fit the edit icon, which can cause a
// flickering re-wrap. So we measure where the pills wrap initially and separate
// them into rows that overflow into the profile's padding on hover instead of
// wrapping. Single-pill lines stay full width so a long tag can still wrap its
// text.
export const PillRows: FC<
	PropsWithChildren<{ editable: boolean; className?: string }>
> = ({ children, editable, className }) => {
	if (!editable)
		return (
			<div className={twMerge("flex w-full flex-wrap gap-2", className)}>
				{children}
			</div>
		);

	return <MeasuredPillRows className={className}>{children}</MeasuredPillRows>;
};

const MeasuredPillRows: FC<PropsWithChildren<{ className?: string }>> = ({
	children,
	className
}) => {
	const reference = useRef<HTMLDivElement>(null);

	// eslint-disable-next-line react/no-children-to-array
	const items = Children.toArray(children).filter(isValidElement);
	const signature = items.map((item) => String(item.key)).join(" ");

	const [locked, setLocked] = useState<{
		signature: string;
		width: number;
		rows: Array<number>;
	} | null>(null);
	const measured = locked?.signature === signature;

	useLayoutEffect(() => {
		const container = reference.current;
		if (!container) return;

		// Re-measure when the container's width changes.
		const observer = new ResizeObserver(([entry]) => {
			const width = entry?.contentRect.width ?? 0;
			setLocked((previous) =>
				previous && Math.abs(previous.width - width) < 1 ? previous : null
			);
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	useLayoutEffect(() => {
		if (measured) return;
		const container = reference.current;
		if (!container) return;

		let previousTop: number | null = null;
		let row = -1;

		const rows = (Array.from(container.children) as Array<HTMLElement>).map(
			(child) => {
				if (child.offsetTop !== previousTop) {
					previousTop = child.offsetTop;
					row += 1;
				}
				return row;
			}
		);

		setLocked({ signature, width: container.clientWidth, rows });
	}, [measured, signature]);

	if (!measured || locked.rows.length !== items.length)
		return (
			<div
				className={twMerge("flex w-full flex-wrap gap-2", className)}
				ref={reference}
			>
				{children}
			</div>
		);

	const grouped: Array<Array<ReactElement>> = [];
	items.forEach((item, index) => {
		(grouped[locked.rows[index]] ??= []).push(item);
	});

	return (
		<div
			className={twMerge("flex w-full flex-col gap-2", className)}
			ref={reference}
		>
			{grouped.map((group) => (
				<div
					key={String(group[0].key)}
					className={twMerge("flex gap-2", group.length > 1 && "w-max")}
				>
					{group}
				</div>
			))}
		</div>
	);
};

import { m } from "motion/react";
import { useId } from "react";

export interface TabsProps<T extends string> {
	tabs: Array<{ id: T; label: string }>;
	value: T;
	onChange: (value: T) => void;
}

export function Tabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
	const layoutId = useId();
	const index = tabs.findIndex(({ id }) => id === value);

	function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		const next = {
			ArrowLeft: index - 1,
			ArrowRight: index + 1,
			Home: 0,
			End: tabs.length - 1
		}[event.key];

		if (next === undefined) return;
		event.preventDefault();

		const tab = tabs[(next + tabs.length) % tabs.length]!;
		onChange(tab.id);

		event.currentTarget
			.querySelector(`[data-tab="${tab.id}"]`)
			?.scrollIntoView({ block: "nearest", inline: "nearest" });
	}

	return (
		<div
			className="focusable-within relative isolate grid h-11 w-full shrink-0 cursor-pointer auto-cols-[minmax(max-content,1fr)] grid-flow-col items-center overflow-x-auto rounded-xl bg-white-30 shadow-brand-1 vision:bg-white-30/70 dark:bg-black-60"
			role="tablist"
			tabIndex={0}
			onKeyDown={onKeyDown}
		>
			{tabs.map(({ id, label }) => (
				<button
					key={id}
					aria-selected={id === value}
					className="relative flex h-full items-center justify-center rounded-xl px-4 focus:outline-none aria-selected:text-white-10 vision:text-black-80"
					data-tab={id}
					role="tab"
					tabIndex={-1}
					type="button"
					onClick={() => onChange(id)}
				>
					{id === value && (
						<m.div
							className="absolute inset-0 -z-10 rounded-xl bg-brand-gradient"
							layoutId={layoutId}
							transition={{ type: "spring", duration: 0.3, bounce: 0.25 }}
						/>
					)}
					{label}
				</button>
			))}
		</div>
	);
}

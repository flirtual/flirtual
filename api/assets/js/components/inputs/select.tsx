import React, { useCallback, useRef, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export interface SelectOption {
	key: string;
	label: string;
}

export type OptionWindowProps = Omit<React.ComponentProps<"div">, "onChange"> & {
	options: Array<SelectOption>;
	onChange: React.Dispatch<React.SetStateAction<Array<string>>>;
	onOptionClick?: React.EventHandler<
		React.MouseEvent<HTMLButtonElement> & { option: SelectOption }
	>;
};

export const OptionWindow = forwardRef<HTMLDivElement, OptionWindowProps>((props, ref) => {
	const { options, onChange, onOptionClick, ...elementProps } = props;
	const optionsRef = useRef<HTMLDivElement>(null);

	const focusOption = useCallback((direction: -1 | 1 | 0) => {
		const { current: root } = optionsRef;
		if (!root) return;

		if (!root.contains(document.activeElement) || !document.activeElement || direction === 0) {
			if (root.firstChild instanceof HTMLElement) root.firstChild.focus();
			return;
		}

		const sibling = document.activeElement[direction === -1 ? "previousSibling" : "nextSibling"];
		if (sibling instanceof HTMLElement) sibling.focus();
	}, []);

	return (
		<div
			{...elementProps}
			ref={ref}
			className={twMerge(
				"bg-brand-white shadow-brand-1 focus-within:ring-brand-coral focus:outline-none focus-within:ring-2 focus-within:ring-offset-2 w-full rounded-xl max-h-52 overflow-y-scroll overflow-x-hidden",
				elementProps.className
			)}
			onFocusCapture={(event) => {
				console.log("b")
				if (event.currentTarget !== event.target) return;
				focusOption(0);
			}}
			onKeyDown={(event) => {
				switch (event.key) {
					case "ArrowUp": {
						event.preventDefault();
						focusOption(-1);
						return;
					}
					case "ArrowDown": {
						event.preventDefault();
						focusOption(1);
						return;
					}
				}
			}}
		>
			<div className="flex flex-col w-full" ref={optionsRef}>
				{options.map((option) => (
					<button
						className="hover:bg-brand-grey focus:bg-brand-gradient focus:text-white focus:outline-none px-4 py-2 text-left"
						key={option.key}
						type="button"
						onClick={(event) => {
							onChange.call(null, (values) => [...values, option.key]);
							onOptionClick?.(Object.assign(event, { option }));
						}}
					>
						<span className="font-nunito text-lg">{option.label}</span>
					</button>
				))}
			</div>
		</div>
	);
});

export const Select: React.FC = () => {
	return (
		<div>
			<input />
		</div>
	);
};

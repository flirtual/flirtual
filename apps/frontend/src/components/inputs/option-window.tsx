import {
	ComponentProps,
	EventHandler,
	FC,
	FocusEvent,
	forwardRef,
	KeyboardEvent,
	MouseEvent,
	SyntheticEvent,
	useCallback,
	useEffect,
	useRef
} from "react";
import { twMerge } from "tailwind-merge";

import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";
import { InlineLink } from "../inline-link";

export interface InputSelectOption<K> {
	key: K;
	label: string;
	definition?: string;
	definitionLink?: string;
	active?: boolean;
}

export type InputOptionEvent<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends SyntheticEvent<any>,
	K
> = T & {
	option: InputSelectOption<K>;
};

export interface OptionItemProps<K> {
	option: InputSelectOption<K>;
	elementProps: {
		"data-key": K;
		"data-name": string;
		"data-active": boolean;
		onClick: EventHandler<MouseEvent<HTMLButtonElement>>;
		onFocus: EventHandler<FocusEvent<HTMLButtonElement>>;
	};
}

export type InputOptionWindowProps<K> = Omit<
	ComponentProps<"div">,
	"onChange"
> & {
	options: Array<InputSelectOption<K>>;
	OptionItem?: FC<OptionItemProps<K>>;
	onOptionClick?: EventHandler<
		InputOptionEvent<MouseEvent<HTMLButtonElement>, K>
	>;
	onOptionFocus?: EventHandler<
		InputOptionEvent<FocusEvent<HTMLButtonElement>, K>
	>;
};

function getFirstActiveElement(root: HTMLElement): HTMLElement {
	return (
		([...root.children] as Array<HTMLElement>).find(
			(element) => element.dataset.active === "true"
		) || (root.firstChild as HTMLElement)
	);
}

export function focusElementByKeydown({
	code,
	currentTarget
}: KeyboardEvent<HTMLDivElement>) {
	if (!code.startsWith("Key")) return;
	const key = code.slice(3).toLowerCase();
	const elements = currentTarget.querySelectorAll("*[data-key]");

	for (const element of elements) {
		if (
			!(element instanceof HTMLElement) ||
			!element.dataset.name?.toLowerCase().startsWith(key)
		)
			continue;

		element.focus({});
		return element;
	}
}

export const DefaultOptionItem: FC<OptionItemProps<unknown>> = (props) => {
	const { option, elementProps } = props;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					{...elementProps}
					type="button"
					className={twMerge(
						"px-4 py-2 text-left hocus:outline-none",
						option.active
							? "bg-brand-gradient text-white-20"
							: "text-black-70 focus:outline-none hocus:bg-white-40 dark:text-white-20 dark:hocus:bg-black-80/50 dark:hocus:text-white-20"
					)}
				>
					<span className="select-none font-nunito text-lg">
						{option.label}
					</span>
				</button>
			</TooltipTrigger>
			{(option.definition || option.definitionLink) && (
				<TooltipContent align="start">
					{option.definition}{" "}
					{option.definitionLink && (
						<InlineLink
							className="pointer-events-auto"
							href={option.definitionLink}
						>
							Learn more
						</InlineLink>
					)}
				</TooltipContent>
			)}
		</Tooltip>
	);
};

export const InputOptionWindow = forwardRef<
	HTMLDivElement,
	InputOptionWindowProps<unknown>
>((props, reference) => {
	const {
		options,
		onOptionClick,
		onOptionFocus,
		OptionItem = DefaultOptionItem,
		...elementProps
	} = props;
	const optionsReference = useRef<HTMLDivElement>(null);

	const focusOption = useCallback((target: -1 | 1 | 0) => {
		const { current: root } = optionsReference;
		if (!root) return;

		const firstActiveElement = getFirstActiveElement(root);
		if (
			!root.contains(document.activeElement) ||
			!document.activeElement ||
			target === 0
		) {
			if (root.firstChild instanceof HTMLElement) firstActiveElement.focus();
			return;
		}

		const sibling =
			document.activeElement[
				target === -1 ? "previousSibling" : "nextSibling"
			] ?? root[target === -1 ? "lastChild" : "firstChild"];
		if (sibling instanceof HTMLElement) sibling.focus();
	}, []);

	// useEffect(() => focusOption(0), [focusOption]);

	useEffect(() => {
		const { current: root } = optionsReference;
		if (!root) return;

		const activeElement = root.querySelector("*[data-active=true]");
		if (!activeElement || !(activeElement instanceof HTMLElement)) return;

		activeElement.focus({});

		// todo: this scrolls the entire page, not the container.
		// activeElement.scrollIntoView({ block: "start" });
	}, []);

	return (
		<div
			ref={reference}
			tabIndex={-1}
			className={twMerge(
				"focusable-within flex max-h-72 w-full overflow-x-hidden overflow-y-scroll rounded-xl bg-white-20 shadow-brand-1 dark:bg-black-70",
				elementProps.className
			)}
			onFocusCapture={(event) => {
				props.onFocusCapture?.(event);

				if (event.currentTarget !== event.target) return;
				focusOption(0);
			}}
			onKeyDown={(event) => {
				props.onKeyDown?.(event);
				focusElementByKeydown(event);

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
			<div className="flex w-full flex-col" ref={optionsReference}>
				{options.map((option) => {
					if (!option.key) return null;

					return (
						<OptionItem
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							key={option.key as any}
							option={option}
							elementProps={{
								"data-active": option.active ?? false,
								"data-key": option.key,
								"data-name": option.label,
								onClick: (event) =>
									onOptionClick?.(Object.assign(event, { option })),
								onFocus: (event) =>
									onOptionFocus?.(Object.assign(event, { option }))
							}}
						/>
					);
				})}
			</div>
		</div>
	);
});

import { useTranslations } from "next-intl";
import {
	type ComponentProps,
	type EventHandler,
	type FC,
	type FocusEvent,
	forwardRef,
	type KeyboardEvent,
	type MouseEvent,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useRef
} from "react";
import { twMerge } from "tailwind-merge";

import { InlineLink } from "../inline-link";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

export interface InputSelectOption<K> {
	key: K;
	label: string;
	definition?: string;
	definitionLink?: string;
	active?: boolean;
}

export type InputOptionEvent<
	T extends SyntheticEvent<any>,
	K
> = {
	option: InputSelectOption<K>;
} & T;

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

export type InputOptionWindowProps<K> = {
	options: Array<InputSelectOption<K>>;
	OptionItem?: FC<OptionItemProps<K>>;
	onOptionClick?: EventHandler<
		InputOptionEvent<MouseEvent<HTMLButtonElement>, K>
	>;
	onOptionFocus?: EventHandler<
		InputOptionEvent<FocusEvent<HTMLButtonElement>, K>
	>;
} & Omit<
	ComponentProps<"div">,
	"onChange"
>;

function getFirstActiveElement(root: HTMLElement): HTMLElement {
	return (
		([...root.children] as Array<HTMLElement>).find(
			(element) => element.dataset.active === "true"
		) || (root.firstChild as HTMLElement)
	);
}

function focusElementByKeydown({
	code,
	currentTarget
}: KeyboardEvent<HTMLDivElement>) {
	if (!code.startsWith("Key")) return;
	const key = code.slice(3).toLowerCase();
	const elements = currentTarget.querySelectorAll("*[data-key]");

	for (const element of elements) {
		if (
			!(element instanceof HTMLElement)
			|| !element.dataset.name?.toLowerCase().startsWith(key)
		)
			continue;

		element.focus({});
		return element;
	}
}

export const DefaultOptionItem: FC<OptionItemProps<unknown>> = (props) => {
	const { option, elementProps } = props;
	const t = useTranslations();

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					{...elementProps}
					className={twMerge(
						"px-4 py-2 text-left hocus:outline-none",
						option.active
							? "bg-brand-gradient text-white-20"
							: "text-black-70 focus:outline-none hocus:bg-white-40 dark:text-white-20 dark:hocus:bg-black-80/50 dark:hocus:text-white-20"
					)}
					type="button"
				>
					<span className="font-nunito text-lg">{option.label}</span>
				</button>
			</TooltipTrigger>
			{(option.definition || option.definitionLink) && (
				<TooltipContent align="start">
					{option.definition}
					{" "}
					{option.definitionLink && (
						<InlineLink
							className="pointer-events-auto"
							href={option.definitionLink}
						>
							{t("learn_more")}
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

	const focusOption = useCallback((target: -1 | 0 | 1) => {
		const { current: root } = optionsReference;
		if (!root) return;

		const firstActiveElement = getFirstActiveElement(root);
		if (
			!root.contains(document.activeElement)
			|| !document.activeElement
			|| target === 0
		) {
			if (root.firstChild instanceof HTMLElement) firstActiveElement.focus();
			return;
		}

		const sibling
			= document.activeElement[
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
			className={twMerge(
				"focusable-within flex max-h-72 w-full overflow-x-hidden overflow-y-scroll rounded-xl bg-white-20 shadow-brand-1 dark:bg-black-60",
				elementProps.className
			)}
			ref={reference}
			tabIndex={-1}
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
					}
				}
			}}
		>
			<div className="flex w-full flex-col" ref={optionsReference}>
				{options.map((option) => {
					if (!option.key) return null;

					return (
						<OptionItem
							elementProps={{
								"data-active": option.active ?? false,
								"data-key": option.key,
								"data-name": option.label,
								onClick: (event) =>
									onOptionClick?.(Object.assign(event, { option })),
								onFocus: (event) =>
									onOptionFocus?.(Object.assign(event, { option }))
							}}
							key={option.key as any}
							option={option}
						/>
					);
				})}
			</div>
		</div>
	);
});

InputOptionWindow.displayName = "InputOptionWindow";

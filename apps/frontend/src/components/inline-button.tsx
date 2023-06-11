import { twMerge } from "tailwind-merge";

type InlineButtonProps = React.ComponentProps<"button"> &
	Required<Pick<React.ComponentProps<"button">, "onClick">> & {
		highlight?: boolean;
	};

export const InlineButton: React.FC<InlineButtonProps> = ({
	highlight = true,
	...props
}) => (
	<button
		{...props}
		type="button"
		className={twMerge(
			"inline w-fit focus:outline-none hocus:underline",
			highlight && "text-theme-2",
			props.className
		)}
	/>
);

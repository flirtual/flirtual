import { twMerge } from "tailwind-merge";

type InlineButtonProps = {
	highlight?: boolean;
} &
React.ComponentProps<"button"> & Required<Pick<React.ComponentProps<"button">, "onClick">>;

export const InlineButton: React.FC<InlineButtonProps> = ({
	highlight = true,
	...props
}) => (
	<button
		{...props}
		className={twMerge(
			"inline w-fit focus:outline-none hocus:underline",
			highlight && "text-theme-2",
			props.className
		)}
		type="button"
	/>
);

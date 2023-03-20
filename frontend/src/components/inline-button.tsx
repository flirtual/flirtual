import { twMerge } from "tailwind-merge";

type InlineButtonProps = React.ComponentProps<"button"> &
	Required<Pick<React.ComponentProps<"button">, "onClick">>;

export const InlineButton: React.FC<InlineButtonProps> = (props) => (
	<button
		{...props}
		className={twMerge("inline w-fit focus:outline-none hocus:underline", props.className)}
		type="button"
	/>
);

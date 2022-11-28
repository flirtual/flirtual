import { twMerge } from "tailwind-merge";

export const Popover: React.FC<React.ComponentProps<"div">> = ({ children, ...props }) => {
	return (
		<div {...props} className={twMerge("group relative", props.className)}>
			{children}
		</div>
	);
};

export type PopoverModelProps = React.ComponentProps<"div"> & {
	size?: "base" | "sm";
	invert?: boolean;
};

export const PopoverModel: React.FC<PopoverModelProps> = (props) => {
	const { size = "base", invert = false, children, ...elementProps } = props;

	return (
		<div
			{...elementProps}
			className={twMerge(
				"pointer-events-none absolute -left-6 z-50 flex pt-2 opacity-0 transition-opacity group-hocus-within:pointer-events-auto group-hocus-within:opacity-100",
				props.className
			)}
		>
			<div
				className={twMerge(
					"flex w-max flex-col gap-4 font-medium shadow-brand-1",
					{
						sm: "py-2 px-3 rounded-lg text-sm",
						base: "py-4 px-6 text-base rounded-xl"
					}[size],
					invert ? "bg-black-70 text-white-20" : "bg-white-20 text-black-80"
				)}
			>
				{children}
			</div>
		</div>
	);
};

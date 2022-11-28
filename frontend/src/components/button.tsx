import { twMerge } from "tailwind-merge";

export type ButtonProps = React.ComponentProps<"button">;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
	return (
		<button
			{...props}
			// eslint-disable-next-line react/button-has-type
			type={props.type ?? "button"}
			className={twMerge(
				"rounded-xl bg-brand-gradient p-4 text-center font-montserrat text-xl font-semibold text-white-10 shadow-brand-1 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2  disabled:bg-black-60 disabled:bg-none",
				props.className
			)}
		>
			{children}
		</button>
	);
};

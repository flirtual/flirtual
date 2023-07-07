import Link, { LinkProps } from "next/link";
import { twMerge } from "tailwind-merge";

export type LandingButtonProps = React.PropsWithChildren<
	LinkProps & {
		kind: "primary" | "secondary" | "secondary-cta";
	}
>;

export const LandingButton: React.FC<LandingButtonProps> = (props) => (
	<Link
		{...props}
		className={twMerge(
			"focusable cursor-pointer rounded-xl text-center font-montserrat font-extrabold shadow-brand-1",
			{
				primary: "bg-brand-gradient p-4 w-48 text-2xl text-white-20",
				secondary: "text-theme-2 w-48 p-4 text-2xl bg-white-20",
				"secondary-cta": "text-theme-2 w-64 p-4 text-3xl bg-white-20"
			}[props.kind]
		)}
	>
		<span>{props.children}</span>
	</Link>
);

import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { isInternalHref } from "~/urls";

const buttonClassName =
	"focusable rounded-xl bg-brand-gradient p-4 text-center font-montserrat text-xl font-semibold text-white-10 shadow-brand-1 disabled:cursor-not-allowed disabled:brightness-90";

export type ButtonProps = React.ComponentProps<"button">;

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
	return (
		<button
			{...props}
			className={twMerge(buttonClassName, props.className)}
			// eslint-disable-next-line react/button-has-type
			type={props.type ?? "button"}
		>
			{children}
		</button>
	);
};

export type ButtonLinkProps = Parameters<typeof Link>[0];

export const ButtonLink: React.FC<ButtonLinkProps> = (props) => {
	return (
		<Link
			{...props}
			className={twMerge(buttonClassName, props.className)}
			target={props.target ?? isInternalHref(props.href) ? "_self" : "_blank"}
		/>
	);
};

import type { HTMLMotionProps } from "motion/react";

import { useFormContext } from "~/hooks/use-input-form";

import { Button } from "../button";

export const FormButton: React.FC<Parameters<typeof Button>[0]> = ({ children, ...props }) => {
	const { buttonProps } = useFormContext();

	return (
		<Button {...buttonProps as HTMLMotionProps<"button">} {...props}>
			{children ?? "Continue"}
		</Button>
	);
};

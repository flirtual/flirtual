import { useFormContext } from "~/hooks/use-input-form";

import { Button } from "../button";

export const FormButton: React.FC<Parameters<typeof Button>[0]> = ({ children, ...props }) => {
	const { buttonProps } = useFormContext();

	return (
		<Button {...buttonProps} {...props}>
			{children ?? "Continue"}
		</Button>
	);
};

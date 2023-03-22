import { useFormContext } from "~/hooks/use-input-form";

import { Button, ButtonProps } from "../button";

export const FormButton: React.FC<ButtonProps> = (props) => {
	const { buttonProps } = useFormContext();

	return (
		<Button {...buttonProps} {...props}>
			{props.children ?? "Continue"}
		</Button>
	);
};

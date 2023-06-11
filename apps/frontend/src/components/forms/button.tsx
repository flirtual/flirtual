import { Button } from "../button";

import { useFormContext } from "~/hooks/use-input-form";

export const FormButton: React.FC<Parameters<typeof Button>[0]> = (props) => {
	const { buttonProps } = useFormContext();

	return (
		<Button {...buttonProps} {...props}>
			{props.children ?? "Continue"}
		</Button>
	);
};

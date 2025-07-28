import type { HTMLMotionProps } from "motion/react";
import { useTranslation } from "react-i18next";

import { useFormContext } from "~/hooks/use-input-form";

import { Button } from "../button";

export const FormButton: React.FC<Parameters<typeof Button>[0]> = ({ children, ...props }) => {
	const { buttonProps, submitting } = useFormContext();
	const { t } = useTranslation();

	return (
		<Button
			{...buttonProps as HTMLMotionProps<"button">}
			{...props}
			pending={submitting}
			type="submit"
		>
			{!submitting && (children ?? t("continue"))}
		</Button>
	);
};

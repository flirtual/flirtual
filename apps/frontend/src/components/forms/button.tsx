import { Loader2 } from "lucide-react";
import type { HTMLMotionProps } from "motion/react";
import { useTranslations } from "next-intl";

import { useFormContext } from "~/hooks/use-input-form";

import { Button } from "../button";

export const FormButton: React.FC<Parameters<typeof Button>[0]> = ({ children, ...props }) => {
	const { buttonProps, submitting } = useFormContext();
	const t = useTranslations();

	return (
		<Button
			{...buttonProps as HTMLMotionProps<"button">}
			{...props}
			Icon={submitting ? Loader2 : props.Icon}
			iconClassName={submitting ? "animate-spin" : props.iconClassName}
			type="submit"
		>
			{!submitting && (children ?? t("continue"))}
		</Button>
	);
};

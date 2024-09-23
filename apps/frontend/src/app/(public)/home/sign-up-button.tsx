import { useTranslations } from "next-intl";

import { ButtonLink } from "~/components/button";
import { FlirtualMark } from "~/components/mark";
import { urls } from "~/urls";

import type { FC } from "react";

export const SignUpButton: FC = () => {
	const t = useTranslations("landing");

	return (
		<div className="group/mark relative">
			<FlirtualMark className="absolute right-1 top-0 w-16 origin-[bottom_center] rotate-[14deg] cursor-grab transition-all active:scale-x-110 active:scale-y-90 active:cursor-grabbing group-hocus-within/mark:-top-9" />
			<ButtonLink className="isolate" href={urls.register} kind="primary">
				{t("sign_up")}
			</ButtonLink>
		</div>
	);
};

import { EnvelopeIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useSupport } from "~/hooks/use-support";

import { InlineButton } from "../inline-button";
import { FooterListIconLink, FooterListLink } from "./footer";

export const FooterSupportLink: React.FC = () => {
	const { t } = useTranslation();

	return (
		<FooterListLink label={t("support")} onClick={useSupport().openSupport} />
	);
};

export const FooterIconSupportLink: React.FC = () => {
	return (
		<FooterListIconLink
			className="-mx-0.5 size-6 desktop:size-8"
			Icon={EnvelopeIcon}
			onClick={useSupport().openSupport}
		/>
	);
};

export const SupportButton: React.FC<{ className?: string; children?: ReactNode }> = ({
	className,
	children
}) => {
	const { t } = useTranslation();

	return (
		<InlineButton
			className={className}
			onClick={useSupport().openSupport}
		>
			{children || t("contact_us")}
		</InlineButton>
	);
};

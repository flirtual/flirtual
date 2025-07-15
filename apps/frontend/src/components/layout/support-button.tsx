"use client";

import { EnvelopeIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useFreshworks } from "~/hooks/use-freshworks";

import { InlineButton } from "../inline-button";
import { FooterListIconLink, FooterListLink } from "./footer";

export const FooterSupportLink: React.FC = () => {
	const { t } = useTranslation();

	return (
		<FooterListLink label={t("support")} onClick={useFreshworks().openFreshworks} />
	);
};

export const FooterIconSupportLink: React.FC = () => {
	return (
		<FooterListIconLink
			Icon={EnvelopeIcon}
			onClick={useFreshworks().openFreshworks}
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
			onClick={useFreshworks().openFreshworks}
		>
			{children || t("contact_us")}
		</InlineButton>
	);
};

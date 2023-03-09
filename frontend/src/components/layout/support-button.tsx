"use client";

import { EnvelopeIcon } from "@heroicons/react/24/solid";

import { useFreshworks } from "~/hooks/use-freshworks";

import { InlineButton } from "../inline-button";

import { FooterListIconLink, FooterListLink } from "./footer";

export const FooterSupportLink: React.FC = () => {
	return <FooterListLink label="Support" onClick={useFreshworks().openFreshworks} />;
};

export const FooterIconSupportLink: React.FC = () => {
	return <FooterListIconLink Icon={EnvelopeIcon} onClick={useFreshworks().openFreshworks} />;
};

export const HeaderSupportButton: React.FC = () => {
	return <InlineButton onClick={useFreshworks().openFreshworks}>Contact us</InlineButton>;
};

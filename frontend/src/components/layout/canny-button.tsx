"use client";

import { useCanny } from "~/hooks/use-canny";

import { FooterListLink } from "./footer";

export const FooterCannyLink: React.FC = () => {
	return <FooterListLink label="Feedback" onClick={useCanny().openFeedback} />;
};

export const ProfileNavigationCannyButton: React.FC = () => {
	return (
		<button
			data-canny-changelog
			className="w-full text-left font-montserrat font-semibold hover:text-theme-2"
			type="button"
		>
			Updates
		</button>
	);
};

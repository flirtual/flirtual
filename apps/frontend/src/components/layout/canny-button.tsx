"use client";

import { Newspaper } from "lucide-react";

import { useCanny } from "~/hooks/use-canny";

import { FooterListLink } from "./footer";

export const FooterCannyLink: React.FC = () => {
	return <FooterListLink label="Feedback" onClick={useCanny().openFeedback} />;
};

export const ProfileNavigationCannyButton: React.FC = () => {
	return (
		<button
			data-canny-changelog
			className="flex w-full items-center gap-5 py-2 text-left font-montserrat text-lg font-semibold hover:text-theme-2"
			type="button"
		>
			<Newspaper className="size-6" />
			Updates
		</button>
	);
};

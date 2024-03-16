import React from "react";
import { twMerge } from "tailwind-merge";

import { html } from "~/html";

export type HtmlProps = Omit<React.ComponentProps<"span">, "children"> & {
	children: string;
};

export const Html: React.FC<HtmlProps> = ({ children, ...props }) => (
	<span
		data-sentry-mask
		// "html" is a sanitization function, we explicitly declare
		// allowed tags, properties, and other various attributes.
		dangerouslySetInnerHTML={{ __html: html(children) }}
		className={twMerge(
			"prose vision:prose-invert dark:prose-invert",
			props.className
		)}
	/>
);

import React from "react";
import { twMerge } from "tailwind-merge";

import { html } from "~/html";

export type HtmlProps = Omit<React.ComponentProps<"span">, "children"> & {
	children: string;
};

export const Html: React.FC<HtmlProps> = ({ children, ...props }) => (
	<span
		className={twMerge("prose dark:prose-invert", props.className)}
		// "html" is a sanitization function, we explicitly declare
		// allowed tags, properties, and other various attributes.
		dangerouslySetInnerHTML={{ __html: html(children) }}
	/>
);

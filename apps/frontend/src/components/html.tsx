import type React from "react";
import { twMerge } from "tailwind-merge";

import { html } from "~/html";

export type HtmlProps = {
	children: string;
} & Omit<React.ComponentProps<"span">, "children">;

export const Html: React.FC<HtmlProps> = ({ children, ...props }) => (

	<span
		data-mask
		className={twMerge(
			"prose vision:prose-invert dark:prose-invert",
			props.className
		)}
		// "html" is a sanitization function, we explicitly declare
		// allowed tags, properties, and other various attributes.
		dangerouslySetInnerHTML={{ __html: html(children) }}
	/>
);

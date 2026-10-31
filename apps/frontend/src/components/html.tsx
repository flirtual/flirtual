import type React from "react";
import { twMerge } from "tailwind-merge";

import { html, markLowContrastColors } from "~/html";

import "./html.scss";

export type HtmlProps = {
	children: string;
} & Omit<React.ComponentProps<"span">, "children">;

export const Html: React.FC<HtmlProps> = ({ children, ...props }) => (

	<span
		data-mask
		className={twMerge(
			"prose dark:prose-invert vision:prose-invert",
			props.className
		)}
		// "html" is a sanitization function, we explicitly declare
		// allowed tags, properties, and other various attributes.
		// eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
		dangerouslySetInnerHTML={{ __html: markLowContrastColors(html(children)) }}
	/>
);

import type React from "react";
import { twMerge } from "tailwind-merge";

import { useTheme } from "~/hooks/use-theme";
import { html } from "~/html";

export type HtmlProps = {
	children: string;
} & Omit<React.ComponentProps<"span">, "children">;

export const Html: React.FC<HtmlProps> = ({ children, ...props }) => {
	const [theme] = useTheme();

	return (
		<span
			data-mask
			className={twMerge(
				"prose dark:prose-invert vision:prose-invert",
				props.className
			)}
			// "html" is a sanitization function, we explicitly declare
			// allowed tags, properties, and other various attributes.
			// eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
			dangerouslySetInnerHTML={{ __html: html(children, { theme }) }}
		/>
	);
};

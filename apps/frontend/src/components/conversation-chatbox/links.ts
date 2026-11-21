import type { TextBlock } from "@talkjs/react-components";

import { isEmbeddable } from "~/api/embed";

const maximumEmbeds = 3;

type TextNode = TextBlock["children"][number];

const isAutoLink = (node: Exclude<TextNode, string>) => node.type === "autoLink" || (node.type as string) === "autolink";

export function messageLinks(children: Array<TextNode>): Array<string> {
	const links: Array<string> = [];

	const visit = (nodes: Array<TextNode>) => {
		for (const node of nodes) {
			if (typeof node === "string") continue;
			if ((isAutoLink(node) || node.type === "link") && "url" in node && isEmbeddable(node.url) && !links.includes(node.url)) links.push(node.url);
			if ("children" in node) visit(node.children);
		}
	};

	visit(children);
	return links.slice(0, maximumEmbeds);
}

export function soleLink(children: Array<TextNode>): string | null {
	const nodes = children.filter((node) => typeof node !== "string" || node.trim());
	const [node] = nodes;
	return nodes.length === 1 && typeof node !== "string" && isAutoLink(node) && "url" in node && isEmbeddable(node.url) ? node.url : null;
}

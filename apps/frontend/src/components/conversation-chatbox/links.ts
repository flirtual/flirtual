import type { TextBlock } from "@talkjs/react-components";

import { isEmbeddable } from "~/api/embed";

const maximumEmbeds = 3;

type TextNode = TextBlock["children"][number];

export function messageLinks(children: Array<TextNode>): Array<string> {
	const links: Array<string> = [];

	const visit = (nodes: Array<TextNode>) => {
		for (const node of nodes) {
			if (typeof node === "string") continue;
			if ((node.type === "autoLink" || node.type === "link") && isEmbeddable(node.url) && !links.includes(node.url)) links.push(node.url);
			if ("children" in node) visit(node.children);
		}
	};

	visit(children);
	return links.slice(0, maximumEmbeds);
}

export function soleLink(children: Array<TextNode>): string | null {
	const nodes = children.filter((node) => typeof node !== "string" || node.trim());
	const [node] = nodes;
	return nodes.length === 1 && typeof node !== "string" && node.type === "autoLink" && isEmbeddable(node.url) ? node.url : null;
}

import { isEmbeddable } from "~/api/embed";

import type { MarkupLike } from "./markup";

const maximumEmbeds = 3;

type TextNode = MarkupLike;

const isAutoLink = (node: Exclude<TextNode, string>) => node.type === "autoLink" || node.type === "autolink";

export function messageLinks(children: Array<TextNode>): Array<string> {
	const links: Array<string> = [];

	const visit = (nodes: Array<TextNode>) => {
		for (const node of nodes) {
			if (typeof node === "string") continue;
			if ((isAutoLink(node) || node.type === "link") && node.url && isEmbeddable(node.url) && !links.includes(node.url)) links.push(node.url);
			if (node.children) visit(node.children);
		}
	};

	visit(children);
	return links.slice(0, maximumEmbeds);
}

export function soleLink(children: Array<TextNode>): string | null {
	const nodes = children.filter((node) => typeof node !== "string" || node.trim());
	const [node] = nodes;
	return nodes.length === 1 && typeof node !== "string" && isAutoLink(node) && node.url && isEmbeddable(node.url) ? node.url : null;
}

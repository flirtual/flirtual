import { customEmojis } from "./custom-emojis";

const shortcode = /:[\w+-]+:/g;
const emojiClass = "mx-[0.05em] inline-block size-[1.375em] align-[-0.3em] select-none";

const isEmoji = (node: Node): node is HTMLImageElement => node instanceof HTMLImageElement && node.dataset.emoji !== undefined;
const isSentinel = (node: Node) => node instanceof HTMLBRElement && (node.dataset.sentinel !== undefined || !node.nextSibling);

function length(node: Node): number {
	if (node.nodeType === Node.TEXT_NODE) return (node as Text).data.length;
	if (isEmoji(node)) return node.alt.length;
	if (isSentinel(node)) return 0;
	if (node instanceof HTMLBRElement) return 1;

	let total = 0;
	for (const child of node.childNodes) total += length(child);
	return total;
}

export function serialize(node: Node): string {
	if (node.nodeType === Node.TEXT_NODE) return (node as Text).data;
	if (isEmoji(node)) return node.alt;
	if (isSentinel(node)) return "";
	if (node instanceof HTMLBRElement) return "\n";

	let text = "";
	for (const child of node.childNodes) text += serialize(child);
	return text;
}

export function tokens(text: string): Array<{ emoji: string } | string> {
	const parts: Array<{ emoji: string } | string> = [];
	let offset = 0;

	for (const match of text.matchAll(shortcode)) {
		if (!customEmojis[match[0]]) continue;
		if (match.index > offset) parts.push(text.slice(offset, match.index));
		parts.push({ emoji: match[0] });
		offset = match.index + match[0].length;
	}

	if (offset < text.length) parts.push(text.slice(offset));
	return parts;
}

export function render(root: HTMLElement, text: string) {
	const nodes: Array<Node> = tokens(text).map((part) => {
		if (typeof part === "string") return document.createTextNode(part);

		const image = document.createElement("img");
		image.alt = part.emoji;
		image.src = customEmojis[part.emoji]!.url;
		image.className = emojiClass;
		image.draggable = false;
		image.dataset.emoji = "";
		return image;
	});

	if (text.endsWith("\n")) {
		const sentinel = document.createElement("br");
		sentinel.dataset.sentinel = "";
		nodes.push(sentinel);
	}

	root.replaceChildren(...nodes);
}

export function stale(root: HTMLElement, text: string): boolean {
	if (serialize(root) !== text) return true;
	if (text === "") return root.childNodes.length > 0;

	const last = root.lastChild;
	if (text.endsWith("\n") && !(last && isSentinel(last))) return true;

	return [...root.childNodes].some((node) => {
		if (node.nodeType === Node.TEXT_NODE) return tokens((node as Text).data).some((part) => typeof part !== "string");
		return !isEmoji(node) && !isSentinel(node);
	});
}

function offsetOf(root: HTMLElement, container: Node, offset: number): number {
	let total = 0;

	const walk = (node: Node): boolean => {
		if (node === container) {
			if (node.nodeType === Node.TEXT_NODE) total += offset;
			else for (const child of [...node.childNodes].slice(0, offset)) total += length(child);
			return true;
		}

		if (node.nodeType === Node.TEXT_NODE || isEmoji(node) || node instanceof HTMLBRElement) {
			total += length(node);
			return false;
		}

		for (const child of node.childNodes) if (walk(child)) return true;
		return false;
	};

	walk(root);
	return total;
}

export function selectionOffsets(root: HTMLElement): { from: number; to: number } | null {
	const selection = document.getSelection();
	if (!selection || selection.rangeCount === 0) return null;

	const range = selection.getRangeAt(0);
	if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;

	return {
		from: offsetOf(root, range.startContainer, range.startOffset),
		to: offsetOf(root, range.endContainer, range.endOffset)
	};
}

export function setCaret(root: HTMLElement, offset: number) {
	const selection = document.getSelection();
	if (!selection) return;

	let remaining = offset;
	let container: Node = root;
	let position = root.childNodes.length;

	for (const [index, node] of [...root.childNodes].entries()) {
		const size = length(node);

		if (node.nodeType === Node.TEXT_NODE && remaining <= size) {
			container = node;
			position = remaining;
			break;
		}

		if (remaining <= 0 || (isSentinel(node) && remaining === 0)) {
			position = index;
			break;
		}

		if (node.nodeType !== Node.TEXT_NODE && remaining < size) {
			position = index + 1;
			break;
		}

		remaining -= size;
	}

	const range = document.createRange();
	range.setStart(container, position);
	range.collapse(true);
	selection.removeAllRanges();
	selection.addRange(range);
}

export function selectedText(root: HTMLElement): string | null {
	const selection = document.getSelection();
	if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

	const range = selection.getRangeAt(0);
	if (!root.contains(range.commonAncestorContainer)) return null;

	return serialize(range.cloneContents());
}

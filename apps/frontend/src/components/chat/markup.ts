export type MarkupNode
	= | { type: "autoLink"; url: string; text: string }
		| { type: "bold" | "bulletList" | "bulletPoint" | "italic" | "strikethrough"; children: Array<MarkupNode> }
		| string;

export type MarkupLike = { type: string; children?: Array<MarkupLike>; url?: string; text?: string } | string;

export interface LinkSpan {
	start: number;
	length: number;
}

const marks = [
	["**", "bold"],
	["__", "bold"],
	["~~", "strikethrough"],
	["*", "italic"],
	["_", "italic"]
] as const;

const isSpace = (character: string | undefined) => character === undefined || /\s/.test(character);
const isBoundary = (character: string | undefined) => character === undefined || /[\s\p{P}\p{S}]/u.test(character);

function push(nodes: Array<MarkupNode>, node: MarkupNode) {
	if (node === "") return;

	const last = nodes.at(-1);
	if (typeof node === "string" && typeof last === "string") nodes[nodes.length - 1] = last + node;
	else nodes.push(node);
}

function closingMark(text: string, mark: string, from: number): number {
	const character = mark[0]!;
	let end = from;

	for (;;) {
		end = text.indexOf(mark, end + 1);
		if (end === -1) return -1;
		if (mark.length === 1 && (text[end - 1] === character || text[end + 1] === character)) continue;

		while (text[end + mark.length] === character) end++;
		if (!isSpace(text[end - 1]) && isBoundary(text[end + mark.length])) return end;
	}
}

function markAt(text: string, index: number) {
	if (!isBoundary(text[index - 1])) return;

	for (const [mark, type] of marks) {
		const start = index + mark.length;
		if (!text.startsWith(mark, index) || isSpace(text[start]) || (mark.length === 1 && text[start] === mark)) continue;

		const end = closingMark(text, mark, start);
		if (end !== -1 && !text.slice(start, end).includes("\n")) return { type, start, end, next: end + mark.length };
	}
}

function parseMarks(text: string): Array<MarkupNode> {
	const nodes: Array<MarkupNode> = [];
	let index = 0;

	while (index < text.length) {
		const mark = markAt(text, index);
		if (mark) {
			push(nodes, { type: mark.type, children: parseMarks(text.slice(mark.start, mark.end)) });
			index = mark.next;
			continue;
		}

		push(nodes, text[index]!);
		index++;
	}

	return nodes;
}

function parseInline(text: string, offset: number, links: ReadonlyArray<LinkSpan>): Array<MarkupNode> {
	const nodes: Array<MarkupNode> = [];
	let position = 0;

	for (const { start, length } of links) {
		const from = start - offset;
		if (from < position || from + length > text.length) continue;

		for (const node of parseMarks(text.slice(position, from))) push(nodes, node);
		const link = text.slice(from, from + length);
		push(nodes, { type: "autoLink", url: /^https?:\/\//i.test(link) ? link : `https://${link}`, text: link });
		position = from + length;
	}

	for (const node of parseMarks(text.slice(position))) push(nodes, node);
	return nodes;
}

const bullet = /^\s*[-*] +(?=\S)/;

export function parseMarkup(text: string, links: ReadonlyArray<LinkSpan> = []): Array<MarkupNode> {
	const nodes: Array<MarkupNode> = [];
	let paragraph: { start: number; lines: Array<string> } | null = null;
	let points: Array<{ start: number; text: string }> = [];

	const flushParagraph = () => {
		if (!paragraph) return;
		for (const node of parseInline(paragraph.lines.join("\n"), paragraph.start, links)) push(nodes, node);
		paragraph = null;
	};

	const flushPoints = () => {
		if (points.length === 0) return;
		nodes.push({ type: "bulletList", children: points.map(({ start, text }) => ({ type: "bulletPoint", children: parseInline(text, start, links) })) });
		points = [];
	};

	let start = 0;
	for (const line of text.split("\n")) {
		const marker = bullet.exec(line);
		if (marker) {
			flushParagraph();
			points.push({ start: start + marker[0].length, text: line.slice(marker[0].length) });
		}
		else {
			flushPoints();
			paragraph ??= { start, lines: [] };
			paragraph.lines.push(line);
		}

		start += line.length + 1;
	}

	flushParagraph();
	flushPoints();
	return nodes;
}

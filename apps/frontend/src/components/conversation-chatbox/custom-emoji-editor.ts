import { customEmojis } from "~/hooks/use-talkjs";

// Subset of TalkJS's ProseMirror editor.
interface Node {
	type: NodeType;
	isText: boolean;
	text?: string;
}

interface NodeType {
	create: (attributes: Record<string, string>, content: Node) => Node;
}

interface Transaction {
	replaceWith: (from: number, to: number, node: Node) => Transaction;
	replaceSelectionWith: (node: Node, inheritMarks: boolean) => Transaction;
	scrollIntoView: () => Transaction;
}

interface View {
	state: {
		schema: { nodes: Record<string, NodeType | undefined>; text: (text: string) => Node };
		doc: { descendants: (visit: (node: Node, position: number) => boolean | void) => void };
		tr: Transaction;
	};
	dispatch: (transaction: Transaction) => void;
	focus: () => void;
}

interface EditorInternals {
	editorView?: View;
	setText: (text: string) => void;
}

interface Fiber {
	return?: Fiber;
	memoizedProps?: { value?: unknown };
}

function isEditorInternals(value: unknown): value is EditorInternals {
	return !!value && typeof value === "object" && "editorView" in value && "setText" in value && typeof value.setText === "function";
}

// TalkJS only exposes its editor through a React context, so this walks up the element's React fiber
// to it. If a TalkJS update moves it, custom emoji go in as plain shortcodes.
function editorInternals(element: Element): EditorInternals | undefined {
	const key = Object.keys(element).find((key) => key.startsWith("__reactFiber$"));
	let fiber = key ? (element as unknown as Record<string, Fiber | undefined>)[key] : undefined;

	for (let depth = 0; fiber && depth < 40; depth++, fiber = fiber.return) {
		const value = fiber.memoizedProps?.value;
		if (isEditorInternals(value)) return value;

		const internals = value && typeof value === "object" && "editorInternals" in value ? value.editorInternals : undefined;
		if (isEditorInternals(internals)) return internals;
	}

	return undefined;
}

// Draws the picture, and holds the shortcode as the text that's sent.
function customEmojiNode(view: View, name: string): Node | undefined {
	const emoji = customEmojis[name];
	const { schema } = view.state;
	return emoji && schema.nodes.customemoji?.create({ name, url: emoji.url }, schema.text(name));
}

function showCustomEmoji(view: View) {
	const type = view.state.schema.nodes.customemoji;
	if (!type) return;

	const found: Array<{ from: number; to: number; node: Node }> = [];
	view.state.doc.descendants((node, position) => {
		if (node.type === type) return false;
		if (!node.isText || !node.text) return;

		for (const { 0: name, index } of node.text.matchAll(/:[^:\s]+:/g)) {
			const emoji = customEmojiNode(view, name);
			if (emoji) found.push({ from: position + index, to: position + index + name.length, node: emoji });
		}
	});
	if (found.length === 0) return;

	let transaction = view.state.tr;
	for (const { from, to, node } of found.reverse()) transaction = transaction.replaceWith(from, to, node);
	view.dispatch(transaction);
}

export function insertCustomEmoji(editor: Element, name: string): boolean {
	const view = editorInternals(editor)?.editorView;
	const node = view && customEmojiNode(view, name);
	if (!view || !node) return false;

	view.dispatch(view.state.tr.replaceSelectionWith(node, false).scrollIntoView());
	view.focus();
	return true;
}

const wrapped = new WeakSet<object>();

// Shows custom emoji in drafts and messages being edited. Older messages may hold TalkJS's own
// `<!!customemoji::name:>` markup, which the editor throws on ("Something went wrong").
function wrapSetText(internals: EditorInternals) {
	const prototype = Object.getPrototypeOf(internals) as EditorInternals;
	if (wrapped.has(prototype)) return;
	wrapped.add(prototype);

	const setText = prototype.setText;
	prototype.setText = function (this: EditorInternals, text: string) {
		setText.call(this, text.replaceAll(/<!!customemoji:(.*?)>/g, "$1"));
		if (this.editorView) showCustomEmoji(this.editorView);
	};
}

export function followEditors(container: HTMLElement): () => void {
	const seen = new WeakSet<Element>();

	const follow = () => {
		for (const editor of container.querySelectorAll(".chat-editor")) {
			if (seen.has(editor)) continue;

			const internals = editorInternals(editor);
			if (!internals) continue;
			wrapSetText(internals);

			// A draft may have been restored before setText was wrapped.
			if (!internals.editorView) continue;
			seen.add(editor);
			showCustomEmoji(internals.editorView);
		}
	};

	const observer = new MutationObserver(follow);
	observer.observe(container, { childList: true, subtree: true });
	follow();

	return () => observer.disconnect();
}

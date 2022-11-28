import React, { useMemo } from "react";
import { Editable, Slate, useSlate, withReact } from "slate-react";
import { Editor, Transforms, createEditor, Descendant, Element as SlateElement } from "slate";
import { withHistory } from "slate-history";
import isHotkey from "is-hotkey";
import { twMerge } from "tailwind-merge";
import { CodeBracketIcon } from "@heroicons/react/24/outline";

import { IconComponent } from "../icons";
import {
	FormatBoldIcon,
	FormatItalicIcon,
	FormatStrikethroughIcon,
	FormatUnderlineIcon
} from "../icons/format";

export type EditorFormat = "bold" | "italic" | "underline" | "strikethrough" | "code";

export interface EditorElement {
	type: "paragraph";
	children: Array<EditorText>;
}
export type EditorText = { text: string } & { [K in EditorFormat]?: true };

declare module "slate" {
	export interface CustomTypes {
		Element: EditorElement;
		Text: EditorText;
	}
}

export type EditorButtonProps = {
	Icon: IconComponent;
	kind: "mark" | "block";
	format: EditorFormat;
} & React.ComponentProps<"button">;

const EditorButton: React.FC<EditorButtonProps> = ({ kind, format, Icon, ...props }) => {
	const editor = useSlate();

	const active = !!editor.marks?.[format];

	return (
		<button
			{...props}
			className={twMerge("", props.className)}
			type="button"
			onClick={() => {
				editor.marks?.[format] === true ? editor.removeMark(format) : editor.addMark(format, true);
			}}
		>
			<Icon className="h-6 w-6" strokeWidth={active ? 2 : 1} />
		</button>
	);
};

const toggleBlock = (editor: Editor, format: any) => {
	const isActive = isBlockActive(
		editor,
		format,
		TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
	);
	const isList = LIST_TYPES.includes(format);

	Transforms.unwrapNodes(editor, {
		match: (n) =>
			!Editor.isEditor(n) &&
			SlateElement.isElement(n) &&
			LIST_TYPES.includes(n.type) &&
			!TEXT_ALIGN_TYPES.includes(format),
		split: true
	});
	let newProperties: Partial<SlateElement>;
	if (TEXT_ALIGN_TYPES.includes(format)) {
		newProperties = {
			align: isActive ? undefined : format
		};
	} else {
		newProperties = {
			type: isActive ? "paragraph" : isList ? "list-item" : format
		};
	}
	Transforms.setNodes<SlateElement>(editor, newProperties);

	if (!isActive && isList) {
		const block = { type: format, children: [] };
		Transforms.wrapNodes(editor, block);
	}
};

const isBlockActive = (editor: Editor, format: any, blockType = "type") => {
	const { selection } = editor;
	if (!selection) return false;

	const [match] = Array.from(
		Editor.nodes(editor, {
			at: Editor.unhangRange(editor, selection),
			match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n[blockType] === format
		})
	);

	return !!match;
};

const Element = ({ attributes, children, element }: any) => {
	const style = { textAlign: element.align };
	switch (element.type) {
		case "block-quote":
			return (
				<blockquote style={style} {...attributes}>
					{children}
				</blockquote>
			);
		case "bulleted-list":
			return (
				<ul style={style} {...attributes}>
					{children}
				</ul>
			);
		case "heading-one":
			return (
				<h1 style={style} {...attributes}>
					{children}
				</h1>
			);
		case "heading-two":
			return (
				<h2 style={style} {...attributes}>
					{children}
				</h2>
			);
		case "list-item":
			return (
				<li style={style} {...attributes}>
					{children}
				</li>
			);
		case "numbered-list":
			return (
				<ol style={style} {...attributes}>
					{children}
				</ol>
			);
		default:
			return (
				<p style={style} {...attributes}>
					{children}
				</p>
			);
	}
};

const LIST_TYPES = ["numbered-list", "bulleted-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];

const hotkeys = {
	"mod+b": "bold",
	"mod+i": "italic",
	"mod+u": "underline",
	"mod+`": "code"
};

const EditorToolbar: React.FC = () => {
	return (
		<div className="flex gap-2 p-4">
			<EditorButton format="bold" Icon={FormatBoldIcon} kind="mark" />
			<EditorButton format="italic" Icon={FormatItalicIcon} kind="mark" />
			<EditorButton format="underline" Icon={FormatUnderlineIcon} kind="mark" />
			<EditorButton format="strikethrough" Icon={FormatStrikethroughIcon} kind="mark" />
			<EditorButton format="code" Icon={CodeBracketIcon} kind="mark" />
		</div>
	);
};

const EditorContent: React.FC = () => {
	const editor = useSlate();

	return (
		<Editable
			autoFocus
			spellCheck
			className="prose p-4 pt-0 "
			placeholder="Enter some rich text…"
			renderElement={Element}
			renderLeaf={({ leaf, children, attributes }) => {
				if (leaf.bold) children = <strong>{children}</strong>;
				if (leaf.italic) children = <em>{children}</em>;
				if (leaf.underline) children = <u>{children}</u>;
				if (leaf.strikethrough) children = <s>{children}</s>;
				if (leaf.code) children = <code>{children}</code>;

				return <span {...attributes}>{children}</span>;
			}}
			onKeyDown={(event) => {
				Object.entries(hotkeys).forEach(([hotkey, format]) => {
					if (!isHotkey(hotkey, event)) return;
					event.preventDefault();

					editor.marks?.[format as EditorFormat] === true
						? editor.removeMark(format)
						: editor.addMark(format, true);
				});
			}}
		/>
	);
};

export const InputEditor: React.FC = () => {
	const editor = useMemo(() => withHistory(withReact(createEditor())), []);

	return (
		<Slate editor={editor} value={initialValue}>
			<div className="flex flex-col overflow-hidden rounded-xl bg-white-50 shadow-brand-1">
				<EditorToolbar />
				<EditorContent />
			</div>
		</Slate>
	);
};

const initialValue: Array<Descendant> = [
	{
		type: "paragraph",
		children: [
			{ text: "This is editable " },
			{ text: "rich", bold: true },
			{ text: " text, " },
			{ text: "much", italic: true },
			{ text: " better than a " },
			{ text: "<textarea>", code: true },
			{ text: "!" }
		]
	},
	{
		type: "paragraph",
		children: [
			{
				text: "Since it's rich text, you can do things like turn a selection of text "
			},
			{ text: "bold", bold: true },
			{
				text: ", or add a semantically rendered block quote in the middle of the page, like this:"
			}
		]
	},
	{
		type: "block-quote",
		children: [{ text: "A wise quote." }]
	},
	{
		type: "paragraph",
		children: [{ text: "Try it out for yourself!" }]
	}
];

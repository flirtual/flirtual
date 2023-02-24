"use client";

import dynamic from "next/dynamic";

import { editorColors } from "~/html";

import "./style.scss";

// Quill throws an error on the server if imported directly,
// so we lazily import it, which only renders when needed on client.
const ReactQuill = dynamic(async () => {
	const ReactQuill = (await import("react-quill")).default;
	const { Quill } = ReactQuill;

	// Use inline styles instead of Quill's classnames,
	// which are not available in other pages.
	const AlignStyle = Quill.import("attributors/style/align");
	Quill.register(AlignStyle);

	return ReactQuill;
});

export interface InputEditorProps {
	value: string;
	onChange: React.Dispatch<string>;
}

export const InputEditor: React.FC<InputEditorProps> = ({ value, onChange }) => {
	return (
		<ReactQuill
			className="prose"
			value={value}
			formats={[
				"header",
				"bold",
				"italic",
				"underline",
				"strike",
				"color",
				"background",
				"list",
				"blockquote",
				"code-block",
				"align",
				"code",
				"script",
				"indent",
				"direction",
				"link",
				"clean"
			]}
			modules={{
				toolbar: [
					["bold", "italic", "underline", { header: 3 }],
					[{ color: editorColors }, { background: editorColors }],
					[{ list: "ordered" }, { list: "bullet" }],
					["blockquote"],
					[{ align: [] }]
				]
			}}
			onChange={(value) => onChange(value)}
		/>
	);
};

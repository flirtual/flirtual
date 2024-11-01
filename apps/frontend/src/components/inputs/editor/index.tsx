import dynamic from "next/dynamic";
import type React from "react";

import { editorColors } from "~/html";

import { EditorSkeleton } from "./skeleton";

import "./style.scss";

// Quill throws an error on the server if imported directly,
// so we lazily import it, which only renders when needed on client.
const ReactQuill = dynamic(
	async () => {
		const ReactQuill = (await import("react-quill-new")).default;
		const { Quill } = ReactQuill;

		// Use inline styles instead of Quill's classnames,
		// which are not available in other pages.
		const AlignStyle = Quill.import("attributors/style/align");
		// @ts-expect-error: Broken types in migration to v3.
		Quill.register(AlignStyle);

		return ReactQuill;
	},
	{ ssr: false, loading: () => <EditorSkeleton /> }
);

export interface InputEditorProps {
	value: string;
	onChange: React.Dispatch<string>;
}

export const InputEditor: React.FC<InputEditorProps> = ({
	value,
	onChange
}) => {
	return (
		<ReactQuill
			data-sentry-block
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
				"align"
			]}
			modules={{
				toolbar: [
					[{ header: 3 }],
					["bold", "italic", "underline"],
					[{ color: editorColors }, { background: editorColors }],
					[{ list: "ordered" }],
					["blockquote"],
					[{ align: [] }]
				]
			}}
			className="prose max-w-none dark:prose-invert [&_*]:!select-auto"
			value={value}
			onChange={(value) => onChange(value)}
		/>
	);
};

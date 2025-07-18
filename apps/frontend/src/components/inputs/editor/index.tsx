import type React from "react";
import { lazy } from "react";

import { editorColors } from "~/html";

import { EditorSkeleton } from "./skeleton";

import "./style.scss";

const ReactQuill = lazy(
	async () => {
		const ReactQuill = (await import("react-quill-new")).default;
		const { Quill } = ReactQuill;

		// Use inline styles instead of Quill's classnames,
		// which are not available in other pages.
		const AlignStyle = Quill.import("attributors/style/align");
		// @ts-expect-error: Broken types in migration to v3.
		Quill.register(AlignStyle);

		return { default: ReactQuill };
	},
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
			data-block
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

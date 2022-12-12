// eslint-disable-next-line import/named
import ReactQuill, { Quill } from "react-quill";

import { editorColors } from "~/html";

import "./style.scss";

// use inline styles instead of quill's classnames,
// which aren't available in other pages.
const AlignStyle = Quill.import("attributors/style/align");
Quill.register(AlignStyle);

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

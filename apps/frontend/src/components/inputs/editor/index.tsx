import type React from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { contentLength, editorColors } from "~/html";
import { lazy } from "~/lazy";

import "./style.scss";

const ReactQuill = lazy(
	async () => {
		const ReactQuill = (await import("react-quill-new")).default;
		const { Quill } = ReactQuill;

		// Use inline styles instead of Quill's classnames,
		// which are not available in other pages.
		const AlignStyle = Quill.import("attributors/style/align");
		// @ts-expect-error: Broken types in migration to v3.
		Quill.register(AlignStyle, true);

		return ReactQuill;
	},
);

export interface InputEditorProps {
	value: string;
	onChange: React.Dispatch<string>;
	maxLength?: number;
	showCountAbove?: number;
}

export const InputEditor: React.FC<InputEditorProps> = ({
	value,
	onChange,
	maxLength,
	showCountAbove
}) => {
	const { t } = useTranslation();

	const length = maxLength === undefined ? 0 : contentLength(value);

	const tooLong = maxLength !== undefined && length > maxLength;
	const showCount
		= maxLength !== undefined
			&& (showCountAbove === undefined || length > showCountAbove);

	return (
		<div className="flex flex-col gap-1">
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
				// Restore the pre-3.7.0 serializer: since 3.7.0 onChange returns
				// editor.getSemanticHTML() instead of editor.root.innerHTML.
				// https://github.com/VaguelySerious/react-quill/commit/d905530c1b19339948164673206150adb5435827
				useSemanticHTML={false}
				value={value}
				onChange={(value) => onChange(value)}
			/>
			{showCount && (
				<div className="flex items-center gap-2 font-nunito text-sm">
					{tooLong && (
						<span className="text-red-600 dark:text-red-400">
							{t("errors.should_be_at_most_{count}_character(s)" as never, {
								count: maxLength
							})}
						</span>
					)}
					<span
						className={twMerge(
							"ml-auto tabular-nums text-black-60 dark:text-white-50",
							tooLong && "text-red-600 dark:text-red-400"
						)}
					>
						{length}
						{" / "}
						{maxLength}
					</span>
				</div>
			)}
		</div>
	);
};

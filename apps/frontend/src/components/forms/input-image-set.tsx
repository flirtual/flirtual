import { Dispatch } from "react";

import { api } from "~/api";
import { useSessionUser } from "~/hooks/use-session";

import { ArrangeableImageSet } from "../arrangeable-image-set";
import { InputFile } from "../inputs";

export interface ImageSetValue {
	id: string | null;
	file: File | null;
	src: string;
}

export interface InputImageSetProps {
	value: Array<ImageSetValue>;
	onChange: Dispatch<Array<ImageSetValue>>;
	id: string;
	type?: "profile" | "report";
}

export const InputImageSet: React.FC<InputImageSetProps> = (props) => {
	const { value, id, onChange, type = "profile" } = props;
	const user = useSessionUser();

	return (
		<>
			<ArrangeableImageSet
				inputId={id}
				value={value.map((image) => ({
					src: image.src,
					uploading: !!image.file
				}))}
				onChange={(arrayValue) =>
					onChange(
						arrayValue.map(({ src }) => value.find((a) => a.src === src)!)
					)
				}
			/>
			<InputFile
				multiple
				accept="image/*"
				className="hidden"
				id={id}
				onChange={async (files) => {
					if (!user) return;

					onChange([
						...value,
						...files.map((file) => ({
							id: null,
							file,
							src: URL.createObjectURL(file)
						}))
					]);

					const newImages =
						type === "report"
							? await api.report.uploadImages({
									body: files
								})
							: await api.user.profile.images.upload(user.id, {
									body: files
								});

					onChange([
						...value.filter((image) => "id" in image),
						...newImages.map((image) => ({
							id: image.id,
							file: null,
							src: image.url
						}))
					]);
				}}
			/>
		</>
	);
};

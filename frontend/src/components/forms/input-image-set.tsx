import { Dispatch } from "react";

import { api } from "~/api";
import { useCurrentUser } from "~/hooks/use-current-user";
import { urls } from "~/urls";

import { ArrangeableImageSet } from "../arrangeable-image-set";
import { InputFile } from "../inputs";

export interface ImageSetValue {
	id: string | null;
	fileId: string | null;
	file: File | null;
	src: string;
}

export interface InputImageSetProps {
	value: Array<ImageSetValue>;
	onChange: Dispatch<Array<ImageSetValue>>;
	id: string;
}

export const InputImageSet: React.FC<InputImageSetProps> = (props) => {
	const { value, id, onChange } = props;

	const { data: user } = useCurrentUser();

	return (
		<>
			<ArrangeableImageSet
				inputId={id}
				value={value.map((image) => ({
					src: image.src,
					uploading: !!image.file
				}))}
				onChange={(arrValue) =>
					onChange(
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						arrValue.map(({ src }) => value.find((a) => a.src === src)!)
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
							fileId: null,
							file,
							src: URL.createObjectURL(file)
						}))
					]);

					const newImages = await api.user.profile.images.upload(user.id, files);

					onChange([
						...value.filter((image) => "id" in image),
						...newImages.map((image) => ({
							id: image.id,
							fileId: image.externalId,
							file: null,
							src: urls.media(image.externalId)
						}))
					]);
				}}
			/>
		</>
	);
};

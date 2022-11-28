import { fetch, FetchOptions } from "../..";
import { FileUploadOptions, upload as uploadFiles } from "../../file";

export async function upload(
	userId: string,
	files: Array<File>,
	options: FetchOptions & { uploadOptions?: FileUploadOptions } = {}
) {
	const imageIds = await uploadFiles(files, options.uploadOptions);

	await fetch("post", `users/${userId}/profile/images`, {
		...options,
		body: { imageIds }
	});
}

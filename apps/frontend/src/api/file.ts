import { uploadcarePublicKey } from "~/const";

export interface FileUploadOptions {
	store?: boolean;
}

export async function upload(
	files: Array<File>,
	options: FileUploadOptions = {}
): Promise<Array<string>> {
	const body = new FormData();

	body.append("UPLOADCARE_PUB_KEY", uploadcarePublicKey);
	if (options.store) body.append("UPLOADCARE_STORE", "1");

	files.forEach((file) => body.append(file.name, file));

	const response = await fetch("https://upload.uploadcare.com/base/", {
		method: "post",
		body
	});

	if (!response.ok) throw new Error("File upload failed");
	return Object.values((await response.json()) as Record<string, string>);
}

export async function uploadOne(
	file: File,
	options: FileUploadOptions = {}
): Promise<Array<string>> {
	return upload([file], options);
}

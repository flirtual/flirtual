import { fetch, NarrowFetchOptions } from "./exports";
import { ProfileImage } from "./user/profile/images";

export async function get(
	imageId: string,
	options: NarrowFetchOptions = {}
): Promise<ProfileImage> {
	return fetch<ProfileImage>("get", `images/${imageId}`, options);
}

export { _delete as delete };
async function _delete(
	imageId: string,
	options: NarrowFetchOptions = {}
): Promise<ProfileImage> {
	return fetch<ProfileImage>("delete", `images/${imageId}`, options);
}

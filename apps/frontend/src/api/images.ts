import { api } from "~/api/common";

export const Image = {
	upload() {
		return api
			.url("images")
			.post()
			.json<{ id: string; signedUrl: string }>();
	}
};

import { api } from "~/api/common";

export const Image = {
	upload() {
		return api
			.url("images")
			.post()
			.json<{ id: string; uploadUrl: string; uploadToken: string }>();
	}
};

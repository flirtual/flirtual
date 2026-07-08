import { api } from "~/api/common";

export const Image = {
	upload(sbs?: boolean) {
		return api
			.url("images")
			.json({ sbs: sbs === true })
			.post()
			.json<{ id: string; signedUrl: string }>();
	}
};

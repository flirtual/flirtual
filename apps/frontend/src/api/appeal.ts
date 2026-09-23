import { api } from "./common";

export const Appeal = {
	api: api.url("appeals"),
	create(message: string) {
		return this.api.json({ message }).post().res();
	}
};

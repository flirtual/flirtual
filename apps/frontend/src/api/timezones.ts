import { api } from "./common";

export interface Timezone {
	id: string;
	offset: number;
}

export async function listTimezones(): Promise<Array<Timezone>> {
	return api.url("timezones").get().json<Array<Timezone>>();
}

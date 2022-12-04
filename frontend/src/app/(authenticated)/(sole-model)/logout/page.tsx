import { redirect } from "next/navigation";

import { api } from "~/api";
import { urls } from "~/pageUrls";
import { thruServerCookies } from "~/server-utilities";

export default async function LogoutPage() {
	await api.auth.logout(thruServerCookies()).catch(() => null);
	redirect(urls.login());

	return null;
}

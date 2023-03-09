import { redirect } from "next/navigation";

import { api } from "~/api";
import { thruServerCookies } from "~/server-utilities";
import { urls } from "~/urls";

export default async function LogoutPage() {
	await api.auth.logout(thruServerCookies()).catch(() => null);
	redirect(urls.login());

	return null;
}

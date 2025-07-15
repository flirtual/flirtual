import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { urls } from "~/urls";

export async function GET() {
	if ((await cookies()).has("session"))
		// Optimistically redirect to the discover page if the session cookie exists.
		// Worst case: If the session is invalid, the user will be redirected to the browse page, then the login page.
		redirect(urls.discover("dates"));

	redirect(urls.landing);
}

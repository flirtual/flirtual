import { redirect } from "react-router";

import { urls } from "~/urls";

export default function NotFound() {
	redirect(urls.landing);
}

"use client";

// eslint-disable-next-line no-restricted-imports
import { redirect } from "next/navigation";

import { urls } from "~/urls";

export default function NotFoundPage() {
	redirect(urls.landing);
}

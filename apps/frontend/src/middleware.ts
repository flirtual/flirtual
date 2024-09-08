import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const { searchParams } = request.nextUrl;

	if (searchParams.get("language")) {
		// Support explicit language override via URL query parameter.
		// for example: https://flirtu.al/home?language=ja
		request.headers.set("language", searchParams.get("language")!);
	}

	if (searchParams.get("theme")) {
		// Support explicit theme override via URL query parameter.
		// for example: https://flirtu.al/browse?theme=dark
		request.headers.set("theme", searchParams.get("theme")!);
	}

	if (searchParams.has("translating")) {
		// Support explicit translation opt-in via URL query parameter.
		// for example: https://flirtu.al/browse?translating
		request.headers.set("translating", "yes");
	}

	return NextResponse.next({
		request
	});
}

export const config = {
	matcher:
		"/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"
};

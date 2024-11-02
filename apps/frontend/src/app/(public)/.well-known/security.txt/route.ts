import { NextResponse } from "next/server";

import { siteOrigin } from "~/const";
import { urls } from "~/urls";

export const dynamic = "force-static";

const oneYearInMilliseconds = 3.156e+10;

export async function GET() {
	return new NextResponse([
		["Contact", urls.resources.contactDirect],
		["Contact", urls.resources.vulnerabilityReport],
		["Expires", new Date(Date.now() + (oneYearInMilliseconds / 2)).toISOString()],
		["Canonical", new URL("/.well-known/security.txt", siteOrigin)],
		["Policy", new URL(`${urls.resources.communityGuidelines}?language=en#respect-flirtual`, siteOrigin)],
	].map(([key, value]) => `${key}: ${value}`).join("\n"));
}

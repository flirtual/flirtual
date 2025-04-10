import { NextResponse } from "next/server";

import { picoAppId } from "~/const";

export const dynamic = "force-static";

export async function GET() {
	return NextResponse.json({
		app_id: picoAppId
	});
}

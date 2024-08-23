import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		app_id: "7aa1002e9d57599bb810a2b57c99db06"
	});
}

import { headers as getHeaders } from "next/headers";

import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { Onboarding1Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "About me"
};

export default async function Onboarding1Page() {
	const games = await withAttributeList("game");
	const interests = await withAttributeList("interest");
	const genders = await withAttributeList("gender");

	const headers = getHeaders();
	const ipcountry =
		headers.get("CF-IPCountry") || headers.get("X-Vercel-IP-Country");

	return (
		<ModelCard className="shrink-0 desktop:max-w-2xl" title="About me">
			<Onboarding1Form
				{...{
					games,
					genders,
					interests,
					ipcountry
				}}
			/>
		</ModelCard>
	);
}

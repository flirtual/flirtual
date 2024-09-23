import * as swr from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";

import { Onboarding1Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "About me"
};

export default async function Onboarding1Page() {
	const [games, interests, genders] = await Promise.all([
		Attribute.list("game"),
		Attribute.list("interest"),
		Attribute.list("gender")
	]);

	return (
		<ModelCard branded className="shrink-0 desktop:max-w-2xl" title="About me">
			<SWRConfig
				value={{
					fallback: {
						[swr.unstable_serialize(["attribute", "game"])]: games,
						[swr.unstable_serialize(["attribute", "gender"])]: genders,
						[swr.unstable_serialize(["attribute", "interest"])]: interests
					}
				}}
			>
				<Onboarding1Form />
			</SWRConfig>
		</ModelCard>
	);
}

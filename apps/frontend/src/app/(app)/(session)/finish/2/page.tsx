import { unstable_serialize } from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { FinishProgress } from "../progress";

import { Finish2Form } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "More details"
};

export default async function Finish2Page() {
	const [platforms, sexualities, languages] = await Promise.all([
		Attribute.list("platform"),
		Attribute.list("sexuality"),
		Attribute.list("language")
	]);

	return (
		<>
			<FinishProgress page={2} />
			<ModelCard
				className="shrink-0 pb-[max(calc(env(safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title="More details"
			>
				<SWRConfig
					value={{
						fallback: {
							[unstable_serialize(attributeKey("platform"))]: platforms,
							[unstable_serialize(attributeKey("sexuality"))]: sexualities,
							[unstable_serialize(attributeKey("language"))]: languages
						}
					}}
				>
					<Finish2Form />
				</SWRConfig>
			</ModelCard>
		</>
	);
}

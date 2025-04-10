import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { ModelCard } from "~/components/model-card";
import { SWRConfig } from "~/components/swr";
import { attributeKey } from "~/swr";

import { FinishProgress } from "../progress";
import { Finish1Form } from "./form";

export default async function Finish1Page() {
	const prompts = await Attribute.list("prompt");

	return (
		<>
			<FinishProgress page={1} />
			<ModelCard
				className="shrink-0 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title="Bio & pics"
			>
				<SWRConfig
					value={{
						fallback: {
							[unstable_serialize(attributeKey("prompt"))]: prompts
						}
					}}
				>
					<Finish1Form />
				</SWRConfig>
			</ModelCard>
		</>
	);
}

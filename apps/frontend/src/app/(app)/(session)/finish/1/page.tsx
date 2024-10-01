import * as swr from "swr";

import { ModelCard } from "~/components/model-card";
import { Attribute } from "~/api/attributes";
import { SWRConfig } from "~/components/swr";

import { FinishProgress } from "../progress";

import { Finish1Form } from "./form";

export default async function Finish1Page() {
	const prompts = await Attribute.list("prompt");

	return (
		<>
			<FinishProgress page={1} />
			<ModelCard
				className="shrink-0 pb-[max(calc(env(safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title="Bio & pics"
			>
				<SWRConfig
					value={{
						fallback: {
							[swr.unstable_serialize(["attribute", "prompt"])]: prompts
						}
					}}
				>
					<Finish1Form />
				</SWRConfig>
			</ModelCard>
		</>
	);
}

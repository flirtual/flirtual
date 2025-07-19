import { setRequestLocale } from "next-intl/server";
import { use } from "react";

import { ModelCard } from "~/components/model-card";

import { FinishProgress } from "../progress";
import { Finish1Form } from "./form";

export default function Finish1Page() {
	const { locale } = use(params);
	setRequestLocale(locale);

	return (
		<>
			<FinishProgress page={1} />
			<ModelCard
				className="shrink-0 pb-[max(calc(var(--safe-area-inset-bottom,0rem)-0.5rem),1rem)] desktop:max-w-2xl desktop:pb-0"
				title="Bio & pics"
			>

				<Finish1Form />
			</ModelCard>
		</>
	);
}

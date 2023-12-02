import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";

import { Onboarding3Form } from "./form";

export const metadata: Metadata = {
	title: "Bio & pics"
};

export default function Onboarding3Page() {
	return (
		<ModelCard className="shrink-0 sm:max-w-2xl" title="Bio & pics">
			<Onboarding3Form />
		</ModelCard>
	);
}

import React, { useState } from "react";

import { Input } from "~/components/inputs";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

export const Onboarding2Page: React.FC = () => {
	const [birthday, setBirthday] = useState(new Date());
	const [sexualities, setSexualities] = useState<Array<string>>([]);

	return (
		<SoleModelLayout>
			<ModelCard className="md:w-2/4 grow-0" title="Info & tags">
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-2">
						<Input.Label hint="(only your age will be visible)">Date of birth</Input.Label>
						<Input.Date value={birthday} onChange={setBirthday} />
					</div>
					<div className="flex flex-col gap-2">
						<Input.Label>Gender</Input.Label>
						<div className="flex items-center gap-4">
							<Input.Checkbox />
							<Input.Label inline>Man</Input.Label>
						</div>
						<div className="flex items-center gap-4">
							<Input.Checkbox />
							<Input.Label inline>Woman</Input.Label>
						</div>
						<div className="flex items-center gap-4">
							<Input.Checkbox />
							<Input.Label inline>Other</Input.Label>
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<Input.Label>Sexuality</Input.Label>
						<Input.Autocomplete
							values={sexualities}
							options={[
								"Straight",
								"Lesbian",
								"Gay",
								"Bisexual",
								"Pansexual",
								"Asexual",
								"Demisexual",
								"Heteroflexible",
								"Homoflexible",
								"Queer",
								"Questioning",
								"Experimenting in VR"
							].map((label) => ({ label, key: label.toLowerCase().replace(" ", "_") }))}
							onChange={setSexualities}
						/>
					</div>
					<button
						className="bg-brand-gradient shadow-brand-1 focus:ring-brand-coral p-4 rounded-xl focus:ring-2  focus:ring-offset-2 focus:outline-none"
						type="button"
					>
						<span className="font-montserrat text-white text-xl">Continue</span>
					</button>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
};

export default Onboarding2Page;

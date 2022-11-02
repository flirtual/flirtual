"use client";

import React, { useState } from "react";

import { InputAutocomplete, InputCheckbox, InputDateSelect, InputLabel } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";

export const Onboarding2Page: React.FC = () => {
	const [birthday, setBirthday] = useState(new Date());
	const [sexualities, setSexualities] = useState<Array<string>>([]);

	return (
		<ModelCard className="lg:w-2/4 shrink-0" title="Info & tags">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<InputLabel className="flex-col sm:flex-row" hint="(only your age will be visible)">
						Date of birth
					</InputLabel>
					<InputDateSelect value={birthday} onChange={setBirthday} />
				</div>
				<div className="flex flex-col gap-2">
					<InputLabel>Gender</InputLabel>
					<div className="flex items-center gap-4">
						<InputCheckbox />
						<InputLabel inline>Man</InputLabel>
					</div>
					<div className="flex items-center gap-4">
						<InputCheckbox />
						<InputLabel inline>Woman</InputLabel>
					</div>
					<div className="flex items-center gap-4">
						<InputCheckbox />
						<InputLabel inline>Other</InputLabel>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<InputLabel>Sexuality</InputLabel>
					<InputAutocomplete
						placeholder="Select your sexualities..."
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
					<span className="font-montserrat text-white text-xl font-bold">Continue</span>
				</button>
			</div>
		</ModelCard>
	);
};

export default Onboarding2Page;

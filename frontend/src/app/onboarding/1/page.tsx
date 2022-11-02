"use client";

import React, { useState } from "react";
import Link from "next/link";

import { ModelCard } from "~/components/model-card";
import {
	InputCheckbox,
	InputLabel,
	InputRangeSlider,
	InputRangeSliderValue,
	InputSwitch
} from "~/components/inputs";

export const Onboarding1Page: React.FC = () => {
	const [ageRange, setAgeRange] = useState<InputRangeSliderValue>([18, 100]);
	const [serious, setSerious] = useState(false);

	return (
		<ModelCard title="Matchmaking">
			<div className="flex flex-col gap-8">
				<div className="flex flex-col gap-2">
					<InputLabel>I want to meet...</InputLabel>
					<div className="flex items-center gap-4">
						<InputCheckbox />
						<InputLabel inline>Men</InputLabel>
					</div>
					<div className="flex items-center gap-4">
						<InputCheckbox />
						<InputLabel inline>Women</InputLabel>
					</div>
					<div className="flex items-center gap-4">
						<InputCheckbox />
						<InputLabel inline>Other</InputLabel>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<InputLabel
						hint={
							ageRange[0] === 18 && ageRange[1] === 100
								? "any age"
								: `${ageRange[0]} to ${ageRange[1]}`
						}
					>
						Age range
					</InputLabel>
					<InputRangeSlider max={100} min={18} value={ageRange} onChange={setAgeRange} />
				</div>
				<div className="flex gap-4 sm:items-center flex-col-reverse sm:flex-row">
					<InputSwitch name="serious" value={serious} onChange={setSerious} />
					<InputLabel inline>Are you open to serious dating?</InputLabel>
				</div>
				<div className="flex flex-col gap-4">
					<Link
						className="bg-brand-gradient shadow-brand-1 focus:ring-brand-coral p-4 rounded-xl focus:ring-2 text-center  focus:ring-offset-2 focus:outline-none"
						href="/onboarding/2"
					>
						<span className="font-montserrat text-white font-bold text-xl">Continue</span>
					</Link>
				</div>
			</div>
		</ModelCard>
	);
};

export default Onboarding1Page;

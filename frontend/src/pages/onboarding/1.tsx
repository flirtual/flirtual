import React, { useState } from "react";
import Link from "next/link";

import { Input } from "~/components/inputs";
import { RangeSlider, RangeSliderValue } from "~/components/inputs/range-slider";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

export const Onboarding1Page: React.FC = () => {
	const [ageRange, setAgeRange] = useState<RangeSliderValue>([18, 100]);
	const [serious, setSerious] = useState(false);

	return (
		<SoleModelLayout>
			<ModelCard title="Matchmaking">
				<div className="flex flex-col gap-8">
					<div className="flex flex-col gap-2">
						<Input.Label htmlFor="remember_me">I want to meet...</Input.Label>
						<div className="flex items-center gap-4">
							<Input.Checkbox name="noti" />
							<Input.Label inline htmlFor="remember_me">
								Men
							</Input.Label>
						</div>
						<div className="flex items-center gap-4">
							<Input.Checkbox />
							<Input.Label inline>Women</Input.Label>
						</div>
						<div className="flex items-center gap-4">
							<Input.Checkbox />
							<Input.Label inline>Other</Input.Label>
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<Input.Label
							hint={
								ageRange[0] === 18 && ageRange[1] === 100
									? "any age"
									: `${ageRange[0]} to ${ageRange[1]}`
							}
						>
							Age range
						</Input.Label>
						<RangeSlider max={100} min={18} value={ageRange} onChange={setAgeRange} />
					</div>
					<div className="flex gap-4 items-center">
						<Input.Switch name="serious" value={serious} onChange={setSerious} />
						<Input.Label inline>Are you open to serious dating?</Input.Label>
					</div>
					<div className="flex flex-col gap-4">
						<Link
							className="bg-brand-gradient shadow-brand-1 focus:ring-brand-coral p-4 rounded-xl focus:ring-2 text-center  focus:ring-offset-2 focus:outline-none"
							href="/onboarding/2"
						>
							<span className="font-montserrat text-white text-xl">Continue</span>
						</Link>
					</div>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
};

export default Onboarding1Page;

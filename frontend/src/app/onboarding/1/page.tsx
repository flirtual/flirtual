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
import { useInputForm } from "~/hooks/use-input-form";
import { FormField } from "~/components/forms/field";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";

const Onboarding1Page: React.FC = () => {
	const { fields, formProps } = useInputForm<{
		genders: Array<string>;
		ageRange: InputRangeSliderValue;
		serious: boolean;
	}>({
		fields: {
			genders: [],
			ageRange: [18, 100],
			serious: false
		},
		onSubmit: async (values) => {}
	});

	return (
		<ModelCard title="Matchmaking">
			<form {...formProps} className="flex flex-col gap-8">
				<FormField field={fields.genders}>
					{(field) => (
						<>
							<InputLabel {...field.labelProps}>I want to meet...</InputLabel>
							<InputCheckboxList
								{...field.props}
								items={[
									{ key: "men", label: "Men" },
									{ key: "women", label: "Women" },
									{ key: "other", label: "Other" }
								]}
							/>
						</>
					)}
				</FormField>
				<FormField field={fields.ageRange}>
					{(field) => {
						const [min, max] = field.props.value;

						return (
							<>
								<InputLabel
									{...field.labelProps}
									hint={min === 18 && max === 100 ? "any age" : `${min} to ${max}`}
								>
									Age range
								</InputLabel>
								<InputRangeSlider {...field.props} max={100} min={18} />
							</>
						);
					}}
				</FormField>
				<FormField
					className="flex-col-reverse gap-4 sm:flex-row sm:items-center"
					field={fields.serious}
				>
					{(field) => (
						<>
							<InputSwitch {...field.props} />
							<InputLabel {...field.labelProps} inline>
								Are you open to serious dating?
							</InputLabel>
						</>
					)}
				</FormField>
				<div className="flex flex-col gap-4">
					<button
						className="rounded-xl bg-brand-gradient p-4 text-center shadow-brand-1 focus:outline-none focus:ring-2  focus:ring-brand-coral focus:ring-offset-2"
						type="submit"
					>
						<span className="font-montserrat text-xl font-bold text-white">Continue</span>
					</button>
				</div>
			</form>
		</ModelCard>
	);
};

export default Onboarding1Page;

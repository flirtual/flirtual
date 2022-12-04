"use client";

import { useRouter } from "next/navigation";

import { api } from "~/api";
import { ProfilePreferenceGender } from "~/api/user/profile";
import { Form } from "~/components/forms";
import {
	InputLabel,
	InputRangeSlider,
	InputRangeSliderValue,
	InputSwitch
} from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { useCurrentUser } from "~/hooks/use-current-user";
import { urls } from "~/pageUrls";

export const Onboarding1Form: React.FC = () => {
	const { data: user } = useCurrentUser();
	const router = useRouter();

	if (!user) return null;

	const absMinAge = 18;
	const absMaxAge = 100;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				gender: (user?.profile.preferences.gender ?? []) as Array<ProfilePreferenceGender>,
				ageRange: [
					user?.profile.preferences.agemin ?? absMinAge,
					user?.profile.preferences.agemax ?? absMaxAge
				] as InputRangeSliderValue,
				serious: false
			}}
			onSubmit={async (values) => {
				if (!user) return;

				const [agemin, agemax] = values.ageRange;
				await api.user.profile.updatePreferences(user.id, {
					agemin: agemin === absMinAge ? null : agemin,
					agemax: agemax === absMaxAge ? null : agemax,
					gender: values.gender
				});

				router.push(urls.onboarding(2));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="gender">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>I want to meet...</InputLabel>
								<InputCheckboxList
									{...field.props}
									items={{
										men: { label: "Men" },
										women: { label: "Women" },
										other: { label: "Other" }
									}}
								/>
							</>
						)}
					</FormField>
					<FormField name="ageRange">
						{(field) => {
							const [min, max] = field.props.value;

							return (
								<>
									<InputLabel
										{...field.labelProps}
										hint={min === absMinAge && max === absMaxAge ? "any age" : `${min} to ${max}`}
									>
										Age range
									</InputLabel>
									<InputRangeSlider {...field.props} max={absMaxAge} min={absMinAge} />
								</>
							);
						}}
					</FormField>
					<FormField className="flex-col-reverse gap-4 sm:flex-row sm:items-center" name="serious">
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
							className="rounded-xl bg-brand-gradient p-4 text-center shadow-brand-1 focus:outline-none focus:ring-2  focus:ring-coral focus:ring-offset-2"
							type="submit"
						>
							<span className="font-montserrat text-xl font-semibold text-white-10">Continue</span>
						</button>
					</div>
				</>
			)}
		</Form>
	);
};

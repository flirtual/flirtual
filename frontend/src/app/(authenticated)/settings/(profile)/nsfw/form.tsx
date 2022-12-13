"use client";

import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputSwitch } from "~/components/inputs";
import { InputCheckboxList } from "~/components/inputs/checkbox-list";
import { useCurrentUser } from "~/hooks/use-current-user";

export const NsfwForm: React.FC = () => {
	const { data: user, mutate: mutateUser } = useCurrentUser();
	if (!user) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				nsfw: false,
				domsub: ""
			}}
			onSubmit={async (values) => {
				0;
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="nsfw">
						{(field) => (
							<>
								<InputLabel
									{...field.labelProps}
									inline
									hint="Choose whether to display NSFW tags on other users' profiles."
								>
									Show NSFW tags on profiles?
								</InputLabel>
								<InputSwitch {...field.props} />
							</>
						)}
					</FormField>
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
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};

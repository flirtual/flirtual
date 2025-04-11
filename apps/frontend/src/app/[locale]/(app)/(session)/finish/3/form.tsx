"use client";

import { MoveLeft, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { FC } from "react";

import { Profile } from "~/api/user/profile";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputLabel, InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { urls } from "~/urls";

import {
	InterestSelectCount,
	InterestSelectCustomInput,
	InterestSelectList,
	maximumInterests
} from "../../settings/(profile)/interests/form";

export const Finish3Form: FC = () => {
	const [session] = useSession();
	const toasts = useToast();
	const router = useRouter();
	const t = useTranslations();

	if (!session) return null;
	const { user } = session;
	const { profile } = user;

	return (
		<Form
			fields={{
				filter: "",
				defaultInterests: profile.attributes.interest || [],
				customInterests: profile.customInterests
			}}
			className="flex flex-col gap-8"
			requireChange={false}
			onSubmit={async ({ defaultInterests, customInterests }) => {
				await Profile.update(user.id, {
					customInterests,
					interestId: defaultInterests
				})
					.then(() => {
						return router.push(urls.finish(4));
					})
					.catch(toasts.addError);
			}}
		>
			{({
				FormField,
				fields: {
					filter: {
						props: { value: filter }
					},
					defaultInterests,
					customInterests
				}
			}) => {
				const totalInterests
					= defaultInterests.props.value.length
						+ customInterests.props.value.length;

				return (
					<>
						<InputLabel>
							{t("chunky_weak_tadpole_relish")}
						</InputLabel>
						<FormField name="filter">
							{(field) => (
								<InputText
									{...field.props}
									Icon={Search}
									placeholder={t("search_interests")}
								/>
							)}
						</FormField>
						<FormField name="defaultInterests">
							{({ props: { value, onChange } }) => (
								<InterestSelectList
									maximum={
										maximumInterests - customInterests.props.value.length
									}
									filter={filter}
									selected={value}
									onSelected={(newValues) => {
										if (
											totalInterests >= maximumInterests
											&& newValues.length >= value.length
										)
											return toasts.add({
												type: "warning",
												value: t("inclusive_silly_ibex_succeed")
											});

										onChange(newValues);
									}}
								/>
							)}
						</FormField>
						<FormField name="customInterests">
							{({ props: { value, onChange } }) => (
								<InterestSelectCustomInput
									value={value}
									onChange={(newValues) => {
										if (
											totalInterests >= maximumInterests
											&& newValues.length >= value.length
										)
											return toasts.add({
												type: "warning",
												value: t("inclusive_silly_ibex_succeed")
											});

										onChange(newValues);
									}}
								/>
							)}
						</FormField>
						<div className="flex justify-end gap-2">
							<ButtonLink
								className="flex w-fit flex-row gap-2 opacity-75"
								href={urls.finish(2)}
								kind="tertiary"
								size="sm"
							>
								<MoveLeft className="size-5" />
								<span>{t("back")}</span>
							</ButtonLink>
							<FormButton className="min-w-36" size="sm" />
						</div>
						<InterestSelectCount
							className="mb-11 desktop:mb-0"
							current={totalInterests}
							maximum={maximumInterests}
						/>
					</>
				);
			}}
		</Form>
	);
};

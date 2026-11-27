import { useSuspenseQueries } from "@tanstack/react-query";
import { MoveLeft } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { interestsOptions, platformsOptions } from "~/api/data";
import { Profile } from "~/api/user/profile";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { FormGameAutocomplete } from "~/components/forms/game-autocomplete";
import {
	InputAutocomplete,
	InputLabel,
	InputLabelHint,
	InputSwitch
} from "~/components/inputs";
import { vrTags } from "~/features";
import { useSession } from "~/hooks/use-session";
import { useLocale, useNavigate } from "~/i18n";
import { useOptimisticRoute } from "~/preload";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

const FormTypes = [...(["game", "interest", "platform"] as const)];

export const Onboarding2Form: FC = () => {
	const { user } = useSession();
	const { profile } = user;

	const { t } = useTranslation();
	const navigate = useNavigate();

	const [locale] = useLocale();
	const [{ data: interests }, { data: platforms }] = useSuspenseQueries({
		queries: [interestsOptions({ locale, order: ["name"] }), platformsOptions({ locale })]
	});

	useOptimisticRoute(urls.onboarding(3));

	return (
		<Form
			fields={{
				new: profile.new ?? false,
				game: profile.games || [],
				interest: profile.interests || [],
				platform: profile.platforms || []
			}}
			className="flex flex-col gap-8"
			requireChange={false}
			onSubmit={async (values) => {
				await Profile.update(user.id, {
					new: values.new,
					...Object.fromEntries(
						FormTypes.map((type) => [`${type}Id`, values[type]])
					)
				});

				await invalidate({ queryKey: sessionKey() });
				navigate(urls.onboarding(3));
			}}
		>
			{({ FormField }) => (
				<>
					{vrTags && (
						<>
							<FormField name="new">
								{(field) => (
									<>
										<InputLabel>{t("new_to_vr_question")}</InputLabel>
										<InputSwitch {...field.props} />
									</>
								)}
							</FormField>
							<FormField name="platform">
								{(field) => (
									<>
										<InputLabel>{t("vr_setup")}</InputLabel>
										<InputAutocomplete
											{...field.props}
											options={platforms.map((platform) => {
												const { id, name, example } = platform;
												return {
													key: id,
													label: name || id,
													example
												};
											})}
											limit={8}
											placeholder={t("select_the_platforms_you_use")}
										/>
									</>
								)}
							</FormField>
							<FormField name="game">
								{() => (
									<>
										<InputLabel hint={t("up_to_number", { number: 5 })}>{t("vr_apps_games")}</InputLabel>
										<InputLabelHint className="-mt-2">
											{t("game_hint")}
										</InputLabelHint>
										<FormGameAutocomplete />
									</>
								)}
							</FormField>
						</>
					)}
					<FormField name="interest">
						{(field) => (
							<>
								<InputLabel hint={t("up_to_number", { number: 10 })}>{t("interests")}</InputLabel>
								<InputLabelHint className="-mt-2">
									{t("onboarding_interests_hint")}
								</InputLabelHint>
								<InputAutocomplete
									{...field.props}
									options={interests
										.filter(
											(interest) =>
												interest.category === "popular"
										)
										.map((interest) => ({
											key: interest.id,
											label: interest.name
										}))}
									limit={10}
									placeholder={t("select_interests")}
									value={field.props.value || []}
								/>
							</>
						)}
					</FormField>
					<div className="ml-auto flex gap-2">
						<ButtonLink
							className="flex w-fit flex-row gap-2 opacity-75"
							href={urls.onboarding(1)}
							kind="tertiary"
							size="sm"
						>
							<MoveLeft className="size-5 shrink-0" />
							<span>{t("back")}</span>
						</ButtonLink>
						<FormButton className="min-w-36" size="sm" />
					</div>
				</>
			)}
		</Form>
	);
};

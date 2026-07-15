import { MoveLeft } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { Profile } from "~/api/user/profile";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	InputAutocomplete,
	InputLabel,
	InputLabelHint,
	InputSwitch
} from "~/components/inputs";
import {
	useAttributes,
	useAttributeTranslation
} from "~/hooks/use-attribute";
import { useSession } from "~/hooks/use-session";
import { useNavigate } from "~/i18n";
import { useOptimisticRoute } from "~/preload";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

const AttributeKeys = [...(["game", "interest", "platform"] as const)];

export const Onboarding2Form: FC = () => {
	const { user } = useSession();
	const { profile } = user;

	const { t } = useTranslation();
	const navigate = useNavigate();

	const games = useAttributes("game");
	const interests = useAttributes("interest");
	const platforms = useAttributes("platform");

	const tAttribute = useAttributeTranslation();

	useOptimisticRoute(urls.onboarding(3));

	return (
		<Form
			fields={{
				new: profile.new ?? false,
				game: profile.attributes.game || [],
				interest: profile.attributes.interest || [],
				platform: profile.attributes.platform || []
			}}
			className="flex flex-col gap-8"
			requireChange={false}
			onSubmit={async (values) => {
				await Profile.update(user.id, {
					new: values.new,
					...Object.fromEntries(
						AttributeKeys.map((type) => [`${type}Id`, values[type]])
					)
				});

				await invalidate({ queryKey: sessionKey() });
				navigate(urls.onboarding(3));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="new">
						{(field) => (
							<>
								<InputLabel>{t("nimble_hour_bumblebee_savor")}</InputLabel>
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
										const id = typeof platform === "string" ? platform : platform.id;
										return {
											key: id,
											label: tAttribute[id]?.name || id,
											example: tAttribute[id]?.example
										};
									})}
									limit={8}
									placeholder={t("select_the_platforms_you_use")}
								/>
							</>
						)}
					</FormField>
					<FormField name="game">
						{(field) => (
							<>
								<InputLabel hint={t("up_to_number", { number: 5 })}>{t("vr_apps_games")}</InputLabel>
								<InputLabelHint className="-mt-2">
									{t("game_hint")}
								</InputLabelHint>
								<InputAutocomplete
									{...field.props}
									options={games.map((game) => ({
										key: game,
										label: tAttribute[game]?.name ?? game
									}))}
									limit={5}
									placeholder={t("select_games")}
									value={field.props.value || []}
								/>
							</>
						)}
					</FormField>
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
												interest.category === "iiCe39JvGQAAtsrTqnLddb"
										)
										.map((interest) => ({
											key: interest.id,
											label: tAttribute[interest.id]?.name ?? interest.id
										}))
										.sort((a, b) => {
											if (a.label > b.label) return 1;
											return -1;
										})}
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

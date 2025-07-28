import { MoveLeft } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Profile } from "~/api/user/profile";
import { ButtonLink } from "~/components/button";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputImageSet } from "~/components/forms/input-image-set";
import { InputPrompts } from "~/components/forms/prompts";
import {
	InputEditor,
	InputLabel,
	InputLabelHint,
	InputText
} from "~/components/inputs";
import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useOptionalSession } from "~/hooks/use-session";
import { urls } from "~/urls";

export const Finish1Form: FC = () => {
	const session = useOptionalSession();
	const navigate = useNavigate();

	const { t } = useTranslation();
	const tAttribute = useAttributeTranslation();

	if (!session) return null;
	const { user } = session;

	const favoriteGameId = (user.profile.attributes.game || []).filter(
		(gameId) => gameId !== "3nzcXDoMySRrPn6jHC8n3o"
	)[0] || "mkyAHUgKDWFiqkZcgZD6pS";

	return (
		<Form
			fields={{
				displayName: user.profile.displayName || "",
				images: user.profile.images.map((image) => ({
					id: image.id,
					src: urls.image(image),
					fullSrc: urls.image(image, "full")
				})),
				biography: user.profile.biography || "",
				prompts: user.profile.prompts
			}}
			className="flex flex-col gap-8"
			requireChange={false}
			onSubmit={async (values) => {
				await Promise.all([
					Profile.update(user.id, {
						biography: values.biography,
						displayName: values.displayName,
						required: ["biography", "displayName"]
					}),
					Profile.Image.create(
						user.id,
						values.images.map((image) => image.id).filter(Boolean)
					).then((images) =>
						Profile.Image.update(
							user.id,
							images.map((image) => image.id)
						)
					),
					Profile.updatePrompts(user.id, values.prompts)
				]);

				navigate(urls.finish(2));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="displayName">
						{(field) => (
							<>
								<InputLabel
									inline
									hint={t("factual_curly_fly_pop")}
									{...field.labelProps}
								>
									{t("display_name")}
								</InputLabel>
								<InputText {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="images">
						{(field) => (
							<>
								<InputLabel
									{...field.labelProps}
									inline
									hint={(
										<InputLabelHint>
											{t("known_antsy_gull_savor", { game: tAttribute[favoriteGameId]!.name })}
											<details>
												<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
													{t("guidelines")}
												</summary>
												{t("formal_icy_hound_type")}
											</details>
										</InputLabelHint>
									)}
								>
									{t("profile_pictures")}
								</InputLabel>
								<InputImageSet {...field.props} max={15} />
							</>
						)}
					</FormField>
					<FormField name="biography">
						{(field) => (
							<>
								<InputLabel
									{...field.labelProps}
									inline
									hint={(
										<InputLabelHint>
											{t("proof_east_termite_pave")}
											<details>
												<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
													{t("guidelines")}
												</summary>
												{t("tame_weird_termite_zap")}
											</details>
										</InputLabelHint>
									)}
								>
									{t("bio")}
								</InputLabel>
								<InputEditor {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="prompts">
						{(field) => (
							<InputPrompts
								labelId={field.labelProps.htmlFor}
								{...field.props}
							/>
						)}
					</FormField>
					<div className="flex flex-wrap justify-end gap-2">
						<ButtonLink
							className="flex w-fit flex-row gap-2 opacity-75"
							href={urls.discover("dates")}
							kind="tertiary"
							size="sm"
						>
							<MoveLeft className="size-5" />
							<span>{t("back_to_browsing")}</span>
						</ButtonLink>
						<FormButton className="w-36" size="sm" />
					</div>
				</>
			)}
		</Form>
	);
};

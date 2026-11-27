import { useSuspenseQuery } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import { byId, gamesOptions } from "~/api/data";
import { Profile } from "~/api/user/profile";
import { ProfileImage } from "~/api/user/profile/images";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputImageSet } from "~/components/forms/input-image-set";
import type { ImageSetValue } from "~/components/forms/input-image-set";
import { InputPrompts } from "~/components/forms/prompts";
import {
	InputEditor,
	InputLabel,
	InputLabelHint,
	InputText
} from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import {
	biographyCounterThreshold,
	biographyMaxLength,
	contentLength,
	html
} from "~/html";
import { useLocale } from "~/i18n";
import { invalidate, sessionKey } from "~/query";
import { urls } from "~/urls";

export const BiographyForm: FC = () => {
	const session = useSession();
	const { user } = session;
	const { profile } = user;

	const toasts = useToast();

	const { t } = useTranslation();
	const [locale] = useLocale();
	const { data: games } = useSuspenseQuery({ ...gamesOptions({ locale }), select: byId });

	const favoriteGameId = (user.profile.games || []).filter(
		(gameId) => gameId !== "vrchat"
	)[0] || "horizon_worlds";

	return (
		<Form
			fields={{
				displayName: user.profile.displayName || "",
				images: profile.images.map((image): ImageSetValue => ({
					id: image.id,
					src: urls.image(image),
					fullSrc: urls.image(image, "full"),
					blurHash: image.blurHash,
					authorId: image.authorId,
					authorName: image.authorName,
					worldId: image.worldId,
					worldName: image.worldName
				})),
				biography: html(user.profile.biography || ""),
				prompts: user.profile.prompts
			}}
			className="flex flex-col gap-8"
			onSubmit={async ({ displayName, biography, ...values }) => {
				await Promise.all([
					Profile.update(user.id, {
						displayName,
						biography: html(biography),
						required: ["displayName", "biography"]
					}),
					ProfileImage.create(
						user.id,
						values.images.map((image) => ({
							id: image.id,
							stereo: image.stereo,
							authorId: image.authorId,
							authorName: image.authorName,
							worldId: image.worldId,
							worldName: image.worldName
						})).filter((file) => file.id)
					).then((images) =>
						images.length === 0
							? null
							: ProfileImage.update(
									user.id,
									images.map((image) => image.id)
								)
					),
					Profile.updatePrompts(user.id, values.prompts)
				]);

				toasts.add(t("saved_bio"));

				await invalidate({ queryKey: sessionKey() });
			}}
		>
			{({ FormField, fields, buttonProps }) => {
				const bioInvalid
					= contentLength(fields.biography.props.value) > biographyMaxLength;

				return (
					<>
						<FormField name="displayName">
							{(field) => (
								<>
									<InputLabel
										inline
										hint={t("bio_discord_warning")}
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
												{t("picture_upload_hint", { game: games[favoriteGameId]?.name ?? favoriteGameId })}
												<details>
													<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
														{t("guidelines")}
													</summary>
													{t("picture_guidelines")}
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
										inline
										hint={(
											<InputLabelHint>
												{t("bio_hint")}
												<details>
													<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
														{t("guidelines")}
													</summary>
													{t("bio_guidelines")}
												</details>
											</InputLabelHint>
										)}
										{...field.labelProps}
									>
										{t("bio")}
									</InputLabel>
									<InputEditor
										{...field.props}
										maxLength={biographyMaxLength}
										showCountAbove={biographyCounterThreshold}
									/>
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
						<FormButton disabled={buttonProps.disabled || bioInvalid}>
							{t("update")}
						</FormButton>
					</>
				);
			}}
		</Form>
	);
};

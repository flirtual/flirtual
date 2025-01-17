"use client";

import type { FC } from "react";

import { displayName } from "~/api/user";
import { Profile } from "~/api/user/profile";
import { ProfileImage } from "~/api/user/profile/images";
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
import { useTranslations } from "~/hooks/use-internationalization";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { html } from "~/html";
import { urls } from "~/urls";

export const BiographyForm: FC = () => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();

	const t = useTranslations();
	const tAttribute = useAttributeTranslation();

	if (!session) return null;

	const { user } = session;
	const { profile } = user;

	const favoriteGameId = (user.profile.attributes.game || []).filter(
		(gameId) => gameId !== "3nzcXDoMySRrPn6jHC8n3o"
	)[0];

	return (
		<Form
			fields={{
				displayName: displayName(user),
				images: profile.images.map((image) => ({
					id: image.id,
					src: urls.pfp(image),
					fullSrc: urls.pfp(image, "full")
				})),
				biography: user.profile.biography || "",
				prompts: user.profile.prompts
			}}
			className="flex flex-col gap-8"
			onSubmit={async ({ displayName, biography, ...values }) => {
				const [profile, images, prompts] = await Promise.all([
					Profile.update(user.id, {
						displayName,
						biography: html(biography),
						required: ["displayName", "biography"]
					}),
					ProfileImage.create(
						user.id,
						values.images.map((image) => image.id).filter(Boolean)
					).then((images) =>
						ProfileImage.update(
							user.id,
							images.map((image) => image.id)
						)
					),
					Profile.updatePrompts(user.id, values.prompts)
				]);

				toasts.add(t("cuddly_few_llama_catch"));

				await mutateSession({
					...session,
					user: {
						...user,
						profile: {
							...profile,
							images,
							prompts
						}
					}
				});
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="displayName">
						{(field) => (
							<>
								<InputLabel
									inline
									hint="For your privacy, please do not put your Discord username here (or any other usernames that you use). This helps you avoid unwanted messages on other platforms!"
									{...field.labelProps}
								>
									Display name
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
											Upload your avatar pictures from VRChat,
											{" "}
											{tAttribute[favoriteGameId || ""]?.name
											?? "Horizon Worlds"}
											, or another social VR app. Aim for 3+ avatar pictures to
											get more matches.
											<details>
												<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
													Guidelines
												</summary>
												Don&apos;t include nude/NSFW, disturbing, or off-topic
												content, and don&apos;t use other people&apos;s
												pictures.
											</details>
										</InputLabelHint>
									)}
								>
									Profile pictures
								</InputLabel>
								<InputImageSet {...field.props} />
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
											A great bio shows your personality and interests, maybe
											your sense of humor and what you&apos;re looking for.
											<details>
												<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
													Guidelines
												</summary>
												Be respectful and don&apos;t include spam, soliciting,
												excessive self-promotion, graphic NSFW descriptions,
												hateful or controversial content.
											</details>
										</InputLabelHint>
									)}
									{...field.labelProps}
								>
									Bio
								</InputLabel>
								<InputEditor {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="prompts">
						{(field) => (
							<InputPrompts
								newBadge
								labelId={field.labelProps.htmlFor}
								{...field.props}
							/>
						)}
					</FormField>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};

"use client";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InputImageSet } from "~/components/forms/input-image-set";
import {
	InputEditor,
	InputLabel,
	InputLabelHint,
	InputText
} from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { html } from "~/html";
import { urls } from "~/urls";
import { InputPrompts } from "~/components/forms/prompts";
import { findBy } from "~/utilities";

import type { AttributeCollection } from "~/api/attributes";
import type { FC } from "react";

export const BiographyForm: FC<{ games: AttributeCollection<"game"> }> = ({
	games
}) => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();

	if (!session) return null;

	const { user } = session;
	const { profile } = user;

	const favoriteGame = user.profile.attributes
		.map(({ id }) => findBy(games, "id", id))
		.filter(Boolean)
		.filter((game) => game.name !== "VRChat")[0]?.name;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				displayName: api.user.displayName(user),
				images: profile.images.map((image) => ({
					id: image.id,
					src: urls.pfp(image),
					fullSrc: urls.pfp(image, "full")
				})),
				biography: user.profile.biography || "",
				prompts: user.profile.prompts
			}}
			onSubmit={async ({ displayName, biography, ...values }) => {
				const [profile, images, prompts] = await Promise.all([
					api.user.profile.update(user.id, {
						query: {
							required: ["displayName", "biography"]
						},
						body: {
							displayName,
							biography: html(biography)
						}
					}),
					api.user.profile.images
						.create(user.id, {
							body: values.images.map((image) => image.id).filter(Boolean)
						})
						.then((images) =>
							api.user.profile.images.update(user.id, {
								body: images.map((image) => image.id)
							})
						),
					api.user.profile.prompts.update(user.id, {
						body: values.prompts.map(({ prompt, response }) => ({
							promptId: prompt.id,
							response
						}))
					})
				]);

				toasts.add("Saved bio & pics");

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
									hint={
										<InputLabelHint>
											Upload your avatar pictures from VRChat,{" "}
											{favoriteGame ?? "Horizon Worlds"}, or another social VR
											app. Aim for 3+ avatar pictures to get more matches.
											<details>
												<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
													Guidelines
												</summary>
												Don't include nude/NSFW, disturbing, or off-topic
												content, and don't use other people's pictures.
											</details>
										</InputLabelHint>
									}
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
									hint={
										<InputLabelHint>
											A great bio shows your personality and interests, maybe
											your sense of humor and what you're looking for.
											<details>
												<summary className="text-pink opacity-75 transition-opacity hover:cursor-pointer hover:opacity-100">
													Guidelines
												</summary>
												Be respectful and don't include spam, soliciting,
												excessive self-promotion, graphic NSFW descriptions,
												hateful or controversial content.
											</details>
										</InputLabelHint>
									}
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

"use client";

import { useRouter } from "next/navigation";
import { MoveLeft } from "lucide-react";

import {
	InputEditor,
	InputLabel,
	InputLabelHint,
	InputText
} from "~/components/inputs";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { urls } from "~/urls";
import { InputImageSet } from "~/components/forms/input-image-set";
import { useSession } from "~/hooks/use-session";
import { InputPrompts } from "~/components/forms/prompts";
import { findBy } from "~/utilities";
import { ButtonLink } from "~/components/button";
import { Profile } from "~/api/user/profile";

import type { AttributeCollection } from "~/api/attributes";
import type { FC } from "react";

export const Finish1Form: FC<{ games: AttributeCollection<"game"> }> = ({
	games
}) => {
	const [session] = useSession();
	const router = useRouter();

	if (!session) return null;
	const { user } = session;

	const favoriteGame = user.profile.attributes
		.map(({ id }) => findBy(games, "id", id))
		.filter(Boolean)
		.filter((game) => game.name !== "VRChat")[0]?.name;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={false}
			fields={{
				displayName: user.profile.displayName || "",
				images: user.profile.images.map((image) => ({
					id: image.id,
					src: urls.pfp(image),
					fullSrc: urls.pfp(image, "full")
				})),
				biography: user.profile.biography || "",
				prompts: user.profile.prompts
			}}
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
					Profile.updatePrompts(
						user.id,
						values.prompts.map(({ prompt, response }) => ({
							promptId: prompt.id,
							response
						}))
					)
				]);

				router.push(urls.finish(2));
			}}
		>
			{({ FormField }) => (
				<>
					<FormField name="displayName">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>Display name</InputLabel>
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
											app. Aim for 3+ avatar pictures to get more matches. Don't
											have any handy? You can go back to browsing and come back
											later.
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
									{...field.labelProps}
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
								labelId={field.labelProps.htmlFor}
								{...field.props}
							/>
						)}
					</FormField>
					<div className="flex flex-wrap justify-end gap-2">
						<ButtonLink
							className="flex w-fit flex-row gap-2 opacity-75"
							href={urls.browse()}
							kind="tertiary"
							size="sm"
						>
							<MoveLeft className="size-5" />
							<span>Back to browsing</span>
						</ButtonLink>
						<FormButton className="w-36" size="sm" />
					</div>
				</>
			)}
		</Form>
	);
};

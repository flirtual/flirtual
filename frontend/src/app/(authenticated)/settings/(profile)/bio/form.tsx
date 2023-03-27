"use client";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { ImageSetValue, InputImageSet } from "~/components/forms/input-image-set";
import { InlineLink } from "~/components/inline-link";
import { InputEditor, InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { html } from "~/html";
import { urls } from "~/urls";

export const BiographyForm: React.FC = () => {
	const [session, mutateSession] = useSession();

	if (!session) return null;

	const { user } = session;
	const { profile } = user;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				displayName: profile.displayName || user.username || "",
				images: profile.images.map((image) => ({
					id: image.id,
					file: null,
					src: image.url
				})) as Array<ImageSetValue>,
				biography: user.profile.biography || ""
			}}
			onSubmit={async ({ displayName, biography, ...values }) => {
				const [profile, images] = await Promise.all([
					await api.user.profile.update(user.id, {
						query: {
							required: ["displayName", "biography"]
						},
						body: {
							displayName,
							biography: html(biography)
						}
					}),
					await api.user.profile.images.update(user.id, {
						body: values.images.map((image) => image.id).filter(Boolean)
					})
				]);

				await mutateSession({
					...session,
					user: {
						...user,
						profile: {
							...profile,
							images
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
								<InputLabel {...field.labelProps}>Display name</InputLabel>
								<InputText {...field.props} />
								<InputLabelHint className="text-sm">
									This is how you&apos;ll appear around Flirtual. Your display name can contain
									special characters and doesn&apos;t need to be unique. Your profile link (
									<InlineLink className="font-mono" href={urls.user.profile(user.username)}>
										flirtu.al/
										{user.username}
									</InlineLink>
									) will still use your username.
								</InputLabelHint>
							</>
						)}
					</FormField>
					<FormField name="images">
						{(field) => (
							<>
								<InputLabel {...field.labelProps} inline hint="Upload your VR avatar pictures!">
									Profile pictures
								</InputLabel>
								<InputImageSet {...field.props} />
							</>
						)}
					</FormField>
					<FormField name="biography">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>Bio</InputLabel>
								<InputEditor {...field.props} />
							</>
						)}
					</FormField>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};

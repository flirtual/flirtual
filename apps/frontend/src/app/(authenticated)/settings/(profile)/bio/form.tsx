"use client";

import { FC } from "react";

import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import {
	ImageSetValue,
	InputImageSet
} from "~/components/forms/input-image-set";
import { InlineLink } from "~/components/inline-link";
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

export const BiographyForm: FC = () => {
	const [session, mutateSession] = useSession();
	const toasts = useToast();

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
				biography: user.profile.biography || "",
				vrchat: user.profile.vrchat || "",
				discord: user.profile.discord || ""
			}}
			onSubmit={async ({
				displayName,
				biography,
				discord,
				vrchat,
				...values
			}) => {
				const [profile, images] = await Promise.all([
					await api.user.profile.update(user.id, {
						query: {
							required: ["displayName", "biography"]
						},
						body: {
							displayName,
							biography: html(biography),
							discord: discord.trim() || null,
							vrchat: vrchat.trim() || null
						}
					}),
					await api.user.profile.images.update(user.id, {
						body: values.images.map((image) => image.id).filter(Boolean)
					})
				]);

				toasts.add("Saved biography & pictures");

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
									This is how you&apos;ll appear around Flirtual. Your display
									name can contain special characters and doesn&apos;t need to
									be unique. Your profile link (
									<InlineLink className="font-mono" href={urls.profile(user)}>
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
								<InputLabel
									{...field.labelProps}
									inline
									hint="Upload your VR avatar pictures!"
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
								<InputLabel {...field.labelProps}>Bio</InputLabel>
								<InputEditor {...field.props} />
							</>
						)}
					</FormField>
					<div className="flex flex-col gap-4">
						<InputLabel hint="(optional)">
							Add accounts to your profiles
						</InputLabel>
						<InputLabelHint className="-mt-3 text-sm">
							People can see your accounts after you match, to help you meet up.
						</InputLabelHint>
						<div className="flex gap-4">
							<FormField className="basis-64" name="vrchat">
								{(field) => (
									<>
										<InputLabel {...field.labelProps}>VRChat</InputLabel>
										<InputText {...field.props} />
									</>
								)}
							</FormField>
							<FormField className="basis-64" name="discord">
								{(field) => (
									<>
										<InputLabel {...field.labelProps}>Discord</InputLabel>
										<InputText {...field.props} />
									</>
								)}
							</FormField>
						</div>
						{/* {availableConnections.length !== 0 && (
							<div className="flex flex-wrap gap-4">
								{availableConnections.map((type) => (
									<AddConnectionButton key={type} type={type} />
								))}
							</div>
						)}
						{user.connections && (
							<div className="flex flex-wrap gap-4">
								{user.connections.map((connection) => (
									<ConnectionItem {...connection} key={connection.type} />
								))}
							</div>
						)} */}
					</div>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};

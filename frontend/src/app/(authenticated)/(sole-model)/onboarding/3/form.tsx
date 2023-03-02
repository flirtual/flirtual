"use client";

import { useRouter } from "next/navigation";

import { InputEditor, InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { urls } from "~/urls";
import { ImageSetValue, InputImageSet } from "~/components/forms/input-image-set";

export const Onboarding3Form: React.FC = () => {
	const { data: user } = useCurrentUser();
	const router = useRouter();

	if (!user) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				displayName: user.profile.displayName || user.username || "",
				images: user.profile.images.map((image) => ({
					id: image.id,
					fileId: image.externalId,
					file: null,
					src: urls.media(image.externalId)
				})) as Array<ImageSetValue>,
				biography: user.profile.biography || "",
				connectionsPrivacy: user.preferences?.privacy.connections ?? "matches"
			}}
			onSubmit={async (values) => {
				await Promise.all([
					api.user.profile.update(user.id, {
						biography: values.biography || " ",
						displayName: values.displayName
					}),
					api.user.preferences.updatePrivacy(user.id, {
						connections: values.connectionsPrivacy
					})
				]);

				if (values.images.length) {
					const imageIds = values.images
						.map((image) => image.id)
						.filter((id) => !!id) as Array<string>;

					await api.user.profile.images.update(user.id, imageIds);
				}

				router.push(urls.onboarding(4));
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
									<span className="font-mono">
										flirtu.al/
										{user.username}
									</span>
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
								<InputLabel {...field.labelProps}>Biography</InputLabel>
								<InputEditor {...field.props} />
							</>
						)}
					</FormField>
					{/* <div className="flex flex-col gap-2">
						<InputLabel>Connect accounts</InputLabel>
						<div className="flex flex-col gap-4">
							<ConnectionButton Icon={DiscordIcon} iconClassName="bg-[#5865F2]">
								Discord
							</ConnectionButton>
							<ConnectionButton Icon={LinkIcon} iconClassName="bg-black-70">
								VRChat
							</ConnectionButton>
						</div>
					</div>

					<FormField name="connectionsPrivacy">
						{(field) => (
							<>
								<InputLabel inline hint="Who can see your connected accounts?">
									Connected account privacy
								</InputLabel>
								<InputPrivacySelect {...field.props} />
							</>
						)}
					</FormField> */}
					<FormButton />
				</>
			)}
		</Form>
	);
};

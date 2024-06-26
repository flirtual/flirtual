"use client";

import { useRouter } from "next/navigation";

import {
	InputEditor,
	InputLabel,
	InputLabelHint,
	InputText
} from "~/components/inputs";
import { api } from "~/api";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { urls } from "~/urls";
import {
	ImageSetValue,
	InputImageSet
} from "~/components/forms/input-image-set";
import { useSession } from "~/hooks/use-session";

export const Onboarding3Form: React.FC = () => {
	const [session] = useSession();
	const router = useRouter();

	if (!session) return null;
	const { user } = session;

	return (
		<Form
			className="flex flex-col gap-8"
			requireChange={false}
			fields={{
				displayName: user.profile.displayName || user.username || "",
				images: user.profile.images.map((image) => ({
					id: image.id,
					file: null,
					src: urls.pfp(image)
				})) as Array<ImageSetValue>,
				biography: user.profile.biography || ""
			}}
			onSubmit={async (values) => {
				await Promise.all([
					api.user.profile.update(user.id, {
						query: {
							required: ["biography", "displayName"]
						},
						body: {
							biography: values.biography,
							displayName: values.displayName
						}
					}),
					await api.user.profile.images.update(user.id, {
						body: (
							await api.user.profile.images.create(user.id, {
								body: values.images.map((image) => image.id).filter(Boolean)
							})
						).map((image) => image.id)
					})
				]);

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
									This is how you&apos;ll appear around Flirtual. Your display
									name can contain special characters and doesn&apos;t need to
									be unique. Your profile link (
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
					<FormButton>Continue</FormButton>
				</>
			)}
		</Form>
	);
};

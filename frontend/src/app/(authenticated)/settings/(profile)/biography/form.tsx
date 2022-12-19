"use client";

import { api } from "~/api";
import { ArrangeableImageSet } from "~/components/arrangeable-image-set";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InlineLink } from "~/components/inline-link";
import { InputEditor, InputFile, InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { html } from "~/html";
import { urls } from "~/urls";

interface Image {
	id: string | null;
	fileId: string | null;
	file: File | null;
	src: string;
}

export const BiographyForm: React.FC = () => {
	const { data: user, mutate: mutateUser } = useCurrentUser();
	if (!user) return null;

	const { profile } = user;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				displayName: profile.displayName || user.username || "",
				images: profile.images.map((image) => ({
					id: image.id,
					fileId: image.externalId,
					file: null,
					src: urls.media(image.externalId)
				})) as Array<Image>,
				biography: user.profile.biography || ""
			}}
			onSubmit={async ({ displayName, biography, ...values }) => {
				const imageIds = values.images
					.map((image) => image.id)
					.filter((id) => !!id) as Array<string>;

				const [profile, images] = await Promise.all([
					await api.user.profile.update(user.id, { displayName, biography: html(biography) }),
					await api.user.profile.images.update(user.id, imageIds)
				]);

				await mutateUser((user) =>
					user
						? {
								...user,
								profile: {
									...profile,
									images
								}
						  }
						: null
				);
			}}
		>
			{({ FormField, setSubmitting }) => (
				<>
					<FormField name="displayName">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>Display name</InputLabel>
								<InputText {...field.props} />
								<InputLabelHint className="text-sm">
									This is how you&apos;ll appear around Flirtual. Your display name can contain
									special characters and doesn&apos;t need to be unique. Your profile link (
									<InlineLink className="font-mono" href={urls.user(user.username)}>
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
								<ArrangeableImageSet
									inputId={field.props.id}
									value={field.props.value.map((image) => ({
										src: image.src,
										uploading: !!image.file
									}))}
									onChange={(value) =>
										field.props.onChange(
											// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
											value.map(({ src }) => field.props.value.find((a) => a.src === src)!)
										)
									}
								/>
								<InputFile
									multiple
									accept="image/*"
									className="hidden"
									id={field.props.id}
									onChange={async (files) => {
										field.props.onChange([
											...field.props.value,
											...files.map((file) => ({
												id: null,
												fileId: null,
												file,
												src: URL.createObjectURL(file)
											}))
										]);

										setSubmitting(true);
										const newImages = await api.user.profile.images.upload(user.id, files);

										field.props.onChange([
											...field.props.value.filter((image) => "id" in image),
											...newImages.map((image) => ({
												id: image.id,
												fileId: image.externalId,
												file: null,
												src: urls.media(image.externalId)
											}))
										]);

										setSubmitting(false);
									}}
								/>
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
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};

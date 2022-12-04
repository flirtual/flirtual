"use client";

import { PhotoIcon } from "@heroicons/react/24/solid";

import { api } from "~/api";
import { ArrangeableImageSet } from "~/components/arrangeable-image-set";
import { Form } from "~/components/forms";
import { FormButton } from "~/components/forms/button";
import { InlineLink } from "~/components/inline-link";
import { InputFile, InputLabel, InputLabelHint, InputText } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { urls } from "~/pageUrls";
import { pick } from "~/utilities";

export const BiographyForm: React.FC = () => {
	const { data: user } = useCurrentUser();
	if (!user) return null;

	const { profile } = user;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				displayName: profile.displayName || user.username || "",
				images: profile.images.map((image) => ({
					id: image.id,
					src: `https://media.flirtu.al/${image.externalId}/`
				})) as Array<{ src: string } & ({ file: File } | { id: string })>,
				biography: user.profile.biography || ""
			}}
			onSubmit={async (values) => {
				await api.user.profile.update(user.id, pick(values, ["displayName", "biography"]));
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
										uploading: "file" in image
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
									value={[]}
									onChange={async (files) => {
										field.props.onChange([
											...field.props.value,
											...files.map((file) => ({ file, src: URL.createObjectURL(file) }))
										]);

										const fileIds = await api.file.upload(files);

										field.props.onChange([
											...field.props.value.filter((image) => "id" in image),
											...fileIds.map((fileId) => ({
												id: fileId,
												src: `https://media.flirtu.al/${fileId}/`
											}))
										]);
									}}
								/>
							</>
						)}
					</FormField>
					<FormField name="biography">
						{(field) => (
							<>
								<InputLabel {...field.labelProps}>Biography</InputLabel>
								<InputText {...field.props} />
							</>
						)}
					</FormField>
					<FormButton>Update</FormButton>
				</>
			)}
		</Form>
	);
};

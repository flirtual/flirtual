"use client";

import byteSize from "byte-size";
import { PhotoIcon } from "@heroicons/react/24/solid";
import { LinkIcon } from "@heroicons/react/24/outline";
import { Discord } from "@icons-pack/react-simple-icons";
import { useRouter } from "next/navigation";

import { InputFile, InputLabel, InputLabelHint, InputSelect, InputText } from "~/components/inputs";
import { useCurrentUser } from "~/hooks/use-current-user";
import { privacyOptionLabel } from "~/const";
import { api } from "~/api";
import { pick } from "~/utilities";
import { PrivacyPreferenceOptions } from "~/api/user/preferences";
import { Form } from "~/components/forms";
import { ArrangeableImageSet } from "~/components/arrangeable-image-set";
import { FormButton } from "~/components/forms/button";
import { urls } from "~/urls";

import { ConnectionButton } from "./connection-button";

export const Onboarding3Form: React.FC = () => {
	const { data: user } = useCurrentUser();
	const router = useRouter();

	if (!user) return null;

	return (
		<Form
			className="flex flex-col gap-8"
			fields={{
				displayName: user.profile.displayName || user.username || "",
				images: [] as Array<{ file: File; src: string }>,
				biography: user.profile.biography || "",
				connectionsPrivacy: user.preferences.privacy.connections ?? "matches"
			}}
			onSubmit={async (values) => {
				await Promise.all([
					api.user.profile.update(user.id, pick(values, ["displayName", "biography"])),
					api.user.preferences.updatePrivacy(user.id, {
						connections: values.connectionsPrivacy
					})
				]);

				if (values.images.length) {
					const files = values.images.map((image) => image.file);
					await api.user.profile.images.upload(user.id, files);
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
								<ArrangeableImageSet
									inputId={field.props.id}
									value={field.props.value.map(({ src }) => ({ src }))}
									onChange={(value) =>
										field.props.onChange(
											// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
											value.map(({ src }) => field.props.value.find((a) => a.src === src)!)
										)
									}
								/>
								<label
									className="flex cursor-pointer items-center overflow-hidden rounded-xl bg-white-40 text-left shadow-brand-1 focus-within:ring-2 focus-within:ring-coral focus-within:ring-offset-2 focus:outline-none dark:bg-black-60 dark:text-white-20 focus-within:dark:ring-offset-black-50"
									htmlFor={field.labelProps.htmlFor}
									tabIndex={0}
								>
									<div className="flex items-center justify-center bg-brand-gradient p-2 text-white-20">
										<PhotoIcon className="h-7 w-7" />
									</div>
									<span className="px-4 py-2 font-nunito">
										{field.props.value.length ? "Choose new images" : "Choose images"}
									</span>
								</label>
								<InputLabelHint>
									{field.props.value.length} file{field.props.value.length === 1 ? "" : "s"} total,{" "}
									{byteSize(
										field.props.value
											.map(({ file }) => file.size)
											.reduce((prev, curr) => prev + curr, 0)
									).toString()}
								</InputLabelHint>
								<InputFile
									multiple
									accept="image/*"
									className="hidden"
									id={field.props.id}
									onChange={(files) =>
										field.props.onChange(
											files.map((file) => ({ file, src: URL.createObjectURL(file) }))
										)
									}
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
					<div className="flex flex-col gap-2">
						<InputLabel>Connect accounts</InputLabel>
						<div className="flex flex-col gap-4">
							<ConnectionButton Icon={Discord} iconClassName="bg-[#5865F2]">
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
								<InputSelect
									{...field.props}
									options={PrivacyPreferenceOptions.map((option) => ({
										key: option,
										label: privacyOptionLabel[option]
									}))}
								/>
							</>
						)}
					</FormField>
					<FormButton />
				</>
			)}
		</Form>
	);
};

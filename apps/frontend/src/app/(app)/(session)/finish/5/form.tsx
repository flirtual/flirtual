"use client";

import { useRouter } from "next/navigation";
import { MoveLeft } from "lucide-react";

import { InputText } from "~/components/inputs";
import { useSession } from "~/hooks/use-session";
import { Form, FormButton } from "~/components/forms";
import { api } from "~/api";
import { VRChatIcon, FaceTimeIcon } from "~/components/icons";
import { urls } from "~/urls";
import { ButtonLink } from "~/components/button";
import { useDevice } from "~/hooks/use-device";
import { AddConnectionButton } from "~/components/forms/add-connection-button";

export const Finish5Form: React.FC<{ error?: string }> = ({ error }) => {
	const { vision } = useDevice();
	const router = useRouter();
	const [session] = useSession();

	if (!session) return null;

	const { user } = session;

	return (
		<>
			{error && (
				<div className="mb-8 rounded-lg bg-brand-gradient px-6 py-4">
					<span className="font-montserrat text-lg text-white-10">{error}</span>
				</div>
			)}
			<div className="flex flex-col gap-4">
				<div>
					<span className="flex select-none text-xl">
						Add accounts to your profile
					</span>
					<span className="select-none text-black-50 vision:text-white-50 dark:text-white-50">
						People can see your accounts after you match, to help you meet up.
						You&apos;ll also be able to log in to Flirtual with your Discord
						account.
					</span>
				</div>
				<Form
					className="flex flex-col gap-8"
					requireChange={false}
					fields={{
						vrchat: user.profile.vrchat || "",
						facetime: user.profile.facetime || ""
					}}
					onSubmit={async ({ vrchat, facetime }) => {
						await api.user.profile.update(user.id, {
							body: {
								vrchat: vrchat.trim() || null,
								facetime: facetime.trim() || null
							}
						});

						router.push(
							user.emailConfirmedAt ? urls.browse() : urls.confirmEmail()
						);
					}}
				>
					{({ FormField }) => (
						<>
							<div className="grid gap-4 wide:grid-cols-2">
								<AddConnectionButton type="discord" />
								{/* <AddConnectionButton type="vrchat" />
							{platform === "apple" ? (
								<>
									<AddConnectionButton type="apple" />
									<AddConnectionButton type="google" />
								</>
							) : (
								<>
									<AddConnectionButton type="google" />
									<AddConnectionButton type="apple" />
								</>
							)}
							<AddConnectionButton type="meta" /> */}
								<FormField className="col-span-2 wide:col-span-1" name="vrchat">
									{(field) => (
										<InputText
											connection
											Icon={VRChatIcon}
											iconColor="#095d6a"
											placeholder="VRChat"
											{...field.props}
										/>
									)}
								</FormField>
								{vision && session.user.tags?.includes("debugger") && (
									<FormField
										className="col-span-2 wide:col-span-1"
										name="facetime"
									>
										{(field) => (
											<InputText
												connection
												Icon={FaceTimeIcon}
												iconColor="#34da4f"
												placeholder="FaceTime number"
												{...field.props}
											/>
										)}
									</FormField>
								)}
							</div>
							<div className="flex justify-end gap-2">
								<ButtonLink
									className="flex w-fit flex-row gap-2 opacity-75"
									href={urls.finish(4)}
									kind="tertiary"
									size="sm"
								>
									<MoveLeft className="size-5" />
									<span>Back</span>
								</ButtonLink>
								<FormButton className="w-36" size="sm">
									Finish
								</FormButton>
							</div>
						</>
					)}
				</Form>
			</div>
		</>
	);
};

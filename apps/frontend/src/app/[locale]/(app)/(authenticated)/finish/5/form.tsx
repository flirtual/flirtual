"use client";

import { MoveLeft } from "lucide-react";
import { useTranslations } from "next-intl";
// eslint-disable-next-line no-restricted-imports
import { useRouter, useSearchParams } from "next/navigation";

import { Profile } from "~/api/user/profile";
import { ButtonLink } from "~/components/button";
import { Form, FormButton } from "~/components/forms";
import { AddConnectionButton } from "~/components/forms/add-connection-button";
import { FaceTimeIcon, VRChatIcon } from "~/components/icons";
import { InputText } from "~/components/inputs";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";
import { urls } from "~/urls";

export const Finish5Form: React.FC = () => {
	const query = useSearchParams();
	const error = query.get("error") || undefined;

	const { vision } = useDevice();
	const router = useRouter();
	const session = useOptionalSession();
	const t = useTranslations();

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
					<span className="flex text-xl">{t("drab_game_myna_yell")}</span>
					<span className="text-black-50 vision:text-white-50 dark:text-white-50">{t("empty_petty_bullock_drop")}</span>
				</div>
				<Form
					fields={{
						vrchat: user.profile.vrchat || "",
						facetime: user.profile.facetime || ""
					}}
					className="flex flex-col gap-8"
					requireChange={false}
					onSubmit={async ({ vrchat, facetime }) => {
						await Profile.update(user.id, {
							vrchat: vrchat.trim() || null,
							facetime: facetime.trim() || null
						});

						router.push(
							user.emailConfirmedAt ? urls.discover("love") : urls.confirmEmail()
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
								<FormField name="vrchat">
									{(field) => (
										<InputText
											Icon={VRChatIcon}
											iconColor="#095d6a"
											placeholder={t("vrchat")}
											{...field.props}
										/>
									)}
								</FormField>
								{vision && session.user.tags?.includes("debugger") && (
									<FormField
										name="facetime"
									>
										{(field) => (
											<InputText
												Icon={FaceTimeIcon}
												iconColor="#34da4f"
												placeholder={t("facetime_number")}
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
									<span>{t("back")}</span>
								</ButtonLink>
								<FormButton className="min-w-36" size="sm">
									{t("finish")}
								</FormButton>
							</div>
						</>
					)}
				</Form>
			</div>
		</>
	);
};

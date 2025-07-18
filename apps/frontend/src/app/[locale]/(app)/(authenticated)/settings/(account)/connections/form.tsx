// eslint-disable-next-line no-restricted-imports
import { useSearchParams } from "react-router";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { withSuspense } from "with-suspense";

import type { Session } from "~/api/auth";
import { Profile } from "~/api/user/profile";
import { NewBadge } from "~/components/badge";
import { Form, FormButton } from "~/components/forms";
import { AddConnectionButton } from "~/components/forms/add-connection-button";
import { FaceTimeIcon, VRChatIcon } from "~/components/icons";
import { InputText } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import { ProfilePlaylist } from "~/components/profile/playlist";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { mutate, sessionKey } from "~/query";

const ConnectionError: FC = withSuspense(() => {
	const query = useSearchParams();
	const error = query.get("error");

	const tError = useTranslations("errors");

	if (!error || error === "access_denied") return null;

	return (
		<div className="mb-8 rounded-lg bg-brand-gradient px-6 py-4">
			<span className="font-montserrat text-lg text-white-10">
				{tError(error as any)}
			</span>
		</div>
	);
});

export const ConnectionsForm: FC = () => {
	const { vision } = useDevice();
	const { user } = useSession();
	const toasts = useToast();
	const [playlistSubmitted, setPlaylistSubmitted] = useState<string | null>(
		null
	);
	const { t } = useTranslation();

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("connections")}
		>
			<ConnectionError />
			<Form
				fields={{
					vrchat: user.profile.vrchatName || "",
					facetime: user.profile.facetime || "",
					playlist: user.profile.playlist || ""
				}}
				className="flex flex-col gap-8"
				onSubmit={async ({ vrchat, facetime, playlist }, form) => {
					if (playlist.includes("deezer.page.link")) {
						setPlaylistSubmitted("deezer.page.link");
					}
					else if (
						(playlist.includes("youtube.com") || playlist.includes("youtu.be"))
						&& !playlist.includes("music.youtube.com")
					) {
						setPlaylistSubmitted("youtube");
					}
					else if (playlist === "") {
						setPlaylistSubmitted(null);
					}
					else {
						setPlaylistSubmitted("other");
					}

					const profile = await Profile.update(user.id, {
						vrchat: form.fields.vrchat.changed ? (vrchat.trim() || null) : undefined,
						facetime: facetime.trim() || null,
						playlist: playlist.trim() || null
					});

					toasts.add(t("merry_arable_alligator_coax"));

					await mutate<Session>(sessionKey(), (session) => ({
						...session,
						user: {
							...user,
							profile
						}
					}));
				}}
			>
				{({ FormField }) => (
					<>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<span className="flex text-xl">{t("drab_game_myna_yell")}</span>
								<span className="text-black-50 vision:text-white-50 dark:text-white-50">{t("empty_petty_bullock_drop")}</span>
							</div>
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
											placeholder="VRChat"
											{...field.props}
										/>
									)}
								</FormField>
								{vision && user.tags?.includes("debugger") && (
									<FormField name="facetime">
										{(field) => (
											<InputText
												Icon={FaceTimeIcon}
												iconColor="#34da4f"
												placeholder={t("facetime_number")}
												type="number"
												{...field.props}
											/>
										)}
									</FormField>
								)}
							</div>
						</div>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<div className="flex gap-2">
									<span className="flex text-xl">
										{t("tough_plain_squirrel_persist")}
									</span>
									<NewBadge />
								</div>
								<span className="text-black-50 vision:text-white-50 dark:text-white-50">
									{t("proof_knotty_cockroach_commend")}
								</span>
							</div>
							<FormField className="col-span-2 wide:col-span-1" name="playlist">
								{(field) => (
									<InputText
										iconColor="#095d6a"
										placeholder={t("last_broad_warbler_nail")}
										{...field.props}
									/>
								)}
							</FormField>
							{playlistSubmitted === "deezer.page.link"
								? (
										<span className="italic text-red-600">
											{t("drab_white_lionfish_nurture")}
										</span>
									)
								: playlistSubmitted === "youtube"
									? (
											<span className="italic text-red-600">
												{t("trite_alive_orangutan_foster")}
											</span>
										)
									: playlistSubmitted === "other"
										? (
												<span className="italic text-black-50 vision:text-white-50 dark:text-white-50">
													{t.rich("main_civil_jaguar_peel", {
														strong: (children) => (
															<strong>{children}</strong>
														)
													})}
												</span>
											)
										: null}
							<span className="italic text-black-50 vision:text-white-50 dark:text-white-50">
								{t("warm_gray_poodle_reap")}
							</span>
							{user.profile.playlist && (
								<ProfilePlaylist playlist={user.profile.playlist} />
							)}
						</div>
						<FormButton className="col-span-2 mt-4">{t("update")}</FormButton>
					</>
				)}
			</Form>
		</ModelCard>
	);
};

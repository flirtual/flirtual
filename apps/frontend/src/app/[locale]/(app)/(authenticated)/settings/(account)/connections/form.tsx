import type { FC } from "react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import type { Session } from "~/api/auth";
import { Profile } from "~/api/user/profile";
import { ConnectionError } from "~/components/connection-error";
import { Form, FormButton } from "~/components/forms";
import { AddConnectionButton } from "~/components/forms/add-connection-button";
import { FaceTimeIcon, VRChatIcon } from "~/components/icons";
import { InputText } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import { ProfilePlaylist } from "~/components/profile/playlist";
import { connectionProvider } from "~/features";
import { useDevice } from "~/hooks/use-device";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";
import { mutate, sessionKey } from "~/query";

export const ConnectionsForm: FC = () => {
	const { vision, apple } = useDevice();
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

					toasts.add(t("saved_connections"));

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
								<span className="flex text-xl">{t("connections_heading")}</span>
								<span className="text-black-50 dark:text-white-50 vision:text-white-50">{t("connections_privacy")}</span>
							</div>
							<div className="grid gap-4 wide:grid-cols-2">
								<AddConnectionButton type="discord" />
								{connectionProvider("vrchat") && (
									<FormField name="vrchat">
										{(field) => (
											<InputText
												Icon={VRChatIcon}
												iconClassName="size-6.5"
												iconColor="#095d6a"
												placeholder="VRChat"
												{...field.props}
											/>
										)}
									</FormField>
								)}
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
								<AddConnectionButton type="meta" />
								{apple
									? (
											<>
												<AddConnectionButton type="apple" />
												<AddConnectionButton type="google" />
											</>
										)
									: (
											<>
												<AddConnectionButton type="google" />
												<AddConnectionButton type="apple" />
											</>
										)}
							</div>
						</div>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<div className="flex gap-2">
									<span className="flex text-xl">
										{t("playlist_heading")}
									</span>
								</div>
								<span className="text-black-50 dark:text-white-50 vision:text-white-50">
									{t("playlist_description")}
								</span>
							</div>
							<FormField name="playlist" className="col-span-2 wide:col-span-1">
								{(field) => (
									<InputText
										iconColor="#095d6a"
										placeholder={t("playlist_placeholder")}
										{...field.props}
									/>
								)}
							</FormField>
							{playlistSubmitted === "deezer.page.link"
								? (
										<span className="text-red-600 italic">
											{t("playlist_deezer_unsupported")}
										</span>
									)
								: playlistSubmitted === "youtube"
									? (
											<span className="text-red-600 italic">
												{t("playlist_youtube_unsupported")}
											</span>
										)
									: playlistSubmitted === "other"
										? (
												<span className="text-black-50 italic dark:text-white-50 vision:text-white-50">
													<Trans i18nKey="playlist_not_public" />
												</span>
											)
										: null}
							<span className="text-black-50 italic dark:text-white-50 vision:text-white-50">
								{t("playlist_privacy_warning")}
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

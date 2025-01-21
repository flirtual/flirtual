"use client";

import { useState } from "react";

import { Profile } from "~/api/user/profile";
import { NewBadge } from "~/components/badge";
import { Form, FormButton } from "~/components/forms";
import { AddConnectionButton } from "~/components/forms/add-connection-button";
import { FaceTimeIcon, VRChatIcon } from "~/components/icons";
import { InputText } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import { ProfilePlaylist } from "~/components/profile/playlist";
import { useDevice } from "~/hooks/use-device";
import { useTranslations } from "~/hooks/use-internationalization";
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const ConnectionsForm: React.FC<{ error?: string }> = ({ error }) => {
	const { vision } = useDevice();
	const [session, mutateSession] = useSession();
	const toasts = useToast();
	const [playlistSubmitted, setPlaylistSubmitted] = useState<string | null>(
		null
	);
	const t = useTranslations();

	if (!session) return null;

	const { user } = session;

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title={t("connections")}
		>
			{error && (
				<div className="mb-8 rounded-lg bg-brand-gradient px-6 py-4">
					<span className="font-montserrat text-lg text-white-10">{error}</span>
				</div>
			)}
			<Form
				fields={{
					vrchat: user.profile.vrchat || "",
					facetime: user.profile.facetime || "",
					playlist: user.profile.playlist || ""
				}}
				className="flex flex-col gap-8"
				onSubmit={async ({ vrchat, facetime, playlist }) => {
					if (/deezer\.page\.link/.test(playlist)) {
						setPlaylistSubmitted("deezer.page.link");
					}
					else if (/youtu\.?be/.test(playlist)) {
						setPlaylistSubmitted("youtube");
					}
					else if (playlist === "") {
						setPlaylistSubmitted(null);
					}
					else {
						setPlaylistSubmitted("other");
					}

					const profile = await Profile.update(user.id, {
						vrchat: vrchat.trim() || null,
						facetime: facetime.trim() || null,
						playlist: playlist.trim() || null
					});

					toasts.add(t("merry_arable_alligator_coax"));

					await mutateSession({
						...session,
						user: {
							...user,
							profile: {
								...profile
							}
						}
					});
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
								{vision && session.user.tags?.includes("debugger") && (
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
													{t.rich("main_civil_jaguar_peel", { strong: (children) => (
														<strong>{children}</strong>
													) })}
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

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
import { useSession } from "~/hooks/use-session";
import { useToast } from "~/hooks/use-toast";

export const ConnectionsForm: React.FC<{ error?: string }> = ({ error }) => {
	const { vision } = useDevice();
	const [session, mutateSession] = useSession();
	const toasts = useToast();
	const [playlistSubmitted, setPlaylistSubmitted] = useState<string | null>(
		null
	);

	if (!session) return null;

	const { user } = session;

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			inset={false}
			title="Connections"
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

					toasts.add("Saved connections");

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
								<span className="flex text-xl">
									Add accounts to your profile
								</span>
								<span className="text-black-50 vision:text-white-50 dark:text-white-50">
									People can see your accounts after you match, to help you meet
									up. You&apos;ll also be able to log in to Flirtual with your
									Discord account.
								</span>
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
												placeholder="FaceTime number"
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
										Add a playlist to your profile
									</span>
									<NewBadge />
								</div>
								<span className="text-black-50 vision:text-white-50 dark:text-white-50">
									Share your favorite music on your profile by adding a Spotify,
									Apple Music, Tidal, Amazon Music, or Deezer playlist.
								</span>
							</div>
							<FormField className="col-span-2 wide:col-span-1" name="playlist">
								{(field) => (
									<InputText
										iconColor="#095d6a"
										placeholder="Playlist link (e.g. https://open.spotify.com/playlist/...)"
										{...field.props}
									/>
								)}
							</FormField>
							{playlistSubmitted === "deezer.page.link"
								? (
										<span className="italic text-red-600">
											Sorry, deezer.page.link links are not supported. Please
											provide a deezer.com link. You can find this by following your
											link and copying the URL from your browser.
										</span>
									)
								: playlistSubmitted === "youtube"
									? (
											<span className="italic text-red-600">
												Sorry, YouTube Music playlists are not supported.
											</span>
										)
									: playlistSubmitted === "other"
										? (
												<span className="italic text-black-50 vision:text-white-50 dark:text-white-50">
													If your playlist doesn&apos;t appear below, ensure you have
													provided a valid
													{" "}
													<strong>public playlist</strong>
													{" "}
													link. Songs,
													albums, and private playlists are not supported.
												</span>
											)
										: null}
							<span className="italic text-black-50 vision:text-white-50 dark:text-white-50">
								Be careful: if your real name or other personal information is
								on your music streaming profile, it will be public.
							</span>
							{user.profile.playlist && (
								<ProfilePlaylist playlist={user.profile.playlist} />
							)}
						</div>
						<FormButton className="col-span-2 mt-4">Update</FormButton>
					</>
				)}
			</Form>
		</ModelCard>
	);
};

"use client";

import { useRouter } from "next/navigation";
import type { FC, PropsWithChildren, ReactNode } from "react";
import { Suspense, useDeferredValue, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import useSWR, { unstable_serialize } from "swr";
import { twMerge } from "tailwind-merge";

import type { AttributeType, GroupedAttributeCollection, MinimalAttribute } from "~/api/attributes";
import { Attribute, attributeTypes } from "~/api/attributes";
import type { User } from "~/api/user";
import type { Relationship } from "~/api/user/relationship";
import { InputImageSet } from "~/components/forms/input-image-set";
import { InputAutocomplete, InputCheckbox, InputDateSelect, InputEditor, InputLabel, InputLabelHint, InputText, InputTextArea } from "~/components/inputs";
import { InputCountrySelect } from "~/components/inputs/specialized";
import { ModelCard } from "~/components/model-card";
import { Profile } from "~/components/profile/profile";
import { SWRConfig } from "~/components/swr";
import { useAttributeTranslation } from "~/hooks/use-attribute";
import { useCurrentUser, useSession } from "~/hooks/use-session";
import { attributeKey, relationshipKey, sessionKey, userKey } from "~/swr";
import { urls } from "~/urls";

import { InputColor, InputProfileColor } from "../../settings/(account)/appearance/form";

type GroupedAttributes = Record<AttributeType, Array<MinimalAttribute<AttributeType>>>;

const fakeId = "0000000000000000000000";
const fakeLegacyId = "00000000-00000000-00000000-00000000";

const fakeViewerId = "0000000000000000000001";
const fakeViewerLegacyId = "00000000-00000000-00000000-00000001";

const Details: FC<PropsWithChildren<{ summary: ReactNode }>> = ({ children, summary }) => {
	const [open, setOpen] = useState(false);

	return (
		<details open={open} onToggle={() => setOpen((open) => !open)}>
			<summary>{summary}</summary>
			{open && children}
		</details>
	);
};

export default function FakeProfilePage() {
	const router = useRouter();

	const [session] = useSession()!;
	const current = useCurrentUser()!;

	const tAttribute = useAttributeTranslation();

	const [viewer, setViewer] = useState<User>({ ...current, id: fakeViewerId, talkjsId: fakeViewerLegacyId });

	const [user, setUser] = useState<User>({ ...current, id: fakeId, talkjsId: fakeLegacyId });
	const [relationship, setRelationship] = useState<Relationship | null>(null);

	const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
	const [hideModeratorInfo, setHideModeratorInfo] = useState(true);
	const [profileShadow, setProfileShadow] = useState(true);
	const [backgroundColor, setBackgroundColor] = useState("#000000");

	useEffect(() => {
		const { relationship, user, viewer } = JSON.parse(atob(window.location.hash.slice(1))) as any;

		setRelationship(relationship);
		setUser(user);
		setViewer(viewer);
	}, []);

	const data = useMemo(() => ({ relationship, user, viewer }), [relationship, user, viewer]);
	const deferredData = useDeferredValue(data);

	useEffect(() => {
		const data = btoa(JSON.stringify(deferredData));
		router.replace(`/preview#${data}`, { scroll: false });
	}, [router, deferredData]);

	const { data: groupedAttributes = {} as GroupedAttributes } = useSWR<GroupedAttributes>(
		"attributes",
		async () =>
			Object.fromEntries(await Promise.all(attributeTypes.map(async (type) => {
				if (["country", "language"].includes(type)) return [type, []];
				return [type, await Attribute.list(type)];
			})))
	);

	const attributeOptions = useMemo(() => {
		return Object.entries(groupedAttributes).filter(Boolean).map(([type, attributes = []]) => {
			return attributes.map((attribute) => {
				const id = typeof attribute === "string" ? attribute : attribute.id;
				return { key: `${type}-${id}`, label: `${tAttribute[id]?.name || id} (${type})` };
			});
		}).flat();
	}, [groupedAttributes, tAttribute]);

	if (!session) return null;

	return (
		<div className={twMerge("w-full flex-col-reverse gap-x-8 gap-y-24", {
			horizontal: "flex wide:grid grid-cols-2",
			vertical: "flex"
		}[layout])}
		>
			<ModelCard
				className="w-full desktop:!max-w-inherit"
				containerProps={{ className: "!p-8 gap-2" }}
				title="Profile Preview"
			>
				<Details summary="Settings">
					<div className="grid grid-cols-2 flex-wrap gap-x-8 gap-y-4">
						<div className="hidden items-center gap-4 wide:flex">
							<InputCheckbox
								value={layout === "vertical"}
								onChange={(value) => setLayout(value ? "vertical" : "horizontal")}
							/>
							<InputLabel inline>
								Vertical Layout
							</InputLabel>
						</div>
						<div className="flex items-center gap-4">
							<InputCheckbox
								value={!hideModeratorInfo}
								onChange={(value) => setHideModeratorInfo(!value)}
							/>
							<InputLabel inline>
								Moderator
							</InputLabel>
						</div>
						<div className="flex items-center gap-4">
							<InputCheckbox
								value={viewer.preferences?.nsfw || false}
								onChange={(nsfw) => setViewer((viewer) => ({
									...viewer,
									preferences: {
										...viewer.preferences!,
										nsfw
									}
								}))}
							/>
							<InputLabel inline>
								NSFW
							</InputLabel>
						</div>
					</div>
				</Details>
				<Details summary="Profile">
					<div className="flex flex-col gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-2">
								<InputLabel>Display Name</InputLabel>
								<InputText
									value={user.profile.displayName || ""}
									onChange={((displayName) =>
										setUser((user) => ({
											...user,
											profile: {
												...user.profile,
												displayName
											}
										})))}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="flex flex-col gap-2">
								<InputLabel>Born At</InputLabel>
								<InputDateSelect
									value={user.bornAt ? new Date(user.bornAt) : new Date()}
									onChange={(value) => setUser((user) => ({ ...user, bornAt: value.toISOString() }))}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<InputLabel>Last Activity</InputLabel>
								<InputDateSelect
									value={user.activeAt ? new Date(user.activeAt) : new Date()}
									onChange={(value) => setUser((user) => ({ ...user, activeAt: value.toISOString() }))}
								/>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<InputLabel>Biography</InputLabel>
							<InputEditor
								value={user.profile.biography || ""}
								onChange={(biography) =>
									setUser((user) => ({
										...user,
										profile: {
											...user.profile,
											biography,
										},
									}))}
							/>
						</div>
						<InputImageSet
							value={user.profile.images.map((image) => ({
								id: image.id,
								src: urls.pfp(image),
								fullSrc: urls.pfp(image, "full")
							}))}
							onChange={(images) => {
								const now = new Date().toISOString();

								setUser((user) => ({
									...user,
									profile: {
										...user.profile,
										images: images.map((image) => ({
											id: image.id,
											originalFile: image.id,
											updatedAt: now,
											createdAt: now
										})),
									},
								}));
							}}
						/>
						<div className="flex flex-col gap-2">
							<InputLabel>Attributes</InputLabel>
							<InputAutocomplete
								options={attributeOptions}
								value={Object.entries(user.profile.attributes).map(([type, ids = []]) => ids.map((id) => `${type}-${id}`)).flat()}
								onChange={(values) => {
									const attributes = values.reduce((accumulator, value) => {
										const [type, id] = value.split("-") as [AttributeType, string];

										if (!accumulator[type]) accumulator[type] = [];
										accumulator[type].push(id);

										return accumulator;
									}, {} as GroupedAttributeCollection);

									setUser((user) => ({
										...user,
										profile: {
											...user.profile,
											attributes,
										},
									}));
								}}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<InputLabel>Country</InputLabel>
							<InputCountrySelect
								value={user.profile.country!}
								onChange={(country) => setUser((user) => ({ ...user, profile: { ...user.profile, country: country || undefined } }))}
							/>
						</div>
					</div>
				</Details>
				<Details summary="Appearance">
					<div className="flex flex-col gap-2">
						<InputLabel>Colors</InputLabel>
						<div className="grid grid-cols-2 gap-8">
							<InputProfileColor
								value={{
									color_1: user.profile.color_1 || "#000000",
									color_2: user.profile.color_2 || "#000000"
								}}
								onChange={(value) => setUser((user) => ({
									...user,
									profile: {
										...user.profile,
										color_1: value.color_1,
										color_2: value.color_2
									}
								}))}
							/>
							<div className="flex flex-col gap-4">
								<div className="hidden items-center gap-4 wide:flex">
									<InputCheckbox
										value={profileShadow}
										onChange={setProfileShadow}
									/>
									<InputLabel inline>
										Profile Shadow
									</InputLabel>
								</div>
								<InputColor
									value={backgroundColor}
									onChange={(backgroundColor) => {
										setBackgroundColor(backgroundColor);

										const element = document.querySelector<HTMLDivElement>("[data-testid=app-layout]");
										if (!element) return;

										element.style.backgroundColor = backgroundColor;
									}}
								/>
							</div>
						</div>

					</div>
				</Details>
				<Details summary="Viewer">
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<InputLabel hint="(viewer)">Attributes</InputLabel>
							<InputAutocomplete
								options={attributeOptions}
								value={Object.entries(viewer.profile.attributes).map(([type, ids = []]) => ids.map((id) => `${type}-${id}`)).flat()}
								onChange={(values) => {
									const attributes = values.reduce((accumulator, value) => {
										const [type, id] = value.split("-") as [AttributeType, string];

										if (!accumulator[type]) accumulator[type] = [];
										accumulator[type].push(id);

										return accumulator;
									}, {} as GroupedAttributeCollection);

									setViewer((user) => ({
										...user,
										profile: {
											...user.profile,
											attributes,
										},
									}));
								}}
							/>
						</div>
					</div>
				</Details>
				<div className="flex flex-col gap-2">
					<InputLabel
						inline
						hint={(
							<InputLabelHint>
								An object with the following keys:
								{" "}
								<code>relationship</code>
								,
								{" "}
								<code>user</code>
								, and
								{" "}
								<code>viewer</code>
								.
								You can use this to test different scenarios, such as different attributes, relationships, etc that the UI might not allow you to set.
							</InputLabelHint>
						)}
					>
						<div className="flex items-baseline gap-2">
							<span>JSON objects</span>
							{" "}
							<InputLabelHint>copy & pastable!</InputLabelHint>
						</div>
					</InputLabel>
					<InputTextArea
						className="font-mono text-xs"
						rows={16}
						value={JSON.stringify(deferredData, null, 2)}
						onChange={(value) => {
							try {
								const { relationship, user, viewer } = JSON.parse(value) as any;

								setUser(user);
								setRelationship(relationship);
								setViewer(viewer);
							}
							// eslint-disable-next-line unused-imports/no-unused-vars
							catch (reason) {}
						}}
					/>
				</div>
			</ModelCard>
			<div className={twMerge("mx-auto", layout === "horizontal" && "wide:ml-0 wide:mr-auto")}>
				<SWRConfig value={{
					// Our data is fake, if we tried to revalidate it, it would fail.
					revalidateIfStale: false,
					revalidateOnFocus: false,
					revalidateOnMount: false,
					revalidateOnReconnect: false,
					shouldRetryOnError: false,

					// We'll use a new cache for this, since we don't want to pollute the global cache.
					provider: () => new Map(),

					fallback: {
						[unstable_serialize(sessionKey())]: { user: viewer },

						[unstable_serialize(userKey(user.id))]: user,
						[unstable_serialize(relationshipKey(user.id))]: relationship,

						...Object.fromEntries(Object.entries(groupedAttributes).map(([type, attributes]) =>
							[unstable_serialize(attributeKey(type as AttributeType)), attributes])
						),
					}
				}}

				>
					<ErrorBoundary fallback={<span>Couldn't load profile.</span>} resetKeys={[user]}>
						<Suspense fallback={<span>Loading profile...</span>}>
							<Profile
								className={twMerge(!profileShadow && "!shadow-none")}
								hideModeratorInfo={hideModeratorInfo}
								userId={user.id}
							/>
						</Suspense>
					</ErrorBoundary>
				</SWRConfig>
			</div>
		</div>
	);
}

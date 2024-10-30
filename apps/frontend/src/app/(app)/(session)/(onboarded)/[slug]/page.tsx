import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { displayName } from "~/api/user";
import { Profile } from "~/components/profile/profile";
import { SWRConfig } from "~/components/swr";
import { attributeKey, userKey } from "~/swr";
import { urls } from "~/urls";

import { QueueActions } from "../browse/queue-actions";
import { getProfile, profileRequiredAttributes } from "./data";

export interface ProfilePageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata(
	props: ProfilePageProps
): Promise<Metadata> {
	const { slug } = (await props.params) || {};
	const user = await getProfile(slug);
	if (!user) return redirect(urls.default);

	return {
		title: displayName(user)
	};
}

export default async function ProfilePage(props: ProfilePageProps) {
	const { slug } = (await props.params) || {};
	const [user, attributes] = await Promise.all([
		getProfile(slug),
		Promise.all(
			profileRequiredAttributes.map(
				async (type) => [type, await Attribute.list(type)] as const
			)
		)
	]);
	if (!user) redirect(urls.default);

	return (
		<SWRConfig
			value={{
				fallback: {
					[unstable_serialize(userKey(user.id))]: user,
					...Object.fromEntries(
						attributes.map(([type, attribute]) => [
							unstable_serialize(attributeKey(type)),
							attribute
						])
					)
				}
			}}
		>
			<Profile direct userId={user.id} />
			{!user.bannedAt
			&& user.relationship
			&& !user.relationship?.blocked
			&& !user.relationship?.kind && (
				<QueueActions
					explicitUserId={user.id}
					kind="love"
				/>
			)}
		</SWRConfig>
	);
}

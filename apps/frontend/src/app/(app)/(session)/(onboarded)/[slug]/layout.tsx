import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import { unstable_serialize } from "swr";

import { Attribute } from "~/api/attributes";
import { displayName, User } from "~/api/user";
import { SWRConfig } from "~/components/swr";
import { attributeKey, relationshipKey, userKey } from "~/swr";
import { urls } from "~/urls";

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

export default async function ProfilePageLayout({ params, children }: PropsWithChildren<ProfilePageProps>) {
	const { slug } = (await params) || {};
	const user = await getProfile(slug);

	return (
		<SWRConfig
			value={{
				fallback: {
					[unstable_serialize(userKey(user.id))]: user,
					[unstable_serialize(relationshipKey(user.id))]: User.getRelationship(user.id),
					...Object.fromEntries(
						profileRequiredAttributes.map((type) => [
							unstable_serialize(attributeKey(type)),
							Attribute.list(type)
						])
					)
				}
			}}
		>
			{children}
		</SWRConfig>
	);
}

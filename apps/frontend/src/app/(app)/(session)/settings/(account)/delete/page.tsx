import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { DeleteForm } from "./form";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Delete account"
};

export default async function SettingsAccountDeactivatePage() {
	const deleteReasons = await withAttributeList("delete-reason");

	return (
		<ModelCard
			className="shrink desktop:w-full desktop:max-w-2xl"
			title="Delete account"
		>
			<DeleteForm deleteReasons={deleteReasons} />
		</ModelCard>
	);
}

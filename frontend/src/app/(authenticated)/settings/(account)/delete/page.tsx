import { Metadata } from "next";

import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

import { DeleteForm } from "./form";

export const metadata: Metadata = {
	title: "Delete Account"
};

export default async function SettingsAccountDeactivatePage() {
	const deleteReasons = await withAttributeList("delete-reason");

	return (
		<ModelCard title="Delete Account">
			<DeleteForm deleteReasons={deleteReasons} />
		</ModelCard>
	);
}

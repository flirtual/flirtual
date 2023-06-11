import { Metadata } from "next";

import { DeleteForm } from "./form";

import { ModelCard } from "~/components/model-card";
import { withAttributeList } from "~/api/attributes-server";

export const metadata: Metadata = {
	title: "Delete Account"
};

export default async function SettingsAccountDeactivatePage() {
	const deleteReasons = await withAttributeList("delete-reason");

	return (
		<ModelCard className="sm:max-w-2xl" title="Delete Account">
			<DeleteForm deleteReasons={deleteReasons} />
		</ModelCard>
	);
}

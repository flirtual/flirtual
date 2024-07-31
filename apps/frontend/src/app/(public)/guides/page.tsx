import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Guides"
};

export default function GuidesPage() {
	return (
		<SoleModelLayout>
			<ModelCard className="w-full desktop:max-w-2xl" title="Guides">
				<ul className="list-disc text-xl">
					<li>
						<InlineLink href={urls.guides.mentalHealth}>
							Mental health resources
						</InlineLink>
					</li>
				</ul>
			</ModelCard>
		</SoleModelLayout>
	);
}

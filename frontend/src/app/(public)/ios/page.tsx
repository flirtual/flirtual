import { Metadata } from "next";

import { InlineLink } from "~/components/inline-link";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

export const metadata: Metadata = {
	title: "iOS"
};

export default function IOSPage() {
	return (
		<SoleModelLayout>
			<ModelCard className="w-full sm:max-w-2xl" title="Flirtual for iOS">
				<div className="flex flex-col gap-4">
					<p>
						Here&apos;s how to get the Flirtual app right on your Home Screen on an iPhone or iPad.
					</p>
					<ol className="list-decimal pl-4">
						<li>
							Using Safari, tap the Share button.{" "}
							<img className="my-4 rounded-3xl shadow-brand-1" src="/images/ios1.png" />
						</li>
						<li>
							Tap &quot;Add to Home Screen&quot;.
							<img className="my-4 rounded-3xl shadow-brand-1" src="/images/ios2.png" />
						</li>
						<li>
							Tap &quot;Add&quot;.
							<img className="my-4 rounded-3xl shadow-brand-1" src="/images/ios3.png" />
						</li>
					</ol>
					<p>That&apos;s it! You can now find Flirtual on your Home Screen.</p>
					<h2 className="text-xl font-semibold">FAQ</h2>
					<p>
						Flirtual is not available on the App Store yet, but the Flirtual web app works like any
						other app.
					</p>
					<p>
						You must use Safari on an iOS device to install the Flirtual web app. Other browsers are
						unsupported.
					</p>
					<p>
						Push notifications, mobile payments, App Store availability, and more improvements are
						coming soon. Stay tuned!
					</p>
					<p>
						For help, please <InlineLink href={urls.resources.contactDirect}>contact us</InlineLink>
						.
					</p>
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}

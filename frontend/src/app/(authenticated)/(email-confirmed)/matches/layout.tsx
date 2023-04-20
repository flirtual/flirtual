import { ButtonLink } from "~/components/button";
import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { MobileBarNavigation } from "~/components/layout/navigation/mobile-bar";
import { ModelCard } from "~/components/model-card";
import { urls } from "~/urls";

import { withConversations } from "./data";

export default async function ConversationsLayout({ children }: { children: React.ReactNode }) {
	const conversations = await withConversations();

	return (
		<div className="flex min-h-screen grow flex-col items-center overflow-x-hidden bg-cream font-nunito text-black-80 dark:bg-black-80 dark:text-white-20 sm:flex-col">
			{/* @ts-expect-error: Server Component */}
			<Header />
			{conversations.length === 0 ? (
				<div className="flex w-full max-w-screen-lg grow flex-col items-center justify-center sm:px-8">
					<ModelCard
						className="sm:max-w-xl"
						containerProps={{ className: "gap-4" }}
						title="No matches"
					>
						<h1 className="text-2xl font-semibold">You haven&apos;t matched with anyone yet :(</h1>
						<p>
							If you and someone else both like or homie each other (it&apos;s mutual), then you
							will match! After you match, you can message each other on Flirtual and meet up in VR.
						</p>
						<ButtonLink href={urls.browse()}>Browse</ButtonLink>
					</ModelCard>
				</div>
			) : (
				<div className="flex w-full max-w-screen-lg grow flex-col sm:flex-row md:mt-16 md:px-8">
					{children}
				</div>
			)}
			<Footer desktopOnly />
			{/* @ts-expect-error: Server Component */}
			<MobileBarNavigation />
		</div>
	);
}

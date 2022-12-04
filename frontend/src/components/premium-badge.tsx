import Link from "next/link";

import { urls } from "~/pageUrls";

export const PremiumBadge: React.FC = () => (
	<Link
		className="flex shrink-0 grow-0 gap-2 rounded-xl bg-brand-gradient px-2 py-1 shadow-brand-1"
		href={urls.premium()}
	>
		<span className="font-montserrat text-sm text-white-20">Premium</span>
	</Link>
);

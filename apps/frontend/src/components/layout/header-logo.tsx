"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { FlirtualLogo } from "../logo";

import { urls } from "~/urls";
import { useSession } from "~/hooks/use-session";

export const HeaderLogo: React.FC = () => {
	const [session] = useSession();
	const router = useRouter();

	return (
		<Link
			href={session ? urls.browse() : urls.default}
			onMouseDown={(event) => {
				if (event.button !== 2) return;
				router.push(urls.resources.branding);
			}}
		>
			<FlirtualLogo className="h-16 shrink-0" />
		</Link>
	);
};

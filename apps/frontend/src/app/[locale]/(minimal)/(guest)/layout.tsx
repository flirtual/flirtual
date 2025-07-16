import type { PropsWithChildren } from "react";

import { useGuest } from "~/hooks/use-session";

export default function MinimalGuestLayout({ children }: PropsWithChildren) {
	useGuest();

	return (
		<>
			{children}
		</>
	);
}

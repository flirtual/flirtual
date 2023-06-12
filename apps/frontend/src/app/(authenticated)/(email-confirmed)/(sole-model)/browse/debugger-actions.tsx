"use client";

import { useRouter } from "next/navigation";

import { api } from "~/api";
import { Session } from "~/api/auth";

export const DebuggerActions: React.FC<{ session: Session }> = ({
	session
}) => {
	const router = useRouter();

	if (!session.user.tags?.includes("debugger")) return null;

	return (
		<div className="py-8">
			<button
				type="button"
				onClick={async () => {
					await api.matchmaking.resetProspect();
					router.refresh();
				}}
			>
				Reset queue
			</button>
		</div>
	);
};

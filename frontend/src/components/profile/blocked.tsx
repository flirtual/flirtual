import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { User, displayName } from "~/api/user";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/api";

import { ModelCard } from "../model-card";
import { Button } from "../button";
import { ReportProfileModel } from "../modals/report-profile";
import { Tooltip } from "../tooltip";

export const BlockedProfile: React.FC<{ user: User }> = ({ user }) => {
	const toasts = useToast();
	const router = useRouter();

	const [reportVisible, setReportVisible] = useState(false);

	return (
		<ModelCard
			title="Account blocked"
			containerProps={{
				className: "gap-8"
			}}
		>
			<span>
				You&apos;ve blocked <span className="font-semibold">{displayName(user)}</span>, so you
				can&apos;t see their profile, and they can&apos;t see yours either.
			</span>
			<div className="flex gap-4">
				<Button
					className="w-fit"
					size="sm"
					onClick={async () => {
						await api.user
							.unblock(user.id)
							.then(() => {
								toasts.add({
									type: "success",
									label: "User unblocked successfully"
								});

								return router.refresh();
							})
							.catch(toasts.addError);
					}}
				>
					Unblock
				</Button>
				<ReportProfileModel
					user={user}
					visible={reportVisible}
					onVisibilityChange={setReportVisible}
				>
					<Tooltip value="Report profile">
						<Button className="w-fit" size="sm" onClick={() => setReportVisible(true)}>
							Report
						</Button>
					</Tooltip>
				</ReportProfileModel>
			</div>
		</ModelCard>
	);
};

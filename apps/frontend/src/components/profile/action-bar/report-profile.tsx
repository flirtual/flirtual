import { useState } from "react";
import { FlagIcon } from "@heroicons/react/24/solid";

import { User } from "~/api/user";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { ReportProfileModel } from "~/components/modals/report-profile";

export const ReportProfile: React.FC<{ user: User }> = ({ user }) => {
	const [reportVisible, setReportVisible] = useState(false);

	return (
		<ReportProfileModel
			user={user}
			visible={reportVisible}
			onVisibilityChange={setReportVisible}
		>
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						className="h-6 w-6"
						type="button"
						onClick={() => setReportVisible(true)}
					>
						<FlagIcon className="h-full w-full" />
					</button>
				</TooltipTrigger>
				<TooltipContent>Report profile</TooltipContent>
			</Tooltip>
		</ReportProfileModel>
	);
};

import { Ban, Flag } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import type { User } from "~/api/user";
import { DialogTrigger } from "~/components/dialog/dialog";
import { useOptionalSession } from "~/hooks/use-session";

import { Button } from "../button";
import { AlertDialogTrigger } from "../dialog/alert";
import { BlockDialog } from "./dialogs/block";
import { ReportDialog } from "./dialogs/report";
import { ProfileDropdown } from "./dropdown";
import { ProfileModeratorInfo } from "./moderator-info";

export const ProfileActionBar: FC<{ user: User; hideModeratorInfo?: boolean }> = ({ user, hideModeratorInfo }) => {
	const session = useOptionalSession();
	const { t } = useTranslation();

	if (
		!session
		|| (session.user.id === user.id
			&& !session.user.tags?.includes("moderator")
			&& !session.user.tags?.includes("admin"))
	)
		return null;

	return (
		<div className="flex flex-col gap-8 px-8 py-4 pt-0 desktop:pb-8 desktop:dark:bg-black-70">
			{!hideModeratorInfo && <ProfileModeratorInfo userId={user.id} />}
			<div className="flex w-full gap-4 pb-4 desktop:pb-0">
				{!hideModeratorInfo
					&& (session.user.tags?.includes("moderator") || session.user.tags?.includes("admin"))
					&& (
						<ProfileDropdown userId={user.id} />
					)}
				<div className="flex w-full justify-center gap-6 vision:text-white-20">
					{session.user.id !== user.id && (
						<>
							<BlockDialog user={user}>
								<AlertDialogTrigger asChild>
									<Button className="gap-2 p-0" kind="tertiary" size="sm">
										<Ban className="size-6" />
										{t("block")}
									</Button>
								</AlertDialogTrigger>
							</BlockDialog>
							<ReportDialog user={user}>
								<DialogTrigger asChild>
									<Button className="gap-2 p-0" kind="tertiary" size="sm">
										<Flag className="size-6" />
										{t("report")}
									</Button>
								</DialogTrigger>
							</ReportDialog>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

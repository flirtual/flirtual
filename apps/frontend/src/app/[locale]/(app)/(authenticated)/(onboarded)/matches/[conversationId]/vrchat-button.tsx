"use client";

import { MailPlus } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

import type { User } from "~/api/user";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "~/components/dialog/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from "~/components/dropdown";
import { FaceTimeIcon } from "~/components/icons";
import { VRChatOutlineIcon } from "~/components/icons/brand/vrchat-outline";
import { useDevice } from "~/hooks/use-device";
import { useOptionalSession } from "~/hooks/use-session";

import { VRChatBrowse } from "./vrchat-browse";

export interface VRChatButtonProps {
	user: User;
	conversationId: string;
}

export const VRChatButton: FC<VRChatButtonProps> = (props) => {
	const { user, conversationId } = props;
	const [dialogOpen, setDialogOpen] = useState(false);
	const { platform, vision } = useDevice();
	const session = useOptionalSession();

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						className="-m-3 mr-0 p-4 text-white-20 outline-none transition-opacity hover:opacity-80 focus:opacity-80"
						type="button"
					>
						<MailPlus className="size-[1.625rem]" />
						<span className="sr-only">Send meetup invite</span>
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" sideOffset={4}>
					<DropdownMenuLabel>Send invite</DropdownMenuLabel>
					<DropdownMenuItem
						className="flex items-center gap-2"
						onSelect={() => setDialogOpen(true)}
					>
						<VRChatOutlineIcon className="size-4 text-black-80" />
						VRChat
					</DropdownMenuItem>
					{vision
					&& session?.user.tags?.includes("debugger")
					&& session.user.profile.facetime
					&& user.profile.facetime
					&& platform === "apple" && (
						<DropdownMenuItem asChild>
							<a
								className="flex items-center gap-2"
								href={`facetime://${user.profile.facetime}`}
							>
								<FaceTimeIcon className="size-4" />
								FaceTime
							</a>
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="desktop:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Send a VRChat invite</DialogTitle>
					</DialogHeader>
					<DialogBody>
						<VRChatBrowse
							conversationId={conversationId}
							user={user}
							onClose={() => setDialogOpen(false)}
						/>
					</DialogBody>
				</DialogContent>
			</Dialog>
		</>
	);
};

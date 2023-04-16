"use client";

import { User } from "~/api/user";
import { urls } from "~/urls";

import { Button, ButtonLink } from "../button";

export const MatchActions: React.FC<{ user: User }> = ({ user }) => {
	return (
		<div className="flex gap-4">
			<ButtonLink className="w-full" href={urls.conversations.with(user.id)} size="sm">
				Message
			</ButtonLink>
			<Button className="w-fit" kind="secondary" size="sm" type="button">
				Unmatch
			</Button>
		</div>
	);
};

"use client";

import { User, displayName } from "~/api/user";

import { Button } from "../button";

export const RelationActions: React.FC<{ user: User }> = ({ user }) => {
	return (
		<div className="flex w-full items-center justify-between gap-4 [overflow-wrap:anywhere]">
			<span className="text-xl italic dark:text-white-20">
				You{" "}
				{user.relation?.type === "like"
					? user.relation.kind === "love"
						? "liked"
						: "homied"
					: "passed on"}{" "}
				{displayName(user)}
			</span>
			<Button className="shrink-0" size="sm" onClick={() => alert("TODO")}>
				Undo
			</Button>
		</div>
	);
};

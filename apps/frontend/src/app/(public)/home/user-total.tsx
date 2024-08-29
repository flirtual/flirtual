"use client";

import { type FC, use } from "react";

export const UserTotal: FC<{ promise: Promise<number> }> = ({ promise }) => {
	const totalUsers = use(promise);

	return (Math.floor(totalUsers / 5000) * 5000).toLocaleString();
};

/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";
"use no memo";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable
} from "@tanstack/react-table";
import { Eye, EyeOff, Gavel, Gem, Search, ShieldEllipsis } from "lucide-react";
import Link from "next/link";
import { type FC, Suspense, useDeferredValue, useEffect, useState } from "react";
import { capitalize } from "remeda";
import useSWR from "swr";
import { twMerge } from "tailwind-merge";

import {
	displayName,
	type SearchOptions,
	searchSortKeys,
	User,
	UserStatuses,
	type UserTags,
	userTags
} from "~/api/user";
import { Button } from "~/components/button";
import { DateTimeRelative } from "~/components/datetime-relative";
import { InputSelect, InputSwitch, InputText } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import { ProfileDropdown } from "~/components/profile/dropdown";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "~/components/table";
import { TimeRelative } from "~/components/time-relative";
import {
	MinimalTooltip,
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "~/components/tooltip";
import { UserThumbnail } from "~/components/user-avatar";
import { useCurrentUser } from "~/hooks/use-session";
import { useUser } from "~/hooks/use-user";
import { urls } from "~/urls";

const ColumnDisplayName: FC<{ userId: string }> = ({ userId }) => {
	const user = useUser(userId);
	if (!user) return null;

	const name = displayName(user);

	return (
		<Link
			className="flex w-fit items-center gap-4"
			href={urls.profile(user)}
		>
			<UserThumbnail user={user} />
			<div className="flex flex-col">
				{name === user.slug
					? (
							"-"
						)
					: (
							<span className="truncate">{name}</span>
						)}
				<span className="truncate text-xs brightness-75">{user.slug}</span>
			</div>
		</Link>
	);
};

const ColumnStatus: FC<{ userId: string; placeholder?: boolean }> = ({ userId, placeholder }) => {
	const user = placeholder ? null : useUser(userId);
	const VisibilityIcon = user?.status === "visible" ? Eye : EyeOff;

	return (
		<div className="inline-flex gap-2">
			<MinimalTooltip content={capitalize(user?.status || "unavailable").replace("_", " ")}>
				<VisibilityIcon
					className={twMerge(
						"size-5",
						user?.status === "visible"
							? "text-green-500"
							: user?.status === "finished_profile"
								? "text-yellow-500"
								: user?.status === "onboarded"
									? "text-orange-500"
									: "text-red-500"
					)}
				/>
			</MinimalTooltip>
			<MinimalTooltip
				content={
					user?.subscription
						? user?.subscription.active
							? "Active"
							: "Canceled"
						: "No subscription"
				}
			>
				<Gem
					className={twMerge(
						"size-5",
						user?.subscription
							? user?.subscription.active
								? "text-green-500"
								: "text-yellow-500"
							: "opacity-50"
					)}
				/>
			</MinimalTooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Gavel
						className={twMerge(
							"size-5",
							user?.bannedAt
								? "text-red-500"
								: user?.indefShadowbannedAt
									? "text-orange-500"
									: user?.paymentsBannedAt
										? "text-violet-500"
										: user?.shadowbannedAt
											? "text-yellow-500"
											: "opacity-50"
						)}
					/>
				</TooltipTrigger>
				<TooltipContent className="flex flex-col gap-1">
					{user?.bannedAt
						? (
								<>
									<span>Banned</span>
									<DateTimeRelative value={user?.bannedAt} />
								</>
							)
						: user?.indefShadowbannedAt
							? (
									<>
										<span>Indefinite Shadowban</span>
										<DateTimeRelative value={user?.indefShadowbannedAt} />
									</>
								)
							: user?.paymentsBannedAt
								? (
										<>
											<span>Payments Banned</span>
											<DateTimeRelative value={user?.paymentsBannedAt} />
										</>
									)
								: user?.shadowbannedAt
									? (
											<>
												<span>Shadowbanned</span>
												<DateTimeRelative value={user?.shadowbannedAt} />
											</>
										)
									: (
											<>No bans</>
										)}
				</TooltipContent>
			</Tooltip>
			{placeholder
				? <ShieldEllipsis className="size-5 opacity-50" />
				: <ProfileDropdown userId={userId} />}
		</div>
	);
};

export const columns: Array<ColumnDef<string>> = [
	{
		id: "displayName",
		enableHiding: false,
		header: "Display Name",
		cell: ({ row: { original: userId } }) => <ColumnDisplayName userId={userId} />
	},
	{
		id: "email",
		header: "Email",
		cell: ({ row: { original: userId } }) => {
			const user = useUser(userId);
			if (!user) return null;

			return (
				<MinimalTooltip content={user.email}>
					<div
						className={twMerge(
							"w-[12em] truncate",
							!user.emailConfirmedAt && "text-red-500"
						)}
					>
						{user.email}
					</div>
				</MinimalTooltip>
			);
		}
	},
	{
		id: "activeAt",
		header: "Active",
		cell: ({ row: { original: userId } }) => {
			const user = useUser(userId);
			if (!user || !user.activeAt || !user.createdAt) return null;

			const createdAt = new Date(user.createdAt);
			const activeAt = new Date(user.activeAt);

			// If the user was created and last active at the same time, then
			// they have never been active, so we don't show a last active time.
			if (createdAt.getTime() === activeAt.getTime()) return <span>-</span>;

			return (
				<MinimalTooltip content={<DateTimeRelative value={user.activeAt} />}>
					<span className="whitespace-nowrap">
						<TimeRelative value={user.activeAt} />
					</span>
				</MinimalTooltip>
			);
		}
	},
	{
		id: "createdAt",
		header: "Created",
		cell: ({ row: { original: userId } }) => {
			const user = useUser(userId);
			if (!user || !user.createdAt) return null;

			return (
				<MinimalTooltip content={<DateTimeRelative value={user.createdAt} />}>
					<span className="whitespace-nowrap">
						<TimeRelative value={user.createdAt} />
					</span>
				</MinimalTooltip>
			);
		}
	},
	{
		id: "status",
		header: "Status",
		enableHiding: false,
		cell: ({ row: { original: userId } }) => <ColumnStatus userId={userId} />
	}
];

const DataTable: FC<{ data: Array<string>; admin: boolean; limit: number; pending: boolean }> = ({
	data,
	admin,
	limit,
	pending
}) => {
	const table = useReactTable({
		data,
		columns: columns.filter((column) => column.id !== "email" || admin),
		getCoreRowModel: getCoreRowModel()
	});

	return (
		<Table>
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => (
							<TableHead key={header.id}>
								{header.isPlaceholder
									? null
									: flexRender(
										header.column.columnDef.header,
										header.getContext()
									)}
							</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>
			<TableBody className="relative">
				{table.getRowModel().rows?.length
					? (
							<>
								{table.getRowModel().rows.map((row) => (
									<TableRow
										className={twMerge("h-20", pending && "opacity-50")}
										data-state={row.getIsSelected() && "selected"}
										key={row.id}
									>
										<Suspense fallback={(
											<TableCell colSpan={row.getVisibleCells().length}>
												<span className="truncate text-xs brightness-75">
													Loading profile:
													{" "}
													{row.original}
													...
												</span>
											</TableCell>
										)}
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell className="select-children" key={cell.id}>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											))}
										</Suspense>
									</TableRow>
								))}
								{pending && (
									<tr>
										<td className="absolute inset-0 flex items-center justify-center">
											<span>Loading...</span>
										</td>
									</tr>
								)}
							</>
						)
					: (
							<>
								{Array.from({ length: limit }).map((_, index) => (
								// eslint-disable-next-line react/no-array-index-key
									<TableRow className="h-20"key={index}>
										{columns.map((column) => (
											<TableCell key={column.id} />
										))}
									</TableRow>
								))}
								<tr>
									<td className="absolute inset-0 flex items-center justify-center">
										<span>No results.</span>
									</td>
								</tr>
							</>
						)}

			</TableBody>
		</Table>
	);
};

export const SearchView: React.FC = () => {
	const user = useCurrentUser();

	const [searchOptions, setSearchOptions] = useState({
		search: "",
		status: "" as const,
		tags: [],
		sort: "created_at",
		order: "desc"
	} as unknown as SearchOptions);

	const deferredOptions = useDeferredValue(searchOptions);

	const [page, setPage] = useState(1);
	const deferredPage = useDeferredValue(page);

	// Reset page when the search options change.
	useEffect(() => setPage(1), [deferredOptions]);

	const { data, isLoading } = useSWR(
		["users/search", deferredOptions, { page: deferredPage }],
		([, searchOptions, { page }]) => {
			return User.search(
				Object.fromEntries(
					Object.entries({
						...searchOptions,
						tags: searchOptions.tags?.join(","),
						page
					}).filter(([, value]) => !!value)
				)
			);
		},
		{
			suspense: true,
			keepPreviousData: true,
			fallbackData: {
				entries: [],
				metadata: {
					page: 1,
					limit: 10,
					total: 0
				}
			}
		}
	);

	return (
		<ModelCard
			data-block
			className="desktop:max-w-7xl"
			containerProps={{ className: "gap-8 min-h-screen" }}
			title="Search"
		>
			<div className="flex flex-col gap-4">
				<div className="grid gap-4 wide:grid-cols-2">
					<div className="flex flex-col gap-2">
						<span>Filter</span>
						<div className="grid grid-cols-3 gap-2">
							<div className="col-span-3">
								<InputText
									Icon={Search}
									placeholder="Search"
									value={searchOptions.search}
									onChange={(value) =>
										setSearchOptions((searchOptions) => {
											return {
												...searchOptions,
												sort:
													searchOptions.search === "" && value !== ""
														? "similarity"
														: value === ""
															&& searchOptions.sort === "similarity"
															? "created_at"
															: searchOptions.sort,
												search: value
											};
										})}
								/>
							</div>
							<InputSelect
								optional
								options={UserStatuses.map((status) => ({
									name: status.split("_").map((value) => capitalize(value)).join(" "),
									id: status
								}))}
								placeholder="Any status"
								value={searchOptions.status}
								onChange={(value) =>
									setSearchOptions({
										...searchOptions,
										status: value
									})}
							/>
							<InputSelect
								optional
								options={userTags.map((tag) => ({
									name: tag.split("_").map((value) => capitalize(value)).join(" "),
									id: tag
								}))}
								placeholder="Any tags"
								value={searchOptions.tags?.[0] || ""}
								onChange={(value) =>
									setSearchOptions({
										...searchOptions,
										tags: [value as UserTags]
									})}
							/>
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<span>Sort</span>
						<div className="flex items-center gap-2">
							<InputSelect
								options={searchSortKeys.map((sort) => ({
									name: sort.split("_").map((value) => capitalize(value)).join(" "),
									id: sort,
									disabled: sort === "similarity" && searchOptions.search === ""
								}))}
								value={searchOptions.sort}
								onChange={(value) =>
									setSearchOptions({
										...searchOptions,
										sort: value
									})}
							/>
							<InputSwitch
								no="Ascending"
								value={searchOptions.order === "desc"}
								yes="Descending"
								onChange={(value) =>
									setSearchOptions({
										...searchOptions,
										order: value ? "desc" : "asc"
									})}
							/>
						</div>
					</div>
				</div>
				<DataTable
					admin={user?.tags?.includes("admin") ?? false}
					data={data.entries}
					limit={data.metadata.limit}
					pending={isLoading}
				/>
				<div className="flex items-center justify-end gap-2">
					<div className="grow brightness-75">
						<span>
							Page
							{" "}
							{page}
						</span>
					</div>
					<Button
						disabled={page <= 1}
						size="sm"
						onClick={() => setPage(data.metadata.page - 1)}
					>
						Previous
					</Button>
					<Button
						disabled={data.entries.length < data.metadata.limit}
						size="sm"
						onClick={() => setPage(data.metadata.page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		</ModelCard>
	);
};

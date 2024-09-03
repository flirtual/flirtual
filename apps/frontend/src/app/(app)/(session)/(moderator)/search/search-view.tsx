"use client";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable
} from "@tanstack/react-table";
import useSWR from "swr";
import { type FC, useDeferredValue, useEffect, useState } from "react";
import { Eye, EyeOff, Gavel, Gem, Search } from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import {
	type SearchOptions,
	type User,
	UserStatuses,
	type UserTags,
	displayName,
	searchSortKeys,
	userTags
} from "~/api/user";
import { ModelCard } from "~/components/model-card";
import { api } from "~/api";
import { InputSelect, InputSwitch, InputText } from "~/components/inputs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "~/components/table";
import { Button } from "~/components/button";
import { UserThumbnail } from "~/components/user-avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { TimeRelative } from "~/components/time-relative";
import { DateTimeRelative } from "~/components/datetime-relative";
import { urls } from "~/urls";
import { relativeTime } from "~/date";
import { ProfileDropdown } from "~/components/profile/dropdown";
import { useSessionUser } from "~/hooks/use-session";
import { capitalize } from "~/utilities";

export const columns: Array<ColumnDef<User>> = [
	{
		id: "displayName",
		enableHiding: false,
		header: "Display Name",
		cell: ({ row: { original: user } }) => {
			const name = displayName(user);
			return (
				<Link
					className="flex w-fit items-center gap-4"
					href={urls.profile(user)}
				>
					<UserThumbnail user={user} />
					<div className="flex flex-col">
						{name === user.slug ? (
							"-"
						) : (
							<span className="truncate">{name}</span>
						)}
						<span className="truncate text-xs brightness-75">{user.slug}</span>
					</div>
				</Link>
			);
		}
	},
	{
		id: "email",
		header: "Email",
		cell: ({ row: { original: user } }) => (
			<div
				className={twMerge(
					"w-[12em] truncate",
					!user.emailConfirmedAt && "text-red-500"
				)}
			>
				{user.email}
			</div>
		)
	},
	{
		id: "activeAt",
		header: "Active",
		cell: ({ row: { original: user } }) => {
			if (!user.activeAt || !user.createdAt) return null;
			const createdAt = relativeTime(new Date(user.createdAt));
			const activeAt = relativeTime(new Date(user.activeAt));

			// If the user was created and last active at the same time, then
			// they have never been active, so we don't show a last active time.
			if (createdAt === activeAt) return <span>-</span>;

			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="whitespace-nowrap">
							<TimeRelative value={user.activeAt} />
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<DateTimeRelative value={user.activeAt} />
					</TooltipContent>
				</Tooltip>
			);
		}
	},
	{
		id: "createdAt",
		header: "Created",
		cell: ({ row: { original: user } }) =>
			user.createdAt && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="whitespace-nowrap">
							<TimeRelative value={user.createdAt} />
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<DateTimeRelative value={user.createdAt} />
					</TooltipContent>
				</Tooltip>
			)
	},

	{
		id: "status",
		header: "Status",
		enableHiding: false,
		cell: ({ row: { original: user } }) => {
			const VisibilityIcon = user.status === "visible" ? Eye : EyeOff;

			return (
				<div className="inline-flex gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<VisibilityIcon
								className={twMerge(
									"size-5",
									user.status === "visible"
										? "text-green-500"
										: user.status === "finished_profile"
											? "text-yellow-500"
											: user.status === "onboarded"
												? "text-orange-500"
												: "text-red-500"
								)}
							/>
						</TooltipTrigger>
						<TooltipContent>
							{capitalize(user.status).replace("_", " ")}
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Gem
								className={twMerge(
									"size-5",
									user.subscription
										? user.subscription.active
											? "text-green-500"
											: "text-yellow-500"
										: "opacity-50"
								)}
							/>
						</TooltipTrigger>
						<TooltipContent>
							{user.subscription
								? user.subscription.active
									? "Active"
									: "Canceled"
								: "No subscription"}
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Gavel
								className={twMerge(
									"size-5",
									user.bannedAt
										? "text-red-500"
										: user.indefShadowbannedAt
											? "text-orange-500"
											: user.paymentsBannedAt
												? "text-violet-500"
												: user.shadowbannedAt
													? "text-yellow-500"
													: "opacity-50"
								)}
							/>
						</TooltipTrigger>
						<TooltipContent className="flex flex-col gap-1">
							{user.bannedAt ? (
								<>
									<span>Banned</span>
									<DateTimeRelative value={user.bannedAt} />
								</>
							) : user.indefShadowbannedAt ? (
								<>
									<span>Indefinite Shadowban</span>
									<DateTimeRelative value={user.indefShadowbannedAt} />
								</>
							) : user.paymentsBannedAt ? (
								<>
									<span>Payments Banned</span>
									<DateTimeRelative value={user.paymentsBannedAt} />
								</>
							) : user.shadowbannedAt ? (
								<>
									<span>Shadowbanned</span>
									<DateTimeRelative value={user.shadowbannedAt} />
								</>
							) : (
								<>No bans</>
							)}
						</TooltipContent>
					</Tooltip>
					<ProfileDropdown user={user} />
				</div>
			);
		}
	}
];

const DataTable: FC<{ data: Array<User>; admin: boolean }> = ({
	data,
	admin
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
			<TableBody>
				{table.getRowModel().rows?.length ? (
					table.getRowModel().rows.map((row) => (
						<TableRow
							data-state={row.getIsSelected() && "selected"}
							key={row.id}
						>
							{row.getVisibleCells().map((cell) => (
								<TableCell key={cell.id}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell
							className="h-[680px] text-center"
							colSpan={columns.length}
						>
							No results.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
};

export const SearchView: React.FC = () => {
	const user = useSessionUser();

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

	const { data } = useSWR(
		["users/search", deferredOptions, { page: deferredPage }],
		([, searchOptions, { page }]) => {
			return api.user.search(
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
			className="desktop:max-w-7xl"
			containerProps={{ className: "gap-8 min-h-screen" }}
			title="Search"
		>
			<div className="flex flex-col gap-4">
				<div className="grid-col-1 grid gap-4 wide:grid-cols-2">
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
														: value === "" &&
															  searchOptions.sort === "similarity"
															? "created_at"
															: searchOptions.sort,
												search: value
											};
										})
									}
								/>
							</div>
							<InputSelect
								value={searchOptions.status}
								placeholder="Any status"
								options={UserStatuses.map((status) => ({
									name: status.split("_").map(capitalize).join(" "),
									id: status
								}))}
								optional
								onChange={(value) =>
									setSearchOptions({
										...searchOptions,
										status: value
									})
								}
							></InputSelect>
							<InputSelect
								value={searchOptions.tags?.[0] || ""}
								placeholder="Any tags"
								options={userTags.map((tag) => ({
									name: tag.split("_").map(capitalize).join(" "),
									id: tag
								}))}
								optional
								onChange={(value) =>
									setSearchOptions({
										...searchOptions,
										tags: [value as UserTags]
									})
								}
							></InputSelect>
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<span>Sort</span>
						<div className="flex items-center gap-2">
							<InputSelect
								value={searchOptions.sort}
								options={searchSortKeys.map((sort) => ({
									name: sort.split("_").map(capitalize).join(" "),
									id: sort,
									disabled: sort === "similarity" && searchOptions.search === ""
								}))}
								onChange={(value) =>
									setSearchOptions({
										...searchOptions,
										sort: value
									})
								}
							></InputSelect>
							<InputSwitch
								name="order"
								value={searchOptions.order === "desc"}
								yes="Descending"
								no="Ascending"
								onChange={(value) =>
									setSearchOptions({
										...searchOptions,
										order: value ? "desc" : "asc"
									})
								}
							/>
						</div>
					</div>
				</div>
				<DataTable
					admin={user?.tags?.includes("admin") ?? false}
					data={data.entries}
				/>
				<div className="flex items-center justify-end gap-2">
					<div className="grow brightness-75">
						<span>Page {page}</span>
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

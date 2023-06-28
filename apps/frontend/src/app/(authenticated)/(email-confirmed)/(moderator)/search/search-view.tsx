"use client";

import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable
} from "@tanstack/react-table";
import useSWR from "swr";
import { FC, useDeferredValue, useEffect, useState } from "react";
import { Eye, EyeOff, Gem } from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

import { User, displayName } from "~/api/user";
import { ModelCard } from "~/components/model-card";
import { api } from "~/api";
import { InputText } from "~/components/inputs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "~/components/table";
import { Button } from "~/components/button";
import { UserAvatar } from "~/components/user-avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { TimeRelative } from "~/components/time-relative";
import { DateTimeRelative } from "~/components/datetime-relative";
import { urls } from "~/urls";
import { relativeTime } from "~/date";

import { RowDropdown } from "./row-dropdown";

const dayInMilliseconds = 8.64e7;

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
					<UserAvatar
						className="rounded-xl"
						height={32}
						user={user}
						width={32}
					/>
					<div className="flex w-[8em] flex-col truncate">
						<span>{name}</span>
						{name !== user.username && (
							<span className="text-xs brightness-75">{user.username}</span>
						)}
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
		id: "createdAt",
		header: "Created",
		cell: ({ row: { original: user } }) =>
			user.createdAt && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="whitespace-nowrap">
							<TimeRelative capitalize value={user.createdAt} />
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<DateTimeRelative value={user.createdAt} />
					</TooltipContent>
				</Tooltip>
			)
	},
	{
		id: "activeAt",
		header: "Last Active",
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
							<TimeRelative capitalize value={user.activeAt} />
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
		id: "status",
		header: "Status",
		enableHiding: false,
		cell: ({ row: { original: user } }) => {
			const VisibilityIcon = user.visible ? Eye : EyeOff;

			return (
				<div className="inline-flex gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<VisibilityIcon
								className={twMerge(
									"h-5 w-5",
									user.visible ? "text-green-500" : "text-red-500"
								)}
							/>
						</TooltipTrigger>
						<TooltipContent>
							{user.visible ? "Visible" : "Hidden"}
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Gem
								className={twMerge(
									"h-5 w-5",
									user.subscription
										? user.subscription.active
											? "text-green-500"
											: "text-yellow-400"
										: "brightness-75"
								)}
							/>
						</TooltipTrigger>
						<TooltipContent>
							{user.subscription
								? user.subscription.active
									? "Active"
									: "Cancelled"
								: "No Subscription"}
						</TooltipContent>
					</Tooltip>
				</div>
			);
		}
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row: { original: user } }) => <RowDropdown user={user} />
	}
];

const DataTable: FC<{ data: Array<User> }> = ({ data }) => {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel()
	});
	return (
		<div className="overflow-hidden rounded-xl shadow-brand-1">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								return (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
											  )}
									</TableHead>
								);
							})}
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
							<TableCell className="h-24 text-center" colSpan={columns.length}>
								No results.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export const SearchView: React.FC = () => {
	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);

	const [page, setPage] = useState(1);
	const deferredPage = useDeferredValue(page);

	// Reset page when search changes.
	useEffect(() => setPage(1), [search]);

	const { data } = useSWR(
		["users/search", deferredSearch, { page: deferredPage }],
		([, search, { page }]) => {
			return api.user.search({
				search,
				page
			});
		},
		{
			suspense: true
		}
	);

	return (
		<ModelCard
			className="sm:max-w-4xl"
			containerProps={{ className: "gap-8 min-h-screen" }}
			title="Search"
		>
			<div className="flex flex-col gap-4">
				<div className="w-96">
					<InputText
						Icon={MagnifyingGlassIcon}
						placeholder="Search"
						value={search}
						onChange={setSearch}
					/>
				</div>
				<DataTable data={data.entries} />
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

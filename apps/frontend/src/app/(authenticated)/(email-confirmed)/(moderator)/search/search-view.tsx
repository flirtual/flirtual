"use client";

import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable
} from "@tanstack/react-table";
import useSWR from "swr";
import {
	FC,
	startTransition,
	useCallback,
	useDeferredValue,
	useMemo,
	useState,
	useTransition
} from "react";

import { User, displayName } from "~/api/user";
import { ModelCard } from "~/components/model-card";
import { Paginate, api } from "~/api";
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

import { defaultSearchOptions } from "./common";

export const columns: Array<ColumnDef<User>> = [
	{
		id: "displayName",
		accessorFn: (user) => displayName(user),
		header: "Display Name",
		cell: ({ row }) => {
			return (
				<div className="flex items-center gap-4">
					<UserAvatar
						className="rounded-xl"
						height={32}
						user={row.original}
						width={32}
					/>
					<span>{row.getValue("displayName")}</span>
				</div>
			);
		}
	},
	{
		accessorKey: "id",
		header: () => <div className="text-right">ID</div>,
		cell: ({ row }) => {
			return <div className="text-right font-mono">{row.getValue("id")}</div>;
		}
	},
	{
		id: "actions"
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

	const [limit, setLimit] = useState(defaultSearchOptions.limit);

	const { data, isLoading } = useSWR(
		["users/search", deferredSearch, { page: deferredPage, limit }],
		([, search, { page, limit }]) => {
			return api.user.search({
				search,
				page,
				limit
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
				<div className="w-48">
					<InputText placeholder="Search" value={search} onChange={setSearch} />
				</div>
				<DataTable data={data.entries} />
				<div className="flex items-center justify-end gap-2">
					<span>{page}</span>
					<Button
						disabled={page <= 1}
						size="sm"
						onClick={() => setPage(data.metadata.page - 1)}
					>
						Previous
					</Button>
					<Button
						disabled={data.entries.length < limit}
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

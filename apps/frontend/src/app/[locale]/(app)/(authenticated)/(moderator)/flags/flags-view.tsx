/* eslint-disable react-refresh/only-export-components */
import {
	flexRender,
	getCoreRowModel,
	useReactTable
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, Trash2 } from "lucide-react";
import { Suspense, useDeferredValue, useEffect, useState } from "react";
import type { FC } from "react";

import type { Paginate } from "~/api/common";
import { emptyPaginate } from "~/api/common";
import type { Flag as FlagModel, FlagType, ListFlagOptions } from "~/api/flag";
import { Flag } from "~/api/flag";
import { Button } from "~/components/button";
import { InputSelect, InputSwitch, InputText } from "~/components/inputs";
import { ModelCard } from "~/components/model-card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "~/components/table";
import { TimeRelative } from "~/components/time-relative";
import { MinimalTooltip } from "~/components/tooltip";
import { useToast } from "~/hooks/use-toast";
import { invalidate, useMutation, useQuery } from "~/query";

import { AddFlagForm } from "./add-flag-form";

const flagsKey = (options: ListFlagOptions) => ["flags", options] as const;

const ColumnActions: FC<{ flag: FlagModel }> = ({ flag }) => {
	const toasts = useToast();

	const deleteFlag = useMutation({
		mutationFn: async (flagId: string) => {
			await Flag.delete(flagId);
		},
		onSuccess: () => {
			toasts.add("Deleted flag");
			invalidate({ queryKey: ["flags"] });
		},
		onError: () => {
			toasts.add("Couldn't delete flag");
		}
	});

	const handleDelete = () => {
		// eslint-disable-next-line no-alert
		if (confirm(`Delete flag "${flag.flag}"?`)) {
			deleteFlag.mutate(flag.id);
		}
	};

	return (
		<MinimalTooltip content="Delete flag">
			<button
				className="text-red-500 hover:text-red-600 disabled:opacity-50"
				disabled={deleteFlag.isPending}
				type="button"
				onClick={handleDelete}
			>
				<Trash2 className="size-5" />
			</button>
		</MinimalTooltip>
	);
};

export const columns: Array<ColumnDef<FlagModel>> = [
	{
		id: "flag",
		header: "Flag",
		cell: ({ row: { original: flag } }) => (
			<span className="font-mono">{flag.flag}</span>
		)
	},
	{
		id: "updatedAt",
		header: "Updated",
		cell: ({ row: { original: flag } }) => (
			<MinimalTooltip content={new Date(flag.updatedAt).toLocaleString()}>
				<span className="whitespace-nowrap">
					<TimeRelative value={flag.updatedAt} />
				</span>
			</MinimalTooltip>
		)
	},
	{
		id: "actions",
		header: () => <div className="text-right">Actions</div>,
		cell: ({ row: { original: flag } }) => (
			<div className="flex justify-end">
				<ColumnActions flag={flag} />
			</div>
		)
	}
];

const DataTable: FC<{ data: Array<FlagModel>; limit: number }> = ({
	data,
	limit
}) => {
	const table = useReactTable({
		data,
		columns,
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
										key={row.id}
									>
										<Suspense fallback={(
											<TableCell colSpan={row.getVisibleCells().length}>
												<span className="truncate text-xs brightness-75">
													Loading...
												</span>
											</TableCell>
										)}
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id} className="select-children">
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											))}
										</Suspense>
									</TableRow>
								))}
							</>
						)
					: (
							<>
								{Array.from({ length: limit }).map((_, index) => (
									// eslint-disable-next-line react/no-array-index-key
									<TableRow key={index} className="h-16">
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

export const FlagsView: React.FC = () => {
	const [activeTab, setActiveTab] = useState<FlagType>("text");
	const [searchOptions, setSearchOptions] = useState<{
		search: string;
		sort: "flag" | "updated_at";
		order: "asc" | "desc";
	}>({
		search: "",
		sort: "updated_at",
		order: "desc"
	});
	const deferredOptions = useDeferredValue(searchOptions);

	const [page, setPage] = useState(1);
	const deferredPage = useDeferredValue(page);

	// Reset page when the search options or tab change.
	useEffect(() => setPage(1), [deferredOptions, activeTab]);

	const data = useQuery({
		queryKey: flagsKey({
			...deferredOptions,
			type: activeTab,
			page: deferredPage
		}),
		queryFn: ({ queryKey: [, options] }) => Flag.list(options),
		placeholderData: emptyPaginate as Paginate<FlagModel>,
		staleTime: 0,
		meta: {
			cacheTime: 0
		}
	});

	return (
		<ModelCard
			data-block
			className="desktop:max-w-7xl"
			containerProps={{ className: "gap-8 min-h-screen" }}
			title="Flags"
		>
			<div className="flex flex-col gap-4">
				<div className="flex gap-2">
					<InputSwitch
						className="w-full"
						no="Email flags"
						value={activeTab === "text"}
						yes="Text flags"
						onChange={(value) => setActiveTab(value ? "text" : "email")}
					/>
				</div>

				<div className="grid gap-4 wide:grid-cols-2">
					<div className="flex flex-col gap-2">
						<span>Filter</span>
						<InputText
							Icon={Search}
							placeholder="Search flags"
							value={searchOptions.search}
							onChange={(value) =>
								setSearchOptions((options) => ({
									...options,
									search: value
								}))}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<span>Sort</span>
						<div className="flex items-center gap-2">
							<InputSelect
								options={[
									{ id: "flag", name: "Flag" },
									{ id: "updated_at", name: "Updated At" }
								]}
								value={searchOptions.sort}
								onChange={(value) =>
									setSearchOptions((options) => ({
										...options,
										sort: value as "flag" | "updated_at",
										order: value === "flag" ? "asc" : "desc"
									}))}
							/>
							<InputSwitch
								no="Ascending"
								value={searchOptions.order === "desc"}
								yes="Descending"
								onChange={(value) =>
									setSearchOptions((options) => ({
										...options,
										order: value ? "desc" : "asc"
									}))}
							/>
						</div>
					</div>
				</div>

				<DataTable
					data={data.entries}
					limit={data.metadata.limit}
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
						onClick={() => setPage(page - 1)}
					>
						Previous
					</Button>
					<Button
						disabled={data.entries.length < data.metadata.limit}
						size="sm"
						onClick={() => setPage(page + 1)}
					>
						Next
					</Button>
				</div>

				<AddFlagForm type={activeTab} />
			</div>
		</ModelCard>
	);
};
